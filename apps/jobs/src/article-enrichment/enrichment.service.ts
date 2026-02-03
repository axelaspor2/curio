/**
 * 記事エンリッチメントサービス
 *
 * 記事にLLM分類・要約・ベクトルを付与する。
 */
import { prisma } from "@curio/database";
import { geminiClient } from "../lib/gemini-client.js";
import { ProcessingError } from "./errors.js";

const BATCH_SIZE = 10;

interface EnrichmentResult {
  totalCount: number;
  successCount: number;
  failedCount: number;
  errors: Array<{ articleId: string; title: string; error: string }>;
}

/**
 * 単一記事をエンリッチメントする
 */
const enrichArticle = async (
  articleId: string,
  title: string,
  content: string,
): Promise<{ success: boolean; error?: Error }> => {
  // 1. LLMで分類・要約
  const classificationResult = await geminiClient.classifyAndSummarize({
    title,
    content,
  });

  if (classificationResult.isErr()) {
    return { success: false, error: classificationResult.error };
  }

  const { summary, categories } = classificationResult.value;

  // 2. Embeddingを生成
  const embeddingResult = await geminiClient.generateEmbedding(
    `${title}\n\n${content.slice(0, 2000)}`,
  );

  if (embeddingResult.isErr()) {
    return { success: false, error: embeddingResult.error };
  }

  const embedding = embeddingResult.value;

  // 3. DBに保存（トランザクション）
  try {
    await prisma.$transaction(async (tx) => {
      // summaryを更新
      await tx.article.update({
        where: { id: articleId },
        data: { summary },
      });

      // embeddingを更新（raw query）
      // pgvectorは [0.1, 0.2, ...] 形式の文字列を期待する
      const embeddingStr = `[${embedding.join(",")}]`;
      await tx.$executeRaw`
        UPDATE articles
        SET embedding = ${embeddingStr}::vector
        WHERE id = ${articleId}::uuid
      `;

      // カテゴリを保存
      for (const cat of categories) {
        const category = await tx.category.findUnique({
          where: { slug: cat.slug },
        });

        if (category) {
          await tx.articleCategory.upsert({
            where: {
              articleId_categoryId: {
                articleId,
                categoryId: category.id,
              },
            },
            create: {
              articleId,
              categoryId: category.id,
              confidence: cat.confidence,
            },
            update: {
              confidence: cat.confidence,
            },
          });
        }
      }
    });

    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: new ProcessingError(e instanceof Error ? e.message : "Unknown DB error", articleId, e),
    };
  }
};

export const enrichmentService = {
  /**
   * エンリッチメント未処理の記事を処理する
   *
   * contentがあり、embeddingがない記事が対象。
   */
  enrichPendingArticles: async (): Promise<EnrichmentResult> => {
    // embeddingがnullかつcontentがnullでない記事を取得
    const articles = await prisma.$queryRaw<Array<{ id: string; title: string; content: string }>>`
      SELECT id, title, content
      FROM articles
      WHERE content IS NOT NULL
        AND embedding IS NULL
      ORDER BY created_at DESC
      LIMIT ${BATCH_SIZE}
    `;

    const result: EnrichmentResult = {
      totalCount: articles.length,
      successCount: 0,
      failedCount: 0,
      errors: [],
    };

    for (const article of articles) {
      console.log(`Enriching: ${article.title}`);

      const enrichResult = await enrichArticle(article.id, article.title, article.content);

      if (enrichResult.success) {
        result.successCount++;
        console.log(`  ✓ Success`);
      } else {
        result.failedCount++;
        result.errors.push({
          articleId: article.id,
          title: article.title,
          error: enrichResult.error?.message ?? "Unknown error",
        });
        console.log(`  ✗ Failed: ${enrichResult.error?.message}`);
      }
    }

    return result;
  },

  /**
   * エンリッチメント待ちの記事数を取得
   */
  getPendingCount: async (): Promise<number> => {
    const result = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*)::bigint as count
      FROM articles
      WHERE content IS NOT NULL
        AND embedding IS NULL
    `;
    return Number(result[0].count);
  },
};

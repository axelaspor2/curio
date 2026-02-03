/**
 * パーソナライズサービス
 *
 * ベクトル類似度とカテゴリスコアに基づいてリランキングを行う。
 */
import { prisma } from "@curio/database";

const VECTOR_WEIGHT = 0.6;
const CATEGORY_WEIGHT = 0.4;

export interface PersonalizedArticle {
  id: string;
  title: string;
  summary: string | null;
  url: string;
  imageUrl: string | null;
  publishedAt: Date | null;
  sourceId: string;
  sourceName: string;
  similarity: number;
}

export interface UserPreference {
  categoryId: string;
  score: number;
}

export interface ArticleCategory {
  articleId: string;
  categoryId: string;
  confidence: number;
}

export const personalizationService = {
  /**
   * ユーザーの興味ベクトルを取得
   */
  getUserInterestVector: async (userId: string): Promise<number[] | null> => {
    // pgvectorのvector型はtext経由で配列に変換する
    const result = await prisma.$queryRaw<Array<{ embedding: string }>>`
      SELECT interest_embedding::text as embedding
      FROM user_interest_vectors
      WHERE user_id = ${userId}::uuid
        AND interest_embedding IS NOT NULL
    `;

    if (!result[0]?.embedding) return null;

    // pgvectorのtext表現 "[0.1,0.2,...]" をパース
    return JSON.parse(result[0].embedding) as number[];
  },

  /**
   * ユーザーのカテゴリスコアを取得
   */
  getUserCategoryPreferences: async (userId: string): Promise<UserPreference[]> => {
    const preferences = await prisma.userCategoryPreference.findMany({
      where: { userId },
      select: {
        categoryId: true,
        preferenceScore: true,
      },
    });

    return preferences.map((p) => ({
      categoryId: p.categoryId,
      score: Number(p.preferenceScore),
    }));
  },

  /**
   * ベクトル類似度で記事を検索
   *
   * pgvector HNSWインデックスを使用して高速検索。
   */
  searchByVectorSimilarity: async (
    userVector: number[],
    userId: string,
    limit: number,
  ): Promise<PersonalizedArticle[]> => {
    // pgvectorは [0.1, 0.2, ...] 形式の文字列を期待する
    const vectorStr = `[${userVector.join(",")}]`;
    const articles = await prisma.$queryRaw<PersonalizedArticle[]>`
      SELECT
        a.id,
        a.title,
        a.summary,
        a.url,
        a.image_url as "imageUrl",
        a.published_at as "publishedAt",
        s.id as "sourceId",
        s.name as "sourceName",
        1 - (a.embedding <=> ${vectorStr}::vector) AS similarity
      FROM articles a
      JOIN sources s ON a.source_id = s.id
      WHERE a.embedding IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM interactions i
          WHERE i.article_id = a.id AND i.user_id = ${userId}::uuid
        )
      ORDER BY a.embedding <=> ${vectorStr}::vector
      LIMIT ${limit * 2}
    `;

    return articles;
  },

  /**
   * カテゴリスコアに基づいてリランキング
   */
  rerankByCategories: async (
    articles: PersonalizedArticle[],
    categoryPreferences: UserPreference[],
    articleCategories: ArticleCategory[],
  ): Promise<PersonalizedArticle[]> => {
    // カテゴリスコアをMap化
    const categoryScores = new Map(categoryPreferences.map((p) => [p.categoryId, p.score]));

    // 記事ごとのカテゴリをMap化
    const articleCategoryMap = new Map<string, ArticleCategory[]>();
    for (const ac of articleCategories) {
      const existing = articleCategoryMap.get(ac.articleId) ?? [];
      existing.push(ac);
      articleCategoryMap.set(ac.articleId, existing);
    }

    // 各記事の最終スコアを計算
    const scoredArticles = articles.map((article) => {
      const cats = articleCategoryMap.get(article.id) ?? [];

      // カテゴリスコアの加重平均
      let categoryScore = 0.5;
      if (cats.length > 0) {
        const weightedSum = cats.reduce((sum, ac) => {
          const prefScore = categoryScores.get(ac.categoryId) ?? 0.5;
          return sum + prefScore * ac.confidence;
        }, 0);
        const totalConfidence = cats.reduce((sum, ac) => sum + ac.confidence, 0);
        categoryScore = totalConfidence > 0 ? weightedSum / totalConfidence : 0.5;
      }

      // ベクトル類似度 + カテゴリスコアの加重平均
      const finalScore = VECTOR_WEIGHT * article.similarity + CATEGORY_WEIGHT * categoryScore;

      return { ...article, finalScore };
    });

    // スコア順にソート
    scoredArticles.sort((a, b) => b.finalScore - a.finalScore);

    return scoredArticles;
  },

  /**
   * 記事のカテゴリ情報を取得
   */
  getArticleCategories: async (articleIds: string[]): Promise<ArticleCategory[]> => {
    if (articleIds.length === 0) return [];

    const categories = await prisma.articleCategory.findMany({
      where: {
        articleId: { in: articleIds },
      },
      select: {
        articleId: true,
        categoryId: true,
        confidence: true,
      },
    });

    return categories.map((c) => ({
      articleId: c.articleId,
      categoryId: c.categoryId,
      confidence: Number(c.confidence ?? 0.5),
    }));
  },
};

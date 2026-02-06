import { prisma } from "@curio/database";
import { ResultAsync } from "neverthrow";
import { PrismaError, type PrismaError as PrismaErrorType } from "../lib/errors.js";
import { fromPrisma } from "../lib/from-promise.js";
import type { FeedArticle } from "../schemas/feed.js";
import { personalizationService } from "./personalization.service.js";

type FeedResult = {
  articles: FeedArticle[];
  nextCursor: string | null;
  hasMore: boolean;
  exhaustedByThreshold?: boolean;
};

type ArticleFromDb = {
  id: string;
  title: string;
  description: string | null;
  url: string;
  imageUrl: string | null;
  publishedAt: Date | null;
  source: {
    id: string;
    name: string;
  };
  categories: {
    category: {
      id: string;
      slug: string;
      name: string;
    };
  }[];
};

export const feedService = {
  /**
   * インタラクション済み記事を除外したフィードを取得
   * publishedAt + idの複合カーソルで一意なページネーションを実現
   */
  getFeed: (
    userId: string,
    options: {
      limit: number;
      cursor?: string;
      categoryId?: string;
    },
  ): ResultAsync<FeedResult, PrismaErrorType> => {
    const { limit, cursor, categoryId } = options;

    // カーソル形式: base64("publishedAt_id") - publishedAtがnullの記事にも対応
    let cursorPublishedAt: Date | null = null;
    let cursorId: string | null = null;
    if (cursor) {
      const decoded = Buffer.from(cursor, "base64").toString("utf-8");
      const cursorParts = decoded.split("_");
      const publishedAtStr = cursorParts[0];
      const id = cursorParts[1];
      if (publishedAtStr !== undefined && id !== undefined) {
        cursorPublishedAt = publishedAtStr === "null" ? null : new Date(publishedAtStr);
        cursorId = id;
      }
    }

    return fromPrisma<ArticleFromDb[]>(
      prisma.article.findMany({
        where: {
          content: { not: null },
          description: { not: null },
          enrichedAt: { not: null },
          NOT: {
            interactions: {
              some: {
                userId,
              },
            },
          },
          ...(categoryId
            ? {
                categories: {
                  some: {
                    categoryId,
                  },
                },
              }
            : {}),
          // publishedAtが同じ記事が複数ある場合にidで順序を決定
          ...(cursorId
            ? {
                OR: [
                  ...(cursorPublishedAt ? [{ publishedAt: { lt: cursorPublishedAt } }] : []),
                  {
                    publishedAt: cursorPublishedAt,
                    id: { lt: cursorId },
                  },
                ],
              }
            : {}),
        },
        orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
        // hasMoreの判定用に1件多く取得
        take: limit + 1,
        select: {
          id: true,
          title: true,
          description: true,
          url: true,
          imageUrl: true,
          publishedAt: true,
          source: {
            select: {
              id: true,
              name: true,
            },
          },
          categories: {
            select: {
              category: {
                select: {
                  id: true,
                  slug: true,
                  name: true,
                },
              },
            },
          },
        },
      }),
    ).map((articles) => {
      const hasMore = articles.length > limit;
      const resultArticles = hasMore ? articles.slice(0, limit) : articles;
      const lastArticle = resultArticles.at(-1);

      const nextCursor =
        hasMore && lastArticle
          ? Buffer.from(
              `${lastArticle.publishedAt?.toISOString() ?? "null"}_${lastArticle.id}`,
            ).toString("base64")
          : null;

      return {
        articles: resultArticles.map((article) => ({
          id: article.id,
          title: article.title,
          description: article.description,
          url: article.url,
          imageUrl: article.imageUrl,
          publishedAt: article.publishedAt?.toISOString() ?? null,
          source: {
            id: article.source.id,
            name: article.source.name,
          },
          categories: article.categories.map((ac) => ({
            id: ac.category.id,
            slug: ac.category.slug,
            name: ac.category.name,
          })),
        })),
        nextCursor,
        hasMore,
      };
    });
  },

  /**
   * パーソナライズドフィードを取得
   *
   * ユーザーの興味ベクトルとカテゴリ嗜好に基づいて記事をリランキング。
   * スコア閾値（0.4）以上の記事のみ返却。
   * 興味ベクトルがない場合は通常のフィードにフォールバック。
   */
  getPersonalizedFeed: (
    userId: string,
    options: {
      limit: number;
      cursor?: string;
    },
  ): ResultAsync<FeedResult, PrismaErrorType> => {
    const { limit, cursor } = options;

    return ResultAsync.fromPromise(
      (async () => {
        // ユーザーの興味ベクトルを取得
        const userVector = await personalizationService.getUserInterestVector(userId);

        // 興味ベクトルがない場合は通常のフィードにフォールバック
        if (!userVector) {
          return null;
        }

        // カーソルをデコード: base64("score_id")
        let parsedCursor: { score: number; id: string } | undefined;
        if (cursor) {
          const decoded = Buffer.from(cursor, "base64").toString("utf-8");
          const parts = decoded.split("_");
          if (parts.length >= 2) {
            const score = Number.parseFloat(parts[0] ?? "");
            const id = parts.slice(1).join("_"); // IDに"_"が含まれる場合を考慮
            if (!Number.isNaN(score) && id) {
              parsedCursor = { score, id };
            }
          }
        }

        // カテゴリスコアを取得
        const categoryPreferences = await personalizationService.getUserCategoryPreferences(userId);

        // ベクトル類似度で記事を検索（スコア閾値フィルタリング適用）
        const { articles, hasMore: hasMoreFromVector } =
          await personalizationService.searchByVectorSimilarity(userVector, userId, limit, {
            cursor: parsedCursor,
          });

        if (articles.length === 0) {
          return {
            articles: [],
            nextCursor: null,
            hasMore: false,
            exhaustedByThreshold: true,
          };
        }

        // 記事のカテゴリ情報を取得
        const articleIds = articles.map((a) => a.id);
        const articleCategories = await personalizationService.getArticleCategories(articleIds);

        // カテゴリスコアでリランキング
        const rerankedArticles = await personalizationService.rerankByCategories(
          articles,
          categoryPreferences,
          articleCategories,
        );

        // カテゴリ情報をMap化
        const categoryMap = new Map<string, Array<{ id: string; slug: string; name: string }>>();

        // カテゴリ詳細を取得
        const categoryDetails = await prisma.category.findMany({
          where: {
            id: { in: articleCategories.map((ac) => ac.categoryId) },
          },
          select: { id: true, slug: true, name: true },
        });

        const categoryDetailMap = new Map(categoryDetails.map((c) => [c.id, c]));

        for (const ac of articleCategories) {
          const detail = categoryDetailMap.get(ac.categoryId);
          if (detail) {
            const existing = categoryMap.get(ac.articleId) ?? [];
            existing.push(detail);
            categoryMap.set(ac.articleId, existing);
          }
        }

        // 最後の記事からカーソルを生成
        const lastArticle = rerankedArticles.at(-1);
        const nextCursor =
          hasMoreFromVector && lastArticle
            ? Buffer.from(`${lastArticle.similarity}_${lastArticle.id}`).toString("base64")
            : null;

        return {
          articles: rerankedArticles.map((article) => ({
            id: article.id,
            title: article.title,
            description: article.description,
            url: article.url,
            imageUrl: article.imageUrl,
            publishedAt: article.publishedAt?.toISOString() ?? null,
            source: {
              id: article.sourceId,
              name: article.sourceName,
            },
            categories: categoryMap.get(article.id) ?? [],
          })),
          nextCursor,
          hasMore: hasMoreFromVector,
          exhaustedByThreshold: !hasMoreFromVector,
        };
      })(),
      (e) => new PrismaError(e instanceof Error ? e.message : "Database error", e),
    ).andThen((result) => {
      // 興味ベクトルがない場合は通常のフィードにフォールバック
      if (result === null) {
        return feedService.getFeed(userId, { limit, cursor });
      }
      return ResultAsync.fromSafePromise(Promise.resolve(result));
    });
  },
};

/**
 * フィードサービス
 *
 * フィード関連のビジネスロジックを提供します。
 */

import { prisma } from "@curio/database";
import type { ResultAsync } from "neverthrow";
import type { PrismaError } from "../lib/errors.js";
import { fromPrisma } from "../lib/from-promise.js";
import type { FeedArticle } from "../schemas/feed.js";

type FeedResult = {
  articles: FeedArticle[];
  nextCursor: string | null;
  hasMore: boolean;
};

type ArticleFromDb = {
  id: string;
  title: string;
  summary: string | null;
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
   * フィードを取得
   * - インタラクション済みの記事は除外
   * - カテゴリフィルタ対応
   * - カーソルベースのページネーション
   */
  getFeed: (
    userId: string,
    options: {
      limit: number;
      cursor?: string;
      categoryId?: string;
    },
  ): ResultAsync<FeedResult, PrismaError> => {
    const { limit, cursor, categoryId } = options;

    // カーソルをデコード (format: "publishedAt_id" or "null_id")
    let cursorPublishedAt: Date | null = null;
    let cursorId: string | null = null;
    if (cursor) {
      const decoded = Buffer.from(cursor, "base64").toString("utf-8");
      const [publishedAtStr, id] = decoded.split("_");
      cursorPublishedAt = publishedAtStr === "null" ? null : new Date(publishedAtStr);
      cursorId = id;
    }

    // インタラクション済みの記事IDを取得するサブクエリ
    return fromPrisma<ArticleFromDb[]>(
      prisma.article.findMany({
        where: {
          // インタラクション済みの記事を除外
          NOT: {
            interactions: {
              some: {
                userId,
              },
            },
          },
          // カテゴリフィルタ
          ...(categoryId
            ? {
                categories: {
                  some: {
                    categoryId,
                  },
                },
              }
            : {}),
          // カーソルがある場合は、そのpublishedAt/IDより後の記事を取得
          ...(cursorId
            ? {
                OR: [
                  // publishedAtがカーソルより古い場合
                  ...(cursorPublishedAt ? [{ publishedAt: { lt: cursorPublishedAt } }] : []),
                  // publishedAtが同じ場合はIDで比較
                  {
                    publishedAt: cursorPublishedAt,
                    id: { lt: cursorId },
                  },
                ],
              }
            : {}),
        },
        orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
        take: limit + 1, // 次のページがあるか確認するために1件多く取得
        select: {
          id: true,
          title: true,
          summary: true,
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

      // カーソルをエンコード (format: "publishedAt_id")
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
          summary: article.summary,
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
};

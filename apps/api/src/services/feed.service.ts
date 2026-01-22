/**
 * フィードサービス
 *
 * フィード関連のビジネスロジックを提供します。
 */

import { prisma } from "@curio/database";
import type { ResultAsync } from "neverthrow";
import { fromPrisma } from "../lib/from-promise.js";
import type { PrismaError } from "../lib/errors.js";
import type { FeedArticle } from "../schemas/feed.js";

// Prisma 7 driver adapter使用時の型問題を回避
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;

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

    // インタラクション済みの記事IDを取得するサブクエリ
    return fromPrisma<ArticleFromDb[]>(
      db.article.findMany({
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
          // カーソルがある場合は、そのIDより後の記事を取得
          ...(cursor
            ? {
                id: {
                  lt: cursor,
                },
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
        nextCursor: hasMore && lastArticle ? lastArticle.id : null,
        hasMore,
      };
    });
  },
};

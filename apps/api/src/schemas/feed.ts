/**
 * フィードAPIのZodスキーマ
 */

import { z } from "@hono/zod-openapi";

/**
 * フィードクエリスキーマ
 */
export const FeedQuerySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(50).default(20).openapi({
      description: "取得件数（デフォルト20、最大50）",
    }),
    cursor: z.string().optional().openapi({
      description: "ページネーションカーソル",
    }),
    categoryId: z.uuid().optional().openapi({
      description: "カテゴリフィルタ",
    }),
  })
  .openapi("FeedQuery");

/**
 * フィード記事スキーマ
 */
export const FeedArticleSchema = z
  .object({
    id: z.uuid(),
    title: z.string(),
    summary: z.string().nullable(),
    url: z.string().url(),
    imageUrl: z.string().url().nullable(),
    publishedAt: z.string().datetime().nullable(),
    source: z.object({
      id: z.uuid(),
      name: z.string(),
    }),
    categories: z.array(
      z.object({
        id: z.uuid(),
        slug: z.string(),
        name: z.string(),
      }),
    ),
  })
  .openapi("FeedArticle");

/**
 * フィードレスポンススキーマ
 */
export const FeedResponseSchema = z
  .object({
    articles: z.array(FeedArticleSchema),
    nextCursor: z.string().nullable(),
    hasMore: z.boolean(),
    exhaustedByThreshold: z.boolean().optional().openapi({
      description: "スコア閾値以上の記事がすべて消費されたかどうか",
    }),
  })
  .openapi("FeedResponse");

/**
 * 型エクスポート
 */
export type FeedQuery = z.infer<typeof FeedQuerySchema>;
export type FeedArticle = z.infer<typeof FeedArticleSchema>;
export type FeedResponse = z.infer<typeof FeedResponseSchema>;

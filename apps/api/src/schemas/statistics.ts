/**
 * 統計APIのZodスキーマ
 *
 * ユーザーの累計統計情報（LIKE/SKIP/READ数、カテゴリ別統計）を定義します。
 */

import { z } from "@hono/zod-openapi";

/**
 * アクション統計スキーマ
 */
export const ActionStatsSchema = z
  .object({
    like: z.number().int().openapi({ description: "累計LIKE数" }),
    skip: z.number().int().openapi({ description: "累計SKIP数" }),
    read: z.number().int().openapi({ description: "累計READ数" }),
    total: z.number().int().openapi({ description: "合計インタラクション数" }),
  })
  .openapi("ActionStats");

/**
 * カテゴリ別統計スキーマ
 */
export const CategoryStatSchema = z
  .object({
    categoryId: z.string().uuid().openapi({ description: "カテゴリID" }),
    categoryName: z.string().openapi({ description: "カテゴリ名" }),
    categorySlug: z.string().openapi({ description: "カテゴリスラッグ" }),
    count: z.number().int().openapi({ description: "インタラクション数" }),
  })
  .openapi("CategoryStat");

/**
 * 統計レスポンススキーマ
 */
export const StatisticsResponseSchema = z
  .object({
    actionStats: ActionStatsSchema.openapi({ description: "アクション統計" }),
    topLikedCategories: z
      .array(CategoryStatSchema)
      .max(3)
      .openapi({ description: "LIKEが多いカテゴリTOP3" }),
    topSkippedCategories: z
      .array(CategoryStatSchema)
      .max(3)
      .openapi({ description: "SKIPが多いカテゴリTOP3" }),
  })
  .openapi("StatisticsResponse");

/**
 * 型エクスポート
 */
export type ActionStats = z.infer<typeof ActionStatsSchema>;
export type CategoryStat = z.infer<typeof CategoryStatSchema>;
export type StatisticsResponse = z.infer<typeof StatisticsResponseSchema>;

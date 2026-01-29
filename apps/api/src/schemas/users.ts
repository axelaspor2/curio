/**
 * ユーザーAPIのZodスキーマ
 */

import { z } from "@hono/zod-openapi";

/**
 * カテゴリ選択リクエストスキーマ
 */
export const SetCategoriesRequestSchema = z
  .object({
    categoryIds: z
      .array(z.string().uuid())
      .min(1, "少なくとも1つのカテゴリを選択してください")
      .openapi({
        description: "選択したカテゴリID配列",
        example: ["550e8400-e29b-41d4-a716-446655440000"],
      }),
  })
  .openapi("SetCategoriesRequest");

/**
 * ユーザーカテゴリ設定スキーマ
 */
export const UserPreferenceSchema = z
  .object({
    categoryId: z.string().uuid(),
    preferenceScore: z.number().min(0).max(1),
    isInitialSelection: z.boolean(),
  })
  .openapi("UserPreference");

/**
 * カテゴリ選択レスポンススキーマ
 */
export const SetCategoriesResponseSchema = z
  .object({
    preferences: z.array(UserPreferenceSchema),
  })
  .openapi("SetCategoriesResponse");

/**
 * 型エクスポート
 */
export type SetCategoriesRequest = z.infer<typeof SetCategoriesRequestSchema>;
export type UserPreference = z.infer<typeof UserPreferenceSchema>;
export type SetCategoriesResponse = z.infer<typeof SetCategoriesResponseSchema>;

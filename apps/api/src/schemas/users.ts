/**
 * ユーザーAPIのZodスキーマ
 */

import { z } from "@hono/zod-openapi";

/**
 * カテゴリ選択リクエストスキーマ
 */
export const SetCategoriesRequestSchema = z
  .object({
    categoryIds: z.array(z.string().uuid()).openapi({
      description: "選択したカテゴリID配列（スキップ時は空配列）",
      example: ["550e8400-e29b-41d4-a716-446655440000"],
    }),
    skipped: z.boolean().optional().openapi({
      description: "スキップフラグ（trueの場合、全カテゴリを中立スコアで設定）",
      example: false,
    }),
  })
  .refine((data) => data.skipped === true || data.categoryIds.length > 0, {
    message: "少なくとも1つのカテゴリを選択してください",
    path: ["categoryIds"],
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
    interestVectorGenerated: z.boolean().openapi({
      description: "興味ベクトルが生成されたかどうか",
    }),
  })
  .openapi("SetCategoriesResponse");

/**
 * オンボーディング状態レスポンススキーマ
 */
export const OnboardingStatusResponseSchema = z
  .object({
    isOnboardingComplete: z.boolean().openapi({
      description: "オンボーディングが完了しているかどうか",
    }),
    selectedCategoryCount: z.number().openapi({
      description: "選択済みカテゴリ数",
    }),
  })
  .openapi("OnboardingStatusResponse");

/**
 * 型エクスポート
 */
export type SetCategoriesRequest = z.infer<typeof SetCategoriesRequestSchema>;
export type UserPreference = z.infer<typeof UserPreferenceSchema>;
export type SetCategoriesResponse = z.infer<typeof SetCategoriesResponseSchema>;
export type OnboardingStatusResponse = z.infer<typeof OnboardingStatusResponseSchema>;

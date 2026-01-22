/**
 * インタラクションAPIのZodスキーマ
 */

import { z } from "@hono/zod-openapi";

/**
 * インタラクションタイプスキーマ
 */
export const InteractionTypeSchema = z.enum(["SKIP", "LIKE", "OPEN", "READ"]).openapi({
  description: "インタラクションタイプ",
});

/**
 * インタラクション作成リクエストスキーマ
 */
export const CreateInteractionRequestSchema = z
  .object({
    articleId: z.string().uuid().openapi({ description: "記事ID" }),
    type: InteractionTypeSchema,
    readingTimeSec: z.number().int().optional().openapi({
      description: "閲覧時間（秒）。typeがREADの場合のみ",
    }),
  })
  .openapi("CreateInteractionRequest");

/**
 * インタラクションレスポンススキーマ
 */
export const InteractionResponseSchema = z
  .object({
    interaction: z.object({
      id: z.string().uuid(),
      articleId: z.string().uuid(),
      type: z.string(),
      createdAt: z.string().datetime(),
    }),
  })
  .openapi("InteractionResponse");

/**
 * 型エクスポート
 */
export type InteractionType = z.infer<typeof InteractionTypeSchema>;
export type CreateInteractionRequest = z.infer<typeof CreateInteractionRequestSchema>;
export type InteractionResponse = z.infer<typeof InteractionResponseSchema>;

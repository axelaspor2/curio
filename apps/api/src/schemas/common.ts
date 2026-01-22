/**
 * 共通Zodスキーマ
 *
 * 複数のエンドポイントで使用する共通スキーマを定義します。
 */

import { z } from "@hono/zod-openapi";

/**
 * エラーレスポンススキーマ
 */
export const ErrorResponseSchema = z
  .object({
    error: z.string().openapi({ description: "エラーメッセージ" }),
  })
  .openapi("ErrorResponse");

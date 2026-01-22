/**
 * カテゴリAPIのZodスキーマ
 */

import { z } from "@hono/zod-openapi";

/**
 * カテゴリスキーマ
 */
export const CategorySchema = z
  .object({
    id: z.string().uuid().openapi({ description: "カテゴリID" }),
    slug: z.string().openapi({ description: "カテゴリスラッグ", example: "technology" }),
    name: z.string().openapi({ description: "カテゴリ名", example: "テクノロジー" }),
    description: z.string().nullable().openapi({ description: "カテゴリ説明" }),
    displayOrder: z.number().int().openapi({ description: "表示順" }),
  })
  .openapi("Category");

/**
 * カテゴリ一覧レスポンススキーマ
 */
export const CategoriesResponseSchema = z
  .object({
    categories: z.array(CategorySchema),
  })
  .openapi("CategoriesResponse");

/**
 * 型エクスポート
 */
export type Category = z.infer<typeof CategorySchema>;
export type CategoriesResponse = z.infer<typeof CategoriesResponseSchema>;

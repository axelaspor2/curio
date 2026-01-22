/**
 * カテゴリAPIルート
 */

import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { categoryService } from "../services/category.service.js";
import { CategoriesResponseSchema } from "../schemas/categories.js";
import { ErrorResponseSchema } from "../schemas/common.js";

const getCategoriesRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Categories"],
  summary: "カテゴリ一覧取得",
  description: "初回セットアップ画面で使用するカテゴリ一覧を取得します",
  responses: {
    200: {
      content: { "application/json": { schema: CategoriesResponseSchema } },
      description: "カテゴリ一覧",
    },
    500: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "サーバーエラー",
    },
  },
});

export const categoriesRouter = new OpenAPIHono().openapi(getCategoriesRoute, async (c) => {
  const result = await categoryService.getAll();

  return result.match(
    (categories) => c.json({ categories }, 200),
    (error) => {
      throw error;
    },
  );
});

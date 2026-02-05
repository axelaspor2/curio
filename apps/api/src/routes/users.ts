/**
 * ユーザーAPIルート
 */

import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { NotFoundError } from "../lib/errors.js";
import { ErrorResponseSchema } from "../schemas/common.js";
import {
  OnboardingStatusResponseSchema,
  SetCategoriesRequestSchema,
  SetCategoriesResponseSchema,
} from "../schemas/users.js";
import { userService } from "../services/user.service.js";
import type { AppEnv } from "../types/hono.js";

const getOnboardingStatusRoute = createRoute({
  method: "get",
  path: "/me/onboarding-status",
  tags: ["Users"],
  summary: "オンボーディング状態取得",
  description: "ユーザーのオンボーディング完了状態を取得します。",
  responses: {
    200: {
      content: { "application/json": { schema: OnboardingStatusResponseSchema } },
      description: "オンボーディング状態取得成功",
    },
    401: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "認証エラー",
    },
    500: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "サーバーエラー",
    },
  },
});

const setCategoriesRoute = createRoute({
  method: "post",
  path: "/me/categories",
  tags: ["Users"],
  summary: "初回カテゴリ選択",
  description:
    "ユーザーの興味のあるカテゴリを設定します。初回セットアップ時に使用します。スキップ時はskipped=trueを指定します。",
  request: {
    body: {
      content: { "application/json": { schema: SetCategoriesRequestSchema } },
      required: true,
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: SetCategoriesResponseSchema } },
      description: "カテゴリ設定完了",
    },
    400: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "バリデーションエラー",
    },
    401: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "認証エラー",
    },
    404: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "カテゴリが見つからない",
    },
    500: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "サーバーエラー",
    },
  },
});

export const usersRouter = new OpenAPIHono<AppEnv>()
  .openapi(getOnboardingStatusRoute, async (c) => {
    const user = c.get("user");
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const result = await userService.getOnboardingStatus(user.id);

    return result.match(
      (status) => c.json(status, 200),
      (error) => {
        throw error;
      },
    );
  })
  .openapi(setCategoriesRoute, async (c) => {
    const user = c.get("user");
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const body = c.req.valid("json");
    const result = await userService.setCategories(user.id, body.categoryIds, body.skipped);

    return result.match(
      ({ preferences, interestVectorGenerated }) =>
        c.json({ preferences, interestVectorGenerated }, 200),
      (error) => {
        if (error instanceof NotFoundError) {
          return c.json({ error: error.message }, 404);
        }
        throw error;
      },
    );
  });

/**
 * 統計APIルート
 *
 * ユーザーの累計統計情報を取得するエンドポイントを提供します。
 */

import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { UnauthorizedError } from "../lib/errors.js";
import { ErrorResponseSchema } from "../schemas/common.js";
import { StatisticsResponseSchema } from "../schemas/statistics.js";
import { statisticsService } from "../services/statistics.service.js";
import type { AppEnv } from "../types/hono.js";

const getStatisticsRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Statistics"],
  summary: "ユーザー統計取得",
  description: "累計アクション統計（LIKE/SKIP/READ数）とカテゴリ別統計を取得します",
  responses: {
    200: {
      content: { "application/json": { schema: StatisticsResponseSchema } },
      description: "統計情報",
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

export const statisticsRouter = new OpenAPIHono<AppEnv>().openapi(getStatisticsRoute, async (c) => {
  const user = c.get("user");
  if (!user) {
    throw new UnauthorizedError("認証が必要です");
  }

  const result = await statisticsService.getStatistics(user.id);

  return result.match(
    (stats) => c.json(stats, 200),
    (error) => {
      throw error;
    },
  );
});

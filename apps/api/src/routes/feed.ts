import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { ErrorResponseSchema } from "../schemas/common.js";
import { FeedQuerySchema, FeedResponseSchema } from "../schemas/feed.js";
import { feedService } from "../services/feed.service.js";
import type { AppEnv } from "../types/hono.js";

const getFeedRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Feed"],
  summary: "フィード取得",
  description:
    "ユーザー向けのパーソナライズされたフィードを取得します。インタラクション済みの記事は除外されます。",
  request: {
    query: FeedQuerySchema,
  },
  responses: {
    200: {
      content: { "application/json": { schema: FeedResponseSchema } },
      description: "フィード取得成功",
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

export const feedRouter = new OpenAPIHono<AppEnv>().openapi(getFeedRoute, async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const query = c.req.valid("query");

  // カテゴリ指定時は通常フィードを使用
  // それ以外はパーソナライズドフィードを使用（ページネーション対応）
  const result = query.categoryId
    ? await feedService.getFeed(user.id, {
        limit: query.limit,
        cursor: query.cursor,
        categoryId: query.categoryId,
      })
    : await feedService.getPersonalizedFeed(user.id, {
        limit: query.limit,
        cursor: query.cursor,
      });

  return result.match(
    (feed) => c.json(feed, 200),
    (error) => {
      throw error;
    },
  );
});

/**
 * フィードAPIルート
 */

import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { feedService } from "../services/feed.service.js";
import { FeedQuerySchema, FeedResponseSchema } from "../schemas/feed.js";
import { ErrorResponseSchema } from "../schemas/common.js";

const getFeedRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Feed"],
  summary: "フィード取得",
  description: "ユーザー向けのパーソナライズされたフィードを取得します。インタラクション済みの記事は除外されます。",
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

export const feedRouter = new OpenAPIHono().openapi(getFeedRoute, async (c) => {
  // セッションからユーザーIDを取得（authMiddlewareで認証済み）
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = (c as any).get("user") as { id: string } | null;
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const query = c.req.valid("query");
  const result = await feedService.getFeed(user.id, {
    limit: query.limit,
    cursor: query.cursor,
    categoryId: query.categoryId,
  });

  return result.match(
    (feed) => c.json(feed, 200),
    (error) => {
      throw error;
    },
  );
});

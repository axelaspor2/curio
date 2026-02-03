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

  // パーソナライズドフィード: cursorがない初回リクエストかつカテゴリ指定なしの場合
  // ページネーション時やカテゴリ絞り込み時は通常フィードを使用
  const result =
    !query.cursor && !query.categoryId
      ? await feedService.getPersonalizedFeed(user.id, { limit: query.limit })
      : await feedService.getFeed(user.id, {
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

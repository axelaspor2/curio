import { type Context, Hono } from "hono";

/**
 * ヘルスチェック用エンドポイント
 */
export const healthRouter = new Hono().get("/", (c: Context) => {
  return c.json({ status: "ok" });
});

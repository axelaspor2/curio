import { Context, Hono } from "hono";

/**
 * ヘルスチェック用エンドポイント
 */
export const healthRouter = new Hono().get("/health", (c: Context) => {
  return c.json({ status: "ok" });
});
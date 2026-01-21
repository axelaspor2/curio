import { Hono } from "hono";
import { auth } from "../lib/auth.js";

/**
 * Better Auth の認証用エンドポイント
 */
export const authRouter = new Hono().on(["POST", "GET"], "/api/auth/*", (c) => {
  return auth.handler(c.req.raw);
});

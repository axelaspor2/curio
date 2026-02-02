import { Hono } from "hono";
import { auth } from "../lib/auth.js";

/**
 * Better Auth の認証用エンドポイント
 */
export const authRouter = new Hono().on(["GET", "POST"], "*", async (c) => {
  return await auth.handler(c.req.raw);
});

import type { Context, Next } from "hono";
import { auth } from "../lib/auth.js";

/**
 * 後続のルートハンドラでユーザー情報にアクセスできるよう、
 * セッション情報をHonoコンテキストに設定
 */
export const sessionMiddleware = async (c: Context, next: Next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session) {
    c.set("user", null);
    c.set("session", null);
    await next();
    return;
  }

  c.set("user", session.user);
  c.set("session", session.session);
  await next();
};

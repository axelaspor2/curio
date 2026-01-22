import type { Context, Next } from "hono";
import { auth } from "../lib/auth.js";

/**
 * セッションをコンテキストに設定するミドルウェア
 */
export const sessionMiddleware = async (c: Context, next: Next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  // セッションが存在しない場合は、userとsessionをnullで設定して、nextを呼び出す
  if (!session) {
    c.set("user", null);
    c.set("session", null);
    await next();
    return;
  }

  // セッションが存在する場合は、userとsessionを設定して、nextを呼び出す
  c.set("user", session.user);
  c.set("session", session.session);
  await next();
};

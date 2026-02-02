import type { Context, Next } from "hono";

const DEFINED_ROUTES = [
  "/api/auth",
  "/api/health",
  "/api/categories",
  "/api/users",
  "/api/feed",
  "/api/interactions",
  "/api/docs",
] as const;

const PUBLIC_ROUTES = ["/api/auth", "/api/health", "/api/categories", "/api/docs"] as const;

/**
 * 認証ミドルウェア
 *
 * sessionMiddleware で設定されたセッション情報を使用して、
 * 保護されたルートへのアクセスを制御します。
 *
 * - DEFINED_ROUTES に含まれないパス → 認証スキップ（notFound ハンドラーへ）
 * - PUBLIC_ROUTES に含まれるパス → 認証スキップ（公開エンドポイント）
 * - それ以外 → セッション検証を実行し、無効な場合は 401 を返す
 */
export const authMiddleware = async (c: Context, next: Next) => {
  const path = c.req.path;
  const isDefinedRoute = DEFINED_ROUTES.some((route) => path.startsWith(route));

  if (!isDefinedRoute) {
    return next();
  }

  const isPublicPath = PUBLIC_ROUTES.some((publicRoute) => path.startsWith(publicRoute));

  if (isPublicPath) {
    return next();
  }

  // sessionMiddleware で設定されたセッションを取得
  const session = c.get("session");

  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  return next();
};

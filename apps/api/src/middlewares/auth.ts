import type { Context, Next } from "hono";
import { auth } from "../lib/auth.js";

const DEFINED_ROUTES = ["/api/auth"] as const;
const PUBLIC_ROUTES = ["/health"] as const;

export const authMiddleware = async (c: Context, next: Next) => {
    const path = c.req.path;
    const isDefinedRoute = DEFINED_ROUTES.some((route) =>
        path.startsWith(route),
    );

    // 定義されていないルートの場合は認証をスキップして 404 処理に任せる
    if (!isDefinedRoute) {
        return next();
    }

    const isPublicPath = PUBLIC_ROUTES.some((publicRoute) =>
        path.startsWith(publicRoute),
    );

    if (isPublicPath) {
        return next();
    }

    const session = await auth.api.getSession({
        headers: c.req.raw.headers,
    });

    if (!session) {
        return c.json({ error: "Unauthorized" }, 401);
    }

    return next();
};

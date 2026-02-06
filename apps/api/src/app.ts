import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono } from "@hono/zod-openapi";
import type { Context } from "hono";
import { cors } from "hono/cors";
import { corsOrigins } from "./lib/config.js";
import { logger } from "./lib/logger.js";
import { authMiddleware } from "./middlewares/auth.js";
import { sessionMiddleware } from "./middlewares/session.js";
import { authRouter } from "./routes/auth.js";
import { categoriesRouter } from "./routes/categories.js";
import { feedRouter } from "./routes/feed.js";
import { healthRouter } from "./routes/health.js";
import { interactionsRouter } from "./routes/interactions.js";
import { statisticsRouter } from "./routes/statistics.js";
import { usersRouter } from "./routes/users.js";

const baseApp = new OpenAPIHono();

const app = baseApp
  .use(
    // CORSは認証より先に処理する必要がある（プリフライトリクエスト対応）
    cors({
      origin: corsOrigins,
      allowHeaders: ["Content-Type", "Authorization"],
      allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      exposeHeaders: ["Content-Length"],
      // プリフライトのキャッシュを24時間に設定してリクエスト数を削減
      maxAge: 86400,
      // Better Authのセッション管理にCookieを使用するため必須
      credentials: true,
    }),
  )
  // ミドルウェアの順序: session → auth（セッション情報を認証判定に使用）
  .use(sessionMiddleware)
  .use(authMiddleware)
  .route("/api/auth", authRouter)
  .route("/api/categories", categoriesRouter)
  .route("/api/feed", feedRouter)
  .route("/api/health", healthRouter)
  .route("/api/interactions", interactionsRouter)
  .route("/api/statistics", statisticsRouter)
  .route("/api/users", usersRouter);

// OpenAPI JSON
baseApp.doc("/api/docs/openapi.json", {
  openapi: "3.1.0",
  info: {
    title: "Curio API",
    version: "1.0.0",
    description: "Curio - パーソナライズ情報キュレーションアプリのAPI",
  },
});

// Swagger UI
baseApp.get("/api/docs", swaggerUI({ url: "/api/docs/openapi.json" }));

// Error handlers
baseApp.notFound((c: Context) => {
  return c.json({ error: "Not Found" }, 404);
});

baseApp.onError((err: Error, c: Context) => {
  logger.error({ err, path: c.req.path, method: c.req.method }, "Unhandled error");
  return c.json({ error: "Internal Server Error" }, 500);
});

export default app;

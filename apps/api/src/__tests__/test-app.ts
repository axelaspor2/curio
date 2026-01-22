/**
 * テスト用アプリケーション
 *
 * better-authを経由せず、直接DBからセッションを検索するテスト用ミドルウェアを使用します。
 */

import { OpenAPIHono } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import { cors } from "hono/cors";
import type { Context, Next } from "hono";
import { pool } from "./setup.js";
import { authMiddleware } from "../middlewares/auth.js";
import { authRouter } from "../routes/auth.js";
import { categoriesRouter } from "../routes/categories.js";
import { feedRouter } from "../routes/feed.js";
import { healthRouter } from "../routes/health.js";
import { interactionsRouter } from "../routes/interactions.js";
import { usersRouter } from "../routes/users.js";

/**
 * テスト用セッションミドルウェア
 * better-authを経由せず、直接DBからセッションを検索します
 */
const testSessionMiddleware = async (c: Context, next: Next) => {
  const cookieHeader = c.req.header("Cookie");
  const sessionToken = cookieHeader
    ?.split(";")
    .find((c) => c.trim().startsWith("better-auth.session_token="))
    ?.split("=")[1]
    ?.trim();

  if (!sessionToken) {
    c.set("user", null);
    c.set("session", null);
    await next();
    return;
  }

  // 直接DBからセッションを検索
  const client = await pool.connect();
  try {
    const sessionResult = await client.query(
      `SELECT s.id, s.user_id, s.token, s.expires_at, s.created_at, s.updated_at,
              u.id as user_id_2, u.email, u.name, u.email_verified
       FROM sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.token = $1 AND s.expires_at > NOW()`,
      [sessionToken]
    );

    if (sessionResult.rows.length === 0) {
      c.set("user", null);
      c.set("session", null);
      await next();
      return;
    }

    const row = sessionResult.rows[0];
    c.set("user", {
      id: row.user_id,
      email: row.email,
      name: row.name,
      emailVerified: row.email_verified,
    });
    c.set("session", {
      id: row.id,
      userId: row.user_id,
      token: row.token,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  } finally {
    client.release();
  }

  await next();
};

const corsOrigins = ["http://localhost:3000", "http://localhost:5173"];

const testApp = new OpenAPIHono();

// Middlewares
testApp.use(testSessionMiddleware);
testApp.use(authMiddleware);
testApp.use(
  cors({
    origin: corsOrigins,
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 86400,
    credentials: true,
  })
);

// Routes
testApp.route("/api/auth", authRouter);
testApp.route("/api/categories", categoriesRouter);
testApp.route("/api/feed", feedRouter);
testApp.route("/api/health", healthRouter);
testApp.route("/api/interactions", interactionsRouter);
testApp.route("/api/users", usersRouter);

// OpenAPI JSON
testApp.doc("/api/docs/openapi.json", {
  openapi: "3.1.0",
  info: {
    title: "Curio API",
    version: "1.0.0",
    description: "Curio - パーソナライズ情報キュレーションアプリのAPI",
  },
});

// Swagger UI
testApp.get("/api/docs", swaggerUI({ url: "/api/docs/openapi.json" }));

// Error handlers
testApp.notFound((c: Context) => {
  return c.json({ error: "Not Found" }, 404);
});

testApp.onError((err: Error, c: Context) => {
  console.error("Test app error:", err);
  return c.json({ error: "Internal Server Error" }, 500);
});

export default testApp;

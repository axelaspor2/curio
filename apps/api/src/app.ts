import { OpenAPIHono } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import { cors } from "hono/cors";
import type { Context } from "hono";
import { logger } from "./lib/logger.js";
import { authMiddleware } from "./middlewares/auth.js";
import { sessionMiddleware } from "./middlewares/session.js";
import { authRouter } from "./routes/auth.js";
import { categoriesRouter } from "./routes/categories.js";
import { feedRouter } from "./routes/feed.js";
import { healthRouter } from "./routes/health.js";
import { interactionsRouter } from "./routes/interactions.js";
import { usersRouter } from "./routes/users.js";

const corsOrigins = process.env.CORS_ORIGINS?.split(",") ?? [
  "http://localhost:3000",
  "http://localhost:5173",
];

const app = new OpenAPIHono();

// Middlewares
app.use(sessionMiddleware);
app.use(authMiddleware);
app.use(
  cors({
    origin: corsOrigins,
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 86400,
    credentials: true,
  }),
);

// Routes
app.route("/api/auth", authRouter);
app.route("/api/categories", categoriesRouter);
app.route("/api/feed", feedRouter);
app.route("/api/health", healthRouter);
app.route("/api/interactions", interactionsRouter);
app.route("/api/users", usersRouter);

// OpenAPI JSON
app.doc("/api/docs/openapi.json", {
  openapi: "3.1.0",
  info: {
    title: "Curio API",
    version: "1.0.0",
    description: "Curio - パーソナライズ情報キュレーションアプリのAPI",
  },
});

// Swagger UI
app.get("/api/docs", swaggerUI({ url: "/api/docs/openapi.json" }));

// Error handlers
app.notFound((c: Context) => {
  return c.json({ error: "Not Found" }, 404);
});

app.onError((err: Error, c: Context) => {
  logger.error({ err, path: c.req.path, method: c.req.method }, "Unhandled error");
  return c.json({ error: "Internal Server Error" }, 500);
});

export default app;

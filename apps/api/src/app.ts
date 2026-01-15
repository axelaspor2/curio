import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { sessionMiddleware } from "./middlewares/session.js";
import { authRouter } from "./routes/auth.js";

const app = new Hono()
  .use(sessionMiddleware)
  .use("*", logger())
  .use(
    cors({
      origin: ["http://localhost:3000", "http://localhost:5173"],
      allowHeaders: ["Content-Type", "Authorization"],
      allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      exposeHeaders: ["Content-Length"],
      maxAge: 86400,
      credentials: true,
    }),
  )
  .route("/api/auth", authRouter)
  .get("/health", (c) => {
    return c.json({ status: "ok" });
  });

export default app;

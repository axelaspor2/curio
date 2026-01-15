import { Hono } from "hono";
import { cors } from "hono/cors";
import { sessionMiddleware } from "./middlewares/session.js";
import { authRouter } from "./routes/auth.js";
import { healthRouter } from "./routes/health.js";
import { logger } from "./lib/logger.js";

const app = new Hono()
  .use(sessionMiddleware)
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
  .route("/api/health", healthRouter)
  .notFound((c) => {
    return c.json({ error: "Not Found" }, 404);
  })
  .onError((err, c) => {
        logger.error(
            { err, path: c.req.path, method: c.req.method },
            "Unhandled error",
        );
        return c.json({ error: "Internal Server Error" }, 500);
});

export default app;

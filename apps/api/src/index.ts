import { serve } from "@hono/node-server";
import app from "./app.js";
import { logger } from "./lib/logger.js";

serve(
  {
    fetch: app.fetch,
    port: Number(process.env.PORT) || 3001,
    hostname: "0.0.0.0",
  },
  (info) => {
    logger.info(`Server is running on http://localhost:${info.port}`);
  },
);

export type AppType = typeof app;

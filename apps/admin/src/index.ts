import app from "./app.js";
import { config } from "./lib/config.js";
import { logger } from "./lib/logger.js";

const { port } = config;

app.listen(port, "0.0.0.0", () => {
  logger.info(`AdminJS started on http://localhost:${port}/admin`);
});

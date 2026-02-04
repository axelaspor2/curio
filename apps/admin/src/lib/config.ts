export const config = {
  port: Number(process.env.PORT) || 3002,
  nodeEnv: process.env.NODE_ENV || "development",
  sessionSecret: process.env.SESSION_SECRET || "dev-session-secret-at-least-32-chars",
  isDev: process.env.NODE_ENV !== "production",
} as const;

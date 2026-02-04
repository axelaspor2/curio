export const config = {
  port: Number(process.env.PORT) || 3002,
  nodeEnv: process.env.NODE_ENV || "development",
  sessionSecret: process.env.SESSION_SECRET || "dev-session-secret-at-least-32-chars",
  isDev: process.env.NODE_ENV !== "production",

  // Basic 認証
  adminEmail: process.env.ADMIN_EMAIL || "admin@example.com",
  adminPassword: process.env.ADMIN_PASSWORD || "password",
} as const;

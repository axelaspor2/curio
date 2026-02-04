import AdminJSExpress from "@adminjs/express";
import { Database, Resource } from "@adminjs/prisma";
import AdminJS from "adminjs";
import express, { type Express } from "express";
import session from "express-session";
import { config } from "./lib/config.js";
import { logger } from "./lib/logger.js";
import { iapAuthMiddleware } from "./middlewares/iap-auth.js";
import { resources } from "./resources/index.js";

// Register Prisma adapter
AdminJS.registerAdapter({ Database, Resource });

const app: Express = express();

// Trust proxy for Cloud Run
app.set("trust proxy", true);

// IAP Authentication Middleware (applied to all routes except /health)
app.use(iapAuthMiddleware);

// Session configuration (required by AdminJS)
app.use(
  session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: !config.isDev,
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  }),
);

// Create AdminJS instance
const adminJs = new AdminJS({
  rootPath: "/admin",
  resources,
  branding: {
    companyName: "Curio Admin",
    logo: false,
    withMadeWithLove: false,
  },
  locale: {
    language: "ja",
    translations: {
      ja: {
        labels: {
          User: "ユーザー",
          Source: "ソース",
          Category: "カテゴリ",
          Article: "記事",
          ArticleCategory: "記事カテゴリ",
          Interaction: "インタラクション",
          UserCategoryPreference: "カテゴリ選好",
          UserInterestVector: "興味ベクトル",
          Session: "セッション",
          Account: "アカウント",
          Verification: "認証",
        },
        messages: {
          loginWelcome: "Curio 管理画面へようこそ",
        },
      },
    },
  },
});

// Build router without authentication (IAP handles auth)
const router = AdminJSExpress.buildRouter(adminJs);

// Mount AdminJS
app.use(adminJs.options.rootPath, router);

// Root redirect to admin
app.get("/", (_req, res) => {
  res.redirect("/admin");
});

// Health check endpoint
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// Log startup info
logger.info({ rootPath: adminJs.options.rootPath }, "AdminJS configured");

export default app;

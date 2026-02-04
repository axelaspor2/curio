import AdminJSExpress from "@adminjs/express";
import { Database, Resource } from "@adminjs/prisma";
import AdminJS from "adminjs";
import express, { type Express } from "express";
import { config } from "./lib/config.js";
import { logger } from "./lib/logger.js";
import { resources } from "./resources/index.js";

// Register Prisma adapter
AdminJS.registerAdapter({ Database, Resource });

const app: Express = express();

// Trust proxy for Cloud Run
app.set("trust proxy", true);

// Health check endpoint (before auth)
app.get("/health", (_req, res) => {
	res.json({
		status: "ok",
		timestamp: new Date().toISOString(),
	});
});

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

// 認証関数
const authenticate = async (email: string, password: string) => {
	if (email === config.adminEmail && password === config.adminPassword) {
		return { email };
	}
	return null;
};

// 認証付きルーター
const router = AdminJSExpress.buildAuthenticatedRouter(
	adminJs,
	{
		authenticate,
		cookieName: "adminjs",
		cookiePassword: config.sessionSecret,
	},
	null,
	{
		resave: false,
		saveUninitialized: false,
		secret: config.sessionSecret,
		cookie: {
			secure: !config.isDev,
			httpOnly: true,
			maxAge: 24 * 60 * 60 * 1000, // 24 hours
		},
	},
);

// Mount AdminJS
app.use(adminJs.options.rootPath, router);

// Root redirect to admin
app.get("/", (_req, res) => {
	res.redirect("/admin");
});

// Log startup info
logger.info({ rootPath: adminJs.options.rootPath }, "AdminJS configured");

export default app;

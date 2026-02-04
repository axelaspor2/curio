import type { NextFunction, Request, Response } from "express";
import { config } from "../lib/config.js";
import { logger } from "../lib/logger.js";

export interface IAPUser {
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      iapUser?: IAPUser;
    }
  }
}

/**
 * IAP Authentication Middleware
 *
 * Cloud Run の直接 IAP を使用するため、JWT 署名検証は不要。
 * IAP を通過しないリクエストは Cloud Run に到達しないため、
 * ヘッダーの存在確認とユーザー情報の抽出のみ行う。
 */
export function iapAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  // ヘルスチェックはスキップ
  if (req.path === "/health") {
    next();
    return;
  }

  // ローカル開発時は IAP をバイパス
  if (config.isDev) {
    req.iapUser = { email: "dev@localhost" };
    next();
    return;
  }

  // IAP ヘッダーからユーザー情報を取得
  // 形式: "accounts.google.com:user@example.com"
  const emailHeader = req.headers["x-goog-authenticated-user-email"] as string | undefined;

  if (!emailHeader) {
    logger.warn("Missing IAP user email header");
    res.status(401).json({ error: "Unauthorized: Missing IAP authentication" });
    return;
  }

  // "accounts.google.com:" プレフィックスを除去
  const email = emailHeader.replace(/^accounts\.google\.com:/, "");

  req.iapUser = { email };
  logger.info({ email }, "IAP user authenticated");

  next();
}

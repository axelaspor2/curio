/**
 * テスト用ヘルパー関数
 *
 * 認証モックやリクエストヘルパーなどを提供します。
 * モジュール解決の問題を回避するため、生のSQLを使用します。
 */

import { pool } from "./setup.js";
import { randomUUID } from "crypto";

// 型定義
export interface TestUser {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
}

export interface TestSession {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
}

/**
 * テスト用ユーザーとセッションを作成
 */
export const createTestUserWithSession = async (): Promise<{
  user: TestUser;
  session: TestSession;
}> => {
  const client = await pool.connect();
  try {
    const user: TestUser = {
      id: randomUUID(),
      email: `test-${Date.now()}@example.com`,
      name: "Test User",
      emailVerified: true,
    };

    await client.query(
      `INSERT INTO users (id, email, name, email_verified, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())`,
      [user.id, user.email, user.name, user.emailVerified]
    );

    const session: TestSession = {
      id: randomUUID(),
      userId: user.id,
      token: `test-session-token-${Date.now()}`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1日後
    };

    await client.query(
      `INSERT INTO sessions (id, user_id, token, expires_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())`,
      [session.id, session.userId, session.token, session.expiresAt]
    );

    return { user, session };
  } finally {
    client.release();
  }
};

/**
 * Honoアプリケーション型（OpenAPIHono互換）
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AppType = { request: (path: string, init?: RequestInit) => Response | Promise<Response> };

/**
 * 認証済みリクエスト用ヘルパー
 */
export const authenticatedRequest = (app: AppType, token: string) => {
  return {
    get: (path: string) =>
      app.request(path, {
        headers: { Cookie: `better-auth.session_token=${token}` },
      }),
    post: (path: string, body: unknown) =>
      app.request(path, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `better-auth.session_token=${token}`,
        },
        body: JSON.stringify(body),
      }),
  };
};

/**
 * 未認証リクエスト用ヘルパー
 */
export const unauthenticatedRequest = (app: AppType) => {
  return {
    get: (path: string) => app.request(path),
    post: (path: string, body: unknown) =>
      app.request(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
  };
};

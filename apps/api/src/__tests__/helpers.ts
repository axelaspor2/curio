/**
 * テスト用ヘルパー関数
 *
 * 認証モックやリクエストヘルパーなどを提供します。
 */

import { prisma } from "@curio/database";

/**
 * テスト用ユーザーとセッションを作成
 */
export const createTestUserWithSession = async () => {
  const user = await prisma.user.create({
    data: {
      email: `test-${Date.now()}@example.com`,
      name: "Test User",
      emailVerified: true,
    },
  });

  const session = await prisma.session.create({
    data: {
      userId: user.id,
      token: `test-session-token-${Date.now()}`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1日後
    },
  });

  return { user, session };
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

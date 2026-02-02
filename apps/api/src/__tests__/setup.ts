/**
 * テストセットアップ
 *
 * テスト実行前後のセットアップとクリーンアップを行います。
 */

import { prisma } from "@curio/database";
import { afterAll, beforeAll, beforeEach, vi } from "vitest";

// Better Auth のセッション検証をモック
// テストでは直接DBからセッションを検索する
vi.mock("../lib/auth.js", () => ({
  auth: {
    api: {
      getSession: async ({ headers }: { headers: Headers }) => {
        const { prisma: db } = await import("@curio/database");
        const cookie = headers.get("cookie");
        const token = cookie?.match(/better-auth\.session_token=([^;]+)/)?.[1];
        if (!token) return null;
        const session = await db.session.findFirst({ where: { token } });
        if (!session || session.expiresAt < new Date()) return null;
        const user = await db.user.findUnique({ where: { id: session.userId } });
        if (!user) return null;
        return { user, session };
      },
    },
    handler: async (_request: Request) => new Response(null, { status: 404 }),
  },
}));

beforeAll(async () => {
  // テスト用DBの接続確認
  await prisma.$queryRaw`SELECT 1`;
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  // テストごとにDBをクリーンアップ（依存関係順に削除）
  await prisma.interaction.deleteMany();
  await prisma.userCategoryPreference.deleteMany();
  await prisma.userInterestVector.deleteMany();
  await prisma.articleCategory.deleteMany();
  await prisma.article.deleteMany();
  await prisma.source.deleteMany();
  await prisma.category.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verification.deleteMany();
  await prisma.user.deleteMany();
});

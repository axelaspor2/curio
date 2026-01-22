/**
 * テストセットアップ
 *
 * テスト実行前後のセットアップとクリーンアップを行います。
 */

import { prisma } from "@curio/database";
import { beforeAll, afterAll, beforeEach } from "vitest";

// Prisma 7 driver adapter使用時の型問題を回避
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;

beforeAll(async () => {
  // テスト用DBの接続確認
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  // テストごとにDBをクリーンアップ（依存関係順に削除）
  await db.interaction.deleteMany();
  await db.userCategoryPreference.deleteMany();
  await db.userInterestVector.deleteMany();
  await db.articleCategory.deleteMany();
  await db.article.deleteMany();
  await db.source.deleteMany();
  await db.category.deleteMany();
  await db.session.deleteMany();
  await db.account.deleteMany();
  await db.verification.deleteMany();
  await db.user.deleteMany();
});

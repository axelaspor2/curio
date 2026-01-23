/**
 * テストセットアップ
 *
 * テスト実行前後のセットアップとクリーンアップを行います。
 */

import { prisma } from "@curio/database";
import { beforeAll, afterAll, beforeEach } from "vitest";

beforeAll(async () => {
  // テスト用DBの接続確認
  await prisma.$connect();
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

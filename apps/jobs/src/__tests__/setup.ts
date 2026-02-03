/**
 * テストセットアップ
 */

import { prisma } from "@curio/database";
import { afterAll, beforeAll, beforeEach } from "vitest";

beforeAll(async () => {
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

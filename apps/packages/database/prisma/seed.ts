/**
 * @curio/database - Seed Script
 *
 * Creates initial development data for local testing.
 * Safe to run multiple times (uses upsert for idempotency).
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "better-auth/crypto";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/client/index.js";

// Initialize PrismaClient with pg adapter (Prisma 7 requirement)
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const SEED_DATA = {
  users: [
    { email: "test@curio.dev", name: "Test User", password: "password123" },
    { email: "demo@curio.dev", name: "Demo User", password: "password123" },
  ],
  sources: [
    { type: "atom", name: "Zenn", url: "https://zenn.dev/feed" },
    { type: "rss", name: "Qiita", url: "https://qiita.com/popular-items/feed" },
    { type: "rss", name: "はてなブックマーク IT", url: "https://b.hatena.ne.jp/hotentry/it.rss" },
    { type: "atom", name: "Publickey", url: "https://www.publickey1.jp/atom.xml" },
    { type: "rss", name: "GIGAZINE", url: "https://gigazine.net/news/rss_2.0/" },
    { type: "rss", name: "Hacker News", url: "https://hnrss.org/frontpage" },
    { type: "rss", name: "TechCrunch", url: "https://techcrunch.com/feed/" },
  ],
  // テストユーザーの初期カテゴリ嗜好
  initialCategoryPreferences: ["tech", "ai-ml", "web-dev"],
  // AIの分類で使用するカテゴリと一致させる (gemini-client.ts CATEGORY_SLUGS)
  categories: [
    {
      slug: "tech",
      name: "テクノロジー",
      description: "一般的なテック情報・ガジェット",
      displayOrder: 1,
    },
    {
      slug: "ai-ml",
      name: "AI・機械学習",
      description: "人工知能、機械学習、ディープラーニング",
      displayOrder: 2,
    },
    {
      slug: "web-dev",
      name: "Web開発",
      description: "フロントエンド、バックエンド、フレームワーク",
      displayOrder: 3,
    },
    {
      slug: "mobile",
      name: "モバイル",
      description: "iOS、Android、クロスプラットフォーム開発",
      displayOrder: 4,
    },
    {
      slug: "devops",
      name: "DevOps",
      description: "CI/CD、インフラ、クラウド、コンテナ",
      displayOrder: 5,
    },
    {
      slug: "security",
      name: "セキュリティ",
      description: "サイバーセキュリティ、脆弱性、プライバシー",
      displayOrder: 6,
    },
    {
      slug: "business",
      name: "ビジネス",
      description: "テック業界のビジネスニュース",
      displayOrder: 7,
    },
    {
      slug: "startup",
      name: "スタートアップ",
      description: "起業、資金調達、スタートアップ文化",
      displayOrder: 8,
    },
    { slug: "design", name: "デザイン", description: "UI/UX、プロダクトデザイン", displayOrder: 9 },
    {
      slug: "career",
      name: "キャリア",
      description: "エンジニアのキャリア、転職、働き方",
      displayOrder: 10,
    },
    {
      slug: "lifestyle",
      name: "ライフスタイル",
      description: "エンジニアの生活、趣味、健康",
      displayOrder: 11,
    },
    { slug: "news", name: "ニュース", description: "一般ニュース、時事", displayOrder: 12 },
  ],
} as const;

async function main(): Promise<void> {
  console.log("🌱 Seeding database...\n");

  // Create users with passwords (for Better Auth email/password login)
  for (const userData of SEED_DATA.users) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: { name: userData.name },
      create: {
        email: userData.email,
        name: userData.name,
      },
    });

    // Create or update account with password for email/password auth
    const hashedPassword = await hashPassword(userData.password);
    const existingAccount = await prisma.account.findFirst({
      where: {
        userId: user.id,
        providerId: "credential",
      },
    });

    if (!existingAccount) {
      await prisma.account.create({
        data: {
          userId: user.id,
          accountId: user.id, // For credential provider, accountId is the user's ID
          providerId: "credential",
          password: hashedPassword,
        },
      });
      console.log(`✅ User: ${user.email} (with password)`);
    } else {
      console.log(`⏭️  User: ${user.email} (exists)`);
    }
  }

  // Create sources (using url as unique identifier via findFirst + create pattern)
  for (const sourceData of SEED_DATA.sources) {
    const existing = await prisma.source.findFirst({
      where: { url: sourceData.url },
    });

    if (!existing) {
      const source = await prisma.source.create({ data: sourceData });
      console.log(`✅ Source: ${source.name} (created)`);
    } else {
      console.log(`⏭️  Source: ${existing.name} (exists)`);
    }
  }

  // Create categories
  for (const categoryData of SEED_DATA.categories) {
    const category = await prisma.category.upsert({
      where: { slug: categoryData.slug },
      update: {
        name: categoryData.name,
        description: categoryData.description,
        displayOrder: categoryData.displayOrder,
      },
      create: categoryData,
    });
    console.log(`✅ Category: ${category.name}`);
  }

  // Set initial category preferences for test users
  const testUser = await prisma.user.findFirst({
    where: { email: "test@curio.dev" },
  });

  if (testUser) {
    for (const slug of SEED_DATA.initialCategoryPreferences) {
      const category = await prisma.category.findUnique({ where: { slug } });
      if (category) {
        await prisma.userCategoryPreference.upsert({
          where: {
            userId_categoryId: { userId: testUser.id, categoryId: category.id },
          },
          create: {
            userId: testUser.id,
            categoryId: category.id,
            preferenceScore: 0.7,
            isInitialSelection: true,
          },
          update: {},
        });
        console.log(`✅ Category preference: ${slug} for ${testUser.email}`);
      }
    }
  }

  console.log("\n🎉 Seed completed!");
}

main()
  .catch((error: unknown) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

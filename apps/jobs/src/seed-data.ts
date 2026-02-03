import { prisma } from "@curio/database";

const CATEGORIES = [
  { slug: "tech", name: "テクノロジー", description: "テック全般" },
  { slug: "ai-ml", name: "AI/機械学習", description: "人工知能・機械学習" },
  { slug: "web-dev", name: "Web開発", description: "フロントエンド・バックエンド" },
  { slug: "mobile", name: "モバイル", description: "iOS/Android開発" },
  { slug: "devops", name: "DevOps", description: "インフラ・CI/CD" },
  { slug: "security", name: "セキュリティ", description: "情報セキュリティ" },
  { slug: "business", name: "ビジネス", description: "ビジネス・経営" },
  { slug: "startup", name: "スタートアップ", description: "起業・資金調達" },
  { slug: "design", name: "デザイン", description: "UI/UXデザイン" },
  { slug: "career", name: "キャリア", description: "キャリア・転職" },
  { slug: "lifestyle", name: "ライフスタイル", description: "働き方・生活" },
  { slug: "news", name: "ニュース", description: "最新ニュース" },
];

const main = async () => {
  console.log("=== Seeding Data ===\n");

  // カテゴリ
  console.log("Creating categories...");
  for (const cat of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      create: cat,
      update: cat,
    });
    console.log(`  ✓ ${cat.slug}`);
  }

  // テストユーザー
  console.log("\nCreating test user...");
  const user = await prisma.user.upsert({
    where: { email: "test@example.com" },
    create: {
      email: "test@example.com",
      name: "Test User",
      emailVerified: true,
    },
    update: {},
  });
  console.log(`  ✓ ${user.email} (${user.id})`);

  // ユーザーのカテゴリ初期設定
  console.log("\nSetting initial category preferences...");
  const preferredCategories = ["tech", "ai-ml", "web-dev"];
  for (const slug of preferredCategories) {
    const category = await prisma.category.findUnique({ where: { slug } });
    if (category) {
      await prisma.userCategoryPreference.upsert({
        where: {
          userId_categoryId: { userId: user.id, categoryId: category.id },
        },
        create: {
          userId: user.id,
          categoryId: category.id,
          preferenceScore: 0.7,
          isInitialSelection: true,
        },
        update: {},
      });
      console.log(`  ✓ ${slug}`);
    }
  }

  console.log("\n=== Done ===");
  await prisma.$disconnect();
};

main();

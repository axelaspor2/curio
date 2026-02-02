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
    { type: "rss", name: "Hacker News", url: "https://news.ycombinator.com/rss" },
    { type: "rss", name: "TechCrunch", url: "https://techcrunch.com/feed/" },
  ],
  categories: [
    {
      slug: "technology",
      name: "テクノロジー",
      description: "AI、プログラミング、ガジェットなどの最新テック情報",
      displayOrder: 1,
    },
    {
      slug: "business",
      name: "ビジネス",
      description: "スタートアップ、経済、マーケティングのニュース",
      displayOrder: 2,
    },
    {
      slug: "science",
      name: "サイエンス",
      description: "科学研究、宇宙、環境に関する発見",
      displayOrder: 3,
    },
    {
      slug: "health",
      name: "健康",
      description: "医療、フィットネス、メンタルヘルスの情報",
      displayOrder: 4,
    },
  ],
  articles: [
    {
      title: "GPT-5がついに登場：AIの新時代が始まる",
      content:
        "OpenAIは本日、次世代AIモデル「GPT-5」を発表しました。従来モデルを大幅に上回る推論能力と、マルチモーダル対応が特徴です。",
      summary: "OpenAIがGPT-5を発表。推論能力が大幅向上し、画像・音声・動画の理解も可能に。",
      url: "https://example.com/gpt5-announcement",
      imageUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800",
      categorySlug: "technology",
    },
    {
      title: "Rustが2026年最も愛されるプログラミング言語に",
      content:
        "Stack Overflowの年次調査で、Rustが9年連続で「最も愛されるプログラミング言語」に選ばれました。",
      summary: "Stack Overflow調査でRustが9年連続1位。メモリ安全性と高パフォーマンスが評価される。",
      url: "https://example.com/rust-survey-2026",
      imageUrl: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800",
      categorySlug: "technology",
    },
    {
      title: "量子コンピュータが暗号を破る日は近い？",
      content:
        "Google Quantumチームの新しい研究により、実用的な量子コンピュータの実現が5年以内に可能になる見通しが立ちました。",
      summary: "Google Quantumが量子優位性の新記録を達成。既存暗号システムへの影響が懸念される。",
      url: "https://example.com/quantum-breakthrough",
      imageUrl: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800",
      categorySlug: "technology",
    },
    {
      title: "日本発スタートアップがユニコーン企業に仲間入り",
      content:
        "東京拠点のAIスタートアップ「NeuralWorks」が、シリーズCで評価額10億ドルを突破しました。",
      summary: "NeuralWorksが日本発の新ユニコーンに。製造業向けAIソリューションで急成長。",
      url: "https://example.com/neuralworks-unicorn",
      imageUrl: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800",
      categorySlug: "business",
    },
    {
      title: "リモートワーク定着で都心オフィス空室率が過去最高に",
      content:
        "東京都心5区のオフィス空室率が15%を超え、過去最高を記録しました。企業の働き方改革が加速しています。",
      summary: "東京都心オフィス空室率が15%超え。リモートワーク定着でオフィス需要が構造的変化。",
      url: "https://example.com/office-vacancy-rate",
      imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800",
      categorySlug: "business",
    },
    {
      title: "火星で微生物の痕跡を発見か？NASAが重大発表へ",
      content:
        "NASAのPerseverance探査機が収集したサンプルから、古代微生物の可能性を示す有機分子が検出されました。",
      summary: "火星サンプルから有機分子検出。地球外生命体の存在を示す初の直接証拠の可能性。",
      url: "https://example.com/mars-life-discovery",
      imageUrl: "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=800",
      categorySlug: "science",
    },
    {
      title: "核融合発電、実用化に向け大きな一歩",
      content:
        "国際熱核融合実験炉（ITER）が、プラズマ持続時間の新記録を樹立。商用化への道筋が見えてきました。",
      summary: "ITERがプラズマ持続10分を達成。クリーンエネルギーの実用化が現実味を帯びる。",
      url: "https://example.com/fusion-breakthrough",
      imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800",
      categorySlug: "science",
    },
    {
      title: "睡眠不足が認知症リスクを40%上昇させる：大規模研究",
      content:
        "10万人を対象とした20年間の追跡調査により、慢性的な睡眠不足と認知症発症の強い関連が明らかになりました。",
      summary: "睡眠6時間未満が認知症リスクを40%上昇。7-8時間の睡眠確保が推奨される。",
      url: "https://example.com/sleep-dementia-study",
      imageUrl: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=800",
      categorySlug: "health",
    },
    {
      title: "AIが医療画像診断で人間の医師を上回る精度を達成",
      content:
        "新しいAI診断システムが、がん検出において放射線科医を上回る精度を複数の臨床試験で実証しました。",
      summary: "AI医療画像診断が医師を超える精度に。早期がん発見率が30%向上。",
      url: "https://example.com/ai-medical-diagnosis",
      imageUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800",
      categorySlug: "health",
    },
    {
      title: "週4日勤務の大規模実験、生産性が向上する結果に",
      content:
        "イギリスで行われた週4日勤務の実験で、参加企業の92%が制度を継続する意向を示しました。",
      summary: "週4日勤務で生産性が向上。従業員の幸福度も大幅改善、92%の企業が継続を決定。",
      url: "https://example.com/4day-workweek-results",
      imageUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800",
      categorySlug: "business",
    },
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
  const sources: { id: string; name: string; url: string }[] = [];
  for (const sourceData of SEED_DATA.sources) {
    const existing = await prisma.source.findFirst({
      where: { url: sourceData.url },
    });

    if (!existing) {
      const source = await prisma.source.create({ data: sourceData });
      sources.push(source);
      console.log(`✅ Source: ${source.name} (created)`);
    } else {
      sources.push(existing);
      console.log(`⏭️  Source: ${existing.name} (exists)`);
    }
  }

  // Create categories
  const categoryMap = new Map<string, string>();
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
    categoryMap.set(category.slug, category.id);
    console.log(`✅ Category: ${category.name}`);
  }

  // Create articles
  const defaultSource = sources[0];
  if (!defaultSource) {
    console.log("⚠️  No source available, skipping articles");
    return;
  }

  for (const articleData of SEED_DATA.articles) {
    const existing = await prisma.article.findFirst({
      where: { url: articleData.url },
    });

    if (!existing) {
      const categoryId = categoryMap.get(articleData.categorySlug);
      const article = await prisma.article.create({
        data: {
          sourceId: defaultSource.id,
          title: articleData.title,
          content: articleData.content,
          summary: articleData.summary,
          url: articleData.url,
          imageUrl: articleData.imageUrl,
          publishedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // ランダムに過去7日以内
          categories: categoryId
            ? {
                create: {
                  categoryId,
                  confidence: 0.95,
                },
              }
            : undefined,
        },
      });
      console.log(`✅ Article: ${article.title.substring(0, 30)}...`);
    } else {
      console.log(`⏭️  Article: ${existing.title.substring(0, 30)}... (exists)`);
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

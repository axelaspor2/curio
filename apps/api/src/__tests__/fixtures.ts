/**
 * テスト用ダミーデータ生成
 *
 * テストで使用するデータを作成するためのヘルパー関数を提供します。
 */

import { prisma } from "@curio/database";

// Prisma 7 driver adapter使用時の型問題を回避
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;

/**
 * テスト用カテゴリを作成
 */
export const createTestCategories = async () => {
  const categories = await db.category.createManyAndReturn({
    data: [
      { slug: "technology", name: "テクノロジー", description: "Tech news", displayOrder: 1 },
      { slug: "business", name: "ビジネス", description: "Business news", displayOrder: 2 },
      { slug: "science", name: "サイエンス", description: "Science news", displayOrder: 3 },
      { slug: "health", name: "健康", description: "Health news", displayOrder: 4 },
    ],
  });
  return categories;
};

/**
 * テスト用ソースを作成
 */
export const createTestSource = async () => {
  const source = await db.source.create({
    data: {
      type: "rss",
      name: "Test News Source",
      url: "https://example.com/feed.xml",
    },
  });
  return source;
};

/**
 * テスト用記事を作成
 */
export const createTestArticles = async (
  sourceId: string,
  categoryIds: string[] = [],
  count: number = 5,
) => {
  const articles = [];

  for (let i = 0; i < count; i++) {
    const article = await db.article.create({
      data: {
        sourceId,
        title: `Test Article ${i + 1}`,
        content: `This is test content for article ${i + 1}`,
        summary: `Summary of article ${i + 1}`,
        url: `https://example.com/article-${i + 1}`,
        imageUrl: `https://example.com/image-${i + 1}.jpg`,
        publishedAt: new Date(Date.now() - i * 3600000), // 1時間ずつ古い
        categories:
          categoryIds.length > 0
            ? {
                create: categoryIds.map((categoryId) => ({
                  categoryId,
                  confidence: 0.9,
                })),
              }
            : undefined,
      },
      include: {
        source: true,
        categories: { include: { category: true } },
      },
    });
    articles.push(article);
  }

  return articles;
};

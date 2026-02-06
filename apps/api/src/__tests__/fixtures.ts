/**
 * テスト用ダミーデータ生成
 *
 * テストで使用するデータを作成するためのヘルパー関数を提供します。
 */

import { prisma } from "@curio/database";

/**
 * テスト用カテゴリを作成
 */
export const createTestCategories = async () => {
  const categories = await prisma.category.createManyAndReturn({
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
  const source = await prisma.source.create({
    data: {
      type: "rss",
      name: "Test News Source",
      url: "https://example.com/feed.xml",
    },
  });
  return source;
};

/**
 * テスト用インタラクションを作成
 */
export const createTestInteraction = async (
  userId: string,
  articleId: string,
  type: "SKIP" | "LIKE" | "OPEN" | "READ",
  readingTimeSec?: number,
) => {
  const interaction = await prisma.interaction.create({
    data: {
      userId,
      articleId,
      type,
      readingTimeSec: readingTimeSec ?? null,
    },
  });
  return interaction;
};

/**
 * テスト用記事を作成
 */
/**
 * テスト用の未エンリッチ記事を作成（フィードに表示されないことを検証するため）
 */
export const createUnenrichedArticles = async (
  sourceId: string,
  overrides: { content?: string | null; description?: string | null; enrichedAt?: Date | null } = {},
  count: number = 1,
) => {
  const articles = [];
  for (let i = 0; i < count; i++) {
    const article = await prisma.article.create({
      data: {
        sourceId,
        title: `Unenriched Article ${i + 1}`,
        content: overrides.content !== undefined ? overrides.content : null,
        description: overrides.description !== undefined ? overrides.description : null,
        enrichedAt: overrides.enrichedAt !== undefined ? overrides.enrichedAt : null,
        url: `https://example.com/unenriched-${i + 1}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        publishedAt: new Date(),
      },
    });
    articles.push(article);
  }
  return articles;
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
    const article = await prisma.article.create({
      data: {
        sourceId,
        title: `Test Article ${i + 1}`,
        content: `This is test content for article ${i + 1}`,
        description: `Description of article ${i + 1}`,
        enrichedAt: new Date(),
        url: `https://example.com/article-${i + 1}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
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
    });
    articles.push(article);
  }

  return articles;
};

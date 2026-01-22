/**
 * テスト用ダミーデータ生成
 *
 * テストで使用するデータを作成するためのヘルパー関数を提供します。
 * モジュール解決の問題を回避するため、生のSQLを使用します。
 */

import { pool } from "./setup.js";
import { randomUUID } from "crypto";

// 型定義
export interface TestCategory {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  displayOrder: number;
}

export interface TestSource {
  id: string;
  type: string;
  name: string;
  url: string;
}

export interface TestArticle {
  id: string;
  sourceId: string;
  title: string;
  content: string;
  summary: string | null;
  url: string;
  imageUrl: string | null;
  publishedAt: Date;
}

/**
 * テスト用カテゴリを作成
 */
export const createTestCategories = async (): Promise<TestCategory[]> => {
  const client = await pool.connect();
  try {
    const categories: TestCategory[] = [
      { id: randomUUID(), slug: "technology", name: "テクノロジー", description: "Tech news", displayOrder: 1 },
      { id: randomUUID(), slug: "business", name: "ビジネス", description: "Business news", displayOrder: 2 },
      { id: randomUUID(), slug: "science", name: "サイエンス", description: "Science news", displayOrder: 3 },
      { id: randomUUID(), slug: "health", name: "健康", description: "Health news", displayOrder: 4 },
    ];

    for (const cat of categories) {
      await client.query(
        `INSERT INTO categories (id, slug, name, description, display_order, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [cat.id, cat.slug, cat.name, cat.description, cat.displayOrder]
      );
    }

    return categories;
  } finally {
    client.release();
  }
};

/**
 * テスト用ソースを作成
 */
export const createTestSource = async (): Promise<TestSource> => {
  const client = await pool.connect();
  try {
    const source: TestSource = {
      id: randomUUID(),
      type: "rss",
      name: "Test News Source",
      url: "https://example.com/feed.xml",
    };

    await client.query(
      `INSERT INTO sources (id, type, name, url, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [source.id, source.type, source.name, source.url]
    );

    return source;
  } finally {
    client.release();
  }
};

/**
 * テスト用記事を作成
 */
/**
 * テスト用インタラクションを作成
 */
export const createTestInteraction = async (
  userId: string,
  articleId: string,
  type: "SKIP" | "LIKE" | "OPEN" | "READ",
  readingTimeSec?: number,
): Promise<{ id: string; userId: string; articleId: string; type: string }> => {
  const client = await pool.connect();
  try {
    const id = randomUUID();
    await client.query(
      `INSERT INTO interactions (id, user_id, article_id, type, reading_time_sec, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [id, userId, articleId, type, readingTimeSec ?? null]
    );
    return { id, userId, articleId, type };
  } finally {
    client.release();
  }
};

export const createTestArticles = async (
  sourceId: string,
  categoryIds: string[] = [],
  count: number = 5,
): Promise<TestArticle[]> => {
  const client = await pool.connect();
  try {
    const articles: TestArticle[] = [];

    for (let i = 0; i < count; i++) {
      const article: TestArticle = {
        id: randomUUID(),
        sourceId,
        title: `Test Article ${i + 1}`,
        content: `This is test content for article ${i + 1}`,
        summary: `Summary of article ${i + 1}`,
        url: `https://example.com/article-${i + 1}-${Date.now()}-${randomUUID()}`,
        imageUrl: `https://example.com/image-${i + 1}.jpg`,
        publishedAt: new Date(Date.now() - i * 3600000), // 1時間ずつ古い
      };

      await client.query(
        `INSERT INTO articles (id, source_id, title, content, summary, url, image_url, published_at, fetched_at, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
        [
          article.id,
          article.sourceId,
          article.title,
          article.content,
          article.summary,
          article.url,
          article.imageUrl,
          article.publishedAt,
        ]
      );

      // カテゴリを関連付け
      for (const categoryId of categoryIds) {
        await client.query(
          `INSERT INTO article_categories (article_id, category_id, confidence, created_at)
           VALUES ($1, $2, $3, NOW())`,
          [article.id, categoryId, 0.9]
        );
      }

      articles.push(article);
    }

    return articles;
  } finally {
    client.release();
  }
};

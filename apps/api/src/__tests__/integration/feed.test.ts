/**
 * フィードAPIのインテグレーションテスト
 */

import { describe, expect, it } from "vitest";
import type { FeedResponse } from "../../schemas/feed.js";
import {
  createTestArticles,
  createTestCategories,
  createTestInteraction,
  createTestSource,
} from "../fixtures.js";
import {
  authenticatedRequest,
  createTestUserWithSession,
  unauthenticatedRequest,
} from "../helpers.js";
import app from "../test-app.js";

describe("GET /api/feed", () => {
  it("フィードが正しく取得できる", async () => {
    // Arrange
    const { session } = await createTestUserWithSession();
    const source = await createTestSource();
    await createTestArticles(source.id);
    const client = authenticatedRequest(app, session.token);

    // Act
    const res = await client.get("/api/feed?limit=10");

    // Assert
    expect(res.status).toBe(200);
    const json = (await res.json()) as FeedResponse;
    expect(json.articles).toBeInstanceOf(Array);
    expect(json.hasMore).toBeDefined();
  });

  it("カテゴリフィルタが機能する", async () => {
    // Arrange
    const { session } = await createTestUserWithSession();
    const source = await createTestSource();
    const categories = await createTestCategories();
    const categoryId = categories.at(0)!.id as string;

    await createTestArticles(source.id, [categoryId], 3);
    await createTestArticles(source.id, [], 3);
    const client = authenticatedRequest(app, session.token);

    // Act
    const res = await client.get(`/api/feed?limit=10&categoryId=${categoryId}`);

    // Assert
    expect(res.status).toBe(200);
    const json = (await res.json()) as FeedResponse;
    expect(json.articles.length).toBe(3);
  });

  it("インタラクション済みの記事は除外される", async () => {
    // Arrange
    const { user, session } = await createTestUserWithSession();
    const source = await createTestSource();
    const articles = await createTestArticles(source.id, [], 5);
    const articleId = articles.at(0)!.id;

    // LIKEインタラクションを作成
    await createTestInteraction(user.id, articleId, "LIKE");

    const client = authenticatedRequest(app, session.token);

    // Act
    const res = await client.get("/api/feed?limit=10");

    // Assert
    expect(res.status).toBe(200);
    const json = (await res.json()) as FeedResponse;
    const articleIds = json.articles.map((a) => a.id);
    expect(articleIds).not.toContain(articleId);
    expect(json.articles.length).toBe(4); // 5 - 1
  });

  it("未認証の場合は401が返る", async () => {
    // Arrange
    const client = unauthenticatedRequest(app);

    // Act
    const res = await client.get("/api/feed");

    // Assert
    expect(res.status).toBe(401);
  });

  it("ページネーションが正しく機能する", async () => {
    // Arrange
    const { session } = await createTestUserWithSession();
    const source = await createTestSource();
    await createTestArticles(source.id, [], 10);
    const client = authenticatedRequest(app, session.token);

    // Act - 最初のページ
    const res1 = await client.get("/api/feed?limit=3");
    const json1 = (await res1.json()) as FeedResponse;

    expect(json1.articles).toHaveLength(3);
    expect(json1.hasMore).toBe(true);
    expect(json1.nextCursor).not.toBeNull();

    // Act - 2ページ目
    const res2 = await client.get(`/api/feed?limit=3&cursor=${json1.nextCursor}`);
    const json2 = (await res2.json()) as FeedResponse;

    expect(json2.articles).toHaveLength(3);

    // 重複がないことを確認
    const firstPageIds = json1.articles.map((a) => a.id);
    const secondPageIds = json2.articles.map((a) => a.id);
    const overlap = firstPageIds.filter((id) => secondPageIds.includes(id));
    expect(overlap).toHaveLength(0);
  });
});

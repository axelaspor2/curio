/**
 * フィードサービスのユニットテスト
 */

import { describe, expect, it } from "vitest";
import { feedService } from "../../services/feed.service.js";
import {
  createTestArticles,
  createTestCategories,
  createTestInteraction,
  createTestSource,
  createUnenrichedArticles,
} from "../fixtures.js";
import { createTestUserWithSession } from "../helpers.js";

describe("feedService", () => {
  describe("getFeed", () => {
    it("フィードを取得できる", async () => {
      // Arrange
      const { user } = await createTestUserWithSession();
      const source = await createTestSource();
      await createTestArticles(source.id);

      // Act
      const result = await feedService.getFeed(user.id, { limit: 10 });

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.articles.length).toBeGreaterThan(0);
        expect(result.value.articles.at(0)).toHaveProperty("title");
        expect(result.value.articles.at(0)).toHaveProperty("source");
      }
    });

    it("limit件数分取得できる", async () => {
      // Arrange
      const { user } = await createTestUserWithSession();
      const source = await createTestSource();
      await createTestArticles(source.id, [], 10);

      // Act
      const result = await feedService.getFeed(user.id, { limit: 3 });

      // Assert
      if (result.isOk()) {
        expect(result.value.articles).toHaveLength(3);
        expect(result.value.hasMore).toBe(true);
      }
    });

    it("インタラクション済みの記事は除外される", async () => {
      // Arrange
      const { user } = await createTestUserWithSession();
      const source = await createTestSource();
      const articles = await createTestArticles(source.id);
      const articleId = articles.at(0)!.id;

      // LIKEインタラクションを作成
      await createTestInteraction(user.id, articleId, "LIKE");

      // Act
      const result = await feedService.getFeed(user.id, { limit: 10 });

      // Assert
      if (result.isOk()) {
        const articleIds = result.value.articles.map((a) => a.id);
        expect(articleIds).not.toContain(articleId);
      }
    });

    it("カテゴリフィルタが機能する", async () => {
      // Arrange
      const { user } = await createTestUserWithSession();
      const source = await createTestSource();
      const categories = await createTestCategories();
      const categoryId = categories.at(0)!.id as string;

      // カテゴリ付きの記事を作成
      await createTestArticles(source.id, [categoryId], 3);

      // カテゴリなしの記事を作成
      await createTestArticles(source.id, [], 3);

      // Act
      const result = await feedService.getFeed(user.id, {
        limit: 10,
        categoryId,
      });

      // Assert
      if (result.isOk()) {
        expect(result.value.articles.length).toBe(3);
        result.value.articles.forEach((article) => {
          expect(article.categories.some((c) => c.id === categoryId)).toBe(true);
        });
      }
    });

    it("enrichedAtがnullの記事は除外される", async () => {
      // Arrange
      const { user } = await createTestUserWithSession();
      const source = await createTestSource();
      await createTestArticles(source.id, [], 2);
      await createUnenrichedArticles(source.id, {
        content: "has content",
        description: "has description",
        enrichedAt: null,
      });

      // Act
      const result = await feedService.getFeed(user.id, { limit: 10 });

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.articles).toHaveLength(2);
      }
    });

    it("contentがnullの記事は除外される", async () => {
      // Arrange
      const { user } = await createTestUserWithSession();
      const source = await createTestSource();
      await createTestArticles(source.id, [], 2);
      await createUnenrichedArticles(source.id, {
        content: null,
        description: "has description",
        enrichedAt: new Date(),
      });

      // Act
      const result = await feedService.getFeed(user.id, { limit: 10 });

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.articles).toHaveLength(2);
      }
    });

    it("descriptionがnullの記事は除外される", async () => {
      // Arrange
      const { user } = await createTestUserWithSession();
      const source = await createTestSource();
      await createTestArticles(source.id, [], 2);
      await createUnenrichedArticles(source.id, {
        content: "has content",
        description: null,
        enrichedAt: new Date(),
      });

      // Act
      const result = await feedService.getFeed(user.id, { limit: 10 });

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.articles).toHaveLength(2);
      }
    });

    it("hasMoreがページネーションを正しく示す", async () => {
      // Arrange
      const { user } = await createTestUserWithSession();
      const source = await createTestSource();
      await createTestArticles(source.id, [], 5);

      // Act - ちょうど全件取得
      const result = await feedService.getFeed(user.id, { limit: 5 });

      // Assert
      if (result.isOk()) {
        expect(result.value.articles).toHaveLength(5);
        expect(result.value.hasMore).toBe(false);
      }
    });
  });
});

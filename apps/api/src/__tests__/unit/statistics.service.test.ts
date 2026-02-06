/**
 * 統計サービスのユニットテスト
 */

import { describe, expect, it } from "vitest";
import { statisticsService } from "../../services/statistics.service.js";
import {
  createTestArticles,
  createTestCategories,
  createTestInteraction,
  createTestSource,
} from "../fixtures.js";
import { createTestUserWithSession } from "../helpers.js";

describe("statisticsService", () => {
  describe("getStatistics", () => {
    it("累計統計を正しく集計できる", async () => {
      // Arrange
      const { user } = await createTestUserWithSession();
      const source = await createTestSource();
      const categories = await createTestCategories();
      const articles = await createTestArticles(source.id, [categories[0].id], 5);

      // インタラクションを作成
      await createTestInteraction(user.id, articles[0].id, "LIKE");
      await createTestInteraction(user.id, articles[1].id, "LIKE");
      await createTestInteraction(user.id, articles[2].id, "SKIP");
      await createTestInteraction(user.id, articles[3].id, "READ", 120);

      // Act
      const result = await statisticsService.getStatistics(user.id);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.actionStats.like).toBe(2);
        expect(result.value.actionStats.skip).toBe(1);
        expect(result.value.actionStats.read).toBe(1);
        expect(result.value.actionStats.total).toBe(4);
      }
    });

    it("LIKEカテゴリTOP3が正しく取得できる", async () => {
      // Arrange
      const { user } = await createTestUserWithSession();
      const source = await createTestSource();
      const categories = await createTestCategories();

      // テクノロジー記事を3つ、ビジネス記事を1つ作成
      const techArticles = await createTestArticles(source.id, [categories[0].id], 3);
      const bizArticles = await createTestArticles(source.id, [categories[1].id], 1);

      // テクノロジー3件、ビジネス1件をLIKE
      await createTestInteraction(user.id, techArticles[0].id, "LIKE");
      await createTestInteraction(user.id, techArticles[1].id, "LIKE");
      await createTestInteraction(user.id, techArticles[2].id, "LIKE");
      await createTestInteraction(user.id, bizArticles[0].id, "LIKE");

      // Act
      const result = await statisticsService.getStatistics(user.id);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.topLikedCategories.length).toBeGreaterThanOrEqual(1);
        expect(result.value.topLikedCategories[0].categoryName).toBe("テクノロジー");
        expect(result.value.topLikedCategories[0].count).toBe(3);
      }
    });

    it("SKIPカテゴリTOP3が正しく取得できる", async () => {
      // Arrange
      const { user } = await createTestUserWithSession();
      const source = await createTestSource();
      const categories = await createTestCategories();

      // ビジネス記事を2つ作成してSKIP
      const bizArticles = await createTestArticles(source.id, [categories[1].id], 2);
      await createTestInteraction(user.id, bizArticles[0].id, "SKIP");
      await createTestInteraction(user.id, bizArticles[1].id, "SKIP");

      // Act
      const result = await statisticsService.getStatistics(user.id);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.topSkippedCategories.length).toBeGreaterThanOrEqual(1);
        expect(result.value.topSkippedCategories[0].categoryName).toBe("ビジネス");
        expect(result.value.topSkippedCategories[0].count).toBe(2);
      }
    });

    it("インタラクションがない場合は空の統計を返す", async () => {
      // Arrange
      const { user } = await createTestUserWithSession();

      // Act
      const result = await statisticsService.getStatistics(user.id);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.actionStats.like).toBe(0);
        expect(result.value.actionStats.skip).toBe(0);
        expect(result.value.actionStats.read).toBe(0);
        expect(result.value.actionStats.total).toBe(0);
        expect(result.value.topLikedCategories).toHaveLength(0);
        expect(result.value.topSkippedCategories).toHaveLength(0);
      }
    });
  });
});

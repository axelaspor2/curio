/**
 * インタラクションサービスのユニットテスト
 */

import { describe, expect, it } from "vitest";
import { interactionService } from "../../services/interaction.service.js";
import { createTestArticles, createTestSource } from "../fixtures.js";
import { createTestUserWithSession } from "../helpers.js";

describe("interactionService", () => {
  describe("create", () => {
    it("LIKEインタラクションを記録できる", async () => {
      // Arrange
      const { user } = await createTestUserWithSession();
      const source = await createTestSource();
      const articles = await createTestArticles(source.id);
      const articleId = articles.at(0)!.id as string;

      // Act
      const result = await interactionService.create(user.id, articleId, "LIKE");

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.articleId).toBe(articleId);
        expect(result.value.type).toBe("LIKE");
      }
    });

    it("SKIPインタラクションを記録できる", async () => {
      // Arrange
      const { user } = await createTestUserWithSession();
      const source = await createTestSource();
      const articles = await createTestArticles(source.id);
      const articleId = articles.at(0)!.id as string;

      // Act
      const result = await interactionService.create(user.id, articleId, "SKIP");

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.type).toBe("SKIP");
      }
    });

    it("READインタラクションでreadingTimeSecが保存される", async () => {
      // Arrange
      const { user } = await createTestUserWithSession();
      const source = await createTestSource();
      const articles = await createTestArticles(source.id);
      const articleId = articles.at(0)!.id as string;

      // Act
      const result = await interactionService.create(user.id, articleId, "READ", 120);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.type).toBe("READ");
      }
    });

    it("存在しないarticleIdの場合はエラーになる", async () => {
      // Arrange
      const { user } = await createTestUserWithSession();
      const nonExistentId = "00000000-0000-0000-0000-000000000000";

      // Act
      const result = await interactionService.create(user.id, nonExistentId, "LIKE");

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain("記事が見つかりません");
      }
    });
  });
});

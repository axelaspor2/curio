/**
 * ユーザーサービスのユニットテスト
 */

import { describe, expect, it } from "vitest";
import { userService } from "../../services/user.service.js";
import { createTestCategories } from "../fixtures.js";
import { createTestUserWithSession } from "../helpers.js";

describe("userService", () => {
  describe("setCategories", () => {
    it("カテゴリを設定できる", async () => {
      // Arrange
      const { user } = await createTestUserWithSession();
      const categories = await createTestCategories();
      const categoryIds = categories.slice(0, 2).map((c: { id: string }) => c.id);

      // Act
      const result = await userService.setCategories(user.id, categoryIds);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toHaveLength(2);
        expect(result.value.at(0)?.isInitialSelection).toBe(true);
        expect(result.value.at(0)?.preferenceScore).toBe(0.5);
      }
    });

    it("存在しないカテゴリIDを指定するとエラーになる", async () => {
      // Arrange
      const { user } = await createTestUserWithSession();
      const nonExistentId = "00000000-0000-0000-0000-000000000000";

      // Act
      const result = await userService.setCategories(user.id, [nonExistentId]);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain("カテゴリが見つかりません");
      }
    });

    it("既存のカテゴリ設定を上書きする", async () => {
      // Arrange
      const { user } = await createTestUserWithSession();
      const categories = await createTestCategories();

      // 最初の設定
      await userService.setCategories(user.id, [categories.at(0)!.id]);

      // Act - 別のカテゴリで上書き
      const newCategoryIds = [categories.at(1)!.id, categories.at(2)!.id];
      const result = await userService.setCategories(user.id, newCategoryIds);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toHaveLength(2);
        expect(result.value.map((p) => p.categoryId)).toEqual(newCategoryIds);
      }
    });
  });
});

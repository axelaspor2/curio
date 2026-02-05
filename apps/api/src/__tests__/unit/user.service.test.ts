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
        // 全カテゴリが返される（選択/未選択両方）
        expect(result.value.preferences.length).toBeGreaterThanOrEqual(2);
        // 選択されたカテゴリはスコア0.7
        const selectedPrefs = result.value.preferences.filter((p) =>
          categoryIds.includes(p.categoryId),
        );
        expect(selectedPrefs).toHaveLength(2);
        expect(selectedPrefs.at(0)?.isInitialSelection).toBe(true);
        expect(selectedPrefs.at(0)?.preferenceScore).toBe(0.7);
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
        // 選択されたカテゴリのみを確認
        const selectedPrefs = result.value.preferences.filter((p) =>
          newCategoryIds.includes(p.categoryId),
        );
        expect(selectedPrefs).toHaveLength(2);
        expect(selectedPrefs.every((p) => p.isInitialSelection)).toBe(true);
      }
    });

    it("スキップ時は全カテゴリが中立スコアで設定される", async () => {
      // Arrange
      const { user } = await createTestUserWithSession();
      await createTestCategories();

      // Act
      const result = await userService.setCategories(user.id, [], true);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.preferences.length).toBeGreaterThan(0);
        // 全てスコア0.5
        expect(result.value.preferences.every((p) => p.preferenceScore === 0.5)).toBe(true);
        // 全てisInitialSelectionはfalse
        expect(result.value.preferences.every((p) => p.isInitialSelection === false)).toBe(true);
      }
    });
  });

  describe("getOnboardingStatus", () => {
    it("カテゴリ未設定の場合はisOnboardingCompleteがfalse", async () => {
      // Arrange
      const { user } = await createTestUserWithSession();

      // Act
      const result = await userService.getOnboardingStatus(user.id);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.isOnboardingComplete).toBe(false);
        expect(result.value.selectedCategoryCount).toBe(0);
      }
    });

    it("カテゴリ設定済みの場合はisOnboardingCompleteがtrue", async () => {
      // Arrange
      const { user } = await createTestUserWithSession();
      const categories = await createTestCategories();
      await userService.setCategories(user.id, [categories.at(0)!.id]);

      // Act
      const result = await userService.getOnboardingStatus(user.id);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.isOnboardingComplete).toBe(true);
        expect(result.value.selectedCategoryCount).toBeGreaterThan(0);
      }
    });
  });
});

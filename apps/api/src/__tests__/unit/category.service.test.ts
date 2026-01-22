/**
 * カテゴリサービスのユニットテスト
 */

import { describe, it, expect } from "vitest";
import { categoryService } from "../../services/category.service.js";
import { createTestCategories } from "../fixtures.js";

describe("categoryService", () => {
  describe("getAll", () => {
    it("カテゴリ一覧を取得できる", async () => {
      // Arrange
      await createTestCategories();

      // Act
      const result = await categoryService.getAll();

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toHaveLength(4);
        expect(result.value.at(0)?.name).toBe("テクノロジー");
        expect(result.value.at(1)?.name).toBe("ビジネス");
      }
    });

    it("displayOrder順でソートされている", async () => {
      // Arrange
      await createTestCategories();

      // Act
      const result = await categoryService.getAll();

      // Assert
      if (result.isOk()) {
        expect(result.value.at(0)?.displayOrder).toBe(1);
        expect(result.value.at(1)?.displayOrder).toBe(2);
        expect(result.value.at(2)?.displayOrder).toBe(3);
        expect(result.value.at(3)?.displayOrder).toBe(4);
      }
    });

    it("カテゴリがない場合は空配列を返す", async () => {
      // Act（カテゴリを作成せずに実行）
      const result = await categoryService.getAll();

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toHaveLength(0);
      }
    });
  });
});

/**
 * カテゴリAPIのインテグレーションテスト
 */

import { describe, it, expect } from "vitest";
import app from "../../app.js";
import { createTestCategories } from "../fixtures.js";
import type { CategoriesResponse } from "../../schemas/categories.js";

describe("GET /api/categories", () => {
  it("カテゴリ一覧を取得できる", async () => {
    // Arrange
    await createTestCategories();

    // Act
    const res = await app.request("/api/categories");

    // Assert
    expect(res.status).toBe(200);
    const json = (await res.json()) as CategoriesResponse;
    expect(json.categories).toHaveLength(4);
    expect(json.categories.at(0)).toMatchObject({
      slug: "technology",
      name: "テクノロジー",
    });
  });

  it("displayOrder順でソートされている", async () => {
    // Arrange
    await createTestCategories();

    // Act
    const res = await app.request("/api/categories");

    // Assert
    const json = (await res.json()) as CategoriesResponse;
    expect(json.categories.at(0)?.displayOrder).toBe(1);
    expect(json.categories.at(1)?.displayOrder).toBe(2);
    expect(json.categories.at(2)?.displayOrder).toBe(3);
    expect(json.categories.at(3)?.displayOrder).toBe(4);
  });

  it("カテゴリがない場合は空配列を返す", async () => {
    // Act（カテゴリを作成せずに実行）
    const res = await app.request("/api/categories");

    // Assert
    expect(res.status).toBe(200);
    const json = (await res.json()) as CategoriesResponse;
    expect(json.categories).toHaveLength(0);
  });

  it("認証不要でアクセスできる", async () => {
    // Act（認証なしでリクエスト）
    const res = await app.request("/api/categories");

    // Assert
    expect(res.status).toBe(200);
  });
});

/**
 * ユーザーAPIのインテグレーションテスト
 */

import { describe, expect, it } from "vitest";
import type { SetCategoriesResponse } from "../../schemas/users.js";
import { createTestCategories } from "../fixtures.js";
import {
  authenticatedRequest,
  createTestUserWithSession,
  unauthenticatedRequest,
} from "../helpers.js";
import app from "../test-app.js";

describe("POST /api/users/me/categories", () => {
  it("カテゴリを設定できる", async () => {
    // Arrange
    const { session } = await createTestUserWithSession();
    const categories = await createTestCategories();
    const categoryIds = categories.slice(0, 2).map((c: { id: string }) => c.id);
    const client = authenticatedRequest(app, session.token);

    // Act
    const res = await client.post("/api/users/me/categories", { categoryIds });

    // Assert
    expect(res.status).toBe(200);
    const json = (await res.json()) as SetCategoriesResponse;
    expect(json.preferences).toHaveLength(2);
    expect(json.preferences.at(0)?.isInitialSelection).toBe(true);
  });

  it("未認証の場合は401が返る", async () => {
    // Arrange
    const categories = await createTestCategories();
    const categoryIds = categories.slice(0, 2).map((c: { id: string }) => c.id);
    const client = unauthenticatedRequest(app);

    // Act
    const res = await client.post("/api/users/me/categories", { categoryIds });

    // Assert
    expect(res.status).toBe(401);
  });

  it("存在しないカテゴリIDを指定すると404が返る", async () => {
    // Arrange
    const { session } = await createTestUserWithSession();
    const nonExistentId = "00000000-0000-0000-0000-000000000000";
    const client = authenticatedRequest(app, session.token);

    // Act
    const res = await client.post("/api/users/me/categories", { categoryIds: [nonExistentId] });

    // Assert
    expect(res.status).toBe(404);
  });

  it("空のカテゴリ配列を指定すると400が返る", async () => {
    // Arrange
    const { session } = await createTestUserWithSession();
    const client = authenticatedRequest(app, session.token);

    // Act
    const res = await client.post("/api/users/me/categories", { categoryIds: [] });

    // Assert
    expect(res.status).toBe(400);
  });
});

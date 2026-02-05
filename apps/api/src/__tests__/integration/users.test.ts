/**
 * ユーザーAPIのインテグレーションテスト
 */

import { describe, expect, it } from "vitest";
import type { OnboardingStatusResponse, SetCategoriesResponse } from "../../schemas/users.js";
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
    // 全カテゴリが返される
    expect(json.preferences.length).toBeGreaterThanOrEqual(2);
    // 選択されたカテゴリを確認
    const selectedPrefs = json.preferences.filter((p) => categoryIds.includes(p.categoryId));
    expect(selectedPrefs).toHaveLength(2);
    expect(selectedPrefs.at(0)?.isInitialSelection).toBe(true);
    expect(selectedPrefs.at(0)?.preferenceScore).toBe(0.7);
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

  it("空のカテゴリ配列を指定すると404が返る（スキップでない場合）", async () => {
    // Arrange
    const { session } = await createTestUserWithSession();
    const client = authenticatedRequest(app, session.token);

    // Act
    const res = await client.post("/api/users/me/categories", { categoryIds: [] });

    // Assert
    expect(res.status).toBe(404);
  });

  it("skipped=trueで全カテゴリが中立スコアで設定される", async () => {
    // Arrange
    const { session } = await createTestUserWithSession();
    await createTestCategories();
    const client = authenticatedRequest(app, session.token);

    // Act
    const res = await client.post("/api/users/me/categories", { categoryIds: [], skipped: true });

    // Assert
    expect(res.status).toBe(200);
    const json = (await res.json()) as SetCategoriesResponse;
    expect(json.preferences.length).toBeGreaterThan(0);
    expect(json.preferences.every((p) => p.preferenceScore === 0.5)).toBe(true);
    expect(json.preferences.every((p) => p.isInitialSelection === false)).toBe(true);
  });
});

describe("GET /api/users/me/onboarding-status", () => {
  it("カテゴリ未設定の場合はisOnboardingCompleteがfalse", async () => {
    // Arrange
    const { session } = await createTestUserWithSession();
    const client = authenticatedRequest(app, session.token);

    // Act
    const res = await client.get("/api/users/me/onboarding-status");

    // Assert
    expect(res.status).toBe(200);
    const json = (await res.json()) as OnboardingStatusResponse;
    expect(json.isOnboardingComplete).toBe(false);
    expect(json.selectedCategoryCount).toBe(0);
  });

  it("カテゴリ設定後はisOnboardingCompleteがtrue", async () => {
    // Arrange
    const { session } = await createTestUserWithSession();
    const categories = await createTestCategories();
    const client = authenticatedRequest(app, session.token);
    await client.post("/api/users/me/categories", {
      categoryIds: [categories.at(0)!.id],
    });

    // Act
    const res = await client.get("/api/users/me/onboarding-status");

    // Assert
    expect(res.status).toBe(200);
    const json = (await res.json()) as OnboardingStatusResponse;
    expect(json.isOnboardingComplete).toBe(true);
    expect(json.selectedCategoryCount).toBeGreaterThan(0);
  });

  it("未認証の場合は401が返る", async () => {
    // Arrange
    const client = unauthenticatedRequest(app);

    // Act
    const res = await client.get("/api/users/me/onboarding-status");

    // Assert
    expect(res.status).toBe(401);
  });
});

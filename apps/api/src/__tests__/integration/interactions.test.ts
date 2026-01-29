/**
 * インタラクションAPIのインテグレーションテスト
 */

import { describe, it, expect } from "vitest";
import app from "../../app.js";
import { createTestSource, createTestArticles } from "../fixtures.js";
import { createTestUserWithSession, authenticatedRequest, unauthenticatedRequest } from "../helpers.js";
import type { InteractionResponse } from "../../schemas/interactions.js";

describe("POST /api/interactions", () => {
  it("LIKEインタラクションが正しく登録される", async () => {
    // Arrange
    const { session } = await createTestUserWithSession();
    const source = await createTestSource();
    const articles = await createTestArticles(source.id);
    const articleId = articles.at(0)!.id as string;
    const client = authenticatedRequest(app, session.token);

    // Act
    const res = await client.post("/api/interactions", {
      articleId,
      type: "LIKE",
    });

    // Assert
    expect(res.status).toBe(200);
    const json = (await res.json()) as InteractionResponse;
    expect(json.interaction.type).toBe("LIKE");
    expect(json.interaction.articleId).toBe(articleId);
  });

  it("SKIPインタラクションが正しく登録される", async () => {
    // Arrange
    const { session } = await createTestUserWithSession();
    const source = await createTestSource();
    const articles = await createTestArticles(source.id);
    const articleId = articles.at(0)!.id as string;
    const client = authenticatedRequest(app, session.token);

    // Act
    const res = await client.post("/api/interactions", {
      articleId,
      type: "SKIP",
    });

    // Assert
    expect(res.status).toBe(200);
    const json = (await res.json()) as InteractionResponse;
    expect(json.interaction.type).toBe("SKIP");
  });

  it("READインタラクションでreadingTimeSecが保存される", async () => {
    // Arrange
    const { session } = await createTestUserWithSession();
    const source = await createTestSource();
    const articles = await createTestArticles(source.id);
    const articleId = articles.at(0)!.id as string;
    const client = authenticatedRequest(app, session.token);

    // Act
    const res = await client.post("/api/interactions", {
      articleId,
      type: "READ",
      readingTimeSec: 120,
    });

    // Assert
    expect(res.status).toBe(200);
    const json = (await res.json()) as InteractionResponse;
    expect(json.interaction.type).toBe("READ");
  });

  it("未認証の場合は401が返る", async () => {
    // Arrange
    const source = await createTestSource();
    const articles = await createTestArticles(source.id);
    const articleId = articles.at(0)!.id as string;
    const client = unauthenticatedRequest(app);

    // Act
    const res = await client.post("/api/interactions", {
      articleId,
      type: "LIKE",
    });

    // Assert
    expect(res.status).toBe(401);
  });

  it("存在しないarticleIdの場合は404が返る", async () => {
    // Arrange
    const { session } = await createTestUserWithSession();
    const nonExistentId = "00000000-0000-0000-0000-000000000000";
    const client = authenticatedRequest(app, session.token);

    // Act
    const res = await client.post("/api/interactions", {
      articleId: nonExistentId,
      type: "LIKE",
    });

    // Assert
    expect(res.status).toBe(404);
  });
});

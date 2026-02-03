import { describe, expect, it, vi, beforeEach } from "vitest";
import { prisma } from "@curio/database";
import { FeedFetchError } from "../rss-fetch/errors.js";

const mockParseURL = vi.fn();

// rss-parserをモック
vi.mock("rss-parser", () => {
  return {
    default: class MockParser {
      parseURL = mockParseURL;
    },
  };
});

// モック後にインポート
const { rssService } = await import("../rss-fetch/rss.service.js");

describe("rssService", () => {
  describe("saveArticles", () => {
    it("記事を正常に保存できる", async () => {
      // ソースを作成
      const source = await prisma.source.create({
        data: {
          type: "rss",
          name: "Test Feed",
          url: "https://example.com/feed.xml",
        },
      });

      const items = [
        {
          guid: "item-1",
          link: "https://example.com/article-1",
          title: "Test Article 1",
          content: "Content 1",
          contentSnippet: "Snippet 1",
          isoDate: "2024-01-01T00:00:00Z",
        },
        {
          guid: "item-2",
          link: "https://example.com/article-2",
          title: "Test Article 2",
          content: "Content 2",
          contentSnippet: "Snippet 2",
          pubDate: "Mon, 01 Jan 2024 00:00:00 GMT",
        },
      ];

      const result = await rssService.saveArticles(source.id, source.name, items);

      expect(result.isOk()).toBe(true);
      result.map((fetchResult) => {
        expect(fetchResult.savedCount).toBe(2);
        expect(fetchResult.skippedCount).toBe(0);
      });

      // DBに保存されたことを確認
      const articles = await prisma.article.findMany({
        where: { sourceId: source.id },
        orderBy: { title: "asc" },
      });

      expect(articles).toHaveLength(2);
      expect(articles[0]?.title).toBe("Test Article 1");
      expect(articles[0]?.externalId).toBe("item-1");
      expect(articles[1]?.title).toBe("Test Article 2");
    });

    it("URLが重複する記事はスキップされる", async () => {
      const source = await prisma.source.create({
        data: {
          type: "rss",
          name: "Test Feed",
          url: "https://example.com/feed.xml",
        },
      });

      // 既存の記事を作成
      await prisma.article.create({
        data: {
          sourceId: source.id,
          externalId: "existing-item",
          title: "Existing Article",
          url: "https://example.com/existing",
        },
      });

      const items = [
        {
          guid: "new-item",
          link: "https://example.com/new",
          title: "New Article",
        },
        {
          guid: "duplicate-item",
          link: "https://example.com/existing", // 重複URL
          title: "Duplicate Article",
        },
      ];

      const result = await rssService.saveArticles(source.id, source.name, items);

      expect(result.isOk()).toBe(true);
      result.map((fetchResult) => {
        expect(fetchResult.savedCount).toBe(1);
        expect(fetchResult.skippedCount).toBe(1);
      });
    });

    it("リンクがないアイテムはスキップされる", async () => {
      const source = await prisma.source.create({
        data: {
          type: "rss",
          name: "Test Feed",
          url: "https://example.com/feed.xml",
        },
      });

      const items = [
        {
          guid: "no-link-item",
          title: "No Link Article",
          // linkがない
        },
        {
          guid: "with-link-item",
          link: "https://example.com/with-link",
          title: "With Link Article",
        },
      ];

      const result = await rssService.saveArticles(source.id, source.name, items);

      expect(result.isOk()).toBe(true);
      result.map((fetchResult) => {
        expect(fetchResult.savedCount).toBe(1);
        expect(fetchResult.skippedCount).toBe(1);
      });
    });

    it("externalIdで重複チェックされる", async () => {
      const source = await prisma.source.create({
        data: {
          type: "rss",
          name: "Test Feed",
          url: "https://example.com/feed.xml",
        },
      });

      // 既存の記事を作成
      await prisma.article.create({
        data: {
          sourceId: source.id,
          externalId: "same-guid",
          title: "Existing Article",
          url: "https://example.com/existing",
        },
      });

      const items = [
        {
          guid: "same-guid", // 同じexternalId
          link: "https://example.com/new-url", // 異なるURL
          title: "New Article with Same GUID",
        },
      ];

      const result = await rssService.saveArticles(source.id, source.name, items);

      expect(result.isOk()).toBe(true);
      result.map((fetchResult) => {
        expect(fetchResult.savedCount).toBe(0);
        expect(fetchResult.skippedCount).toBe(1);
      });
    });
  });

  describe("fetchAndSaveArticles", () => {
    beforeEach(() => {
      mockParseURL.mockReset();
    });

    it("フィードを正常に取得して記事を保存できる", async () => {
      const source = await prisma.source.create({
        data: {
          type: "rss",
          name: "Test Feed",
          url: "https://example.com/feed.xml",
        },
      });

      mockParseURL.mockResolvedValueOnce({
        items: [
          {
            guid: "item-1",
            link: "https://example.com/article-1",
            title: "Test Article 1",
            contentSnippet: "Snippet 1",
            isoDate: "2024-01-01T00:00:00Z",
          },
        ],
      });

      const result = await rssService.fetchAndSaveArticles(source);

      expect(result.isOk()).toBe(true);
      result.map((fetchResult) => {
        expect(fetchResult.savedCount).toBe(1);
      });
    });

    it("フィード取得エラー時にFeedFetchErrorを返す", async () => {
      const source = await prisma.source.create({
        data: {
          type: "rss",
          name: "Test Feed",
          url: "https://invalid-url.example.com/feed.xml",
        },
      });

      mockParseURL.mockRejectedValueOnce(new Error("Network error"));

      const result = await rssService.fetchAndSaveArticles(source);

      expect(result.isErr()).toBe(true);
      result.mapErr((error) => {
        expect(error).toBeInstanceOf(FeedFetchError);
      });
    });
  });

  describe("fetchAllSources", () => {
    it("RSS/Atom以外のソースは取得しない", async () => {
      // 異なるタイプのソースを作成
      await prisma.source.create({
        data: {
          type: "twitter",
          name: "Twitter Source",
          url: "https://twitter.com/user",
        },
      });

      await prisma.source.create({
        data: {
          type: "podcast",
          name: "Podcast Source",
          url: "https://example.com/podcast.xml",
        },
      });

      const result = await rssService.fetchAllSources();

      expect(result.isOk()).toBe(true);
      result.map((results) => {
        expect(results).toHaveLength(0);
      });
    });
  });
});

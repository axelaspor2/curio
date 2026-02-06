import { prisma } from "@curio/database";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FeedFetchError } from "../rss-fetch/errors.js";
import { FeedItemSchema, FeedSchema } from "../rss-fetch/schema.js";

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

describe("FeedItemSchema", () => {
  it("有効なフィードアイテムを検証できる", () => {
    const validItem = {
      title: "Test Article",
      link: "https://example.com/article",
      guid: "item-1",
      content: "Content",
      contentSnippet: "Snippet",
      pubDate: "Mon, 01 Jan 2024 00:00:00 GMT",
      isoDate: "2024-01-01T00:00:00Z",
    };

    const result = FeedItemSchema.safeParse(validItem);
    expect(result.success).toBe(true);
  });

  it("titleがないアイテムは無効", () => {
    const invalidItem = {
      link: "https://example.com/article",
    };

    const result = FeedItemSchema.safeParse(invalidItem);
    expect(result.success).toBe(false);
  });

  it("linkがないアイテムは無効", () => {
    const invalidItem = {
      title: "Test Article",
    };

    const result = FeedItemSchema.safeParse(invalidItem);
    expect(result.success).toBe(false);
  });

  it("linkがURL形式でないアイテムは無効", () => {
    const invalidItem = {
      title: "Test Article",
      link: "not-a-url",
    };

    const result = FeedItemSchema.safeParse(invalidItem);
    expect(result.success).toBe(false);
  });

  it("オプショナルフィールドがなくても有効", () => {
    const minimalItem = {
      title: "Test Article",
      link: "https://example.com/article",
    };

    const result = FeedItemSchema.safeParse(minimalItem);
    expect(result.success).toBe(true);
  });
});

describe("FeedSchema", () => {
  it("有効なフィードを検証できる", () => {
    const validFeed = {
      items: [
        { title: "Article 1", link: "https://example.com/1" },
        { title: "Article 2", link: "https://example.com/2" },
      ],
    };

    const result = FeedSchema.safeParse(validFeed);
    expect(result.success).toBe(true);
  });

  it("itemsが空でも有効", () => {
    const emptyFeed = { items: [] };

    const result = FeedSchema.safeParse(emptyFeed);
    expect(result.success).toBe(true);
  });
});

describe("rssService", () => {
  describe("saveArticles", () => {
    it("記事を正常に保存できる", async () => {
      const source = await prisma.source.create({
        data: {
          type: "rss",
          name: "Test Feed",
          url: "https://example.com/feed.xml",
        },
      });

      const items = [
        {
          title: "Test Article 1",
          link: "https://example.com/article-1",
          guid: "item-1",
          content: "Content 1",
          contentSnippet: "Snippet 1",
          isoDate: "2024-01-01T00:00:00Z",
        },
        {
          title: "Test Article 2",
          link: "https://example.com/article-2",
          guid: "item-2",
          content: "Content 2",
          contentSnippet: "Snippet 2",
          pubDate: "Mon, 01 Jan 2024 00:00:00 GMT",
        },
      ];

      const result = await rssService.saveArticles(source.id, source.name, items);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.savedCount).toBe(2);
        expect(result.value.skippedCount).toBe(0);
        expect(result.value.invalidCount).toBe(0);
      }

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
          title: "New Article",
          link: "https://example.com/new",
          guid: "new-item",
        },
        {
          title: "Duplicate Article",
          link: "https://example.com/existing",
          guid: "duplicate-item",
        },
      ];

      const result = await rssService.saveArticles(source.id, source.name, items);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.savedCount).toBe(1);
        expect(result.value.skippedCount).toBe(1);
      }
    });

    it("既存記事のdescriptionがnullの場合にバックフィルされる", async () => {
      const source = await prisma.source.create({
        data: {
          type: "rss",
          name: "Test Feed",
          url: "https://example.com/feed.xml",
        },
      });

      // descriptionがnullの既存記事
      await prisma.article.create({
        data: {
          sourceId: source.id,
          externalId: "existing-item",
          title: "Existing Article",
          url: "https://example.com/existing",
          description: null,
        },
      });

      const items = [
        {
          title: "Existing Article",
          link: "https://example.com/existing",
          guid: "existing-item",
          contentSnippet: "Backfilled description",
        },
      ];

      const result = await rssService.saveArticles(source.id, source.name, items);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.savedCount).toBe(0);
        expect(result.value.skippedCount).toBe(1);
      }

      // descriptionがバックフィルされたことを確認
      const article = await prisma.article.findFirst({
        where: { url: "https://example.com/existing" },
      });
      expect(article?.description).toBe("Backfilled description");
    });

    it("既存記事のdescriptionが既にある場合は上書きしない", async () => {
      const source = await prisma.source.create({
        data: {
          type: "rss",
          name: "Test Feed",
          url: "https://example.com/feed.xml",
        },
      });

      // descriptionが既にセットされた既存記事
      await prisma.article.create({
        data: {
          sourceId: source.id,
          externalId: "existing-item",
          title: "Existing Article",
          url: "https://example.com/existing",
          description: "Original description",
        },
      });

      const items = [
        {
          title: "Existing Article",
          link: "https://example.com/existing",
          guid: "existing-item",
          contentSnippet: "New description",
        },
      ];

      await rssService.saveArticles(source.id, source.name, items);

      // descriptionは上書きされないことを確認
      const article = await prisma.article.findFirst({
        where: { url: "https://example.com/existing" },
      });
      expect(article?.description).toBe("Original description");
    });

    it("新規記事にdescriptionが保存される", async () => {
      const source = await prisma.source.create({
        data: {
          type: "rss",
          name: "Test Feed",
          url: "https://example.com/feed.xml",
        },
      });

      const items = [
        {
          title: "Article with contentSnippet",
          link: "https://example.com/article-1",
          guid: "item-1",
          contentSnippet: "This is a snippet",
        },
        {
          title: "Article with summary only",
          link: "https://example.com/article-2",
          guid: "item-2",
          summary: "This is from summary tag",
        },
        {
          title: "Article without description",
          link: "https://example.com/article-3",
          guid: "item-3",
        },
      ];

      await rssService.saveArticles(source.id, source.name, items);

      const articles = await prisma.article.findMany({
        where: { sourceId: source.id },
        orderBy: { url: "asc" },
      });

      expect(articles).toHaveLength(3);
      // contentSnippetが優先される
      expect(articles[0]?.description).toBe("This is a snippet");
      // summaryにフォールバック
      expect(articles[1]?.description).toBe("This is from summary tag");
      // どちらもない場合はnull
      expect(articles[2]?.description).toBeNull();
    });

    it("externalIdで重複チェックされる", async () => {
      const source = await prisma.source.create({
        data: {
          type: "rss",
          name: "Test Feed",
          url: "https://example.com/feed.xml",
        },
      });

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
          title: "New Article with Same GUID",
          link: "https://example.com/new-url",
          guid: "same-guid",
        },
      ];

      const result = await rssService.saveArticles(source.id, source.name, items);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.savedCount).toBe(0);
        expect(result.value.skippedCount).toBe(1);
      }
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
            title: "Test Article 1",
            link: "https://example.com/article-1",
            guid: "item-1",
            contentSnippet: "Snippet 1",
            isoDate: "2024-01-01T00:00:00Z",
          },
        ],
      });

      const result = await rssService.fetchAndSaveArticles(source);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.savedCount).toBe(1);
        expect(result.value.invalidCount).toBe(0);
      }
    });

    it("無効なアイテムはスキップされる", async () => {
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
            title: "Valid Article",
            link: "https://example.com/valid",
          },
          {
            // titleがない - 無効
            link: "https://example.com/no-title",
          },
          {
            title: "No Link Article",
            // linkがない - 無効
          },
        ],
      });

      const result = await rssService.fetchAndSaveArticles(source);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.savedCount).toBe(1);
        expect(result.value.invalidCount).toBe(2);
      }
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
      if (result.isOk()) {
        expect(result.value).toHaveLength(0);
      }
    });
  });
});

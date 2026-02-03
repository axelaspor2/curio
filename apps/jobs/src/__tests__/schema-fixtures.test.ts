/**
 * 実際のフィードデータでZodスキーマを検証するテスト
 *
 * rss-parserをモックせず、本物のXMLをパースして
 * スキーマが実データに適合することを確認する。
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import Parser from "rss-parser";
import { FeedItemSchema } from "../rss-fetch/schema.js";

describe("フィクスチャによるスキーマ検証", () => {
  const parser = new Parser();
  const fixturesDir = join(import.meta.dirname, "fixtures");

  it("Zennフィードの全アイテムが有効", async () => {
    const xml = readFileSync(join(fixturesDir, "zenn.xml"), "utf-8");
    const feed = await parser.parseString(xml);

    expect(feed.items.length).toBeGreaterThan(0);

    for (const item of feed.items) {
      const result = FeedItemSchema.safeParse(item);
      expect(result.success, `Invalid item: ${item.title}`).toBe(true);
    }
  });

  it("Hacker Newsフィードの全アイテムが有効", async () => {
    const xml = readFileSync(join(fixturesDir, "hackernews.xml"), "utf-8");
    const feed = await parser.parseString(xml);

    expect(feed.items.length).toBeGreaterThan(0);

    for (const item of feed.items) {
      const result = FeedItemSchema.safeParse(item);
      expect(result.success, `Invalid item: ${item.title}`).toBe(true);
    }
  });

  it("TechCrunchフィードの全アイテムが有効", async () => {
    const xml = readFileSync(join(fixturesDir, "techcrunch.xml"), "utf-8");
    const feed = await parser.parseString(xml);

    expect(feed.items.length).toBeGreaterThan(0);

    for (const item of feed.items) {
      const result = FeedItemSchema.safeParse(item);
      expect(result.success, `Invalid item: ${item.title}`).toBe(true);
    }
  });
});

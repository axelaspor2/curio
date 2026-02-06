/**
 * RSSフィードのZodスキーマ定義
 *
 * rss-parserの出力を型安全に検証するためのスキーマ。
 * 実行時にデータ形式を検証し、不正なフィードを検知する。
 */
import { z } from "zod";

/**
 * フィードアイテム（記事）のスキーマ
 *
 * title, linkは全ソースで必須。
 * その他のフィールドはソースによって存在しない場合がある。
 */
export const FeedItemSchema = z.object({
  title: z.string(),
  link: z.string().url(),
  guid: z.string().optional(),
  content: z.string().optional(),
  contentSnippet: z.string().optional(),
  summary: z.string().optional(),
  pubDate: z.string().optional(),
  isoDate: z.string().optional(),
  enclosure: z
    .object({
      url: z.string().url().optional(),
    })
    .optional(),
});

export type FeedItem = z.infer<typeof FeedItemSchema>;

export const FeedSchema = z.object({
  items: z.array(FeedItemSchema),
});

export type Feed = z.infer<typeof FeedSchema>;

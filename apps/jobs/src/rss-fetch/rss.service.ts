import Parser from "rss-parser";
import { prisma, type Source } from "@curio/database";
import { ResultAsync, okAsync } from "neverthrow";
import { FeedFetchError, FeedParseError, type JobError } from "./errors.js";
import { logger } from "../lib/logger.js";

const parser = new Parser({
  timeout: 30000,
  headers: {
    "User-Agent": "Curio/1.0 (+https://github.com/axelaspor2/curio)",
  },
});

type FeedItem = {
  guid?: string;
  link?: string;
  title?: string;
  content?: string;
  contentSnippet?: string;
  pubDate?: string;
  isoDate?: string;
  enclosure?: { url?: string };
};

type FetchResult = {
  sourceId: string;
  sourceName: string;
  savedCount: number;
  skippedCount: number;
  error?: string;
};

export const rssService = {
  /**
   * 単一ソースからフィードを取得してDBに保存
   */
  fetchAndSaveArticles: (source: Source): ResultAsync<FetchResult, JobError> => {
    return ResultAsync.fromPromise(parser.parseURL(source.url), (e) => {
      const message = e instanceof Error ? e.message : "Unknown error";
      return new FeedFetchError(`Failed to fetch feed: ${message}`, source.url, e);
    }).andThen((feed) => {
      const items = feed.items ?? [];
      logger.debug({ sourceId: source.id, itemCount: items.length }, "Parsed feed items");
      return rssService.saveArticles(source.id, source.name, items);
    });
  },

  /**
   * フィードアイテムをArticleとして保存（重複スキップ）
   */
  saveArticles: (
    sourceId: string,
    sourceName: string,
    items: FeedItem[],
  ): ResultAsync<FetchResult, FeedParseError> => {
    return ResultAsync.fromPromise(
      (async () => {
        let savedCount = 0;
        let skippedCount = 0;

        for (const item of items) {
          const url = item.link;
          if (!url) {
            skippedCount++;
            continue;
          }

          const externalId = item.guid ?? null;

          // externalIdまたはurlで重複チェック
          const existing = await prisma.article.findFirst({
            where: {
              OR: [
                ...(externalId ? [{ sourceId, externalId }] : []),
                { url },
              ],
            },
          });

          if (existing) {
            skippedCount++;
            continue;
          }

          // 公開日時のパース
          let publishedAt: Date | null = null;
          if (item.isoDate) {
            publishedAt = new Date(item.isoDate);
          } else if (item.pubDate) {
            publishedAt = new Date(item.pubDate);
          }

          await prisma.article.create({
            data: {
              sourceId,
              externalId,
              title: item.title ?? "Untitled",
              content: item.content ?? null,
              summary: item.contentSnippet ?? null,
              url,
              imageUrl: item.enclosure?.url ?? null,
              publishedAt,
            },
          });
          savedCount++;
        }

        return {
          sourceId,
          sourceName,
          savedCount,
          skippedCount,
        };
      })(),
      (e) => {
        const message = e instanceof Error ? e.message : "Unknown error";
        return new FeedParseError(`Failed to save articles: ${message}`, "", e);
      },
    );
  },

  /**
   * RSS/Atom形式の全ソースからフィードを取得
   */
  fetchAllSources: (): ResultAsync<FetchResult[], never> => {
    return ResultAsync.fromPromise(
      prisma.source.findMany({
        where: { type: { in: ["rss", "atom"] } },
      }),
      () => [] as Source[],
    )
      .orElse(() => okAsync([] as Source[]))
      .andThen((sources) => {
        return ResultAsync.fromPromise(
          (async () => {
            const results: FetchResult[] = [];

            for (const source of sources) {
              logger.info({ sourceId: source.id, name: source.name, url: source.url }, "Fetching feed");

              const result = await rssService.fetchAndSaveArticles(source);

              result.match(
                (fetchResult) => {
                  logger.info(
                    { sourceId: source.id, saved: fetchResult.savedCount, skipped: fetchResult.skippedCount },
                    "Feed fetch completed",
                  );
                  results.push(fetchResult);
                },
                (error) => {
                  logger.error({ sourceId: source.id, error: error.message }, "Feed fetch failed");
                  results.push({
                    sourceId: source.id,
                    sourceName: source.name,
                    savedCount: 0,
                    skippedCount: 0,
                    error: error.message,
                  });
                },
              );
            }

            return results;
          })(),
          () => [] as FetchResult[],
        );
      })
      .orElse(() => okAsync([] as FetchResult[]));
  },
};

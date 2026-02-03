/**
 * RSSフィード取得・保存サービス
 *
 * 登録されたソースからRSS/Atomフィードを取得し、
 * Zodスキーマで検証した後、DBに保存する。
 */
import Parser from "rss-parser";
import { prisma, type Source } from "@curio/database";
import { ResultAsync, okAsync } from "neverthrow";
import { FeedFetchError, FeedParseError, type JobError } from "./errors.js";
import { logger } from "../lib/logger.js";
import { FeedItemSchema, type FeedItem } from "./schema.js";

const parser = new Parser({
  timeout: 30000,
  headers: {
    "User-Agent": "Curio/1.0 (+https://github.com/axelaspor2/curio)",
  },
});

type FetchResult = {
  sourceId: string;
  sourceName: string;
  savedCount: number;
  skippedCount: number;
  invalidCount: number;
  error?: string;
};

export const rssService = {
  /**
   * rss-parserの出力は型が保証されないため、Zodで実行時検証を行う
   */
  fetchAndSaveArticles: (source: Source): ResultAsync<FetchResult, JobError> => {
    return ResultAsync.fromPromise(parser.parseURL(source.url), (e) => {
      const message = e instanceof Error ? e.message : "Unknown error";
      return new FeedFetchError(`Failed to fetch feed: ${message}`, source.url, e);
    }).andThen((feed) => {
      const rawItems = feed.items ?? [];
      const validItems: FeedItem[] = [];
      let invalidCount = 0;

      for (const rawItem of rawItems) {
        const result = FeedItemSchema.safeParse(rawItem);
        if (result.success) {
          validItems.push(result.data);
        } else {
          invalidCount++;
          logger.debug(
            { sourceId: source.id, errors: result.error.issues, rawItem },
            "Invalid feed item skipped",
          );
        }
      }

      if (invalidCount > 0) {
        logger.warn(
          { sourceId: source.id, invalidCount, totalCount: rawItems.length },
          "Some feed items failed validation",
        );
      }

      logger.debug({ sourceId: source.id, validCount: validItems.length }, "Validated feed items");
      return rssService.saveArticles(source.id, source.name, validItems, invalidCount);
    });
  },

  saveArticles: (
    sourceId: string,
    sourceName: string,
    items: FeedItem[],
    invalidCount: number = 0,
  ): ResultAsync<FetchResult, FeedParseError> => {
    return ResultAsync.fromPromise(
      (async () => {
        let savedCount = 0;
        let skippedCount = 0;

        for (const item of items) {
          const externalId = item.guid ?? null;

          // 同一ソース内でguidが一致、または全体でURLが一致する記事は重複とみなす
          // guidはソース間で衝突する可能性があるため、sourceIdと組み合わせて検索
          const existing = await prisma.article.findFirst({
            where: {
              OR: [...(externalId ? [{ sourceId, externalId }] : []), { url: item.link }],
            },
          });

          if (existing) {
            skippedCount++;
            continue;
          }

          // isoDateを優先（ISO 8601形式で解析しやすい）、なければpubDateにフォールバック
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
              title: item.title,
              content: item.content ?? null,
              summary: item.contentSnippet ?? null,
              url: item.link,
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
          invalidCount,
        };
      })(),
      (e) => {
        const message = e instanceof Error ? e.message : "Unknown error";
        return new FeedParseError(`Failed to save articles: ${message}`, "", e);
      },
    );
  },

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
                    {
                      sourceId: source.id,
                      saved: fetchResult.savedCount,
                      skipped: fetchResult.skippedCount,
                      invalid: fetchResult.invalidCount,
                    },
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
                    invalidCount: 0,
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

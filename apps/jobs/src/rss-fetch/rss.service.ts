/**
 * RSSフィード取得・保存サービス
 *
 * 登録されたソースからRSS/Atomフィードを取得し、
 * Zodスキーマで検証した後、DBに保存する。
 */

import { prisma, type Source } from "@curio/database";
import { okAsync, ResultAsync } from "neverthrow";
import Parser from "rss-parser";
import { logger } from "../lib/logger.js";
import { FeedFetchError, FeedParseError, type JobError } from "./errors.js";
import { type FeedItem, FeedItemSchema } from "./schema.js";

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
          logger.debug(
            { sourceId: source.id, errors: result.error.issues, rawItem },
            "Invalid feed item skipped",
          );
          invalidCount++;
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
    const parsePublishedAt = (item: FeedItem): Date | null =>
      item.isoDate ? new Date(item.isoDate) : item.pubDate ? new Date(item.pubDate) : null;

    const saveItem = async (item: FeedItem): Promise<{ saved: boolean; skipped: boolean }> => {
      const externalId = item.guid ?? null;

      // 同一ソース内でguidが一致、または全体でURLが一致する記事は重複とみなす
      // guidはソース間で衝突する可能性があるため、sourceIdと組み合わせて検索
      const existing = await prisma.article.findFirst({
        where: {
          OR: [...(externalId ? [{ sourceId, externalId }] : []), { url: item.link }],
        },
      });

      if (existing) {
        return { saved: false, skipped: true };
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
          publishedAt: parsePublishedAt(item),
        },
      });

      return { saved: true, skipped: false };
    };

    return ResultAsync.fromPromise(
      items
        .reduce<Promise<{ savedCount: number; skippedCount: number }>>(
          async (accPromise, item) => {
            const acc = await accPromise;
            const result = await saveItem(item);
            return {
              savedCount: acc.savedCount + (result.saved ? 1 : 0),
              skippedCount: acc.skippedCount + (result.skipped ? 1 : 0),
            };
          },
          Promise.resolve({ savedCount: 0, skippedCount: 0 }),
        )
        .then(({ savedCount, skippedCount }) => ({
          sourceId,
          sourceName,
          savedCount,
          skippedCount,
          invalidCount,
        })),
      (e) => {
        const message = e instanceof Error ? e.message : "Unknown error";
        return new FeedParseError(`Failed to save articles: ${message}`, "", e);
      },
    );
  },

  fetchAllSources: (): ResultAsync<FetchResult[], never> => {
    const processSource = async (source: Source): Promise<FetchResult> => {
      logger.info({ sourceId: source.id, name: source.name, url: source.url }, "Fetching feed");

      const result = await rssService.fetchAndSaveArticles(source);

      return result.match(
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
          return fetchResult;
        },
        (error) => {
          logger.error({ sourceId: source.id, error: error.message }, "Feed fetch failed");
          return {
            sourceId: source.id,
            sourceName: source.name,
            savedCount: 0,
            skippedCount: 0,
            invalidCount: 0,
            error: error.message,
          };
        },
      );
    };

    return ResultAsync.fromPromise(
      prisma.source.findMany({
        where: { type: { in: ["rss", "atom"] } },
      }),
      () => [] as Source[],
    )
      .orElse(() => okAsync([] as Source[]))
      .andThen((sources) =>
        ResultAsync.fromPromise(
          sources.reduce<Promise<FetchResult[]>>(async (accPromise, source) => {
            const acc = await accPromise;
            const result = await processSource(source);
            return [...acc, result];
          }, Promise.resolve([])),
          () => [] as FetchResult[],
        ),
      )
      .orElse(() => okAsync([] as FetchResult[]));
  },
};

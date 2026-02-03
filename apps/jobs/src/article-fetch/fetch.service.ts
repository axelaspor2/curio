/**
 * 記事本文取得サービス
 *
 * 記事URLから全文を取得してDBに保存する。
 */
import { prisma } from "@curio/database";
import { ResultAsync } from "neverthrow";
import { type FetchError, NetworkError, TimeoutError } from "./errors.js";
import { extractArticle } from "./extractor.js";

const FETCH_TIMEOUT_MS = 30000;
const BATCH_SIZE = 30;

/**
 * URLからHTMLを取得する
 */
const fetchHtml = (url: string): ResultAsync<string, FetchError> => {
  return ResultAsync.fromPromise(
    (async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

      try {
        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            "User-Agent": "Curio/1.0 (RSS Reader; +https://curio.app)",
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          },
        });

        if (!response.ok) {
          throw new NetworkError(`HTTP ${response.status}: ${response.statusText}`, url);
        }

        return await response.text();
      } finally {
        clearTimeout(timeoutId);
      }
    })(),
    (e) => {
      if (e instanceof NetworkError) {
        return e;
      }
      if (e instanceof Error && e.name === "AbortError") {
        return new TimeoutError(`Request timed out after ${FETCH_TIMEOUT_MS}ms`, url, e);
      }
      const message = e instanceof Error ? e.message : "Unknown error";
      return new NetworkError(`Fetch failed: ${message}`, url, e);
    },
  );
};

/**
 * 単一記事の本文を取得してDBに保存する
 */
const fetchAndSaveArticle = async (
  articleId: string,
  url: string,
): Promise<{ success: boolean; error?: FetchError }> => {
  const htmlResult = await fetchHtml(url);

  if (htmlResult.isErr()) {
    return { success: false, error: htmlResult.error };
  }

  const extractResult = await extractArticle(htmlResult.value, url);

  if (extractResult.isErr()) {
    return { success: false, error: extractResult.error };
  }

  const { textContent } = extractResult.value;

  await prisma.article.update({
    where: { id: articleId },
    data: { content: textContent },
  });

  return { success: true };
};

export interface FetchResult {
  totalCount: number;
  successCount: number;
  failedCount: number;
  errors: Array<{ articleId: string; url: string; error: string }>;
}

export const articleFetchService = {
  /**
   * contentがnullの記事を取得して本文を保存する
   */
  fetchPendingArticles: async (): Promise<FetchResult> => {
    const articles = await prisma.article.findMany({
      where: { content: null },
      select: { id: true, url: true, title: true },
      take: BATCH_SIZE,
      orderBy: { createdAt: "desc" },
    });

    const result: FetchResult = {
      totalCount: articles.length,
      successCount: 0,
      failedCount: 0,
      errors: [],
    };

    for (const article of articles) {
      console.log(`Fetching: ${article.title}`);

      const fetchResult = await fetchAndSaveArticle(article.id, article.url);

      if (fetchResult.success) {
        result.successCount++;
        console.log(`  ✓ Success`);
      } else {
        result.failedCount++;
        result.errors.push({
          articleId: article.id,
          url: article.url,
          error: fetchResult.error?.message ?? "Unknown error",
        });
        console.log(`  ✗ Failed: ${fetchResult.error?.message}`);
      }
    }

    return result;
  },

  /**
   * contentがnullの記事数を取得する
   */
  getPendingCount: async (): Promise<number> => {
    return prisma.article.count({
      where: { content: null },
    });
  },
};

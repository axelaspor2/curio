/**
 * HTML本文抽出ユーティリティ
 *
 * @mozilla/readability を使用してHTMLから記事本文を抽出する。
 */
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import { ResultAsync } from "neverthrow";
import { ExtractionError, type FetchError } from "./errors.js";

export interface ExtractedArticle {
  title: string;
  content: string;
  textContent: string;
  excerpt: string | null;
  byline: string | null;
  siteName: string | null;
  length: number;
}

/**
 * HTMLから記事本文を抽出する
 */
export const extractArticle = (
  html: string,
  url: string,
): ResultAsync<ExtractedArticle, FetchError> => {
  return ResultAsync.fromPromise(
    (async () => {
      const dom = new JSDOM(html, { url });
      const reader = new Readability(dom.window.document);
      const article = reader.parse();

      if (!article || !article.textContent) {
        throw new ExtractionError("Failed to extract article content");
      }

      return {
        title: article.title ?? "",
        content: article.content ?? "",
        textContent: article.textContent,
        excerpt: article.excerpt ?? null,
        byline: article.byline ?? null,
        siteName: article.siteName ?? null,
        length: article.length ?? 0,
      };
    })(),
    (e) => {
      if (e instanceof ExtractionError) {
        return e;
      }
      const message = e instanceof Error ? e.message : "Unknown error";
      return new ExtractionError(`Extraction failed: ${message}`, e);
    },
  );
};

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
  ogImage: string | null;
}

/**
 * HTMLからOGP画像を抽出する
 * 優先順位: og:image > og:image:secure_url > twitter:image > link[rel="image_src"]
 */
const extractOgImage = (document: Document): string | null => {
  const selectors = [
    'meta[property="og:image"]',
    'meta[property="og:image:secure_url"]',
    'meta[name="twitter:image"]',
    'link[rel="image_src"]',
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    const content = element?.getAttribute("content") ?? element?.getAttribute("href");
    if (content) {
      return content;
    }
  }
  return null;
};

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
      const document = dom.window.document;

      // OGP画像を抽出（Readabilityがdocumentを変更する前に実行）
      const ogImage = extractOgImage(document);

      const reader = new Readability(document);
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
        ogImage,
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

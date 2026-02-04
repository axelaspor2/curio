import { describe, expect, it } from "vitest";
import { extractArticle } from "../article-fetch/extractor.js";

describe("extractArticle", () => {
  const baseHtml = (head: string, body: string) => `
    <!DOCTYPE html>
    <html>
      <head>${head}</head>
      <body>${body}</body>
    </html>
  `;

  const articleBody =
    "<article><p>This is the main article content for testing purposes.</p></article>";

  describe("OGP画像抽出", () => {
    it("og:imageメタタグからOGP画像を抽出できる", async () => {
      const html = baseHtml(
        `
          <meta property="og:image" content="https://example.com/og-image.jpg">
          <title>Test Article</title>
        `,
        articleBody,
      );

      const result = await extractArticle(html, "https://example.com/article");

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.ogImage).toBe("https://example.com/og-image.jpg");
      }
    });

    it("og:image:secure_urlからフォールバックできる", async () => {
      const html = baseHtml(
        `
          <meta property="og:image:secure_url" content="https://example.com/secure-image.jpg">
          <title>Test Article</title>
        `,
        articleBody,
      );

      const result = await extractArticle(html, "https://example.com/article");

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.ogImage).toBe("https://example.com/secure-image.jpg");
      }
    });

    it("twitter:imageからフォールバックできる", async () => {
      const html = baseHtml(
        `
          <meta name="twitter:image" content="https://example.com/twitter-image.jpg">
          <title>Test Article</title>
        `,
        articleBody,
      );

      const result = await extractArticle(html, "https://example.com/article");

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.ogImage).toBe("https://example.com/twitter-image.jpg");
      }
    });

    it("link[rel=image_src]からフォールバックできる", async () => {
      const html = baseHtml(
        `
          <link rel="image_src" href="https://example.com/link-image.jpg">
          <title>Test Article</title>
        `,
        articleBody,
      );

      const result = await extractArticle(html, "https://example.com/article");

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.ogImage).toBe("https://example.com/link-image.jpg");
      }
    });

    it("og:imageが優先される（複数のメタタグがある場合）", async () => {
      const html = baseHtml(
        `
          <meta property="og:image" content="https://example.com/og-image.jpg">
          <meta name="twitter:image" content="https://example.com/twitter-image.jpg">
          <title>Test Article</title>
        `,
        articleBody,
      );

      const result = await extractArticle(html, "https://example.com/article");

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.ogImage).toBe("https://example.com/og-image.jpg");
      }
    });

    it("OGP画像がない場合はnullを返す", async () => {
      const html = baseHtml(`<title>Test Article</title>`, articleBody);

      const result = await extractArticle(html, "https://example.com/article");

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.ogImage).toBeNull();
      }
    });

    it("空のcontent属性の場合はnullを返す", async () => {
      const html = baseHtml(
        `
          <meta property="og:image" content="">
          <title>Test Article</title>
        `,
        articleBody,
      );

      const result = await extractArticle(html, "https://example.com/article");

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.ogImage).toBeNull();
      }
    });
  });

  describe("本文抽出", () => {
    it("記事本文を正常に抽出できる", async () => {
      const html = baseHtml(`<title>Test Article</title>`, articleBody);

      const result = await extractArticle(html, "https://example.com/article");

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.textContent).toContain("main article content");
      }
    });

    it("本文がない場合はエラーを返す", async () => {
      const html = `<!DOCTYPE html><html><head></head><body></body></html>`;

      const result = await extractArticle(html, "https://example.com/article");

      expect(result.isErr()).toBe(true);
    });
  });
});

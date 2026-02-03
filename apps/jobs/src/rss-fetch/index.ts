/**
 * RSSフィード取得ジョブ
 *
 * 登録されたRSS/Atomソースから記事を取得してDBに保存します。
 *
 * 使用方法:
 *   pnpm --filter @curio/jobs rss-fetch
 */

import { logger } from "../lib/logger.js";
import { rssService } from "./rss.service.js";

async function main(): Promise<void> {
  logger.info("Starting RSS fetch job");
  const startTime = Date.now();

  const result = await rssService.fetchAllSources();

  result.match(
    (results) => {
      const totalSaved = results.reduce((sum, r) => sum + r.savedCount, 0);
      const totalSkipped = results.reduce((sum, r) => sum + r.skippedCount, 0);
      const errors = results.filter((r) => r.error);

      logger.info(
        {
          durationMs: Date.now() - startTime,
          sourcesProcessed: results.length,
          totalArticlesSaved: totalSaved,
          totalArticlesSkipped: totalSkipped,
          errorCount: errors.length,
        },
        "RSS fetch job completed",
      );

      if (errors.length > 0) {
        logger.warn({ errors: errors.map((e) => ({ source: e.sourceName, error: e.error })) }, "Some sources failed");
      }

      // 全ソースが失敗した場合のみ終了コード1
      if (errors.length === results.length && results.length > 0) {
        process.exit(1);
      }
    },
    () => {
      logger.error("RSS fetch job failed unexpectedly");
      process.exit(1);
    },
  );
}

main().catch((e) => {
  logger.error({ error: e }, "Unhandled error in RSS fetch job");
  process.exit(1);
});

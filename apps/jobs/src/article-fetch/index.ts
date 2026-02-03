/**
 * 記事本文取得ジョブ
 *
 * Cloud Run Jobsとして実行される。
 * contentがnullの記事をスクレイピングして本文を保存する。
 */
import { articleFetchService } from "./fetch.service.js";

const main = async () => {
  console.log("=== Article Fetch Job Started ===");

  const pendingCount = await articleFetchService.getPendingCount();
  console.log(`Pending articles: ${pendingCount}`);

  if (pendingCount === 0) {
    console.log("No articles to fetch. Exiting.");
    return;
  }

  const result = await articleFetchService.fetchPendingArticles();

  console.log("\n=== Summary ===");
  console.log(`Total: ${result.totalCount}`);
  console.log(`Success: ${result.successCount}`);
  console.log(`Failed: ${result.failedCount}`);

  if (result.errors.length > 0) {
    console.log("\nErrors:");
    for (const error of result.errors) {
      console.log(`  - ${error.url}: ${error.error}`);
    }
  }

  console.log("\n=== Article Fetch Job Completed ===");
};

main().catch((error) => {
  console.error("Job failed with error:", error);
  process.exit(1);
});

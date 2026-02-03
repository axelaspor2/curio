/**
 * 記事エンリッチメントジョブ
 *
 * Cloud Run Jobsとして実行される。
 * contentがあり、embeddingがない記事にLLM分類・要約・ベクトルを付与する。
 */
import { enrichmentService } from "./enrichment.service.js";

const main = async () => {
  console.log("=== Article Enrichment Job Started ===");

  const pendingCount = await enrichmentService.getPendingCount();
  console.log(`Pending articles: ${pendingCount}`);

  if (pendingCount === 0) {
    console.log("No articles to enrich. Exiting.");
    return;
  }

  const result = await enrichmentService.enrichPendingArticles();

  console.log("\n=== Summary ===");
  console.log(`Total: ${result.totalCount}`);
  console.log(`Success: ${result.successCount}`);
  console.log(`Failed: ${result.failedCount}`);

  if (result.errors.length > 0) {
    console.log("\nErrors:");
    for (const error of result.errors) {
      console.log(`  - ${error.title}: ${error.error}`);
    }
  }

  console.log("\n=== Article Enrichment Job Completed ===");
};

main().catch((error) => {
  console.error("Job failed with error:", error);
  process.exit(1);
});

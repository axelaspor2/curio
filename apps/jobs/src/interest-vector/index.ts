/**
 * ユーザー興味ベクトル計算ジョブ
 *
 * Cloud Run Jobsとして実行される。
 * インタラクション履歴から興味ベクトルを計算してDBに保存する。
 */
import { vectorService } from "./vector.service.js";

const main = async () => {
  console.log("=== Interest Vector Calculation Job Started ===");

  const existingCount = await vectorService.getVectorCount();
  console.log(`Existing interest vectors: ${existingCount}`);

  const result = await vectorService.calculateAllUserVectors();

  console.log("\n=== Summary ===");
  console.log(`Users processed: ${result.usersProcessed}`);
  console.log(`Users updated: ${result.usersUpdated}`);
  console.log(`Users skipped: ${result.usersSkipped}`);

  const newCount = await vectorService.getVectorCount();
  console.log(`\nTotal interest vectors: ${newCount}`);

  console.log("\n=== Interest Vector Calculation Job Completed ===");
};

main().catch((error) => {
  console.error("Job failed with error:", error);
  process.exit(1);
});

/**
 * テストセットアップ
 *
 * テスト実行前後のセットアップとクリーンアップを行います。
 * モジュール解決の問題を回避するため、生のSQLを使用します。
 */

import { Pool, type PoolClient } from "pg";
import { beforeAll, afterAll, beforeEach } from "vitest";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required for tests");
}

// テスト用のPostgreSQL Poolを作成
export const pool = new Pool({ connectionString });

// 現在のテスト用クライアントを保持
let currentClient: PoolClient | null = null;

/**
 * テスト用のDB接続を取得
 */
export async function getClient(): Promise<PoolClient> {
  if (!currentClient) {
    currentClient = await pool.connect();
  }
  return currentClient;
}

beforeAll(async () => {
  // テスト用DBの接続確認
  const client = await pool.connect();
  await client.query("SELECT 1");
  client.release();
});

afterAll(async () => {
  if (currentClient) {
    currentClient.release();
    currentClient = null;
  }
  await pool.end();
});

beforeEach(async () => {
  // テストごとにDBをクリーンアップ（依存関係順に削除）
  const client = await pool.connect();
  try {
    await client.query("DELETE FROM interactions");
    await client.query("DELETE FROM user_category_preferences");
    await client.query("DELETE FROM user_interest_vectors");
    await client.query("DELETE FROM article_categories");
    await client.query("DELETE FROM articles");
    await client.query("DELETE FROM sources");
    await client.query("DELETE FROM categories");
    await client.query("DELETE FROM sessions");
    await client.query("DELETE FROM accounts");
    await client.query("DELETE FROM verifications");
    await client.query("DELETE FROM users");
  } finally {
    client.release();
  }
});

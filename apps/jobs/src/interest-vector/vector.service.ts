/**
 * ユーザー興味ベクトル計算サービス
 *
 * インタラクション履歴から興味ベクトルを計算する。
 */
import { prisma } from "@curio/database";

const VECTOR_DIM = 768;
const TIME_DECAY_DAYS = 30;

/**
 * 時間減衰係数を計算
 *
 * 新しいインタラクションほど重みが大きくなる。
 */
const calculateTimeDecay = (createdAt: Date): number => {
  const now = new Date();
  const diffMs = now.getTime() - createdAt.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return Math.exp(-diffDays / TIME_DECAY_DAYS);
};

/**
 * インタラクションタイプ別の重み
 */
const INTERACTION_WEIGHTS: Record<string, number> = {
  LIKE: 1.0,
  READ: 0.8,
  OPEN: 0.3,
  SKIP: 0, // SKIPはベクトル計算に使用しない
};

/**
 * ベクトルを正規化（L2ノルム）
 */
const normalizeVector = (vector: number[]): number[] => {
  const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
  if (norm === 0) return vector;
  return vector.map((v) => v / norm);
};

interface VectorCalculationResult {
  usersProcessed: number;
  usersUpdated: number;
  usersSkipped: number;
}

export const vectorService = {
  /**
   * 全ユーザーの興味ベクトルを計算・更新する
   */
  calculateAllUserVectors: async (): Promise<VectorCalculationResult> => {
    // ポジティブなインタラクション（LIKE, READ, OPEN）を持つユーザーを取得
    const usersWithInteractions = await prisma.$queryRaw<Array<{ user_id: string }>>`
      SELECT DISTINCT user_id
      FROM interactions
      WHERE type IN ('LIKE', 'READ', 'OPEN')
    `;

    const result: VectorCalculationResult = {
      usersProcessed: usersWithInteractions.length,
      usersUpdated: 0,
      usersSkipped: 0,
    };

    for (const { user_id: userId } of usersWithInteractions) {
      console.log(`Processing user: ${userId}`);

      // ユーザーのポジティブインタラクションと記事のembeddingを取得
      // pgvectorのvector型はtext経由で配列に変換する
      const rawInteractions = await prisma.$queryRaw<
        Array<{
          type: string;
          created_at: Date;
          embedding: string;
        }>
      >`
        SELECT
          i.type,
          i.created_at,
          a.embedding::text as embedding
        FROM interactions i
        JOIN articles a ON i.article_id = a.id
        WHERE i.user_id = ${userId}::uuid
          AND i.type IN ('LIKE', 'READ', 'OPEN')
          AND a.embedding IS NOT NULL
        ORDER BY i.created_at DESC
        LIMIT 100
      `;

      // pgvectorのtext表現 "[0.1,0.2,...]" をパース
      const interactions = rawInteractions.map((row) => ({
        type: row.type,
        created_at: row.created_at,
        embedding: JSON.parse(row.embedding) as number[],
      }));

      if (interactions.length === 0) {
        console.log(`  → No valid interactions, skipped`);
        result.usersSkipped++;
        continue;
      }

      // 加重平均ベクトルを計算
      const weightedSum = new Array(VECTOR_DIM).fill(0);
      let totalWeight = 0;

      for (const interaction of interactions) {
        const baseWeight = INTERACTION_WEIGHTS[interaction.type] ?? 0;
        if (baseWeight === 0) continue;

        const timeDecay = calculateTimeDecay(interaction.created_at);
        const weight = baseWeight * timeDecay;

        for (let i = 0; i < VECTOR_DIM; i++) {
          weightedSum[i] += (interaction.embedding[i] ?? 0) * weight;
        }
        totalWeight += weight;
      }

      if (totalWeight === 0) {
        console.log(`  → Total weight is 0, skipped`);
        result.usersSkipped++;
        continue;
      }

      // 平均化
      const avgVector = weightedSum.map((v) => v / totalWeight);

      // 正規化
      const normalizedVector = normalizeVector(avgVector);

      // DBに保存（upsert）
      // pgvectorは [0.1, 0.2, ...] 形式の文字列を期待する
      const vectorStr = `[${normalizedVector.join(",")}]`;
      await prisma.$executeRaw`
        INSERT INTO user_interest_vectors (id, user_id, interest_embedding, last_calculated_at, created_at, updated_at)
        VALUES (
          gen_random_uuid(),
          ${userId}::uuid,
          ${vectorStr}::vector,
          NOW(),
          NOW(),
          NOW()
        )
        ON CONFLICT (user_id)
        DO UPDATE SET
          interest_embedding = ${vectorStr}::vector,
          last_calculated_at = NOW(),
          updated_at = NOW()
      `;

      console.log(`  ✓ Updated interest vector (${interactions.length} interactions)`);
      result.usersUpdated++;
    }

    return result;
  },

  /**
   * 興味ベクトルを持つユーザー数を取得
   */
  getVectorCount: async (): Promise<number> => {
    const result = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*)::bigint as count
      FROM user_interest_vectors
      WHERE interest_embedding IS NOT NULL
    `;
    return Number(result[0].count);
  },
};

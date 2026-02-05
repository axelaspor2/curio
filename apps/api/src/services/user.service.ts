import { Prisma, prisma } from "@curio/database";
import { errAsync, type ResultAsync } from "neverthrow";
import { NotFoundError, type PrismaError } from "../lib/errors.js";
import { fromPrisma } from "../lib/from-promise.js";
import type { OnboardingStatusResponse, UserPreference } from "../schemas/users.js";

/** 選択されたカテゴリのスコア */
const SELECTED_SCORE = 0.7;
/** 選択されなかったカテゴリのスコア */
const UNSELECTED_SCORE = 0.3;
/** スキップ時の中立スコア */
const NEUTRAL_SCORE = 0.5;

type CategoryIds = { id: string }[];

interface SetCategoriesResult {
  preferences: UserPreference[];
  interestVectorGenerated: boolean;
}

export const userService = {
  /**
   * オンボーディング状態を取得
   */
  getOnboardingStatus: (userId: string): ResultAsync<OnboardingStatusResponse, PrismaError> =>
    fromPrisma(
      prisma.userCategoryPreference.count({
        where: { userId },
      }),
    ).map((count) => ({
      isOnboardingComplete: count > 0,
      selectedCategoryCount: count,
    })),

  /**
   * 初期状態でユーザーのカテゴリ選好を設定
   * トランザクション化で既存設定の一貫性を確保し、部分的な更新を防止
   *
   * @param userId ユーザーID
   * @param categoryIds 選択したカテゴリID配列
   * @param skipped スキップフラグ（trueの場合、全カテゴリを中立スコアで設定）
   */
  setCategories: (
    userId: string,
    categoryIds: string[],
    skipped = false,
  ): ResultAsync<SetCategoriesResult, PrismaError | NotFoundError> => {
    // スキップの場合は全カテゴリを取得
    if (skipped) {
      return fromPrisma<CategoryIds>(
        prisma.category.findMany({
          select: { id: true },
        }),
      ).andThen((allCategories) =>
        setCategoriesWithVector(
          userId,
          allCategories.map((c) => c.id),
          new Set(), // 全て未選択扱い
          true, // skipped
        ),
      );
    }

    // 通常の場合：選択されたカテゴリを検証
    return fromPrisma<CategoryIds>(
      prisma.category.findMany({
        where: { id: { in: categoryIds } },
        select: { id: true },
      }),
    ).andThen((categories) => {
      if (categories.length !== categoryIds.length) {
        const foundIds = new Set(categories.map((c) => c.id));
        const notFoundIds = categoryIds.filter((id) => !foundIds.has(id));
        return errAsync(new NotFoundError(`カテゴリが見つかりません: ${notFoundIds.join(", ")}`));
      }

      // 全カテゴリを取得して、選択/未選択でスコアを設定
      return fromPrisma<CategoryIds>(
        prisma.category.findMany({
          select: { id: true },
        }),
      ).andThen((allCategories) =>
        setCategoriesWithVector(
          userId,
          allCategories.map((c) => c.id),
          new Set(categoryIds),
          false,
        ),
      );
    });
  },
};

/**
 * カテゴリ設定と興味ベクトル生成を行う
 */
const setCategoriesWithVector = (
  userId: string,
  allCategoryIds: string[],
  selectedIds: Set<string>,
  skipped: boolean,
): ResultAsync<SetCategoriesResult, PrismaError> =>
  fromPrisma<SetCategoriesResult>(
    prisma.$transaction(async (tx) => {
      // 既存の設定を削除
      await tx.userCategoryPreference.deleteMany({
        where: { userId },
      });

      // 全カテゴリに対して設定を作成
      const preferences = await Promise.all(
        allCategoryIds.map((categoryId) => {
          const isSelected = selectedIds.has(categoryId);
          let score: number;
          if (skipped) {
            score = NEUTRAL_SCORE;
          } else {
            score = isSelected ? SELECTED_SCORE : UNSELECTED_SCORE;
          }

          return tx.userCategoryPreference.create({
            data: {
              userId,
              categoryId,
              preferenceScore: new Prisma.Decimal(score),
              isInitialSelection: isSelected,
            },
            select: {
              categoryId: true,
              preferenceScore: true,
              isInitialSelection: true,
            },
          });
        }),
      );

      // 興味ベクトルを生成
      const vectorGenerated = await generateInitialInterestVector(tx, userId, selectedIds, skipped);

      return {
        preferences: preferences.map((p) => ({
          categoryId: p.categoryId,
          preferenceScore: Number(p.preferenceScore),
          isInitialSelection: p.isInitialSelection,
        })),
        interestVectorGenerated: vectorGenerated,
      };
    }),
  );

/**
 * カテゴリ選択から初期興味ベクトルを生成
 *
 * 選択されたカテゴリに属する記事のembeddingを加重平均して興味ベクトルを生成
 */
const generateInitialInterestVector = async (
  tx: Prisma.TransactionClient,
  userId: string,
  selectedIds: Set<string>,
  skipped: boolean,
): Promise<boolean> => {
  // 対象カテゴリを決定
  const targetCategoryIds = skipped
    ? (await tx.category.findMany({ select: { id: true } })).map((c) => c.id)
    : Array.from(selectedIds);

  if (targetCategoryIds.length === 0) {
    return false;
  }

  // 各カテゴリの代表ベクトル（平均）を計算
  // カテゴリごとに記事のembeddingを平均化
  const categoryVectors: { categoryId: string; vector: number[]; score: number }[] = [];

  for (const categoryId of targetCategoryIds) {
    // カテゴリに属する記事のembeddingを取得（最大100件）
    const articles = await tx.$queryRaw<{ embedding: string }[]>`
      SELECT a.embedding::text as embedding
      FROM articles a
      JOIN article_categories ac ON a.id = ac.article_id
      WHERE ac.category_id = ${categoryId}::uuid
        AND a.embedding IS NOT NULL
      ORDER BY a.published_at DESC
      LIMIT 100
    `;

    if (articles.length === 0) {
      continue;
    }

    // 平均ベクトルを計算
    const embeddings = articles.map((a) => parseVector(a.embedding));
    const avgVector = averageVectors(embeddings);

    // スコアを決定
    const score = skipped
      ? NEUTRAL_SCORE
      : selectedIds.has(categoryId)
        ? SELECTED_SCORE
        : UNSELECTED_SCORE;

    categoryVectors.push({ categoryId, vector: avgVector, score });
  }

  const firstVector = categoryVectors[0];
  if (!firstVector) {
    return false;
  }

  // カテゴリ代表ベクトルをスコアで加重平均
  const totalScore = categoryVectors.reduce((sum, cv) => sum + cv.score, 0);
  const dimension = firstVector.vector.length;
  const interestVector = new Array<number>(dimension).fill(0);

  for (const cv of categoryVectors) {
    const weight = cv.score / totalScore;
    for (let i = 0; i < dimension; i++) {
      interestVector[i] += (cv.vector[i] ?? 0) * weight;
    }
  }

  // L2正規化
  const norm = Math.sqrt(interestVector.reduce((sum, v) => sum + v * v, 0));
  if (norm > 0) {
    for (let i = 0; i < dimension; i++) {
      interestVector[i] /= norm;
    }
  }

  // user_interest_vectorsに保存
  const vectorStr = `[${interestVector.join(",")}]`;
  await tx.$executeRaw`
    INSERT INTO user_interest_vectors (id, user_id, interest_embedding, last_calculated_at, created_at, updated_at)
    VALUES (gen_random_uuid(), ${userId}::uuid, ${vectorStr}::vector, NOW(), NOW(), NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      interest_embedding = ${vectorStr}::vector,
      last_calculated_at = NOW(),
      updated_at = NOW()
  `;

  return true;
};

/**
 * pgvectorの文字列表現をパース
 */
const parseVector = (vectorStr: string): number[] => {
  // "[0.1,0.2,...]" 形式をパース
  const cleaned = vectorStr.replace(/^\[|\]$/g, "");
  return cleaned.split(",").map(Number);
};

/**
 * ベクトル配列の平均を計算
 */
const averageVectors = (vectors: number[][]): number[] => {
  const first = vectors[0];
  if (!first) return [];
  const dimension = first.length;
  const result = new Array<number>(dimension).fill(0);

  for (const vec of vectors) {
    for (let i = 0; i < dimension; i++) {
      result[i] += vec[i] ?? 0;
    }
  }

  for (let i = 0; i < dimension; i++) {
    result[i] /= vectors.length;
  }

  return result;
};

/**
 * カテゴリ嗜好スコア更新サービス
 *
 * インタラクションに基づいてユーザーのカテゴリ嗜好スコアを更新する。
 */
import { Prisma, prisma } from "@curio/database";
import type { InteractionType } from "../schemas/interactions.js";

/**
 * インタラクションタイプ別のスコア変動量
 *
 * LIKE: +0.05 (強いポジティブシグナル)
 * SKIP: -0.02 (弱いネガティブシグナル)
 * OPEN: +0.02 (中程度のポジティブシグナル)
 * READ: +0.03 (強いポジティブシグナル、滞在時間でボーナス)
 */
const SCORE_DELTAS: Record<InteractionType, number> = {
  LIKE: 0.05,
  SKIP: -0.02,
  OPEN: 0.02,
  READ: 0.03,
};

const MIN_SCORE = 0;
const MAX_SCORE = 1;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

export const preferenceService = {
  /**
   * インタラクションに基づいてカテゴリスコアを更新する
   *
   * 記事に紐づくカテゴリのスコアを更新する。
   */
  updateFromInteraction: async (
    userId: string,
    articleId: string,
    type: InteractionType,
    readingTimeSec?: number,
  ): Promise<void> => {
    // 記事のカテゴリを取得
    const articleCategories = await prisma.articleCategory.findMany({
      where: { articleId },
      select: {
        categoryId: true,
        confidence: true,
      },
    });

    if (articleCategories.length === 0) {
      return;
    }

    // 基本スコア変動
    let baseDelta = SCORE_DELTAS[type];

    // READの場合、滞在時間に応じてボーナス（30秒以上で+0.01、60秒以上で+0.02）
    if (type === "READ" && readingTimeSec) {
      if (readingTimeSec >= 60) {
        baseDelta += 0.02;
      } else if (readingTimeSec >= 30) {
        baseDelta += 0.01;
      }
    }

    // 各カテゴリのスコアを更新
    for (const ac of articleCategories) {
      // LLMのconfidenceを考慮したスコア変動
      const confidence = ac.confidence ? Number(ac.confidence) : 0.5;
      const delta = baseDelta * confidence;

      // 既存のスコアを取得
      const existing = await prisma.userCategoryPreference.findUnique({
        where: {
          userId_categoryId: {
            userId,
            categoryId: ac.categoryId,
          },
        },
      });

      const currentScore = existing ? Number(existing.preferenceScore) : 0.5;
      const newScore = clamp(currentScore + delta, MIN_SCORE, MAX_SCORE);

      // スコアを更新（upsert）
      await prisma.userCategoryPreference.upsert({
        where: {
          userId_categoryId: {
            userId,
            categoryId: ac.categoryId,
          },
        },
        create: {
          userId,
          categoryId: ac.categoryId,
          preferenceScore: new Prisma.Decimal(newScore),
        },
        update: {
          preferenceScore: new Prisma.Decimal(newScore),
        },
      });
    }
  },
};

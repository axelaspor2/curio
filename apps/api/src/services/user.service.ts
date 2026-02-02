/**
 * ユーザーサービス
 *
 * ユーザー関連のビジネスロジックを提供します。
 */

import { prisma } from "@curio/database";
import { errAsync, type ResultAsync } from "neverthrow";
import { NotFoundError, type PrismaError } from "../lib/errors.js";
import { fromPrisma } from "../lib/from-promise.js";
import type { UserPreference } from "../schemas/users.js";

type CategoryIds = { id: string }[];

export const userService = {
  /**
   * 初回カテゴリ選択
   * 選択したカテゴリに対してUserCategoryPreferenceを作成
   */
  setCategories: (
    userId: string,
    categoryIds: string[],
  ): ResultAsync<UserPreference[], PrismaError | NotFoundError> =>
    // まずカテゴリの存在確認
    fromPrisma<CategoryIds>(
      prisma.category.findMany({
        where: { id: { in: categoryIds } },
        select: { id: true },
      }),
    ).andThen((categories) => {
      // 存在しないカテゴリがあればエラー
      if (categories.length !== categoryIds.length) {
        const foundIds = new Set(categories.map((c) => c.id));
        const notFoundIds = categoryIds.filter((id) => !foundIds.has(id));
        return errAsync(new NotFoundError(`カテゴリが見つかりません: ${notFoundIds.join(", ")}`));
      }

      // 既存の設定を削除して新規作成（トランザクション）
      return fromPrisma<UserPreference[]>(
        prisma.$transaction(async (tx: typeof prisma) => {
          // 既存のカテゴリ設定を削除
          await tx.userCategoryPreference.deleteMany({
            where: { userId },
          });

          // 新しいカテゴリ設定を作成
          const preferences = await Promise.all(
            categoryIds.map((categoryId: string) =>
              tx.userCategoryPreference.create({
                data: {
                  userId,
                  categoryId,
                  preferenceScore: 0.5, // 初期スコア
                  isInitialSelection: true,
                },
                select: {
                  categoryId: true,
                  preferenceScore: true,
                  isInitialSelection: true,
                },
              }),
            ),
          );

          return preferences.map(
            (p: { categoryId: string; preferenceScore: number; isInitialSelection: boolean }) => ({
              categoryId: p.categoryId,
              preferenceScore: Number(p.preferenceScore), // Decimalをnumberに変換
              isInitialSelection: p.isInitialSelection,
            }),
          );
        }),
      );
    }),
};

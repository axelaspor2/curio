/**
 * ユーザーサービス
 *
 * ユーザー関連のビジネスロジックを提供します。
 */

import { prisma } from "@curio/database";
import { ResultAsync, err } from "neverthrow";
import { fromPrisma } from "../lib/from-promise.js";
import { NotFoundError, type PrismaError } from "../lib/errors.js";
import type { UserPreference } from "../schemas/users.js";

// Prisma 7 driver adapter使用時の型問題を回避
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;

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
      db.category.findMany({
        where: { id: { in: categoryIds } },
        select: { id: true },
      }),
    ).andThen((categories) => {
      // 存在しないカテゴリがあればエラー
      if (categories.length !== categoryIds.length) {
        const foundIds = new Set(categories.map((c) => c.id));
        const notFoundIds = categoryIds.filter((id) => !foundIds.has(id));
        return ResultAsync.fromSafePromise<UserPreference[], NotFoundError>(
          Promise.resolve([]),
        ).map(() => {
          throw new NotFoundError(`カテゴリが見つかりません: ${notFoundIds.join(", ")}`);
        });
      }

      // 既存の設定を削除して新規作成（トランザクション）
      return fromPrisma<UserPreference[]>(
        db.$transaction(async (tx: typeof db) => {
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

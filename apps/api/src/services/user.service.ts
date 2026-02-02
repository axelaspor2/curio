import { prisma } from "@curio/database";
import { errAsync, type ResultAsync } from "neverthrow";
import { NotFoundError, type PrismaError } from "../lib/errors.js";
import { fromPrisma } from "../lib/from-promise.js";
import type { UserPreference } from "../schemas/users.js";

type CategoryIds = { id: string }[];

export const userService = {
  /**
   * 初期状態でユーザーのカテゴリ選好を設定
   * トランザクション化で既存設定の一貫性を確保し、部分的な更新を防止
   */
  setCategories: (
    userId: string,
    categoryIds: string[],
  ): ResultAsync<UserPreference[], PrismaError | NotFoundError> =>
    fromPrisma<CategoryIds>(
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

      return fromPrisma<UserPreference[]>(
        prisma.$transaction(async (tx) => {
          await tx.userCategoryPreference.deleteMany({
            where: { userId },
          });

          const preferences = await Promise.all(
            categoryIds.map((categoryId) =>
              tx.userCategoryPreference.create({
                data: {
                  userId,
                  categoryId,
                  // 中立的な初期値（0-1スケール）
                  preferenceScore: 0.5,
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

          // PrismaのDecimal型はJSON直列化できないためnumberに変換
          return preferences.map((p) => ({
            categoryId: p.categoryId,
            preferenceScore: Number(p.preferenceScore),
            isInitialSelection: p.isInitialSelection,
          }));
        }),
      );
    }),
};

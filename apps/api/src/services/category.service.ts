/**
 * カテゴリサービス
 *
 * カテゴリ関連のビジネスロジックを提供します。
 */

import { prisma } from "@curio/database";
import type { ResultAsync } from "neverthrow";
import type { PrismaError } from "../lib/errors.js";
import { fromPrisma } from "../lib/from-promise.js";
import type { Category } from "../schemas/categories.js";

export const categoryService = {
  /**
   * カテゴリ一覧を取得
   */
  getAll: (): ResultAsync<Category[], PrismaError> =>
    fromPrisma(
      prisma.category.findMany({
        orderBy: { displayOrder: "asc" },
        select: {
          id: true,
          slug: true,
          name: true,
          description: true,
          displayOrder: true,
        },
      }),
    ),
};

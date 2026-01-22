/**
 * カテゴリサービス
 *
 * カテゴリ関連のビジネスロジックを提供します。
 */

import { prisma } from "@curio/database";
import type { ResultAsync } from "neverthrow";
import { fromPrisma } from "../lib/from-promise.js";
import type { PrismaError } from "../lib/errors.js";
import type { Category } from "../schemas/categories.js";

// Prisma 7 driver adapter使用時の型問題を回避
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;

export const categoryService = {
  /**
   * カテゴリ一覧を取得
   */
  getAll: (): ResultAsync<Category[], PrismaError> =>
    fromPrisma(
      db.category.findMany({
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

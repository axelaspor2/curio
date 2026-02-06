/**
 * 統計サービス
 *
 * ユーザーの累計統計情報を取得するサービスです。
 */

import { prisma } from "@curio/database";
import type { ResultAsync } from "neverthrow";
import type { PrismaError } from "../lib/errors.js";
import { fromPrisma } from "../lib/from-promise.js";
import type { CategoryStat, StatisticsResponse } from "../schemas/statistics.js";

type CategoryStatRow = {
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  count: bigint;
};

export const statisticsService = {
  /**
   * ユーザーの累計統計を取得
   *
   * - アクション統計（LIKE/SKIP/READ数）
   * - LIKEが多いカテゴリTOP3
   * - SKIPが多いカテゴリTOP3
   */
  getStatistics: (userId: string): ResultAsync<StatisticsResponse, PrismaError> =>
    fromPrisma(
      (async () => {
        // 1. 累計アクション統計（LIKE/SKIP/READ）
        const actionCounts = await prisma.interaction.groupBy({
          by: ["type"],
          where: { userId },
          _count: { type: true },
        });

        // 2. LIKEが多いカテゴリTOP3
        const topLikedCategories = await prisma.$queryRaw<CategoryStatRow[]>`
          SELECT
            c.id as "categoryId",
            c.name as "categoryName",
            c.slug as "categorySlug",
            COUNT(*) as count
          FROM interactions i
          JOIN article_categories ac ON i.article_id = ac.article_id
          JOIN categories c ON ac.category_id = c.id
          WHERE i.user_id = ${userId}::uuid AND i.type = 'LIKE'
          GROUP BY c.id, c.name, c.slug
          ORDER BY count DESC
          LIMIT 3
        `;

        // 3. SKIPが多いカテゴリTOP3
        const topSkippedCategories = await prisma.$queryRaw<CategoryStatRow[]>`
          SELECT
            c.id as "categoryId",
            c.name as "categoryName",
            c.slug as "categorySlug",
            COUNT(*) as count
          FROM interactions i
          JOIN article_categories ac ON i.article_id = ac.article_id
          JOIN categories c ON ac.category_id = c.id
          WHERE i.user_id = ${userId}::uuid AND i.type = 'SKIP'
          GROUP BY c.id, c.name, c.slug
          ORDER BY count DESC
          LIMIT 3
        `;

        // 統計を整形
        const stats = {
          like: 0,
          skip: 0,
          read: 0,
        };
        for (const ac of actionCounts) {
          if (ac.type === "LIKE") stats.like = ac._count.type;
          if (ac.type === "SKIP") stats.skip = ac._count.type;
          if (ac.type === "READ") stats.read = ac._count.type;
        }

        // BigIntをnumberに変換
        const convertCategoryStat = (row: CategoryStatRow): CategoryStat => ({
          categoryId: row.categoryId,
          categoryName: row.categoryName,
          categorySlug: row.categorySlug,
          count: Number(row.count),
        });

        return {
          actionStats: {
            ...stats,
            total: stats.like + stats.skip + stats.read,
          },
          topLikedCategories: topLikedCategories.map(convertCategoryStat),
          topSkippedCategories: topSkippedCategories.map(convertCategoryStat),
        };
      })(),
    ),
};

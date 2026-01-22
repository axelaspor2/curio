/**
 * インタラクションサービス
 *
 * インタラクション関連のビジネスロジックを提供します。
 */

import { prisma } from "@curio/database";
import { ResultAsync } from "neverthrow";
import { fromPrisma } from "../lib/from-promise.js";
import { NotFoundError, type PrismaError } from "../lib/errors.js";
import type { InteractionType } from "../schemas/interactions.js";

// Prisma 7 driver adapter使用時の型問題を回避
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;

type InteractionResult = {
  id: string;
  articleId: string;
  type: string;
  createdAt: Date;
};

export const interactionService = {
  /**
   * インタラクションを記録
   */
  create: (
    userId: string,
    articleId: string,
    type: InteractionType,
    readingTimeSec?: number,
  ): ResultAsync<InteractionResult, PrismaError | NotFoundError> =>
    // まず記事の存在確認
    fromPrisma<{ id: string } | null>(
      db.article.findUnique({
        where: { id: articleId },
        select: { id: true },
      }),
    ).andThen((article) => {
      if (!article) {
        return ResultAsync.fromSafePromise<InteractionResult, NotFoundError>(
          Promise.resolve({} as InteractionResult),
        ).map(() => {
          throw new NotFoundError("記事が見つかりません");
        });
      }

      // インタラクションを作成
      return fromPrisma<InteractionResult>(
        db.interaction.create({
          data: {
            userId,
            articleId,
            type,
            readingTimeSec: type === "READ" ? readingTimeSec : null,
          },
          select: {
            id: true,
            articleId: true,
            type: true,
            createdAt: true,
          },
        }),
      );
    }),
};

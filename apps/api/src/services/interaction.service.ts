/**
 * インタラクションサービス
 *
 * インタラクション関連のビジネスロジックを提供します。
 */

import { prisma } from "@curio/database";
import { ResultAsync, errAsync } from "neverthrow";
import { fromPrisma } from "../lib/from-promise.js";
import { NotFoundError, type PrismaError } from "../lib/errors.js";
import type { InteractionType } from "../schemas/interactions.js";

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
      prisma.article.findUnique({
        where: { id: articleId },
        select: { id: true },
      }),
    ).andThen((article) => {
      if (!article) {
        return errAsync(new NotFoundError("記事が見つかりません"));
      }

      // インタラクションを作成
      return fromPrisma<InteractionResult>(
        prisma.interaction.create({
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

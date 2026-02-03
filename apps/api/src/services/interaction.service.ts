import { prisma } from "@curio/database";
import { errAsync, type ResultAsync } from "neverthrow";
import { NotFoundError, type PrismaError } from "../lib/errors.js";
import { fromPrisma } from "../lib/from-promise.js";
import type { InteractionType } from "../schemas/interactions.js";
import { preferenceService } from "./preference.service.js";

type InteractionResult = {
  id: string;
  articleId: string;
  type: string;
  createdAt: Date;
};

export const interactionService = {
  /**
   * ユーザーの記事に対するインタラクション(SKIP/LIKE/OPEN/READ)を記録
   * 存在しない記事へのインタラクションを防ぐため、事前に記事の存在を検証
   */
  create: (
    userId: string,
    articleId: string,
    type: InteractionType,
    readingTimeSec?: number,
  ): ResultAsync<InteractionResult, PrismaError | NotFoundError> =>
    fromPrisma<{ id: string } | null>(
      prisma.article.findUnique({
        where: { id: articleId },
        select: { id: true },
      }),
    ).andThen((article) => {
      if (!article) {
        return errAsync(new NotFoundError("記事が見つかりません"));
      }

      return fromPrisma<InteractionResult>(
        prisma.interaction.create({
          data: {
            userId,
            articleId,
            type,
            // READタイプのみ読了時間を記録（将来の分析用）
            readingTimeSec: type === "READ" ? readingTimeSec : null,
          },
          select: {
            id: true,
            articleId: true,
            type: true,
            createdAt: true,
          },
        }),
      ).andTee(async () => {
        // カテゴリ嗜好スコアを非同期で更新（エラーは無視）
        try {
          await preferenceService.updateFromInteraction(userId, articleId, type, readingTimeSec);
        } catch (e) {
          console.error("Failed to update preference score:", e);
        }
      });
    }),
};

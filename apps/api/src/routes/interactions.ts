/**
 * インタラクションAPIルート
 */

import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { NotFoundError } from "../lib/errors.js";
import { ErrorResponseSchema } from "../schemas/common.js";
import {
  CreateInteractionRequestSchema,
  InteractionResponseSchema,
} from "../schemas/interactions.js";
import { interactionService } from "../services/interaction.service.js";
import type { AppEnv } from "../types/hono.js";

const createInteractionRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["Interactions"],
  summary: "インタラクション記録",
  description: "記事に対するインタラクション（SKIP/LIKE/OPEN/READ）を記録します",
  request: {
    body: {
      content: { "application/json": { schema: CreateInteractionRequestSchema } },
      required: true,
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: InteractionResponseSchema } },
      description: "インタラクション記録完了",
    },
    400: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "バリデーションエラー",
    },
    401: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "認証エラー",
    },
    404: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "記事が見つからない",
    },
    500: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "サーバーエラー",
    },
  },
});

export const interactionsRouter = new OpenAPIHono<AppEnv>().openapi(
  createInteractionRoute,
  async (c) => {
    const user = c.get("user");
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const body = c.req.valid("json");
    const result = await interactionService.create(
      user.id,
      body.articleId,
      body.type,
      body.readingTimeSec,
    );

    return result.match(
      (interaction) =>
        c.json(
          {
            interaction: {
              id: interaction.id,
              articleId: interaction.articleId,
              type: interaction.type,
              createdAt: interaction.createdAt.toISOString(),
            },
          },
          200,
        ),
      (error) => {
        if (error instanceof NotFoundError) {
          return c.json({ error: error.message }, 404);
        }
        throw error;
      },
    );
  },
);

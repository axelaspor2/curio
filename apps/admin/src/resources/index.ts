import { prisma } from "@curio/database";
// Prisma module for getModelByName - generated client module
import * as PrismaModule from "@curio/database/generated/client";
import type { ResourceWithOptions } from "adminjs";
import { getPatchedModelByName } from "../lib/prisma-dmmf-patch.js";

const client = prisma;
const clientModule = PrismaModule;

// パッチ済みモデルを取得するヘルパー
const getModel = (name: string) => getPatchedModelByName(name, PrismaModule);

/**
 * AdminJS Resources Configuration
 *
 * 全 Prisma モデルを AdminJS リソースとして登録。
 * - embedding / interestEmbedding フィールドは表示のみ（編集不可）
 * - Interaction, Session は読み取り専用
 */
export const resources: ResourceWithOptions[] = [
  // ============================================================================
  // ユーザー管理
  // ============================================================================
  {
    resource: { model: getModel("User"), client, clientModule },
    options: {
      navigation: { name: "ユーザー管理", icon: "User" },
      listProperties: ["id", "email", "name", "emailVerified", "createdAt"],
      editProperties: ["email", "name", "avatarUrl", "emailVerified"],
      showProperties: [
        "id",
        "email",
        "name",
        "avatarUrl",
        "emailVerified",
        "createdAt",
        "updatedAt",
      ],
    },
  },
  {
    resource: { model: getModel("Interaction"), client, clientModule },
    options: {
      navigation: { name: "ユーザー管理", icon: "Activity" },
      listProperties: ["id", "userId", "articleId", "type", "readingTimeSec", "createdAt"],
      showProperties: ["id", "userId", "articleId", "type", "readingTimeSec", "createdAt"],
      actions: {
        edit: { isAccessible: false },
        delete: { isAccessible: false },
        new: { isAccessible: false },
      },
    },
  },
  {
    resource: { model: getModel("UserCategoryPreference"), client, clientModule },
    options: {
      navigation: { name: "ユーザー管理", icon: "Settings" },
      listProperties: [
        "userId",
        "categoryId",
        "preferenceScore",
        "isInitialSelection",
        "updatedAt",
      ],
      editProperties: ["preferenceScore", "isInitialSelection"],
      showProperties: [
        "userId",
        "categoryId",
        "preferenceScore",
        "isInitialSelection",
        "createdAt",
        "updatedAt",
      ],
    },
  },
  {
    resource: { model: getModel("UserInterestVector"), client, clientModule },
    options: {
      navigation: { name: "ユーザー管理", icon: "Target" },
      listProperties: ["id", "userId", "lastCalculatedAt", "updatedAt"],
      // interestEmbedding は表示のみ（編集不可）
      showProperties: [
        "id",
        "userId",
        "interestEmbedding",
        "lastCalculatedAt",
        "createdAt",
        "updatedAt",
      ],
      editProperties: ["lastCalculatedAt"],
      properties: {
        interestEmbedding: {
          isVisible: { list: false, filter: false, show: true, edit: false },
        },
      },
    },
  },

  // ============================================================================
  // コンテンツ管理
  // ============================================================================
  {
    resource: { model: getModel("Source"), client, clientModule },
    options: {
      navigation: { name: "コンテンツ管理", icon: "Database" },
      listProperties: ["id", "name", "type", "url", "createdAt"],
      editProperties: ["name", "type", "url"],
      showProperties: ["id", "name", "type", "url", "createdAt"],
    },
  },
  {
    resource: { model: getModel("Category"), client, clientModule },
    options: {
      navigation: { name: "コンテンツ管理", icon: "Tag" },
      listProperties: ["id", "slug", "name", "displayOrder", "createdAt"],
      editProperties: ["slug", "name", "description", "displayOrder"],
      showProperties: ["id", "slug", "name", "description", "displayOrder", "createdAt"],
    },
  },
  {
    resource: { model: getModel("Article"), client, clientModule },
    options: {
      navigation: { name: "コンテンツ管理", icon: "FileText" },
      listProperties: ["id", "title", "sourceId", "publishedAt", "fetchedAt"],
      editProperties: ["title", "content", "summary", "url", "imageUrl", "publishedAt"],
      // embedding は表示のみ（編集不可）
      showProperties: [
        "id",
        "sourceId",
        "externalId",
        "title",
        "content",
        "summary",
        "url",
        "imageUrl",
        "embedding",
        "publishedAt",
        "fetchedAt",
        "createdAt",
      ],
      properties: {
        embedding: {
          isVisible: { list: false, filter: false, show: true, edit: false },
        },
        content: {
          type: "textarea",
        },
        summary: {
          type: "textarea",
        },
      },
    },
  },
  {
    resource: { model: getModel("ArticleCategory"), client, clientModule },
    options: {
      navigation: { name: "コンテンツ管理", icon: "Link" },
      listProperties: ["articleId", "categoryId", "confidence", "createdAt"],
      editProperties: ["confidence"],
      showProperties: ["articleId", "categoryId", "confidence", "createdAt"],
    },
  },

  // ============================================================================
  // 認証
  // ============================================================================
  {
    resource: { model: getModel("Session"), client, clientModule },
    options: {
      navigation: { name: "認証", icon: "Key" },
      listProperties: ["id", "userId", "expiresAt", "ipAddress", "createdAt"],
      showProperties: [
        "id",
        "userId",
        "token",
        "expiresAt",
        "ipAddress",
        "userAgent",
        "createdAt",
        "updatedAt",
      ],
      actions: {
        edit: { isAccessible: false },
        new: { isAccessible: false },
      },
    },
  },
  {
    resource: { model: getModel("Account"), client, clientModule },
    options: {
      navigation: { name: "認証", icon: "Shield" },
      listProperties: ["id", "userId", "providerId", "accountId", "createdAt"],
      showProperties: [
        "id",
        "userId",
        "providerId",
        "accountId",
        "accessTokenExpiresAt",
        "refreshTokenExpiresAt",
        "scope",
        "createdAt",
        "updatedAt",
      ],
      // トークン系は表示しない（セキュリティ上）
      actions: {
        edit: { isAccessible: false },
        new: { isAccessible: false },
      },
    },
  },
  {
    resource: { model: getModel("Verification"), client, clientModule },
    options: {
      navigation: { name: "認証", icon: "CheckCircle" },
      listProperties: ["id", "identifier", "expiresAt", "createdAt"],
      showProperties: ["id", "identifier", "value", "expiresAt", "createdAt", "updatedAt"],
      actions: {
        edit: { isAccessible: false },
        new: { isAccessible: false },
      },
    },
  },
];

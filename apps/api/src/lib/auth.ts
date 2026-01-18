import { prisma } from "@curio/database";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

/**
 * Better Auth の設定
 */
export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  /**
   * Better AuthはデフォルトでcamelCaseフィールド名を使用するが、
   * 当プロジェクトのPostgreSQLデータベースはsnake_caseカラム名を使用している
   * fields設定がないと、Better Authは'image'フィールドにデータを保存しようとするが、
   * 実際のデータベースカラムは'avatar_url'のためデータ不整合が発生する
   * このマッピングにより、TypeScript側の自然な命名を維持しつつ、
   * データベース側の規約に合わせて正しくデータが保存・取得される
   */
  user: {
    modelName: "users",
    fields: {
      image: "avatar_url",
      emailVerified: "email_verified",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
  session: {
    modelName: "sessions",
    fields: {
      userId: "user_id",
      expiresAt: "expires_at",
      ipAddress: "ip_address",
      userAgent: "user_agent",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
  account: {
    modelName: "accounts",
    fields: {
      userId: "user_id",
      accountId: "account_id",
      providerId: "provider_id",
      accessToken: "access_token",
      refreshToken: "refresh_token",
      idToken: "id_token",
      accessTokenExpiresAt: "access_token_expires_at",
      refreshTokenExpiresAt: "refresh_token_expires_at",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
  verification: {
    modelName: "verifications",
    fields: {
      expiresAt: "expires_at",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
});

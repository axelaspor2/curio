import { prisma } from "@curio/database";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { corsOrigins } from "./config.js";

/**
 * Better Auth の設定
 *
 * モデル名はPrismaスキーマの命名規則（小文字）に合わせている
 * Better Authのデフォルト（User, Session等）とは異なるため明示的に指定
 */
export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  // CSRFとリダイレクト攻撃を防ぐため、許可するオリジンを明示
  trustedOrigins: corsOrigins,
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    },
  },
  user: {
    modelName: "user",
    fields: {
      // Prismaスキーマでは "avatarUrl" を使用（Better Authのデフォルトは "image"）
      image: "avatarUrl",
    },
  },
  session: {
    modelName: "session",
  },
  account: {
    modelName: "account",
  },
  verification: {
    modelName: "verification",
  },
  advanced: {
    database: {
      // PostgreSQLのUUID型と一致させるため、UUIDを使用
      generateId: "uuid",
    },
    // 本番環境: サブドメイン間（app.curio.axelaspor2.dev ↔ api.curio.axelaspor2.dev）でCookieを共有
    // 開発環境: デフォルト設定（localhost）
    ...(process.env.NODE_ENV === "production" && {
      crossSubDomainCookies: {
        enabled: true,
        domain: ".curio.axelaspor2.dev",
      },
      defaultCookieAttributes: {
        sameSite: "lax",
        secure: true,
      },
    }),
  },
});

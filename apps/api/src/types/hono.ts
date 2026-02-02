import type { auth } from "../lib/auth.js";

/**
 * auth.api.getSession() の戻り値型を推論
 */
type InferSession = Awaited<ReturnType<typeof auth.api.getSession>>;

/**
 * Hono Context Variables
 * authMiddleware で設定される変数の型定義
 */
type AppVariables = {
  user: NonNullable<InferSession>["user"];
  session: NonNullable<InferSession>;
};

/**
 * Hono App Environment
 */
export type AppEnv = {
  Variables: AppVariables;
};

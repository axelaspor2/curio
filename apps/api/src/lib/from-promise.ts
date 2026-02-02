/**
 * Promise操作のneverthrowラッパー
 *
 * Prismaや外部APIなどのPromiseを返す操作を
 * ResultAsync型に変換するためのユーティリティ関数を提供します。
 */

import { ResultAsync } from "neverthrow";
import { PrismaError } from "./errors.js";

/**
 * Prisma操作をResultAsyncにラップ
 *
 * @example
 * const result = await fromPrisma(prisma.category.findMany());
 * result.match(
 *   (categories) => c.json({ categories }, 200),
 *   (error) => { throw error; }
 * );
 */
export const fromPrisma = <T>(promise: Promise<T>): ResultAsync<T, PrismaError> =>
  ResultAsync.fromPromise(
    promise,
    (e) => new PrismaError(e instanceof Error ? e.message : "Database error", e),
  );

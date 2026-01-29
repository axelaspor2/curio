/**
 * クラスベースのエラー定義
 *
 * neverthrow と組み合わせて使用し、型安全なエラーハンドリングを実現します。
 */

/**
 * 基底エラークラス
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

/**
 * リソースが見つからない場合のエラー (404)
 */
export class NotFoundError extends AppError {
  constructor(message: string, cause?: unknown) {
    super(message, "NOT_FOUND", 404, cause);
  }
}

/**
 * バリデーションエラー (400)
 */
export class ValidationError extends AppError {
  constructor(message: string, cause?: unknown) {
    super(message, "VALIDATION_ERROR", 400, cause);
  }
}

/**
 * 認証エラー (401)
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized", cause?: unknown) {
    super(message, "UNAUTHORIZED", 401, cause);
  }
}

/**
 * 認可エラー (403)
 */
export class ForbiddenError extends AppError {
  constructor(message: string = "Forbidden", cause?: unknown) {
    super(message, "FORBIDDEN", 403, cause);
  }
}

/**
 * データベースエラー (500)
 */
export class PrismaError extends AppError {
  constructor(message: string, cause?: unknown) {
    super(message, "PRISMA_ERROR", 500, cause);
  }
}

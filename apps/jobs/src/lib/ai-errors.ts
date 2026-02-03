/**
 * AI関連のエラークラス
 */

export class GeminiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "GeminiError";
  }
}

export class EmbeddingError extends GeminiError {
  constructor(message: string, cause?: unknown) {
    super(message, "EMBEDDING_ERROR", cause);
    this.name = "EmbeddingError";
  }
}

export class ClassificationError extends GeminiError {
  constructor(message: string, cause?: unknown) {
    super(message, "CLASSIFICATION_ERROR", cause);
    this.name = "ClassificationError";
  }
}

export class RateLimitError extends GeminiError {
  constructor(message: string, cause?: unknown) {
    super(message, "RATE_LIMIT_ERROR", cause);
    this.name = "RateLimitError";
  }
}

export type AIError = GeminiError | EmbeddingError | ClassificationError | RateLimitError;

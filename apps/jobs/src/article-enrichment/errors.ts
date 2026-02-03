/**
 * 記事エンリッチメントに関するエラークラス
 */

export class EnrichmentError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "EnrichmentError";
  }
}

export class ProcessingError extends EnrichmentError {
  constructor(
    message: string,
    public readonly articleId: string,
    cause?: unknown,
  ) {
    super(message, "PROCESSING_ERROR", cause);
    this.name = "ProcessingError";
  }
}

export class BatchError extends EnrichmentError {
  constructor(message: string, cause?: unknown) {
    super(message, "BATCH_ERROR", cause);
    this.name = "BatchError";
  }
}

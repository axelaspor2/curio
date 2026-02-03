/**
 * 記事本文取得に関するエラークラス
 */

export class ArticleFetchError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "ArticleFetchError";
  }
}

export class NetworkError extends ArticleFetchError {
  constructor(
    message: string,
    public readonly url: string,
    cause?: unknown,
  ) {
    super(message, "NETWORK_ERROR", cause);
    this.name = "NetworkError";
  }
}

export class ExtractionError extends ArticleFetchError {
  constructor(message: string, cause?: unknown) {
    super(message, "EXTRACTION_ERROR", cause);
    this.name = "ExtractionError";
  }
}

export class TimeoutError extends ArticleFetchError {
  constructor(
    message: string,
    public readonly url: string,
    cause?: unknown,
  ) {
    super(message, "TIMEOUT_ERROR", cause);
    this.name = "TimeoutError";
  }
}

export type FetchError = NetworkError | ExtractionError | TimeoutError;

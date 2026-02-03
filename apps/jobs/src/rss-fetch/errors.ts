/**
 * RSS/Atomフィード関連のエラー定義
 */

/**
 * 基底エラークラス
 */
export class JobError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

/**
 * フィード取得エラー（ネットワークエラー、タイムアウト等）
 */
export class FeedFetchError extends JobError {
  constructor(
    message: string,
    public readonly sourceUrl: string,
    cause?: unknown,
  ) {
    super(message, "FEED_FETCH_ERROR", cause);
  }
}

/**
 * フィードパースエラー（不正なXML、未対応フォーマット等）
 */
export class FeedParseError extends JobError {
  constructor(
    message: string,
    public readonly sourceUrl: string,
    cause?: unknown,
  ) {
    super(message, "FEED_PARSE_ERROR", cause);
  }
}

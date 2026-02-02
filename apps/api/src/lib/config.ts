/**
 * アプリケーション設定
 */

// 環境変数からCORS許可オリジンを取得（カンマ区切りで複数指定可能）
// 例: CORS_ORIGINS=http://localhost:5173,https://app.example.com
export const corsOrigins = process.env.CORS_ORIGINS?.split(",") || [];

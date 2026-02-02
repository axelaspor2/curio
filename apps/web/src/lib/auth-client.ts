import { createAuthClient } from "better-auth/react";

/**
 * APIのベースURLを取得する
 */
function getApiBaseUrl(): string {
  // VITE_API_URLが設定されている場合はそれを使う
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // それ以外は現在のホスト名を使う
  const hostname = typeof window !== "undefined" ? window.location.hostname : "localhost";
  return `http://${hostname}:3001`;
}

const API_BASE_URL = getApiBaseUrl();

export const authClient = createAuthClient({
  baseURL: API_BASE_URL,
});

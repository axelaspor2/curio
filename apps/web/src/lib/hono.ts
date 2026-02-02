import type { AppType } from "@curio/api";
import { hc } from "hono/client";

export function getApiBaseUrl(): string {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // Use the same hostname as the current page for LAN access
  const hostname = typeof window !== "undefined" ? window.location.hostname : "localhost";
  return `http://${hostname}:3001`;
}

const API_BASE_URL = getApiBaseUrl();

export const honoClient = hc<AppType>(API_BASE_URL, {
  init: {
    // Better Authのセッション管理にCookieを使用するため、認証情報を含める
    credentials: "include",
  },
});

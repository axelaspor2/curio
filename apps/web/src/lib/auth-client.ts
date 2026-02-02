import { createAuthClient } from "better-auth/react";

function getApiBaseUrl(): string {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // Use the same hostname as the current page for LAN access
  const hostname = typeof window !== "undefined" ? window.location.hostname : "localhost";
  return `http://${hostname}:3001`;
}

const API_BASE_URL = getApiBaseUrl();

export const authClient = createAuthClient({
  baseURL: API_BASE_URL,
});

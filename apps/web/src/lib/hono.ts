import { hc } from "hono/client";
import type { AppType } from "@curio/api";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export const honoClient = hc<AppType>(API_BASE_URL, {
  init: {
    credentials: "include",
  },
});

honoClient.api.auth.
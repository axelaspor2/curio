import { QueryClientProvider } from "@tanstack/react-query";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { Provider } from "jotai";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { queryClient } from "@/lib/query-client";
import { routeTree } from "./routeTree.gen";
import "@/styles/globals.css";

// Handle chunk load errors caused by stale cache after deployment
// This occurs when the browser has cached old HTML that references JS files
// that no longer exist after a new deployment
const handleChunkLoadError = (error: unknown): boolean => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const isChunkLoadError =
    errorMessage.includes("Failed to fetch dynamically imported module") ||
    errorMessage.includes("Importing a module script failed") ||
    errorMessage.includes("Loading chunk") ||
    errorMessage.includes("Loading CSS chunk");

  if (isChunkLoadError) {
    // Prevent infinite reload loops by checking sessionStorage
    const reloadKey = "chunk-error-reload";
    const lastReload = sessionStorage.getItem(reloadKey);
    const now = Date.now();

    if (!lastReload || now - Number.parseInt(lastReload, 10) > 10000) {
      sessionStorage.setItem(reloadKey, String(now));
      window.location.reload();
      return true;
    }
  }
  return false;
};

// Global error handler for uncaught errors
window.addEventListener("error", (event) => {
  handleChunkLoadError(event.error || event.message);
});

// Global handler for unhandled promise rejections (dynamic imports)
window.addEventListener("unhandledrejection", (event) => {
  if (handleChunkLoadError(event.reason)) {
    event.preventDefault();
  }
});

// GitHub Pages SPA routing: handle redirect from 404.html
const spaRedirect = sessionStorage.getItem("spa-redirect");
if (spaRedirect) {
  sessionStorage.removeItem("spa-redirect");
  // Replace current URL with the original path (client-side routing will handle it)
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
  const targetPath = spaRedirect.replace(basePath, "") || "/";
  window.history.replaceState(null, "", basePath + targetPath);
}

const router = createRouter({ routeTree, basepath: import.meta.env.BASE_URL });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

createRoot(rootElement).render(
  <StrictMode>
    <Provider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <RouterProvider router={router} />
        </ThemeProvider>
      </QueryClientProvider>
    </Provider>
  </StrictMode>,
);

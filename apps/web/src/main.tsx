import { QueryClientProvider } from "@tanstack/react-query";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { Provider } from "jotai";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { queryClient } from "@/lib/query-client";
import { routeTree } from "./routeTree.gen";
import "@/styles/globals.css";

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

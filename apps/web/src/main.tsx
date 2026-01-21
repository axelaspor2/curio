import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { Provider } from "jotai"
import { QueryClientProvider } from "@tanstack/react-query"
import { RouterProvider, createRouter } from "@tanstack/react-router"
import { ThemeProvider } from "@/components/providers/ThemeProvider"
import { queryClient } from "@/lib/query-client"
import { routeTree } from "./routeTree.gen"
import "@/styles/globals.css"

const router = createRouter({ routeTree })

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}

const rootElement = document.getElementById("root")
if (!rootElement) throw new Error("Root element not found")

createRoot(rootElement).render(
  <StrictMode>
    <Provider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <RouterProvider router={router} />
        </ThemeProvider>
      </QueryClientProvider>
    </Provider>
  </StrictMode>
)

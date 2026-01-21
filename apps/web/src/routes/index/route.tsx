import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/")({
  component: HomePage,
})

function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between p-4 border-b">
        <h1 className="text-2xl font-bold">Curio</h1>
      </header>
      <main className="container mx-auto p-4">
        <p className="text-muted-foreground">
          パーソナライズ情報キュレーションアプリへようこそ
        </p>
      </main>
    </div>
  )
}

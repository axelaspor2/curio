import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Moon } from "lucide-react";
import { useEffect } from "react";
import { SignUpForm } from "@/components/auth";
import { useAuth } from "@/hooks";

export const Route = createFileRoute("/signup")({
  component: SignUpPage,
});

function SignUpPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate({ to: "/" });
    }
  }, [isLoading, isAuthenticated, navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center space-y-4">
          <div className="flex items-center gap-2">
            <Moon className="h-8 w-8 text-primary" />
            <h1 className="font-display text-3xl font-semibold tracking-tight">Curio</h1>
          </div>
          <p className="text-sm text-muted-foreground">あなたの興味を探求しよう</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-lg shadow-black/5">
          <h2 className="mb-6 text-center text-xl font-semibold">アカウント作成</h2>
          <SignUpForm />
        </div>
      </div>
    </div>
  );
}

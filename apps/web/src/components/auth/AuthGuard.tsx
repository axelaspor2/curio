import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { type ReactNode, useEffect } from "react";
import { useAuth } from "@/hooks";

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate({ to: "/login" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- navigate reference changes on every render, causing infinite loop
  }, [isLoading, isAuthenticated]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">読み込み中...</p>
        </div>
      </div>
    );
  }

  // リダイレクト処理中はnullを返す（childrenのフラッシュを防ぐ）
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

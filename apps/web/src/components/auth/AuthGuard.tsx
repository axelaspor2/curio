import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { type ReactNode, useEffect } from "react";
import { useAuth, useOnboardingStatus } from "@/hooks";

interface AuthGuardProps {
  children: ReactNode;
  /** オンボーディングチェックをスキップするか（オンボーディングページ自体で使用） */
  skipOnboardingCheck?: boolean;
}

export function AuthGuard({ children, skipOnboardingCheck = false }: AuthGuardProps) {
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const { data: onboardingStatus, isLoading: onboardingLoading } = useOnboardingStatus();
  const navigate = useNavigate();

  const isLoading = authLoading || (!skipOnboardingCheck && onboardingLoading);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate({ to: "/login" });
    }
  }, [authLoading, isAuthenticated, navigate]);

  // オンボーディング未完了の場合はオンボーディングページへリダイレクト
  useEffect(() => {
    if (
      !skipOnboardingCheck &&
      !authLoading &&
      !onboardingLoading &&
      isAuthenticated &&
      onboardingStatus &&
      !onboardingStatus.isOnboardingComplete
    ) {
      navigate({ to: "/onboarding/categories" });
    }
  }, [
    skipOnboardingCheck,
    authLoading,
    onboardingLoading,
    isAuthenticated,
    onboardingStatus,
    navigate,
  ]);

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

  // オンボーディング未完了の場合もnullを返す
  if (!skipOnboardingCheck && onboardingStatus && !onboardingStatus.isOnboardingComplete) {
    return null;
  }

  return <>{children}</>;
}

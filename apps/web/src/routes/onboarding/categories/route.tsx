import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Moon } from "lucide-react";
import { useEffect } from "react";
import { CategorySelector } from "@/components/onboarding";
import { useAuth, useCategories, useOnboardingStatus, useSetCategories } from "@/hooks";

export const Route = createFileRoute("/onboarding/categories")({
  component: OnboardingCategoriesPage,
});

function OnboardingCategoriesPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const { data: categoriesData, isLoading: categoriesLoading } = useCategories();
  const { data: onboardingStatus, isLoading: statusLoading } = useOnboardingStatus();
  const setCategories = useSetCategories();

  // 未認証ならログインページへ
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate({ to: "/login" });
    }
  }, [authLoading, isAuthenticated, navigate]);

  // 既にオンボーディング完了済みならホームへ
  useEffect(() => {
    if (!statusLoading && onboardingStatus?.isOnboardingComplete) {
      navigate({ to: "/" });
    }
  }, [statusLoading, onboardingStatus, navigate]);

  const handleSelect = async (categoryIds: string[]) => {
    try {
      await setCategories.mutateAsync({ categoryIds, skipped: false });
      navigate({ to: "/" });
    } catch (error) {
      console.error("Failed to set categories:", error);
    }
  };

  const handleSkip = async () => {
    try {
      await setCategories.mutateAsync({ categoryIds: [], skipped: true });
      navigate({ to: "/" });
    } catch (error) {
      console.error("Failed to skip onboarding:", error);
    }
  };

  const isLoading = authLoading || categoriesLoading || statusLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Moon className="h-8 w-8 text-primary animate-pulse" />
          <p className="text-sm text-muted-foreground">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Logo Header */}
      <div className="flex items-center justify-center gap-2 py-4 border-b border-border">
        <Moon className="h-6 w-6 text-primary" />
        <span className="font-display text-xl font-semibold tracking-tight">Curio</span>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col max-w-md mx-auto w-full">
        <CategorySelector
          categories={categoriesData?.categories ?? []}
          onSelect={handleSelect}
          onSkip={handleSkip}
          isLoading={setCategories.isPending}
        />
      </div>
    </div>
  );
}

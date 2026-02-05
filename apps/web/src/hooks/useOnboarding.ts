import { useQuery } from "@tanstack/react-query";
import { honoClient } from "@/lib/hono";

interface OnboardingStatus {
  isOnboardingComplete: boolean;
  selectedCategoryCount: number;
}

async function fetchOnboardingStatus(): Promise<OnboardingStatus> {
  const response = await honoClient.api.users.me["onboarding-status"].$get();

  if (!response.ok) {
    throw new Error("Failed to fetch onboarding status");
  }

  return response.json();
}

export function useOnboardingStatus() {
  return useQuery({
    queryKey: ["onboarding-status"],
    queryFn: fetchOnboardingStatus,
    staleTime: 1000 * 60 * 5, // 5分キャッシュ
  });
}

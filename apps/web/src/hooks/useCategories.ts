import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { honoClient } from "@/lib/hono";

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  displayOrder: number;
}

interface CategoriesResponse {
  categories: Category[];
}

interface SetCategoriesParams {
  categoryIds: string[];
  skipped?: boolean;
}

interface SetCategoriesResponse {
  preferences: {
    categoryId: string;
    preferenceScore: number;
    isInitialSelection: boolean;
  }[];
  interestVectorGenerated: boolean;
}

async function fetchCategories(): Promise<CategoriesResponse> {
  const response = await honoClient.api.categories.$get();

  if (!response.ok) {
    throw new Error("Failed to fetch categories");
  }

  return response.json();
}

async function setCategories(params: SetCategoriesParams): Promise<SetCategoriesResponse> {
  const response = await honoClient.api.users.me.categories.$post({
    json: params,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error((error as { error?: string }).error || "Failed to set categories");
  }

  return response.json();
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    staleTime: 1000 * 60 * 60, // 1時間キャッシュ
  });
}

export function useSetCategories() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: setCategories,
    onSuccess: () => {
      // オンボーディング状態を更新
      queryClient.invalidateQueries({ queryKey: ["onboarding-status"] });
    },
  });
}

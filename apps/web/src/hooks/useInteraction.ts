import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { InteractionType } from "@/types/feed";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

interface CreateInteractionParams {
  articleId: string;
  type: InteractionType;
  readingTimeSec?: number;
}

async function createInteraction(params: CreateInteractionParams): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/interactions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Unknown error" }));
    throw new Error((error as { message?: string }).message ?? "Failed to create interaction");
  }
}

export function useInteraction() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createInteraction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  const recordInteraction = (articleId: string, type: InteractionType, readingTimeSec?: number) => {
    mutation.mutate({ articleId, type, readingTimeSec });
  };

  return {
    recordInteraction,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}

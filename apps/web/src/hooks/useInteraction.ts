import { useMutation } from "@tanstack/react-query";
import { honoClient } from "@/lib/hono";
import type { InteractionType } from "@/types/feed";

interface CreateInteractionParams {
  articleId: string;
  type: InteractionType;
  readingTimeSec?: number;
}

async function createInteraction(params: CreateInteractionParams): Promise<void> {
  const response = await honoClient.api.interactions.$post({
    json: params,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Unknown error" }));
    throw new Error((error as { message?: string }).message ?? "Failed to create interaction");
  }
}

export function useInteraction() {
  const mutation = useMutation({
    mutationFn: createInteraction,
    // Note: フィードの再取得はスワイプ中には行わない
    // 全記事を見終わった後やページ遷移時に自動的に再取得される
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

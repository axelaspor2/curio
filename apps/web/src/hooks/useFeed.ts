import { useQuery } from "@tanstack/react-query";
import { honoClient } from "@/lib/hono";
import type { Article, FeedResponse } from "@/types/feed";

interface UseFeedOptions {
  limit?: number;
  categoryId?: string;
}

async function fetchFeed(options: UseFeedOptions = {}): Promise<FeedResponse> {
  const { limit = 20, categoryId } = options;

  const response = await honoClient.api.feed.$get({
    query: {
      limit: limit.toString(),
      categoryId,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch feed");
  }

  const data = await response.json();
  return data as FeedResponse;
}

export function useFeed(options: UseFeedOptions = {}) {
  return useQuery({
    queryKey: ["feed", options],
    queryFn: () => fetchFeed(options),
  });
}

export function useFeedArticles(options: UseFeedOptions = {}): {
  articles: Article[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
} {
  const query = useFeed(options);

  return {
    articles: query.data?.articles ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

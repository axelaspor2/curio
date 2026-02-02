import { useQuery } from "@tanstack/react-query";
import type { Article, FeedResponse } from "@/types/feed";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

interface UseFeedOptions {
  limit?: number;
  categoryId?: string;
}

async function fetchFeed(options: UseFeedOptions = {}): Promise<FeedResponse> {
  const { limit = 20, categoryId } = options;

  const params = new URLSearchParams();
  params.set("limit", limit.toString());
  if (categoryId) params.set("categoryId", categoryId);

  const response = await fetch(`${API_BASE_URL}/api/feed?${params.toString()}`, {
    credentials: "include",
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

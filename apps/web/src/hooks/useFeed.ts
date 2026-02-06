import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { honoClient } from "@/lib/hono";
import type { Article, FeedResponse } from "@/types/feed";

interface UseFeedOptions {
  limit?: number;
  categoryId?: string;
}

interface FetchFeedParams extends UseFeedOptions {
  cursor?: string;
}

async function fetchFeed(params: FetchFeedParams = {}): Promise<FeedResponse> {
  const { limit = 20, categoryId, cursor } = params;

  const response = await honoClient.api.feed.$get({
    query: {
      limit: limit.toString(),
      categoryId,
      cursor,
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

export function useInfiniteFeed(options: UseFeedOptions = {}) {
  return useInfiniteQuery({
    queryKey: ["feed", "infinite", options],
    queryFn: ({ pageParam }) => fetchFeed({ ...options, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

export function useInfiniteFeedArticles(options: UseFeedOptions = {}): {
  articles: Article[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  exhaustedByThreshold: boolean;
} {
  const query = useInfiniteFeed(options);

  // 全ページの記事をフラット化し、ページ間の重複を排除
  const articles = (query.data?.pages.flatMap((page) => page.articles) ?? []).filter(
    (article, index, self) => self.findIndex((a) => a.id === article.id) === index,
  );

  // 最後のページの exhaustedByThreshold を取得
  const lastPage = query.data?.pages.at(-1);
  const exhaustedByThreshold = lastPage?.exhaustedByThreshold ?? false;

  return {
    articles,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    exhaustedByThreshold,
  };
}

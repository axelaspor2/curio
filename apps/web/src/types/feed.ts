export type CategorySlug = "technology" | "business" | "science" | "health";

export interface ArticleCategory {
  id: string;
  slug: string;
  name: string;
}

export interface ArticleSource {
  id: string;
  name: string;
}

export interface Article {
  id: string;
  title: string;
  summary: string | null;
  url: string;
  imageUrl: string | null;
  publishedAt: string | null;
  source: ArticleSource;
  categories: ArticleCategory[];
}

export interface FeedResponse {
  articles: Article[];
  nextCursor: string | null;
  hasMore: boolean;
  exhaustedByThreshold?: boolean;
}

export type InteractionType = "SKIP" | "LIKE" | "OPEN" | "READ";

export interface CreateInteractionRequest {
  articleId: string;
  type: InteractionType;
  readingTimeSec?: number;
}

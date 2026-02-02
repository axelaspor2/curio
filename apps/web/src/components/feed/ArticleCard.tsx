import { forwardRef, type HTMLAttributes } from "react";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import type { Article, CategorySlug } from "@/types/feed";

export interface ArticleCardProps extends HTMLAttributes<HTMLDivElement> {
  article: Article;
}

function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return "";

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return "たった今";
  if (diffHours < 24) return `${diffHours}時間前`;
  if (diffDays < 7) return `${diffDays}日前`;
  return date.toLocaleDateString("ja-JP", { month: "short", day: "numeric" });
}

export const ArticleCard = forwardRef<HTMLDivElement, ArticleCardProps>(
  ({ article, className, ...props }, ref) => {
    const primaryCategory = article.categories[0];
    const categorySlug = primaryCategory?.slug as CategorySlug | undefined;

    return (
      <div
        ref={ref}
        className={cn(
          "relative w-full h-full rounded-2xl bg-card border border-border/50 overflow-hidden",
          "shadow-xl shadow-black/30",
          "flex flex-col",
          className,
        )}
        {...props}
      >
        <div className="relative h-48 sm:h-56 bg-secondary overflow-hidden">
          {article.imageUrl ? (
            <img
              src={article.imageUrl}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-secondary to-muted">
              <span className="text-6xl opacity-30">📰</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
        </div>

        <div className="flex-1 p-5 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            {categorySlug && (
              <Badge variant="category" category={categorySlug}>
                {primaryCategory.name}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {formatRelativeTime(article.publishedAt)}
            </span>
          </div>

          <h2 className="text-lg sm:text-xl font-semibold leading-snug mb-3 line-clamp-3">
            {article.title}
          </h2>

          {article.summary && (
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 flex-1">
              {article.summary}
            </p>
          )}

          <div className="mt-4 pt-3 border-t border-border/30">
            <span className="text-xs text-muted-foreground font-medium">{article.source.name}</span>
          </div>
        </div>
      </div>
    );
  },
);

ArticleCard.displayName = "ArticleCard";

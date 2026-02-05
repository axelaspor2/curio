import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useCallback } from "react";
import { AuthGuard } from "@/components/auth";
import { SwipeableCardStack } from "@/components/feed";
import { Header, MobileContainer } from "@/components/layout";
import { FluentEmoji } from "@/components/ui";
import { useInfiniteFeedArticles, useInteraction } from "@/hooks";
import type { Article, InteractionType } from "@/types/feed";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const {
    articles,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    exhaustedByThreshold,
  } = useInfiniteFeedArticles({ limit: 20 });
  const { recordInteraction } = useInteraction();

  const handleSwipe = (articleId: string, type: InteractionType) => {
    recordInteraction(articleId, type);
  };

  const handleCardTap = (article: Article) => {
    recordInteraction(article.id, "OPEN");
    window.open(article.url, "_blank");
  };

  const handleNeedMoreArticles = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <AuthGuard>
      <MobileContainer>
        <Header />
        <main className="flex-1 flex flex-col">
          {isLoading && (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {isError && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="mb-4 animate-emoji-wiggle">
                <FluentEmoji name="dizzy-face" size={64} />
              </div>
              <h2 className="text-lg font-semibold mb-2">読み込みエラー</h2>
              <p className="text-sm text-muted-foreground mb-4">
                {error?.message ?? "記事の取得に失敗しました"}
              </p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
              >
                再読み込み
              </button>
            </div>
          )}

          {!isLoading && !isError && articles.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="mb-4 animate-emoji-pop">
                <FluentEmoji name="open-mailbox" size={80} />
              </div>
              <h2 className="text-lg font-semibold mb-2">記事がありません</h2>
              <p className="text-sm text-muted-foreground">
                新しい記事が追加されるまでお待ちください
              </p>
            </div>
          )}

          {!isLoading && !isError && articles.length > 0 && (
            <SwipeableCardStack
              articles={articles}
              onSwipe={handleSwipe}
              onCardTap={handleCardTap}
              onNeedMoreArticles={handleNeedMoreArticles}
              hasMoreArticles={hasNextPage}
              isFetchingMore={isFetchingNextPage}
              exhaustedByThreshold={exhaustedByThreshold}
            />
          )}
        </main>
      </MobileContainer>
    </AuthGuard>
  );
}

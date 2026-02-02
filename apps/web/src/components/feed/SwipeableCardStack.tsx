import { motion, type PanInfo, useAnimation, useMotionValue, useTransform } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { FluentEmoji } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { Article, InteractionType } from "@/types/feed";
import { ActionButtons } from "./ActionButtons";
import { ArticleCard } from "./ArticleCard";
import { SwipeIndicator } from "./SwipeIndicator";

// スワイプ判定の閾値（px）- モバイルでの誤操作を防ぎつつ、意図的なスワイプを検出
const SWIPE_THRESHOLD = 100;
// カードの最大回転角度（deg）- Tinderライクな自然な傾きを表現
const ROTATION_FACTOR = 12;
// スワイプ完了時のカード移動距離（px）- 画面外に確実に移動させる
const EXIT_DISTANCE = 500;

export interface SwipeableCardStackProps {
  articles: Article[];
  onSwipe: (articleId: string, type: InteractionType) => void;
  onCardTap?: (article: Article) => void;
}

export function SwipeableCardStack({ articles, onSwipe, onCardTap }: SwipeableCardStackProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  // Undo機能のためにスワイプ履歴を保持
  const [history, setHistory] = useState<{ article: Article; type: InteractionType }[]>([]);
  // ドラッグ終了時刻を記録（タップとドラッグを区別するため）
  const dragEndTimeRef = useRef(0);

  const x = useMotionValue(0);
  const controls = useAnimation();

  const rotate = useTransform(x, [-200, 200], [-ROTATION_FACTOR, ROTATION_FACTOR]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);

  const currentArticle = articles[currentIndex];
  const nextArticle = articles[currentIndex + 1];
  const hasMore = currentIndex < articles.length;

  const handleSwipeComplete = useCallback(
    (direction: "left" | "right") => {
      if (!currentArticle) return;

      const type: InteractionType = direction === "right" ? "LIKE" : "SKIP";
      setHistory((prev) => [...prev, { article: currentArticle, type }]);
      onSwipe(currentArticle.id, type);
      setCurrentIndex((prev) => prev + 1);
      x.set(0);
    },
    [currentArticle, onSwipe, x],
  );

  const animateSwipe = useCallback(
    async (direction: "left" | "right") => {
      const exitX = direction === "right" ? EXIT_DISTANCE : -EXIT_DISTANCE;
      const exitRotate = direction === "right" ? ROTATION_FACTOR * 2 : -ROTATION_FACTOR * 2;

      await controls.start({
        x: exitX,
        rotate: exitRotate,
        opacity: 0,
        transition: { duration: 0.3, ease: "easeOut" },
      });
      handleSwipeComplete(direction);
      controls.set({ x: 0, rotate: 0, opacity: 1 });
    },
    [controls, handleSwipeComplete],
  );

  const handleDragEnd = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      dragEndTimeRef.current = Date.now();
      const swipeThreshold = SWIPE_THRESHOLD;
      const velocity = info.velocity.x;

      if (info.offset.x > swipeThreshold || velocity > 500) {
        animateSwipe("right");
      } else if (info.offset.x < -swipeThreshold || velocity < -500) {
        animateSwipe("left");
      } else {
        controls.start({
          x: 0,
          rotate: 0,
          transition: { type: "spring", stiffness: 300, damping: 25 },
        });
      }
    },
    [animateSwipe, controls],
  );

  const handleTap = useCallback(() => {
    // ドラッグ操作直後の誤タップを防ぐため、100ms以内のタップは無視
    // framer-motionのonTapはドラッグ終了直後にも発火するため必要
    const timeSinceDragEnd = Date.now() - dragEndTimeRef.current;
    if (timeSinceDragEnd > 100 && currentArticle) {
      onCardTap?.(currentArticle);
    }
  }, [currentArticle, onCardTap]);

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;

    setHistory((prev) => prev.slice(0, -1));
    setCurrentIndex((prev) => prev - 1);
  }, [history]);

  const handleSkip = useCallback(() => {
    animateSwipe("left");
  }, [animateSwipe]);

  const handleLike = useCallback(() => {
    animateSwipe("right");
  }, [animateSwipe]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        handleSkip();
      } else if (e.key === "ArrowRight") {
        handleLike();
      } else if (e.key === "z" && (e.metaKey || e.ctrlKey)) {
        handleUndo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSkip, handleLike, handleUndo]);

  if (!hasMore) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="mb-4 animate-emoji-bounce">
          <FluentEmoji name="party-popper" size={80} />
        </div>
        <h2 className="text-xl font-semibold mb-2">すべての記事を確認しました！</h2>
        <p className="text-muted-foreground">また後で新しい記事をチェックしてください</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Card stack area */}
      <div className="flex-1 relative flex items-center justify-center p-4 overflow-hidden">
        {/* Next card (background) */}
        {nextArticle && (
          <div
            className={cn(
              "absolute inset-4",
              "flex items-center justify-center",
              "pointer-events-none",
            )}
          >
            <div className={cn("w-full max-w-sm h-[480px] sm:h-[520px]", "scale-95 opacity-50")}>
              <ArticleCard article={nextArticle} />
            </div>
          </div>
        )}

        {/* Current card (draggable) */}
        {/* dragElastic: 0.7でゴムのような抵抗感を表現し、スワイプの意図を明確にする */}
        {currentArticle && (
          <motion.div
            className={cn(
              "relative w-full max-w-sm h-[480px] sm:h-[520px]",
              "cursor-grab active:cursor-grabbing",
              "touch-manipulation",
            )}
            style={{ x, rotate, opacity }}
            animate={controls}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.7}
            onDragEnd={handleDragEnd}
            onTap={handleTap}
            whileTap={{ scale: 0.98 }}
          >
            <SwipeIndicator x={x} threshold={SWIPE_THRESHOLD} />
            <ArticleCard article={currentArticle} className="h-full" />
          </motion.div>
        )}
      </div>

      {/* Swipe hints */}
      <div className="flex items-center justify-between px-8 py-2 text-xs text-muted-foreground">
        <span>← スキップ</span>
        <span className="text-muted-foreground/50">
          {currentIndex + 1} / {articles.length}
        </span>
        <span>興味あり →</span>
      </div>

      {/* Action buttons */}
      <div className="pb-safe">
        <ActionButtons
          onSkip={handleSkip}
          onLike={handleLike}
          onUndo={handleUndo}
          canUndo={history.length > 0}
          disabled={!hasMore}
        />
      </div>
    </div>
  );
}

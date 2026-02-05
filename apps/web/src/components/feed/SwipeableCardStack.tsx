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
// ドラッグ開始判定の閾値（px）- この距離を超えるまでドラッグと判定しない
const DRAG_START_THRESHOLD = 10;
// 水平/垂直判定の角度閾値（度）- この角度より水平ならスワイプ、垂直ならスクロール
const DIRECTION_LOCK_ANGLE = 30;

export interface SwipeableCardStackProps {
  articles: Article[];
  onSwipe: (articleId: string, type: InteractionType) => void;
  onCardTap?: (article: Article) => void;
  onNeedMoreArticles?: () => void;
  hasMoreArticles?: boolean;
  isFetchingMore?: boolean;
  exhaustedByThreshold?: boolean;
}

const PREFETCH_THRESHOLD = 5;

export function SwipeableCardStack({
  articles,
  onSwipe,
  onCardTap,
  onNeedMoreArticles,
  hasMoreArticles = false,
  isFetchingMore = false,
  exhaustedByThreshold = false,
}: SwipeableCardStackProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [history, setHistory] = useState<{ article: Article; type: InteractionType }[]>([]);
  const [isDraggingHorizontal, setIsDraggingHorizontal] = useState(false);
  const dragEndTimeRef = useRef(0);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

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

  const handleDragStart = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      dragStartRef.current = { x: info.point.x, y: info.point.y };
      setIsDraggingHorizontal(false);
    },
    [],
  );

  const handleDrag = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (!dragStartRef.current) return;

      const deltaX = Math.abs(info.offset.x);
      const deltaY = Math.abs(info.offset.y);
      const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);

      // 一定距離を超えたら方向を判定
      if (distance > DRAG_START_THRESHOLD && !isDraggingHorizontal) {
        const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
        // 水平方向（角度が閾値より小さい）ならスワイプモード
        if (angle < DIRECTION_LOCK_ANGLE) {
          setIsDraggingHorizontal(true);
        }
      }

      // 垂直方向のドラッグは位置をリセット（スクロールに任せる）
      if (!isDraggingHorizontal && distance > DRAG_START_THRESHOLD) {
        x.set(0);
      }
    },
    [isDraggingHorizontal, x],
  );

  const handleDragEnd = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      dragEndTimeRef.current = Date.now();
      dragStartRef.current = null;

      // 水平ドラッグでない場合は何もしない
      if (!isDraggingHorizontal) {
        setIsDraggingHorizontal(false);
        controls.start({
          x: 0,
          rotate: 0,
          transition: { type: "spring", stiffness: 300, damping: 25 },
        });
        return;
      }

      setIsDraggingHorizontal(false);
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
    [animateSwipe, controls, isDraggingHorizontal],
  );

  const handleTap = useCallback(() => {
    // framer-motionのonTapはドラッグ終了直後にも発火するため、100ms以内は無視
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

  // 残り記事数が少なくなったら追加読み込みをトリガー
  useEffect(() => {
    const remainingArticles = articles.length - currentIndex;
    if (
      remainingArticles <= PREFETCH_THRESHOLD &&
      hasMoreArticles &&
      !isFetchingMore &&
      onNeedMoreArticles
    ) {
      onNeedMoreArticles();
    }
  }, [currentIndex, articles.length, hasMoreArticles, isFetchingMore, onNeedMoreArticles]);

  // スコア閾値以上の記事がすべて消費された場合
  if (!hasMore && exhaustedByThreshold) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="mb-4 animate-emoji-bounce">
          <FluentEmoji name="party-popper" size={80} />
        </div>
        <h2 className="text-xl font-semibold mb-2">おすすめの記事を全て確認しました！</h2>
        <p className="text-muted-foreground">新しいおすすめ記事が見つかったらお知らせします</p>
      </div>
    );
  }

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
      <div className="flex-1 relative flex items-center justify-center p-4 overflow-hidden">
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

        {currentArticle && (
          <motion.div
            className={cn(
              "relative w-full max-w-sm h-[480px] sm:h-[520px]",
              "cursor-grab active:cursor-grabbing",
              // 垂直スクロールを優先しつつ、水平スワイプも許可
              "touch-pan-y",
            )}
            style={{ x, rotate, opacity }}
            animate={controls}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.7}
            dragDirectionLock
            onDragStart={handleDragStart}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
            onTap={handleTap}
            whileTap={{ scale: 0.98 }}
          >
            <SwipeIndicator x={x} threshold={SWIPE_THRESHOLD} />
            <ArticleCard article={currentArticle} className="h-full" />
          </motion.div>
        )}
      </div>

      <div className="flex items-center justify-between px-8 py-2 text-xs text-muted-foreground">
        <span>← スキップ</span>
        <span className="text-muted-foreground/50">
          {currentIndex + 1} / {articles.length}
          {isFetchingMore && " (読み込み中...)"}
        </span>
        <span>興味あり →</span>
      </div>

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

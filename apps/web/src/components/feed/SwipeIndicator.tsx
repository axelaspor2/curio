import { type MotionValue, motion, useTransform } from "framer-motion";
import { FluentEmoji } from "@/components/ui";
import { cn } from "@/lib/utils";

export interface SwipeIndicatorProps {
  x: MotionValue<number>;
  threshold?: number;
}

export function SwipeIndicator({ x, threshold = 100 }: SwipeIndicatorProps) {
  // スワイプ量に応じてインジケーターの透明度とスケールを変化させる
  // threshold到達で完全に表示（opacity: 1, scale: 1）
  const likeOpacity = useTransform(x, [0, threshold], [0, 1]);
  const skipOpacity = useTransform(x, [-threshold, 0], [1, 0]);
  const likeScale = useTransform(x, [0, threshold], [0.8, 1]);
  const skipScale = useTransform(x, [-threshold, 0], [1, 0.8]);

  return (
    <>
      {/* Like indicator (right) */}
      <motion.div
        className={cn(
          "absolute top-6 right-6 z-20",
          "flex items-center justify-center",
          "w-16 h-16 rounded-full",
          "bg-swipe-like/20 border-2 border-swipe-like",
          "pointer-events-none",
        )}
        style={{
          opacity: likeOpacity,
          scale: likeScale,
        }}
      >
        <FluentEmoji name="red-heart" size={32} />
      </motion.div>

      {/* Skip indicator (left) */}
      <motion.div
        className={cn(
          "absolute top-6 left-6 z-20",
          "flex items-center justify-center",
          "w-16 h-16 rounded-full",
          "bg-swipe-skip/20 border-2 border-swipe-skip",
          "pointer-events-none",
        )}
        style={{
          opacity: skipOpacity,
          scale: skipScale,
        }}
      >
        <FluentEmoji name="waving-hand" size={32} />
      </motion.div>
    </>
  );
}

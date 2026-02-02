import { type MotionValue, motion, useTransform } from "framer-motion";
import { Heart, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SwipeIndicatorProps {
  x: MotionValue<number>;
  threshold?: number;
}

export function SwipeIndicator({ x, threshold = 100 }: SwipeIndicatorProps) {
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
        <Heart className="w-8 h-8 text-swipe-like fill-swipe-like" />
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
        <X className="w-8 h-8 text-swipe-skip" />
      </motion.div>
    </>
  );
}

import { FluentEmoji } from "@/components/ui";
import { cn } from "@/lib/utils";

export interface ActionButtonsProps {
  onSkip: () => void;
  onLike: () => void;
  onUndo?: () => void;
  canUndo?: boolean;
  disabled?: boolean;
}

export function ActionButtons({
  onSkip,
  onLike,
  onUndo,
  canUndo = false,
  disabled = false,
}: ActionButtonsProps) {
  return (
    <div className="flex items-center justify-center gap-6 py-4">
      {/* Undo button */}
      <button
        type="button"
        onClick={onUndo}
        disabled={!canUndo || disabled}
        className={cn(
          "w-12 h-12 rounded-full",
          "flex items-center justify-center",
          "bg-secondary border border-border",
          "transition-all duration-200",
          "hover:scale-105 hover:bg-secondary/80",
          "active:scale-95",
          "disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100",
        )}
        aria-label="元に戻す"
      >
        <FluentEmoji name="arrow-undo" size={24} />
      </button>

      {/* Skip button */}
      <button
        type="button"
        onClick={onSkip}
        disabled={disabled}
        className={cn(
          "w-16 h-16 rounded-full",
          "flex items-center justify-center",
          "bg-swipe-skip/10 border-2 border-swipe-skip/50",
          "transition-all duration-200",
          "hover:scale-110 hover:bg-swipe-skip/20 hover:border-swipe-skip",
          "active:scale-95",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
        )}
        aria-label="スキップ"
      >
        <FluentEmoji name="waving-hand" size={32} />
      </button>

      {/* Like button */}
      <button
        type="button"
        onClick={onLike}
        disabled={disabled}
        className={cn(
          "w-16 h-16 rounded-full",
          "flex items-center justify-center",
          "bg-swipe-like/10 border-2 border-swipe-like/50",
          "transition-all duration-200",
          "hover:scale-110 hover:bg-swipe-like/20 hover:border-swipe-like",
          "active:scale-95",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
        )}
        aria-label="興味あり"
      >
        <FluentEmoji name="red-heart" size={32} />
      </button>
    </div>
  );
}

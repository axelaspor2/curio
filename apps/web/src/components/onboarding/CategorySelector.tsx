import { useState } from "react";
import type { Category } from "@/hooks/useCategories";
import { cn } from "@/lib/utils";

interface CategorySelectorProps {
  categories: Category[];
  onSelect: (selectedIds: string[]) => void;
  onSkip: () => void;
  isLoading?: boolean;
  minSelection?: number;
}

export function CategorySelector({
  categories,
  onSelect,
  onSkip,
  isLoading = false,
  minSelection = 1,
}: CategorySelectorProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleCategory = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSubmit = () => {
    if (selectedIds.size >= minSelection) {
      onSelect(Array.from(selectedIds));
    }
  };

  const canSubmit = selectedIds.size >= minSelection && !isLoading;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="text-center px-4 pt-8 pb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          興味のあるカテゴリを選んでください
        </h1>
        <p className="text-muted-foreground text-sm">
          3つ以上選ぶとより精度の高いおすすめが届きます
        </p>
      </div>

      {/* Category Grid */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="grid grid-cols-2 gap-3">
          {categories.map((category) => {
            const isSelected = selectedIds.has(category.id);
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => toggleCategory(category.id)}
                disabled={isLoading}
                className={cn(
                  "relative p-4 rounded-xl border-2 transition-all duration-200",
                  "flex flex-col items-center justify-center text-center",
                  "min-h-[80px]",
                  "active:scale-[0.97]",
                  isSelected
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-foreground hover:border-primary/50 hover:bg-accent/50",
                  isLoading && "opacity-50 cursor-not-allowed",
                )}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-primary-foreground"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                <span className="font-medium text-sm">{category.name}</span>
                {category.description && (
                  <span className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {category.description}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-6 border-t border-border bg-background">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={cn(
            "w-full py-3 px-6 rounded-xl font-medium text-base transition-all",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
            canSubmit
              ? "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98]"
              : "bg-muted text-muted-foreground cursor-not-allowed",
          )}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              設定中...
            </span>
          ) : (
            `選択したカテゴリで始める${selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}`
          )}
        </button>

        <button
          type="button"
          onClick={onSkip}
          disabled={isLoading}
          className={cn(
            "w-full mt-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors",
            isLoading && "opacity-50 cursor-not-allowed",
          )}
        >
          あとで設定する
        </button>
      </div>
    </div>
  );
}

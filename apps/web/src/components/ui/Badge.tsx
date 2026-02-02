import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { type EmojiName, FluentEmoji } from "./FluentEmoji";

type CategorySlug = "technology" | "business" | "science" | "health";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "outline" | "category";
  category?: CategorySlug;
}

const categoryStyles: Record<CategorySlug, string> = {
  technology: "bg-category-tech/20 text-category-tech border-category-tech/30",
  business: "bg-category-business/20 text-category-business border-category-business/30",
  science: "bg-category-science/20 text-category-science border-category-science/30",
  health: "bg-category-health/20 text-category-health border-category-health/30",
};

const categoryEmoji: Record<CategorySlug, EmojiName> = {
  technology: "laptop",
  business: "briefcase",
  science: "microscope",
  health: "hospital",
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", category, children, ...props }, ref) => {
    const categoryStyle = category ? categoryStyles[category] : "";
    const emoji = category ? categoryEmoji[category] : null;

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1 rounded-md border px-2.5 py-0.5 text-xs font-medium transition-colors",
          variant === "default" && "border-transparent bg-primary text-primary-foreground",
          variant === "secondary" && "border-transparent bg-secondary text-secondary-foreground",
          variant === "outline" && "border-border text-foreground",
          variant === "category" && categoryStyle,
          className,
        )}
        {...props}
      >
        {variant === "category" && emoji && (
          <FluentEmoji name={emoji} size={14} className="-ml-0.5" />
        )}
        {children}
      </span>
    );
  },
);

Badge.displayName = "Badge";

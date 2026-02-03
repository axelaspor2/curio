import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface MobileContainerProps {
  children: ReactNode;
  className?: string;
}

export function MobileContainer({ children, className }: MobileContainerProps) {
  return (
    <div
      className={cn(
        "h-full w-full flex flex-col",
        "bg-background text-foreground",
        "max-w-lg mx-auto",
        "sm:border-x sm:border-border/30",
        // Pull-to-Refresh 対策
        "overflow-hidden overscroll-none",
        className,
      )}
    >
      {children}
    </div>
  );
}

import { Slot } from "@radix-ui/react-slot";
import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(
          "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-all",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:pointer-events-none disabled:opacity-50",
          "active:scale-[0.98]",
          "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
          // Variants
          variant === "default" && "bg-primary text-primary-foreground shadow hover:bg-primary/90",
          variant === "secondary" && "bg-secondary text-secondary-foreground hover:bg-secondary/80",
          variant === "outline" &&
            "border border-input bg-transparent hover:bg-accent hover:text-accent-foreground",
          variant === "ghost" && "hover:bg-accent hover:text-accent-foreground",
          variant === "destructive" &&
            "bg-destructive text-destructive-foreground hover:bg-destructive/90",
          variant === "link" && "text-primary underline-offset-4 hover:underline",
          // Sizes
          size === "default" && "h-11 px-5 py-2.5 text-sm",
          size === "sm" && "h-9 px-3 text-xs",
          size === "lg" && "h-12 px-8 text-base",
          size === "icon" && "h-10 w-10",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";

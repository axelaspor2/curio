import { useAtom } from "jotai";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { themeAtom } from "@/store/atoms/theme";

export interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  const [theme, setTheme] = useAtom(themeAtom);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50",
        "flex items-center justify-between",
        "px-4 py-3",
        "bg-background/80 backdrop-blur-md",
        "border-b border-border/50",
        "pt-safe",
        className,
      )}
    >
      {/* Logo */}
      <h1 className="text-xl font-semibold tracking-tight">
        <span className="font-display">Curio</span>
      </h1>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className={cn(
            "w-9 h-9 rounded-full",
            "flex items-center justify-center",
            "bg-secondary/50 hover:bg-secondary",
            "transition-colors duration-200",
          )}
          aria-label={theme === "dark" ? "ライトモードに切替" : "ダークモードに切替"}
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
}

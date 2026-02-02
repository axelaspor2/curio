import { useAtom } from "jotai";
import { FluentEmoji } from "@/components/ui";
import { useAuth } from "@/hooks";
import { cn } from "@/lib/utils";
import { themeAtom } from "@/store/atoms/theme";

export interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  const [theme, setTheme] = useAtom(themeAtom);
  const { signOut } = useAuth();

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
      <h1 className="text-xl font-semibold tracking-tight">
        <span className="font-display">Curio</span>
      </h1>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggleTheme}
          className={cn(
            "w-9 h-9 rounded-full",
            "flex items-center justify-center",
            "bg-secondary/50 hover:bg-secondary",
            "transition-colors duration-200",
            "emoji-btn",
          )}
          aria-label={theme === "dark" ? "ライトモードに切替" : "ダークモードに切替"}
        >
          <FluentEmoji name={theme === "dark" ? "sun" : "crescent-moon"} size={20} />
        </button>

        <button
          type="button"
          onClick={signOut}
          className={cn(
            "w-9 h-9 rounded-full",
            "flex items-center justify-center",
            "bg-secondary/50 hover:bg-secondary",
            "transition-colors duration-200",
            "emoji-btn",
          )}
          aria-label="ログアウト"
        >
          <FluentEmoji name="door" size={20} />
        </button>
      </div>
    </header>
  );
}

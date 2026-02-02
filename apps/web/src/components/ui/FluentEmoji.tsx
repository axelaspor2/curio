import { cn } from "@/lib/utils";

export type EmojiName =
  | "party-popper"
  | "dizzy-face"
  | "open-mailbox"
  | "red-heart"
  | "waving-hand"
  | "arrow-undo"
  | "sun"
  | "crescent-moon"
  | "door"
  | "counterclockwise-arrows"
  | "laptop"
  | "briefcase"
  | "microscope"
  | "hospital";

export interface FluentEmojiProps {
  name: EmojiName;
  size?: number;
  className?: string;
}

export function FluentEmoji({ name, size = 24, className }: FluentEmojiProps) {
  return (
    <img
      src={`/emoji/${name}.png`}
      alt={name}
      width={size}
      height={size}
      className={cn("inline-block", className)}
      draggable={false}
    />
  );
}

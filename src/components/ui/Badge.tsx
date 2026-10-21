import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "brand" | "solid" | "neutral" | "warning" | "danger" | "outline";

const tones: Record<Tone, string> = {
  brand: "bg-mint-200 text-forest",
  solid: "bg-forest text-white",
  neutral: "bg-mint text-ink-label",
  warning: "bg-warning-bg text-warning",
  danger: "bg-danger-bg text-danger",
  outline: "border border-dashed border-sage text-ink-2",
};

/** Status pill. Always pair colour with words (and ideally an icon). */
export function Badge({ tone = "brand", icon, children, className }: { tone?: Tone; icon?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold [&_svg]:size-3.5", tones[tone], className)}>
      {icon}
      {children}
    </span>
  );
}

/** Small unread counter. */
export function CountBadge({ count, className }: { count: number; className?: string }) {
  if (count <= 0) return null;
  return (
    <span
      aria-label={`${count} unread`}
      className={cn("inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-forest px-1.5 text-[11px] font-semibold text-white", className)}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const tones = {
  soft: "bg-mint-200 text-forest",
  solid: "bg-forest text-white",
};

/**
 * The rounded square that holds an icon: settings rows, the notifications card, prescription cards.
 * 44px, field radius. Pass the icon at size-5 or size-[22px].
 */
export function IconTile({ tone = "soft", children, className }: { tone?: keyof typeof tones; children: ReactNode; className?: string }) {
  return <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-field", tones[tone], className)}>{children}</span>;
}

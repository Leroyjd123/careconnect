"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { CountBadge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

export type TabItem = {
  href: string;
  label: string;
  Icon: LucideIcon;
  /** Shorter wording when the full label won't fit on a phone. */
  shortLabel?: string;
  /** Match the path exactly instead of by prefix (e.g. /doctor vs /doctor/patients). */
  exact?: boolean;
  /** Unread counter in the corner. */
  badge?: number;
};

/**
 * The floating glass bottom bar. One implementation for both apps: the patient tabs
 * and the doctor's phone navigation differ only in their items.
 */
/** currentPath overrides the router's path (styleguide only), to show which tab is active. */
export function TabBar({ items, className, currentPath }: { items: TabItem[]; className?: string; currentPath?: string }) {
  const routerPath = usePathname();
  const pathname = currentPath ?? routerPath;

  return (
    <nav
      aria-label="Main"
      className={cn(
        "glass fixed inset-x-4 bottom-[max(16px,env(safe-area-inset-bottom))] z-20 mx-auto grid h-[70px] max-w-md gap-1 rounded-full p-1.5 shadow-float",
        className,
      )}
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
    >
      {items.map(({ href, label, Icon, shortLabel, exact, badge }) => {
        const [path, search] = href.split("?");
        // A link that carries a query string (e.g. ?invite=1) opens something: never "current".
        const active = !search && (exact ? pathname === path : pathname === path || pathname.startsWith(`${path}/`));
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex flex-col items-center justify-center gap-0.5 rounded-full text-xs no-underline",
              active ? "bg-mint-200 font-semibold text-forest hover:text-forest" : "font-medium text-ink-2 hover:text-ink",
            )}
          >
            <Icon aria-hidden="true" className="size-[22px]" strokeWidth={active ? 1.9 : 1.75} />
            {shortLabel ?? label}
            {badge ? <CountBadge count={badge} className="absolute top-1.5 right-[calc(50%-24px)]" /> : null}
          </Link>
        );
      })}
    </nav>
  );
}

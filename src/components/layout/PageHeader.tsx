import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

/** Glass top bar with optional back link, title, subtitle and actions. Used by chat and detail screens. */
export function PageHeader({
  backHref,
  backLabel = "Back",
  leading,
  title,
  subtitle,
  actions,
  className,
}: {
  backHref?: string;
  backLabel?: string;
  leading?: ReactNode; // avatar
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("glass flex min-h-16 items-center gap-2 rounded-3xl px-2 py-2 shadow-lift", className)}>
      {backHref ? (
        <Link href={backHref} aria-label={backLabel} className="flex size-11 shrink-0 items-center justify-center rounded-full text-ink hover:bg-white/60 hover:text-ink">
          <ChevronLeft aria-hidden="true" className="size-6" strokeWidth={1.75} />
        </Link>
      ) : null}
      {leading}
      <div className={cn("flex min-w-0 flex-1 flex-col", !backHref && !leading && "pl-3")}>
        <h1 className="truncate text-[17px] font-semibold">{title}</h1>
        {subtitle ? <p className="truncate text-[13px] text-ink-2">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-1.5 pr-1">{actions}</div> : null}
    </header>
  );
}

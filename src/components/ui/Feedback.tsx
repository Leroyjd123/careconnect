import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Check, CircleAlert, Info, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

/** Centered empty / error / success state with a glass icon tile. */
export function EmptyState({
  icon: Icon,
  title,
  children,
  action,
  tone = "brand",
  className,
}: {
  icon: LucideIcon;
  title: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  tone?: "brand" | "danger";
  className?: string;
}) {
  return (
    <div className={cn("mx-auto flex max-w-sm flex-col items-center gap-3 px-4 py-10 text-center", className)}>
      <div
        className={cn(
          "glass mb-3 flex size-24 items-center justify-center rounded-[34px] shadow-float",
          tone === "danger" ? "text-danger" : "text-forest",
        )}
      >
        <Icon aria-hidden="true" strokeWidth={1.5} className="size-10" />
      </div>
      <h2 className="text-[21px] font-semibold tracking-tight">{title}</h2>
      {children ? <p className="text-[15px] leading-relaxed text-ink-2">{children}</p> : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}

type BannerTone = "success" | "info" | "offline" | "danger";

const bannerTones: Record<BannerTone, { cls: string; icon: LucideIcon }> = {
  success: { cls: "bg-forest/92 text-white shadow-cta", icon: Check },
  info: { cls: "bg-mint-200/80 text-ink", icon: Info },
  offline: { cls: "bg-ink/86 text-white", icon: WifiOff },
  danger: { cls: "bg-danger-bg text-danger", icon: CircleAlert },
};

/** Inline status strip: "Prescription issued", "You're offline", upload errors. */
export function Banner({ tone = "info", children, action, className }: { tone?: BannerTone; children: ReactNode; action?: ReactNode; className?: string }) {
  const { cls, icon: Icon } = bannerTones[tone];
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={cn("flex items-center gap-3 rounded-[18px] px-4 py-3 text-sm backdrop-blur-xl", cls, className)}>
      <Icon aria-hidden="true" className="size-5 shrink-0" />
      <span className="flex-1 leading-snug">{children}</span>
      {action}
    </div>
  );
}

/** Grey placeholder block for loading states. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("animate-pulse rounded-lg bg-white/60", className)} />;
}

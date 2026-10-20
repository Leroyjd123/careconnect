"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Inbox, LogOut, UserPlus, Users } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { CountBadge } from "@/components/ui/Badge";
import { Logo } from "@/components/ui/Logo";
import { signOut } from "@/app/actions/auth";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/doctor", label: "Inbox", Icon: Inbox, exact: true },
  { href: "/doctor/patients", label: "Patients", Icon: Users },
  { href: "/doctor/patients?invite=1", label: "Invite patient", Icon: UserPlus },
];

/**
 * Doctor navigation. Glass sidebar on desktop, floating bottom bar on phones.
 * unread = total unread messages across the inbox.
 */
export function DoctorSidebar({ name, unread = 0 }: { name: string; unread?: number }) {
  const pathname = usePathname();
  const isActive = (href: string, exact?: boolean) => {
    const path = href.split("?")[0];
    return exact ? pathname === path : pathname.startsWith(path) && !href.includes("?");
  };

  return (
    <>
      {/* Desktop */}
      <nav aria-label="Main" className="glass hidden w-[232px] shrink-0 flex-col gap-1.5 rounded-card p-3.5 shadow-float lg:flex">
        <Logo className="px-2 pt-2 pb-5" />
        {NAV.map(({ href, label, Icon, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-[46px] items-center gap-2.5 rounded-2xl px-3.5 text-[15px] no-underline",
                active ? "bg-white/90 font-semibold text-forest shadow-lift hover:text-forest" : "font-medium text-ink hover:bg-white/50 hover:text-ink",
              )}
            >
              <Icon aria-hidden="true" className="size-5" strokeWidth={active ? 1.9 : 1.75} />
              <span className="flex-1">{label}</span>
              {label === "Inbox" ? <CountBadge count={unread} /> : null}
            </Link>
          );
        })}
        <div className="flex-1" />
        <div className="flex items-center gap-2.5 rounded-[18px] bg-white/55 p-2">
          <Avatar name={name} doctor size="sm" />
          <span className="min-w-0 flex-1 truncate text-sm font-semibold">{name}</span>
          <form action={signOut}>
            <button type="submit" aria-label="Sign out" title="Sign out" className="flex size-9 items-center justify-center rounded-full text-ink-2 hover:bg-white/70">
              <LogOut aria-hidden="true" className="size-[18px]" />
            </button>
          </form>
        </div>
      </nav>

      {/* Phone */}
      <nav
        aria-label="Main"
        className="glass fixed inset-x-4 bottom-[max(16px,env(safe-area-inset-bottom))] z-20 mx-auto grid h-[70px] max-w-md grid-cols-3 gap-1 rounded-full p-1.5 shadow-float lg:hidden"
      >
        {NAV.map(({ href, label, Icon, exact }) => {
          const active = isActive(href, exact);
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
              <Icon aria-hidden="true" className="size-[22px]" />
              {label === "Invite patient" ? "Invite" : label}
              {label === "Inbox" ? <CountBadge count={unread} className="absolute top-1.5 right-[calc(50%-24px)]" /> : null}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

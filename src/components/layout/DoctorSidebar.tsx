"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Inbox, LogOut, UserPlus, Users } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { CountBadge } from "@/components/ui/Badge";
import { IconButton } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { TabBar, type TabItem } from "@/components/layout/TabBar";
import { signOut } from "@/app/actions/auth";
import { cn } from "@/lib/utils";

const NAV: TabItem[] = [
  { href: "/doctor", label: "Inbox", Icon: Inbox, exact: true },
  { href: "/doctor/patients", label: "Patients", Icon: Users },
  { href: "/doctor/patients?invite=1", label: "Invite patient", shortLabel: "Invite", Icon: UserPlus },
];

/**
 * Doctor navigation. Glass sidebar on desktop, the shared TabBar on phones.
 * unread = total unread messages across the inbox.
 */
export function DoctorSidebar({ name, unread = 0 }: { name: string; unread?: number }) {
  const pathname = usePathname();
  const items = NAV.map((item) => (item.label === "Inbox" ? { ...item, badge: unread } : item));

  return (
    <>
      {/* Desktop */}
      <nav aria-label="Main" className="glass hidden w-[232px] shrink-0 flex-col gap-1.5 rounded-card p-3.5 shadow-float lg:flex">
        <Logo className="px-2 pt-2 pb-5" />
        {NAV.map(({ href, label, Icon, exact }) => {
          const path = href.split("?")[0];
          const active = !href.includes("?") && (exact ? pathname === path : pathname.startsWith(path));
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
            <IconButton type="submit" label="Sign out" icon={<LogOut className="size-[18px]" />} className="size-10" />
          </form>
        </div>
      </nav>

      {/* Phone */}
      <TabBar items={items} className="lg:hidden" />
    </>
  );
}

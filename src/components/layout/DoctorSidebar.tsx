"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Inbox, LogOut, PanelLeftClose, PanelLeftOpen, Settings, UserPlus, Users } from "lucide-react";
import { setLayoutCookie } from "@/components/layout/LayoutToggle";
import { LAYOUT_COOKIES } from "@/lib/constants";
import { Avatar } from "@/components/ui/Avatar";
import { CountBadge } from "@/components/ui/Badge";
import { IconButton } from "@/components/ui/Button";
import { Logo, LogoMark } from "@/components/ui/Logo";
import { TabBar, type TabItem } from "@/components/layout/TabBar";
import { signOut } from "@/app/actions/auth";
import { cn } from "@/lib/utils";

const NAV: TabItem[] = [
  { href: "/doctor", label: "Inbox", Icon: Inbox, exact: true },
  { href: "/doctor/patients", label: "Patients", Icon: Users },
  { href: "/doctor/patients?invite=1", label: "Invite patient", shortLabel: "Invite", Icon: UserPlus },
  { href: "/doctor/settings", label: "Settings", Icon: Settings },
];

/**
 * Doctor navigation. Glass sidebar on desktop, the shared TabBar on phones.
 * unread = total unread messages across the inbox.
 * signOutAction is only overridden by /styleguide, so its demo can't sign anyone out.
 */
export function DoctorSidebar({
  name,
  unread = 0,
  signOutAction = signOut,
  collapsed: initiallyCollapsed = false,
}: {
  name: string;
  unread?: number;
  signOutAction?: () => void | Promise<void>;
  /** Desktop only: icons-only rail. Remembered in a cookie; the layout passes the saved choice. */
  collapsed?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(initiallyCollapsed);
  const toggle = () => {
    setCollapsed(!collapsed);
    setLayoutCookie(LAYOUT_COOKIES.nav, collapsed ? "off" : "on");
  };
  const pathname = usePathname();
  const items = NAV.map((item) => (item.label === "Inbox" ? { ...item, badge: unread } : item));

  return (
    <>
      {/* Desktop */}
      <nav
        aria-label="Main"
        className={cn(
          "glass hidden shrink-0 flex-col gap-1.5 rounded-card shadow-float transition-[width] lg:flex",
          collapsed ? "w-[76px] items-center p-2.5" : "w-[232px] p-3.5",
        )}
      >
        <div className={cn("flex items-center pb-4", collapsed ? "flex-col gap-2 pt-1" : "justify-between pt-1 pl-2")}>
          {collapsed ? <LogoMark size={32} label="CareConnect" /> : <Logo />}
          <IconButton
            label={collapsed ? "Expand menu" : "Collapse menu"}
            aria-expanded={!collapsed}
            onClick={toggle}
            icon={collapsed ? <PanelLeftOpen className="size-5" /> : <PanelLeftClose className="size-5" />}
          />
        </div>
        {NAV.map(({ href, label, Icon, exact }) => {
          const path = href.split("?")[0];
          const active = !href.includes("?") && (exact ? pathname === path : pathname.startsWith(path));
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              aria-label={collapsed ? label : undefined}
              title={collapsed ? label : undefined}
              className={cn(
                "relative flex min-h-[46px] items-center rounded-tile text-[15px] no-underline",
                collapsed ? "w-[52px] justify-center" : "gap-2.5 px-3.5",
                active ? "bg-white/90 font-semibold text-forest shadow-lift hover:text-forest" : "font-medium text-ink hover:bg-white/50 hover:text-ink",
              )}
            >
              <Icon aria-hidden="true" className="size-5" strokeWidth={active ? 1.9 : 1.75} />
              {collapsed ? null : <span className="flex-1">{label}</span>}
              {label === "Inbox" ? <CountBadge count={unread} className={collapsed ? "absolute top-1 right-1" : undefined} /> : null}
            </Link>
          );
        })}
        <div className="flex-1" />
        <div className={cn("flex items-center rounded-tile bg-white/55 p-2", collapsed ? "flex-col gap-1.5" : "gap-2.5")}>
          <Avatar name={name} doctor size="sm" />
          {collapsed ? null : <span className="min-w-0 flex-1 truncate text-sm font-semibold">{name}</span>}
          <form action={signOutAction}>
            <IconButton type="submit" label="Sign out" icon={<LogOut className="size-[18px]" />} />
          </form>
        </div>
      </nav>

      {/* Phone */}
      <TabBar items={items} className="lg:hidden" />
    </>
  );
}

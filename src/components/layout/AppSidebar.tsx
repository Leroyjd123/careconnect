"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Building2, Inbox, LayoutDashboard, LogOut, PanelLeftClose, PanelLeftOpen, Pill, Settings, Stethoscope, UserPlus, Users } from "lucide-react";
import { setLayoutCookie } from "@/components/layout/LayoutToggle";
import { LAYOUT_COOKIES } from "@/lib/constants";
import { Avatar } from "@/components/ui/Avatar";
import { CountBadge } from "@/components/ui/Badge";
import { IconButton } from "@/components/ui/Button";
import { Logo, LogoMark } from "@/components/ui/Logo";
import { TabBar } from "@/components/layout/TabBar";
import { signOut } from "@/app/actions/auth";
import { cn } from "@/lib/utils";

/**
 * What a sidebar link is. The icon is chosen by name inside this client component,
 * so no component ever travels from a server component across the boundary.
 */
export type AppNavItem = {
  href: string;
  label: string;
  /** Which icon to show. */
  icon: keyof typeof ICONS;
  /** Shorter wording when the full label won't fit on a phone. */
  shortLabel?: string;
  /** Match the path exactly instead of by prefix (e.g. /doctor vs /doctor/patients). */
  exact?: boolean;
};

const ICONS = {
  inbox: Inbox,
  patients: Users,
  invite: UserPlus,
  settings: Settings,
  overview: LayoutDashboard,
  doctors: Stethoscope,
  clinics: Building2,
  medicines: Pill,
} as const;

/** The doctor's links. The admin passes its own (PLAN §6: one sidebar, different links). */
export const DOCTOR_NAV: AppNavItem[] = [
  { href: "/doctor", label: "Inbox", icon: "inbox", exact: true },
  { href: "/doctor/patients", label: "Patients", icon: "patients" },
  { href: "/doctor/patients?invite=1", label: "Invite patient", shortLabel: "Invite", icon: "invite" },
  { href: "/doctor/settings", label: "Settings", icon: "settings" },
];

/**
 * App navigation. Glass sidebar on desktop, the shared TabBar on phones.
 * The doctor passes today's items (unchanged look); the admin passes its own.
 * unread = total unread messages across the inbox (doctor only).
 * signOutAction is only overridden by /styleguide, so its demo can't sign anyone out.
 */
export function AppSidebar({
  name,
  items = DOCTOR_NAV,
  unread = 0,
  doctorAvatar = false,
  signOutAction = signOut,
  collapsed: initiallyCollapsed = false,
}: {
  name: string;
  /** The links to show. Defaults to the doctor's. */
  items?: AppNavItem[];
  unread?: number;
  /** The avatar is forest green for doctors, the usual colour for the admin. */
  doctorAvatar?: boolean;
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
  // The unread counter sits on the item that points at the inbox.
  const withBadge = items.map((item) => (item.href === "/doctor" ? { ...item, badge: unread } : item));
  // The phone bar wants the icon components themselves. Both live in this client file,
  // so nothing crosses the server boundary.
  const tabItems = withBadge.map((item) => ({ ...item, Icon: ICONS[item.icon] }));

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
        {items.map(({ href, label, icon, exact }) => {
          const Icon = ICONS[icon];
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
              {href === "/doctor" ? <CountBadge count={unread} className={collapsed ? "absolute top-1 right-1" : undefined} /> : null}
            </Link>
          );
        })}
        <div className="flex-1" />
        <div className={cn("flex items-center rounded-tile bg-white/55 p-2", collapsed ? "flex-col gap-1.5" : "gap-2.5")}>
          <Avatar name={name} doctor={doctorAvatar} size="sm" />
          {collapsed ? null : <span className="min-w-0 flex-1 truncate text-sm font-semibold">{name}</span>}
          <form action={signOutAction}>
            <IconButton type="submit" label="Sign out" icon={<LogOut className="size-[18px]" />} />
          </form>
        </div>
      </nav>

      {/* Phone */}
      <TabBar items={tabItems} className="lg:hidden" />
    </>
  );
}


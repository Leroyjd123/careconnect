"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, House, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/home", label: "Home", Icon: House },
  { href: "/prescriptions", label: "Prescriptions", Icon: FileText },
  { href: "/profile", label: "Profile", Icon: UserRound },
];

/** Floating glass tab bar for the patient app. Hidden on the chat screen (it has its own composer). */
export function PatientTabBar() {
  const pathname = usePathname();
  if (pathname.startsWith("/chat")) return null;

  return (
    <nav
      aria-label="Main"
      className="glass fixed inset-x-4 bottom-[max(16px,env(safe-area-inset-bottom))] z-20 mx-auto grid h-[70px] max-w-md grid-cols-3 gap-1 rounded-full p-1.5 shadow-float"
    >
      {TABS.map(({ href, label, Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 rounded-full text-xs no-underline",
              active ? "bg-mint-200 font-semibold text-forest hover:text-forest" : "font-medium text-ink-2 hover:text-ink",
            )}
          >
            <Icon aria-hidden="true" className="size-[22px]" strokeWidth={active ? 1.9 : 1.75} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

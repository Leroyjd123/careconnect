"use client";

import { usePathname } from "next/navigation";
import { FileText, House, UserRound } from "lucide-react";
import { TabBar, type TabItem } from "@/components/layout/TabBar";

const TABS: TabItem[] = [
  { href: "/home", label: "Home", Icon: House },
  { href: "/prescriptions", label: "Prescriptions", Icon: FileText },
  { href: "/profile", label: "Profile", Icon: UserRound },
];

/** Patient navigation. Hidden on the chat screen, which has its own composer at the bottom. */
export function PatientTabBar() {
  const pathname = usePathname();
  if (pathname.startsWith("/chat")) return null;
  return <TabBar items={TABS} />;
}

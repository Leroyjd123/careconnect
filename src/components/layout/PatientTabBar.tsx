"use client";

import { usePathname } from "next/navigation";
import { FileText, House, MessageCircle, UserRound } from "lucide-react";
import { TabBar, type TabItem } from "@/components/layout/TabBar";

const TABS: TabItem[] = [
  { href: "/home", label: "Home", Icon: House },
  { href: "/chat", label: "Chats", Icon: MessageCircle },
  { href: "/prescriptions", label: "Prescriptions", Icon: FileText },
  { href: "/profile", label: "Profile", Icon: UserRound },
];

/**
 * Patient navigation. Shown on the list of doctors (/chat); hidden inside one chat (/chat/<id>),
 * which has its own composer at the bottom.
 */
export function PatientTabBar() {
  const pathname = usePathname();
  if (pathname.startsWith("/chat/")) return null;
  return <TabBar items={TABS} />;
}

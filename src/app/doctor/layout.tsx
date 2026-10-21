import { Suspense } from "react";
import { cookies } from "next/headers";
import { LAYOUT_COOKIES } from "@/lib/constants";
import { requireProfile } from "@/lib/auth";
import { getMyConversations } from "@/lib/data";
import { DoctorSidebar } from "@/components/layout/DoctorSidebar";
import { InviteDialog } from "@/components/doctor/InviteDialog";

// Doctor app: glass sidebar + content on desktop, bottom bar on phones.
// Fixed to the viewport height so the inbox, chat and panels scroll on their own.
export default async function DoctorLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile("doctor");
  const conversations = await getMyConversations();
  const unread = conversations.reduce((n, c) => n + c.unread_count, 0);
  const navCollapsed = (await cookies()).get(LAYOUT_COOKIES.nav)?.value === "on";

  return (
    <div className="flex h-dvh gap-4 p-3 sm:p-4">
      <DoctorSidebar name={profile.full_name || "Doctor"} unread={unread} collapsed={navCollapsed} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col pb-[86px] lg:pb-0">{children}</div>
      {/* One invite form for the whole doctor app, opened by ?invite=1 anywhere. */}
      <Suspense fallback={null}>
        <InviteDialog />
      </Suspense>
    </div>
  );
}

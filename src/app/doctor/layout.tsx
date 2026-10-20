import { requireProfile } from "@/lib/auth";
import { getMyConversations } from "@/lib/data";
import { DoctorSidebar } from "@/components/layout/DoctorSidebar";

// Doctor app: glass sidebar + content on desktop, bottom bar on phones.
export default async function DoctorLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile("doctor");
  const conversations = await getMyConversations();
  const unread = conversations.reduce((n, c) => n + c.unread_count, 0);

  return (
    <div className="flex min-h-dvh gap-4 p-3 pb-28 sm:p-4 lg:pb-4">
      <DoctorSidebar name={profile.full_name || "Doctor"} unread={unread} />
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}

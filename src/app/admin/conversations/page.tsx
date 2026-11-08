import type { Metadata } from "next";
import { getAdminDoctors } from "@/app/actions/admin";
import { getAdminConversations } from "@/lib/data";
import { AdminConversations } from "./AdminConversations";

export const metadata: Metadata = { title: "Conversations · Admin" };

/**
 * The admin's conversation list (PLAN §7 Phase E): every chat, with the patient, the
 * doctor, the last message and whether the chat is blocked.
 * ?doctor=<id> narrows the list to one doctor's chats.
 */
export default async function AdminConversationsPage({
  searchParams,
}: {
  searchParams: Promise<{ doctor?: string }>;
}) {
  const { doctor } = await searchParams;
  const [conversations, doctors] = await Promise.all([
    getAdminConversations(doctor),
    getAdminDoctors(),
  ]);

  return <AdminConversations conversations={conversations} doctors={doctors} filterDoctorId={doctor} />;
}

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { getMyConversations } from "@/lib/data";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Feedback";
import { ConversationList } from "@/components/chat/ConversationList";

export const metadata: Metadata = { title: "Chat" };

/**
 * The patient's chats (PLAN §7 Phase C, decision 22).
 * One doctor → straight into that chat. Two or more → the list of doctors.
 */
export default async function PatientChat({ searchParams }: { searchParams: Promise<{ attach?: string }> }) {
  await requireProfile("patient");
  const { attach } = await searchParams;
  const inbox = await getMyConversations();

  if (inbox.length === 0) {
    return (
      <main className="flex flex-1 items-center px-5 pt-6 pb-32">
        <EmptyState icon={MessageCircle} title="No doctor connected yet" action={<ButtonLink href="/home">Back to home</ButtonLink>}>
          Your doctor&apos;s clinic will connect you. Please contact them if this takes long.
        </EmptyState>
      </main>
    );
  }

  // One doctor: open that chat straight away, keeping ?attach=1 for "Send a report".
  if (inbox.length === 1) {
    redirect(attach === "1" ? `/chat/${inbox[0].id}?attach=1` : `/chat/${inbox[0].id}`);
  }

  return (
    <main className="flex flex-col gap-4 p-3 pb-32">
      <div className="px-1">
        <h1 className="text-[28px] font-semibold tracking-tight">Your doctors</h1>
        <p className="text-base text-ink-2">Tap a doctor to open your chat with them.</p>
      </div>
      <ConversationList rows={inbox} viewerRole="patient" />
    </main>
  );
}

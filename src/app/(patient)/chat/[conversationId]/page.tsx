import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { REQUEST_MEETING_TEXT } from "@/lib/constants";
import { getConversation, getAppointments, getMessages, getMyConversations, getPrescriptions, replacedIds } from "@/lib/data";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { Conversation } from "@/components/chat/Conversation";
import { FileViewer } from "@/components/chat/FileViewer";

export const metadata: Metadata = { title: "Chat" };

const STARTERS = ["I have a question about my medicine", "I want to send a report"];

/**
 * One chat, one doctor (PLAN §7 Phase C). The patient reaches it from /chat, from
 * their home card or from a notification. Only their own conversations are open here.
 */
export default async function PatientConversation({
  params,
  searchParams,
}: {
  params: Promise<{ conversationId: string }>;
  searchParams: Promise<{ attach?: string; file?: string }>;
}) {
  const profile = await requireProfile("patient");
  const { conversationId } = await params;
  const { attach, file } = await searchParams;

  const conversation = await getConversation(conversationId);
  if (!conversation || conversation.patient_id !== profile.id) notFound();

  // How many doctors the patient has: with two or more, "back" goes to the list of doctors.
  const inbox = await getMyConversations();
  const backHref = inbox.length > 1 ? "/chat" : "/home";

  const [messages, prescriptions, appointments] = await Promise.all([
    getMessages(conversation.id),
    getPrescriptions(conversation.id),
    getAppointments(conversation.id),
  ]);
  const doctor = conversation.doctor;
  const openFile = file ? messages.find((m) => m.id === file && m.file_path) : undefined;

  return (
    <main className="relative flex h-dvh min-h-0 flex-col p-3">
      <Card tone="subtle" className="flex min-h-0 flex-1 flex-col p-2.5">
        <Conversation
          conversationId={conversation.id}
          meId={profile.id}
          otherName={doctor.full_name}
          initialMessages={messages}
          prescriptions={prescriptions}
          replacedRxIds={replacedIds(prescriptions)}
          meetings={appointments.meetings}
          checkIns={appointments.checkIns}
          viewerRole="patient"
          fileHrefBase={`/chat/${conversation.id}?file=`}
          rxHrefBase="/prescriptions/"
          attachOnOpen={attach === "1"}
          starters={STARTERS}
          requestMeetingText={REQUEST_MEETING_TEXT}
          readOnlyNotice={
            doctor.deactivated_at
              ? `${doctor.full_name} is no longer available here. You can still read your messages and prescriptions.`
              : conversation.blocked_at
                ? "You can't send messages in this chat. You can still read your messages and prescriptions."
                : undefined
          }
          header={{
            backHref,
            backLabel: backHref === "/chat" ? "Back to your doctors" : "Back to home",
            leading: <Avatar name={doctor.full_name} doctor />,
            title: doctor.full_name,
            subtitle: doctor.specialty,
          }}
        />
      </Card>
      {openFile ? <FileViewer message={openFile} backHref={`/chat/${conversation.id}`} className="absolute inset-3 z-10" /> : null}
    </main>
  );
}

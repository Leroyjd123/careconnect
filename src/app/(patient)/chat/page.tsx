import type { Metadata } from "next";
import { MessageCircle } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { getConversation, getMessages, getMyConversations, getPrescriptions, replacedIds } from "@/lib/data";
import { Avatar } from "@/components/ui/Avatar";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/Feedback";
import { Conversation } from "@/components/chat/Conversation";
import { FileViewer } from "@/components/chat/FileViewer";

export const metadata: Metadata = { title: "Chat" };

const STARTERS = ["I have a question about my medicine", "I want to send a report"];

export default async function PatientChat({ searchParams }: { searchParams: Promise<{ attach?: string; file?: string }> }) {
  const profile = await requireProfile("patient");
  const { attach, file } = await searchParams;
  const [inbox] = await getMyConversations(); // MVP: one doctor per patient

  if (!inbox) {
    return (
      <main className="flex flex-1 items-center px-5 pt-6 pb-32">
        <EmptyState icon={MessageCircle} title="No doctor connected yet" action={<ButtonLink href="/home">Back to home</ButtonLink>}>
          Your doctor&apos;s clinic will connect you. Please contact them if this takes long.
        </EmptyState>
      </main>
    );
  }

  const conversation = await getConversation(inbox.id);
  if (!conversation) {
    return (
      <main className="flex flex-1 items-center px-5 pt-6 pb-32">
        <EmptyState icon={MessageCircle} title="We couldn't open this chat" tone="danger" action={<ButtonLink href="/home">Back to home</ButtonLink>}>
          Please try again in a moment.
        </EmptyState>
      </main>
    );
  }

  const [messages, prescriptions] = await Promise.all([getMessages(inbox.id), getPrescriptions(inbox.id)]);
  const doctor = conversation.doctor;
  const openFile = file ? messages.find((m) => m.id === file && m.file_path) : undefined;

  return (
    <main className="relative flex h-dvh min-h-0 flex-col p-3">
      <Card tone="subtle" className="flex min-h-0 flex-1 flex-col p-2.5">
        <Conversation
          conversationId={inbox.id}
          meId={profile.id}
          otherName={doctor.full_name}
          initialMessages={messages}
          prescriptions={prescriptions}
          replacedRxIds={replacedIds(prescriptions)}
          fileHrefBase="/chat?file="
          rxHrefBase="/prescriptions/"
          attachOnOpen={attach === "1"}
          starters={STARTERS}
          header={{
            backHref: "/home",
            backLabel: "Back to home",
            leading: <Avatar name={doctor.full_name} doctor />,
            title: doctor.full_name,
            subtitle: doctor.specialty,
          }}
        />
      </Card>
      {openFile ? <FileViewer message={openFile} backHref="/chat" className="absolute inset-3 z-10" /> : null}
    </main>
  );
}

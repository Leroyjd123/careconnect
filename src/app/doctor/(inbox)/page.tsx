import type { Metadata } from "next";
import { MessageSquare } from "lucide-react";
import { getMyConversations } from "@/lib/data";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/Feedback";
import { Logo } from "@/components/ui/Logo";

export const metadata: Metadata = { title: "Inbox" };

const STEPS = [
  "Invite a patient by name and email.",
  "They join from the email and message you.",
  "Reply, read their reports and issue prescriptions.",
];

/**
 * What sits beside the inbox list when nothing is open.
 * With no patients yet this is the whole screen: the first-run welcome.
 */
export default async function DoctorInbox() {
  const conversations = await getMyConversations();

  if (conversations.length === 0) {
    return (
      <Card tone="subtle" className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6 overflow-y-auto p-6">
        <Logo size="lg" />
        <EmptyState
          icon={MessageSquare}
          title="Invite your first patient"
          action={<ButtonLink href="/doctor?invite=1" size="lg">Invite patient</ButtonLink>}
        >
          CareConnect works by invitation, so patients only appear once you add them.
        </EmptyState>
        <ol className="flex max-w-md flex-col gap-2.5">
          {STEPS.map((step, i) => (
            <li key={step} className="flex items-start gap-3 rounded-tile bg-white/70 px-4 py-3 text-[15px]">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-forest text-sm font-semibold text-white">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </Card>
    );
  }

  return (
    <Card tone="subtle" className="hidden min-h-0 flex-1 items-center justify-center p-6 lg:flex">
      <EmptyState icon={MessageSquare} title="Pick a conversation">
        Choose a patient on the left to read their messages and reply.
      </EmptyState>
    </Card>
  );
}

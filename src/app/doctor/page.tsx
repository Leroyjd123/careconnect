import type { Metadata } from "next";
import Link from "next/link";
import { Clock, UserPlus } from "lucide-react";
import { getMyConversations } from "@/lib/data";
import { formatRelative, cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { CountBadge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/Feedback";

export const metadata: Metadata = { title: "Inbox" };

/**
 * Inbox. Starter version: the conversation list only.
 * TODO(phase 3): turn this into the 3-column layout (list | conversation | patient panel) using
 * the same ConversationList + Conversation components as /doctor/c/[conversationId].
 */
export default async function DoctorInbox() {
  const conversations = await getMyConversations();

  if (conversations.length === 0) {
    return (
      <Card tone="subtle" className="flex flex-1 items-center justify-center p-6">
        <EmptyState
          icon={UserPlus}
          title="Invite your first patient"
          action={
            <ButtonLink href="/doctor/patients?invite=1" size="lg">
              Invite patient
            </ButtonLink>
          }
        >
          When they join, their messages and reports will appear here.
        </EmptyState>
      </Card>
    );
  }

  return (
    <Card as="section" aria-label="Conversations" className="flex max-w-xl flex-col overflow-hidden">
      <h1 className="px-5 pt-5 pb-3 text-[22px] font-semibold tracking-tight">Inbox</h1>
      <ul className="flex flex-col gap-1 px-2 pb-2">
        {conversations.map((c) => {
          const invited = c.other_status === "invited";
          return (
            <li key={c.id}>
              <Link
                href={`/doctor/c/${c.id}`}
                className="flex gap-3 rounded-[18px] p-3 text-ink no-underline hover:bg-white/70 hover:text-ink"
              >
                <Avatar name={c.other_name} seed={c.other_id} pending={invited} />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="flex justify-between gap-2">
                    <span className={cn("text-[15px]", c.unread_count > 0 ? "font-semibold" : "font-medium")}>{c.other_name}</span>
                    {c.last_message_at ? (
                      <span className={cn("text-xs", c.unread_count > 0 ? "font-semibold text-forest" : "text-ink-2")}>
                        {formatRelative(c.last_message_at)}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    {invited ? (
                      <span className="flex items-center gap-1 text-[13px] text-ink-2">
                        <Clock aria-hidden="true" className="size-3.5" /> Invite pending
                      </span>
                    ) : (
                      <span className={cn("truncate text-[13px]", c.unread_count > 0 ? "font-medium" : "text-ink-2")}>
                        {c.last_message_preview ?? "No messages yet"}
                      </span>
                    )}
                    <CountBadge count={c.unread_count} />
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

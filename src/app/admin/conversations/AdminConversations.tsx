"use client";

import { MessageSquareText, X } from "lucide-react";
import { ConversationList } from "@/components/chat/ConversationList";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/Feedback";
import type { AdminConversation } from "@/lib/data";

type Props = {
  conversations: AdminConversation[];
  /** The doctors, for the filter by doctor. */
  doctors: { id: string; full_name: string }[];
  /** Only show this doctor's chats (from "View chats" on the doctors page). */
  filterDoctorId?: string;
};

/**
 * The admin's conversation list: every chat on CareConnect. The rows are the shared
 * ConversationList with viewerRole="admin", so they link to /admin/c/<id>.
 */
export function AdminConversations({ conversations, doctors, filterDoctorId }: Props) {
  const filterDoctor = filterDoctorId ? doctors.find((d) => d.id === filterDoctorId) : null;

  return (
    <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">Conversations</h1>
          <p className="text-[15px] text-ink-2">
            {filterDoctor ? `Chats of ${filterDoctor.full_name}` : `${conversations.length} chats on CareConnect`}
          </p>
        </div>
        {filterDoctor ? (
          <ButtonLink href="/admin/conversations" variant="secondary" size="sm">
            All conversations
          </ButtonLink>
        ) : null}
      </div>

      {/* Filter by doctor. */}
      {doctors.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[13px] font-semibold text-ink-2">Doctor</span>
          <ButtonLink href="/admin/conversations" variant={filterDoctorId ? "ghost" : "soft"} size="sm">
            All
          </ButtonLink>
          {doctors.map((d) => (
            <ButtonLink
              key={d.id}
              href={`/admin/conversations?doctor=${d.id}`}
              variant={filterDoctorId === d.id ? "soft" : "ghost"}
              size="sm"
            >
              {d.full_name}
              {filterDoctorId === d.id ? <X aria-hidden="true" className="size-4" /> : null}
            </ButtonLink>
          ))}
        </div>
      ) : null}

      {conversations.length === 0 ? (
        <Card tone="subtle" className="flex flex-1 items-center justify-center p-6">
          <EmptyState icon={MessageSquareText} title="No conversations yet">
            When a patient starts a chat with a doctor, it shows up here.
          </EmptyState>
        </Card>
      ) : (
        <Card tone="subtle" className="flex min-h-0 flex-1 flex-col overflow-hidden p-0">
          <ConversationList rows={conversations.map((c) => c.row)} viewerRole="admin" live={false} />
        </Card>
      )}
    </main>
  );
}

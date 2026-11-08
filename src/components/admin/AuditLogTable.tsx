"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, ScrollText } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { IconButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/Feedback";
import { formatDate, formatTime } from "@/lib/utils";
import type { AuditEntry } from "@/lib/types";

type Props = {
  rows: AuditEntry[];
  /** The actor's name, by id. The cron has no actor, so it shows as "System". */
  actorNames: Record<string, string>;
  /** How many rows there are in total (for the pager). */
  total: number;
  /** The page being shown, 1-based. */
  page: number;
  /** 50 rows to a page. */
  perPage?: number;
  /** Where the pager and the filters go: the current query string. */
  queryBase: string;
};

/**
 * The action codes, in plain words. One place, so the same event always reads the
 * same way.
 */
const ACTIONS: Record<string, string> = {
  "admin.conversation_viewed": "Opened a chat",
  "admin.file_viewed": "Opened a report",
  "admin.message_sent": "Sent a message as CareConnect Admin",
  "message.edited": "Edited a message",
  "message.removed": "Removed a message",
  "rx.cancelled_by_admin": "Cancelled a prescription",
  "admin.correction_draft_created": "Wrote a prescription correction",
  "admin.doctor_invited": "Invited a doctor by email",
  "admin.doctor_invite_created": "Created a doctor invite link",
  "admin.doctor_updated": "Changed a doctor's details",
  "admin.doctor_deactivated": "Deactivated a doctor",
  "admin.doctor_reactivated": "Reactivated a doctor",
  "admin.doctor_settings_updated": "Changed a doctor's settings",
  "admin.doctor_clinic_changed": "Moved a doctor to a clinic",
  "admin.patient_invited": "Invited a patient by email",
  "admin.patient_invite_created": "Created a patient invite link",
  "admin.patient_assigned": "Assigned a patient to a doctor",
  "admin.patient_doctor_added": "Added a doctor to a patient",
  "admin.patient_settings_updated": "Changed a patient's settings",
  "profile.details_changed": "Changed a patient's details",
  "profile.account_blocked": "Blocked a whole account",
  "profile.account_unblocked": "Unblocked a whole account",
  "conversation.blocked": "Blocked a chat",
  "conversation.unblocked": "Unblocked a chat",
  "meeting.scheduled": "Scheduled a meeting",
  "meeting.changed": "Changed a meeting",
  "meeting.cancelled": "Cancelled a meeting",
  "meeting.completed": "Completed a meeting",
  "meeting.reminded": "Sent a meeting reminder",
  "check_in.scheduled": "Scheduled a check-in",
  "check_in.changed": "Changed a check-in",
  "check_in.done": "Completed a check-in",
  "check_in.cancelled": "Cancelled a check-in",
  "check_in.reminded": "Sent a check-in reminder",
  "reminder.sent": "Sent a reminder",
};

/** A short, plain sentence for an action code. */
export function actionText(action: string): string {
  return ACTIONS[action] ?? action.replace(/[._]/g, " ");
}

/** Where the row's target can be seen, when it can. */
function targetHref(entry: AuditEntry): string | null {
  if (entry.target_type === "conversation" && entry.target_id) return `/admin/c/${entry.target_id}`;
  return null;
}

/** The details, as readable lines. Never raw JSON in the default view. */
function detailLines(details: Record<string, unknown>): string[] {
  const lines: string[] = [];
  const before = details.before as Record<string, unknown> | undefined;
  const after = details.after as Record<string, unknown> | undefined;
  if (before && typeof before.body === "string") lines.push(`Before: ${before.body}`);
  if (after && typeof after.body === "string") lines.push(`After: ${after.body}`);
  if (before && typeof before.file_name === "string") lines.push(`File: ${before.file_name}`);
  if (after && Array.isArray(after.medicines)) lines.push(`Medicines: ${(after.medicines as string[]).join(", ")}`);
  if (typeof details.file_name === "string" && !lines.some((l) => l.startsWith("File:"))) {
    lines.push(`File: ${details.file_name}`);
  }
  for (const [key, value] of Object.entries(details)) {
    if (key === "before" || key === "after" || key === "file_name") continue;
    if (value === null || value === undefined) continue;
    if (typeof value === "object") continue;
    lines.push(`${key.replace(/_/g, " ")}: ${String(value)}`);
  }
  return lines;
}

/**
 * The admin's audit log (decisions 54–55): who did what, and when. Newest first.
 * The details of a row open underneath, so the default view stays readable.
 */
export function AuditLogTable({ rows, actorNames, total, page, perPage = 50, queryBase }: Props) {
  const [open, setOpen] = useState<string | null>(null);
  const pages = Math.max(1, Math.ceil(total / perPage));

  if (rows.length === 0) {
    return (
      <Card tone="subtle" className="flex flex-1 items-center justify-center p-6">
        <EmptyState icon={ScrollText} title="Nothing recorded yet">
          Every change an admin makes shows up here.
        </EmptyState>
      </Card>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <Card tone="subtle" className="flex min-h-0 flex-1 flex-col overflow-hidden p-0">
        <ul className="flex min-h-0 flex-1 flex-col divide-y divide-line-soft overflow-y-auto">
          {rows.map((entry) => {
            const actorName = entry.actor_id ? (actorNames[entry.actor_id] ?? "Unknown") : "System";
            const href = targetHref(entry);
            const details = detailLines(entry.details ?? {});
            const isOpen = open === entry.id;
            return (
              <li key={entry.id} className="flex flex-col">
                <div className="flex items-start gap-3 p-3 sm:p-4">
                  {/* The "details" toggle. */}
                  <IconButton
                    label={isOpen ? "Hide the details" : "Show the details"}
                    aria-expanded={isOpen}
                    onClick={() => setOpen(isOpen ? null : entry.id)}
                    icon={
                      isOpen ? (
                        <ChevronDown aria-hidden="true" className="size-5" />
                      ) : (
                        <ChevronRight aria-hidden="true" className="size-5" />
                      )
                    }
                    className="rounded-tile text-ink-2 hover:bg-white/70"
                  />

                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="text-[15px] font-medium">{actionText(entry.action)}</span>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[13px] text-ink-2">{actorName}</span>
                      <Badge tone="outline">{entry.actor_role === "system" ? "System" : entry.actor_role}</Badge>
                      <span className="text-[13px] text-ink-2">
                        {formatDate(entry.created_at)} at {formatTime(entry.created_at)}
                      </span>
                    </div>
                    {href ? (
                      <Link href={href} className="text-[13px] font-medium text-forest underline">
                        Open the chat
                      </Link>
                    ) : null}
                  </div>
                </div>

                {isOpen ? (
                  <div className="border-t border-line-soft bg-white/50 px-4 py-3 pl-14">
                    {details.length > 0 ? (
                      <ul className="flex flex-col gap-1">
                        {details.map((line) => (
                          <li key={line} className="text-[14px] text-ink-2">
                            {line}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-[14px] text-ink-2">No further details.</p>
                    )}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </Card>

      {/* The pager. */}
      {pages > 1 ? (
        <div className="flex items-center justify-between gap-3">
          <span className="text-[13px] text-ink-2">
            Page {page} of {pages}
          </span>
          <div className="flex gap-2">
            {page > 1 ? (
              <Link
                href={`${queryBase}page=${page - 1}`}
                className="inline-flex min-h-11 items-center rounded-tile border border-line px-4 text-[14px] font-medium text-ink no-underline"
              >
                Previous
              </Link>
            ) : null}
            {page < pages ? (
              <Link
                href={`${queryBase}page=${page + 1}`}
                className="inline-flex min-h-11 items-center rounded-tile border border-line px-4 text-[14px] font-medium text-ink no-underline"
              >
                Next
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

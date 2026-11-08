"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CalendarClock, Clock, Lock, Search, UserPlus } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, CountBadge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/Feedback";
import { TextInput } from "@/components/ui/Field";
import { Segmented } from "@/components/ui/Segmented";
import { getBrowserClient } from "@/lib/supabase/client";
import { cn, formatRelative } from "@/lib/utils";
import type { InboxRow } from "@/lib/types";

/**
 * The conversation list. One component for two places (PLAN §6): the doctor's inbox column,
 * rendered once by the inbox layout so it stays put while conversations open beside it, and the
 * patient's list of doctors on /chat. On a phone the doctor's list hides itself when a
 * conversation is open.
 */
/** live=false (styleguide only) skips the realtime subscription. */
export function ConversationList({
  rows,
  viewerRole = "doctor",
  live = true,
  /** Conversations where a check-in is due today or overdue (doctor only). */
  dueCheckIns = [],
}: {
  rows: InboxRow[];
  /** "doctor" = the inbox; "patient" = the patient's list of doctors; "admin" = every chat. */
  viewerRole?: "doctor" | "patient" | "admin";
  live?: boolean;
  /** Conversation ids with a check-in due. Optional, so old callers keep working. */
  dueCheckIns?: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const patient = viewerRole === "patient";
  const admin = viewerRole === "admin";
  const due = useMemo(() => new Set(dueCheckIns), [dueCheckIns]);
  // The doctor's chats live at /doctor/c/<id>, the patient's at /chat/<id>, the admin's at /admin/c/<id>.
  const activeId = patient
    ? pathname.startsWith("/chat/")
      ? pathname.split("/")[2]
      : null
    : admin
      ? pathname.startsWith("/admin/c/")
        ? pathname.split("/")[3]
        : null
      : pathname.startsWith("/doctor/c/")
        ? pathname.split("/")[3]
        : null;
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const unreadTotal = rows.reduce((n, r) => n + r.unread_count, 0);

  useEffect(() => {
    if (!live) return;
    const supabase = getBrowserClient();
    const channel = supabase
      .channel("inbox")
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, () => router.refresh())
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [router, live]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (filter === "all" || r.unread_count > 0) &&
        (!q ||
          r.other_name.toLowerCase().includes(q) ||
          // The admin searches by either name.
          (r.other_doctor_name ?? "").toLowerCase().includes(q) ||
          (r.last_message_preview ?? "").toLowerCase().includes(q)),
    );
  }, [rows, query, filter]);

  return (
    <Card
      as="section"
      aria-label={patient ? "Your doctors" : "Conversations"}
      className={cn(
        "flex min-h-0 w-full flex-col overflow-hidden",
        !patient && "lg:w-[340px] lg:shrink-0",
        !patient && activeId && "hidden lg:flex",
      )}
    >
      <div className="flex flex-col gap-3 px-4 pt-4">
        <div className="flex items-center justify-between gap-2">
          {patient ? null : admin ? (
            <h1 className="text-[22px] font-semibold tracking-tight">Conversations</h1>
          ) : (
            <>
              <h1 className="text-[22px] font-semibold tracking-tight">Inbox</h1>
              <ButtonLink href="/doctor?invite=1" variant="soft" size="sm">
                <UserPlus aria-hidden="true" className="size-4" />
                Invite
              </ButtonLink>
            </>
          )}
        </div>
        <TextInput
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={patient ? "Search doctors" : admin ? "Search by name" : "Search patients"}
          aria-label={patient ? "Search doctors" : admin ? "Search by name" : "Search patients"}
          className="h-11"
        />
        {!admin ? (
          <Segmented
            label="Filter conversations"
            value={filter}
            onChange={setFilter}
            options={[
              { value: "all", label: "All" },
              { value: "unread", label: unreadTotal > 0 ? `Unread · ${unreadTotal}` : "Unread" },
            ]}
          />
        ) : null}
      </div>

      {visible.length === 0 ? (
        <EmptyState icon={Search} title="Nothing here">
          {rows.length === 0
            ? patient
              ? "Your doctor will appear here."
              : "Invite a patient to get started."
            : "No conversation matches that."}
        </EmptyState>
      ) : (
        <ul className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-2">
          {visible.map((c) => {
            const invited = c.other_status === "invited";
            const active = c.id === activeId;
            return (
              <li key={c.id}>
                <Link
                  href={patient ? `/chat/${c.id}` : admin ? `/admin/c/${c.id}` : `/doctor/c/${c.id}`}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex gap-3 rounded-tile p-3 text-ink no-underline hover:text-ink",
                    active ? "bg-white/90 shadow-lift" : "hover:bg-white/70",
                  )}
                >
                  <Avatar name={c.other_name} seed={c.other_id} doctor={patient} pending={!patient && !admin && invited} />
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <div className="flex justify-between gap-2">
                      <span className={cn("truncate", patient ? "text-base" : "text-[15px]", c.unread_count > 0 ? "font-semibold" : "font-medium")}>
                        {c.other_name}
                      </span>
                      {c.last_message_at ? (
                        <span className={cn("shrink-0 text-xs", c.unread_count > 0 ? "font-semibold text-forest" : "text-ink-2")}>
                          {formatRelative(c.last_message_at)}
                        </span>
                      ) : null}
                    </div>
                    {patient && c.other_specialty ? (
                      <span className="truncate text-sm text-ink-2">{c.other_specialty}</span>
                    ) : null}
                    {/* The admin's row names both people: "Patient · Dr. X". */}
                    {admin && c.other_doctor_name ? (
                      <span className="truncate text-[13px] text-ink-2">{c.other_doctor_name}</span>
                    ) : null}
                    <div className="flex items-center justify-between gap-2">
                      {!patient && !admin && invited ? (
                        <span className="flex items-center gap-1 text-[13px] text-ink-2">
                          <Clock aria-hidden="true" className="size-3.5" /> Invite pending
                        </span>
                      ) : (
                        <span
                          className={cn(
                            "truncate",
                            patient ? "text-base" : "text-[13px]",
                            c.unread_count > 0 ? "font-medium" : "text-ink-2",
                          )}
                        >
                          {c.last_message_preview ?? "No messages yet"}
                        </span>
                      )}
                      {!admin ? <CountBadge count={c.unread_count} /> : null}
                    </div>
                    {/* The admin sees the chat's block (0005): text + icon, never colour alone. */}
                    {admin && c.blocked_at ? (
                      <span className="mt-1 flex items-center gap-1.5">
                        <Badge tone="warning" icon={<Lock aria-hidden="true" />}>
                          Blocked
                        </Badge>
                      </span>
                    ) : null}
                    {/* A check-in is due today or overdue: say so, with an icon (never colour alone). */}
                    {!patient && !admin && due.has(c.id) ? (
                      <span className="mt-1 flex items-center gap-1.5">
                        <Badge tone="warning" icon={<CalendarClock aria-hidden="true" />}>
                          Check-in due
                        </Badge>
                      </span>
                    ) : null}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

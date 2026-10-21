"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Clock, Search, UserPlus } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { CountBadge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/Feedback";
import { TextInput } from "@/components/ui/Field";
import { Segmented } from "@/components/ui/Segmented";
import { getBrowserClient } from "@/lib/supabase/client";
import { cn, formatRelative } from "@/lib/utils";
import type { InboxRow } from "@/lib/types";

/**
 * The doctor's inbox column. Rendered once by the inbox layout, so it stays put while
 * conversations open beside it. On a phone it hides itself when one is open.
 */
/** live=false (styleguide only) skips the realtime subscription. */
export function ConversationList({ rows, live = true }: { rows: InboxRow[]; live?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const activeId = pathname.startsWith("/doctor/c/") ? pathname.split("/")[3] : null;
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
        (!q || r.other_name.toLowerCase().includes(q) || (r.last_message_preview ?? "").toLowerCase().includes(q)),
    );
  }, [rows, query, filter]);

  return (
    <Card
      as="section"
      aria-label="Conversations"
      className={cn("flex min-h-0 w-full flex-col overflow-hidden lg:w-[340px] lg:shrink-0", activeId && "hidden lg:flex")}
    >
      <div className="flex flex-col gap-3 px-4 pt-4">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-[22px] font-semibold tracking-tight">Inbox</h1>
          <ButtonLink href="/doctor?invite=1" variant="soft" size="sm">
            <UserPlus aria-hidden="true" className="size-4" />
            Invite
          </ButtonLink>
        </div>
        <TextInput
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search patients"
          aria-label="Search patients"
          className="h-11"
        />
        <Segmented
          label="Filter conversations"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "All" },
            { value: "unread", label: unreadTotal > 0 ? `Unread · ${unreadTotal}` : "Unread" },
          ]}
        />
      </div>

      {visible.length === 0 ? (
        <EmptyState icon={Search} title="Nothing here">
          {rows.length === 0 ? "Invite a patient to get started." : "No conversation matches that."}
        </EmptyState>
      ) : (
        <ul className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-2">
          {visible.map((c) => {
            const invited = c.other_status === "invited";
            const active = c.id === activeId;
            return (
              <li key={c.id}>
                <Link
                  href={`/doctor/c/${c.id}`}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex gap-3 rounded-tile p-3 text-ink no-underline hover:text-ink",
                    active ? "bg-white/90 shadow-lift" : "hover:bg-white/70",
                  )}
                >
                  <Avatar name={c.other_name} seed={c.other_id} pending={invited} />
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <div className="flex justify-between gap-2">
                      <span className={cn("truncate text-[15px]", c.unread_count > 0 ? "font-semibold" : "font-medium")}>{c.other_name}</span>
                      {c.last_message_at ? (
                        <span className={cn("shrink-0 text-xs", c.unread_count > 0 ? "font-semibold text-forest" : "text-ink-2")}>
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
      )}
    </Card>
  );
}

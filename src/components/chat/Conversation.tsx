"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Search, X } from "lucide-react";
import { markRead, sendAttachment, sendMessage } from "@/app/actions/messages";
import { Button, IconButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Feedback";
import { TextInput } from "@/components/ui/Field";
import { PageHeader } from "@/components/layout/PageHeader";
import { ChatDivider } from "@/components/chat/MessageBubble";
import { MessageItem } from "@/components/chat/MessageItem";
import { Composer } from "@/components/chat/Composer";
import { AttachSheet } from "@/components/chat/AttachSheet";
import { getBrowserClient } from "@/lib/supabase/client";
import { uploadAttachment } from "@/lib/upload";
import { cn, formatDay, isNewDay } from "@/lib/utils";
import type { Message, PrescriptionWithPeople } from "@/lib/types";

/** A message the browser has accepted but the server hasn't confirmed yet. */
type Pending = {
  tempId: string;
  createdAt: string;
  body: string | null;
  file?: File;
  status: "queued" | "sending" | "failed";
};

type ConversationProps = {
  conversationId: string;
  meId: string;
  /** The other person. Used in the composer and the attach sheet. */
  otherName: string;
  initialMessages: Message[];
  prescriptions: PrescriptionWithPeople[];
  /** Prescription ids that a newer issued one has replaced. */
  replacedRxIds: string[];
  header: { backHref?: string; backLabel?: string; leading?: ReactNode; title: string; subtitle?: ReactNode; actions?: ReactNode };
  /** Link prefixes. A message or prescription id is appended to each. */
  fileHrefBase: string;
  rxHrefBase: string;
  /** Doctor only: "Issue a correction" on an issued card. */
  correctionHrefBase?: string;
  /** Open the attach sheet on load (patient's "Send a report" tile). */
  attachOnOpen?: boolean;
  /** Tap-to-send suggestions shown when the conversation is empty. */
  starters?: string[];
};

/**
 * The whole conversation: message list, realtime, read receipts, sending and the composer.
 * Used by BOTH /chat (patient) and /doctor/c/[id]. The only difference is the props.
 */
export function Conversation({
  conversationId,
  meId,
  otherName,
  initialMessages,
  prescriptions,
  replacedRxIds,
  header,
  fileHrefBase,
  rxHrefBase,
  correctionHrefBase,
  attachOnOpen,
  starters,
}: ConversationProps) {
  const router = useRouter();
  const [confirmed, setConfirmed] = useState<Message[]>([]);
  const [pending, setPending] = useState<Pending[]>([]);
  const [draft, setDraft] = useState("");
  const [offline, setOffline] = useState(false);
  const [attachOpen, setAttachOpen] = useState(!!attachOnOpen);
  const [query, setQuery] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  // tempIds already on the wire, so a re-run of the effect below never sends twice.
  const inFlight = useRef<Set<string>>(new Set());

  // Server data wins; realtime and just-sent messages are merged on top by id.
  const messages = useMemo(() => {
    const byId = new Map<string, Message>();
    for (const m of initialMessages) byId.set(m.id, m);
    for (const m of confirmed) byId.set(m.id, m);
    return [...byId.values()].sort((a, b) => a.created_at.localeCompare(b.created_at));
  }, [initialMessages, confirmed]);

  // Where the "N new messages" divider goes. Captured once, so it survives marking them read.
  const [newMarker] = useState(() => {
    const unread = initialMessages.filter((m) => m.sender_id !== meId && !m.read_at);
    return unread.length ? { id: unread[0].id, count: unread.length } : null;
  });

  const rxById = useMemo(() => new Map(prescriptions.map((p) => [p.id, p])), [prescriptions]);
  const replaced = useMemo(() => new Set(replacedRxIds), [replacedRxIds]);

  const lastSeenId = useMemo(
    () => [...messages].reverse().find((m) => m.sender_id === meId && m.read_at)?.id,
    [messages, meId],
  );

  useEffect(() => {
    const sync = () => setOffline(!navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  useEffect(() => {
    void markRead(conversationId).then(() => router.refresh());
  }, [conversationId, router]);

  useEffect(() => {
    const supabase = getBrowserClient();
    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        (payload: { new: Message }) => {
          const row = payload.new;
          if (!row?.id) return;
          setConfirmed((prev) => [...prev.filter((m) => m.id !== row.id), row]);
          if (row.sender_id !== meId) void markRead(conversationId);
          // The card needs the prescription itself, which only the server can read.
          if (row.kind === "prescription") router.refresh();
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversationId, meId, router]);

  const deliver = useCallback(
    async (item: Pending) => {
      setPending((prev) => prev.map((p) => (p.tempId === item.tempId ? { ...p, status: "sending" } : p)));
      try {
        const result = item.file
          ? await (async () => {
              const uploaded = await uploadAttachment(conversationId, item.file!);
              return sendAttachment({ ...uploaded, conversationId, note: item.body ?? undefined });
            })()
          : await sendMessage(conversationId, item.body ?? "");
        if (!result.ok || !result.data) throw new Error("not sent");
        const message = result.data;
        setConfirmed((prev) => [...prev, message]);
        setPending((prev) => prev.filter((p) => p.tempId !== item.tempId));
        router.refresh();
      } catch {
        setPending((prev) => prev.map((p) => (p.tempId === item.tempId ? { ...p, status: "failed" } : p)));
      } finally {
        inFlight.current.delete(item.tempId);
      }
    },
    [conversationId, router],
  );

  // Everything queues first, then this sends it. Offline messages wait here until the browser is back.
  useEffect(() => {
    if (offline) return;
    for (const item of pending) {
      if (item.status !== "queued" || inFlight.current.has(item.tempId)) continue;
      inFlight.current.add(item.tempId);
      void deliver(item);
    }
  }, [offline, pending, deliver]);

  function queue(body: string | null, file?: File) {
    setPending((prev) => [
      ...prev,
      { tempId: crypto.randomUUID(), createdAt: new Date().toISOString(), body, file, status: "queued" },
    ]);
  }

  function sendDraft() {
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    queue(text);
  }

  const searching = query !== null && query.trim().length > 0;
  const visible = searching
    ? messages.filter((m) => (m.body ?? m.file_name ?? "").toLowerCase().includes(query!.trim().toLowerCase()))
    : messages;

  useEffect(() => {
    if (!searching) bottomRef.current?.scrollIntoView({ block: "end" });
  }, [visible.length, pending.length, searching]);

  type Row = { message: Message; pending?: Pending };
  const rows: Row[] = [
    ...visible.map((message) => ({ message })),
    ...(searching
      ? []
      : pending.map((p) => ({
          pending: p,
          message: {
            id: p.tempId,
            conversation_id: conversationId,
            sender_id: meId,
            kind: p.file ? ("file" as const) : ("text" as const),
            body: p.body,
            file_path: null,
            file_name: p.file?.name ?? null,
            file_size: p.file?.size ?? null,
            file_type: p.file?.type ?? null,
            prescription_id: null,
            read_at: null,
            created_at: p.createdAt,
          },
        }))),
  ];

  const pendingStatus = { queued: "Waiting to send", sending: "Sending…", failed: "Not sent" };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader
        {...header}
        actions={
          <>
            {header.actions}
            <IconButton
              label={query === null ? "Search messages" : "Close search"}
              icon={query === null ? <Search className="size-5" /> : <X className="size-5" />}
              onClick={() => setQuery(query === null ? "" : null)}
            />
          </>
        }
      />

      {query !== null ? (
        <div className="px-1 pt-2">
          <TextInput
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search this conversation"
            aria-label="Search this conversation"
          />
        </div>
      ) : null}

      <div className={cn("flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-1 py-3", rows.length === 0 && "justify-center")}>
        {rows.length === 0 ? (
          searching ? (
            <EmptyState icon={Search} title="No messages found">
              Try a different word.
            </EmptyState>
          ) : (
            <EmptyState icon={MessageCircle} title={`Start a conversation with ${otherName}`}>
              {starters?.length ? "Tap one of these, or type your own message." : "Type a message below to begin."}
            </EmptyState>
          )
        ) : null}

        {rows.length === 0 && starters?.length ? (
          <div className="mx-auto flex w-full max-w-sm flex-col gap-2">
            {starters.map((s) => (
              <Button key={s} variant="secondary" block onClick={() => setDraft(s)}>
                {s}
              </Button>
            ))}
          </div>
        ) : null}

        {rows.map(({ message, pending: p }, i) => {
          const prevAt = i > 0 ? rows[i - 1].message.created_at : null;
          const mine = message.sender_id === meId;
          const rx = message.prescription_id ? rxById.get(message.prescription_id) : undefined;
          return (
            <div key={message.id} className="flex flex-col gap-2.5">
              {isNewDay(prevAt, message.created_at) ? <ChatDivider>{formatDay(message.created_at)}</ChatDivider> : null}
              {newMarker && message.id === newMarker.id ? (
                <ChatDivider tone="new">
                  {newMarker.count} new {newMarker.count === 1 ? "message" : "messages"}
                </ChatDivider>
              ) : null}
              <MessageItem
                message={message}
                mine={mine}
                prescription={rx}
                replaced={rx ? replaced.has(rx.id) : false}
                tone={p ? (p.status === "failed" ? "failed" : "pending") : "default"}
                status={p ? pendingStatus[p.status] : message.id === lastSeenId ? "Seen" : undefined}
                fileHref={message.file_path ? `${fileHrefBase}${message.id}` : undefined}
                rxHref={rx ? `${rxHrefBase}${rx.id}` : undefined}
                correctHref={rx && correctionHrefBase && !replaced.has(rx.id) ? `${correctionHrefBase}${rx.id}` : undefined}
                actions={
                  p?.status === "failed" ? (
                    <>
                      <Button
                        size="sm"
                        variant="soft"
                        onClick={() => setPending((prev) => prev.map((x) => (x.tempId === p.tempId ? { ...x, status: "queued" } : x)))}
                      >
                        Try again
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setPending((prev) => prev.filter((x) => x.tempId !== p.tempId))}>
                        Remove
                      </Button>
                    </>
                  ) : undefined
                }
              />
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <Composer
        value={draft}
        onChange={setDraft}
        onSend={sendDraft}
        onAttach={() => setAttachOpen(true)}
        offline={offline}
        placeholder={`Message ${otherName}`}
      />

      <AttachSheet
        open={attachOpen}
        onClose={() => setAttachOpen(false)}
        recipientName={otherName}
        onSend={(file, note) => queue(note.trim() || null, file)}
      />
    </div>
  );
}

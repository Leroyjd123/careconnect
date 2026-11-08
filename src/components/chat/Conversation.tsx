"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Pencil, Search, Trash2, Video, X } from "lucide-react";
import { markRead, sendAttachment, sendMessage } from "@/app/actions/messages";
import { sendAdminMessage, editAdminMessage, removeAdminMessage } from "@/app/actions/admin";
import { Button, ButtonLink, IconButton } from "@/components/ui/Button";
import { Banner, EmptyState } from "@/components/ui/Feedback";
import { TextArea, TextInput } from "@/components/ui/Field";
import { Dialog } from "@/components/ui/Dialog";
import { PageHeader } from "@/components/layout/PageHeader";
import { ChatDivider } from "@/components/chat/MessageBubble";
import { MessageItem } from "@/components/chat/MessageItem";
import { Composer } from "@/components/chat/Composer";
import { AttachSheet } from "@/components/chat/AttachSheet";
import { getBrowserClient } from "@/lib/supabase/client";
import { uploadAttachment } from "@/lib/upload";
import { cn, formatDay, isNewDay } from "@/lib/utils";
import type { CheckIn, Meeting, Message, PrescriptionWithPeople } from "@/lib/types";

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
  /** The meetings and check-ins of this conversation, for the cards in the chat. */
  meetings?: Meeting[];
  checkIns?: CheckIn[];
  /** Who is looking. The doctor sees the appointment actions; the patient only joins. */
  viewerRole?: "doctor" | "patient" | "admin";
  /** Where an appointment popup opens, e.g. "/doctor/c/<id>?appt=". */
  apptHrefBase?: string;
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
  /** Patient only: the text "Request a meeting" puts in the composer (decision 31). */
  requestMeetingText?: string;
  /** When set, the conversation is read-only (blocked, or the doctor is deactivated): this text replaces the composer. */
  readOnlyNotice?: string;
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
  meetings = [],
  checkIns = [],
  viewerRole = "patient",
  apptHrefBase,
  header,
  fileHrefBase,
  rxHrefBase,
  correctionHrefBase,
  attachOnOpen,
  starters,
  requestMeetingText,
  readOnlyNotice,
}: ConversationProps) {
  const router = useRouter();
  const [confirmed, setConfirmed] = useState<Message[]>([]);
  const [pending, setPending] = useState<Pending[]>([]);
  const [draft, setDraft] = useState("");
  const [offline, setOffline] = useState(false);
  const [attachOpen, setAttachOpen] = useState(!!attachOnOpen && !readOnlyNotice);
  const [query, setQuery] = useState<string | null>(null);
  // The admin's moderation: the message being edited, and the one being removed.
  const [adminEdit, setAdminEdit] = useState<Message | null>(null);
  const [adminEditBody, setAdminEditBody] = useState("");
  const [adminRemove, setAdminRemove] = useState<Message | null>(null);
  const [adminBusy, setAdminBusy] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  // The composer's input, so "Request a meeting" can put the text in and focus it.
  const requestRef = useRef<HTMLTextAreaElement>(null);
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
  const meetingById = useMemo(() => new Map(meetings.map((m) => [m.id, m])), [meetings]);
  const checkInById = useMemo(() => new Map(checkIns.map((c) => [c.id, c])), [checkIns]);

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
    // The admin is not a chat member, so there is nothing for them to mark read.
    if (viewerRole === "admin") return;
    void markRead(conversationId).then(() => router.refresh());
  }, [conversationId, router, viewerRole]);

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
      // A meeting or check-in row changing (moved, cancelled, done) changes the card.
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "meetings", filter: `conversation_id=eq.${conversationId}` },
        () => router.refresh(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "check_ins", filter: `conversation_id=eq.${conversationId}` },
        () => router.refresh(),
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
          : viewerRole === "admin"
            ? // The admin sends through the service role, labelled "CareConnect Admin" (decision 48).
              await sendAdminMessage(conversationId, item.body ?? "")
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
    [conversationId, router, viewerRole],
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

  /** The admin edits a message (decision 49). */
  async function saveAdminEdit() {
    if (!adminEdit) return;
    setAdminBusy(true);
    setAdminError(null);
    const result = await editAdminMessage(adminEdit.id, adminEditBody);
    setAdminBusy(false);
    if (!result.ok) {
      setAdminError(result.error);
      return;
    }
    setAdminEdit(null);
    router.refresh();
  }

  /** The admin removes a message (decision 50). */
  async function confirmAdminRemove() {
    if (!adminRemove) return;
    setAdminBusy(true);
    setAdminError(null);
    const result = await removeAdminMessage(adminRemove.id);
    setAdminBusy(false);
    if (!result.ok) {
      setAdminError(result.error);
      return;
    }
    setAdminRemove(null);
    router.refresh();
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
            deleted_at: null,
            meeting_id: null,
            check_in_id: null,
            // Local-only row; bubbles use `mine`, not sender_role. Phase E passes the real viewer role.
            sender_role: viewerRole === "admin" ? ("admin" as const) : ("patient" as const),
            edited_at: null,
            removed_at: null,
            removed_by: null,
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
          const meeting = message.meeting_id ? meetingById.get(message.meeting_id) : undefined;
          const checkIn = message.check_in_id ? checkInById.get(message.check_in_id) : undefined;
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
                meeting={meeting}
                checkIn={checkIn}
                viewerRole={viewerRole}
                appointmentActions={
                  viewerRole === "doctor" && apptHrefBase && (meeting || checkIn) ? (
                    <ButtonLink
                      href={`${apptHrefBase}${meeting ? meeting.id : checkIn!.id}`}
                      variant="outline"
                      size="sm"
                    >
                      Manage
                    </ButtonLink>
                  ) : null
                }
                tone={p ? (p.status === "failed" ? "failed" : "pending") : "default"}
                status={p ? pendingStatus[p.status] : message.id === lastSeenId ? "Seen" : undefined}
                adminActions={
                  viewerRole === "admin" && !message.removed_at ? (
                    <>
                      {message.kind === "text" ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setAdminEditBody(message.body ?? "");
                            setAdminError(null);
                            setAdminEdit(message);
                          }}
                        >
                          <Pencil aria-hidden="true" className="size-4" />
                          Edit
                        </Button>
                      ) : null}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setAdminError(null);
                          setAdminRemove(message);
                        }}
                      >
                        <Trash2 aria-hidden="true" className="size-4" />
                        Remove
                      </Button>
                    </>
                  ) : undefined
                }
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

      {readOnlyNotice ? (
        <Banner>{readOnlyNotice}</Banner>
      ) : (
        <>
          {/* "Request a meeting" is just a message (decision 31). */}
          {requestMeetingText ? (
            <div className="flex justify-start px-1">
              <Button
                variant="soft"
                size="sm"
                onClick={() => {
                  setDraft(requestMeetingText);
                  requestRef.current?.focus();
                }}
              >
                <Video aria-hidden="true" className="size-4" />
                Request a meeting
              </Button>
            </div>
          ) : null}
          <Composer
            value={draft}
            onChange={setDraft}
            onSend={sendDraft}
            // The admin sends text only: RLS only lets a chat member upload a file.
            onAttach={viewerRole === "admin" ? undefined : () => setAttachOpen(true)}
            offline={offline}
            placeholder={viewerRole === "admin" ? `Message as CareConnect Admin` : `Message ${otherName}`}
            inputRef={requestRef}
          />
        </>
      )}

      {viewerRole === "admin" ? null : (
        <AttachSheet
          open={attachOpen}
          onClose={() => setAttachOpen(false)}
          recipientName={otherName}
          onSend={(file, note) => queue(note.trim() || null, file)}
        />
      )}

      {/* The admin edits a message (decision 49). */}
      {adminEdit ? (
        <Dialog
          open
          onClose={() => setAdminEdit(null)}
          title="Edit this message"
          description="Both the patient and the doctor will see the change, marked as edited."
          footer={
            <>
              <Button variant="ghost" onClick={() => setAdminEdit(null)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={() => void saveAdminEdit()} disabled={adminBusy}>
                Save change
              </Button>
            </>
          }
        >
          <div className="flex flex-col gap-3">
            {adminError ? <Banner tone="danger">{adminError}</Banner> : null}
            <TextArea value={adminEditBody} onChange={(e) => setAdminEditBody(e.target.value)} rows={5} />
          </div>
        </Dialog>
      ) : null}

      {/* The admin removes a message (decision 50). */}
      {adminRemove ? (
        <Dialog
          open
          onClose={() => setAdminRemove(null)}
          title="Remove this message?"
          description="Both the patient and the doctor will see “Message removed by admin”. A report's file is deleted too."
          footer={
            <>
              <Button variant="ghost" onClick={() => setAdminRemove(null)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={() => void confirmAdminRemove()} disabled={adminBusy}>
                <Trash2 aria-hidden="true" className="size-4" />
                Remove message
              </Button>
            </>
          }
        >
          {adminError ? <Banner tone="danger">{adminError}</Banner> : null}
        </Dialog>
      ) : null}
    </div>
  );
}

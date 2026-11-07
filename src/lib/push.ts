import "server-only";
import { after } from "next/server";
import webpush from "web-push";
import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type PushEvent =
  | "message"
  | "file"
  | "prescription"
  /** A meeting was scheduled, moved or cancelled. */
  | "meeting"
  | "meeting_scheduled"
  | "meeting_moved"
  | "meeting_cancelled"
  | "meeting_completed"
  /** The 15-minute reminder before a meeting starts. */
  | "meeting_reminder"
  /** A check-in was set, moved or cancelled. */
  | "check_in"
  | "check_in_set"
  | "check_in_moved"
  | "check_in_cancelled"
  | "check_in_done"
  /** The reminder on the day a check-in is due. */
  | "check_in_reminder";

type Target = { endpoint: string; p256dh: string; auth: string; recipient_role: "doctor" | "patient"; sender_name: string };

/**
 * Tell the other person in a conversation that something arrived.
 * Lock-screen safe: names the sender, never the message or anything medical.
 * Looks up devices now (needs the request's session) and sends after the response,
 * so a slow or failing push service never delays or fails the send itself.
 */
export async function notifyConversation(conversationId: string, event: PushEvent) {
  try {
    await queuePush(conversationId, event);
  } catch (e) {
    // Never let a notification problem (bad keys, missing migration) fail the actual send.
    console.error("push setup failed", e);
  }
}

async function queuePush(conversationId: string, event: PushEvent) {
  const vapid = env.vapid();
  if (!vapid) return;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("push_targets", { conv: conversationId });
  if (error || !data?.length) return;
  const targets = data as Target[];

  webpush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);

  after(async () => {
    await Promise.all(
      targets.map(async (t) => {
        const payload = JSON.stringify({
          // The title names the sender, so the right doctor is obvious on a lock screen.
          title: t.sender_name,
          body: bodyFor(event),
          url: urlFor(t.recipient_role, conversationId),
          // One notification per conversation: a burst of messages replaces rather than stacks.
          tag: `conv-${conversationId}`,
        });
        try {
          await webpush.sendNotification({ endpoint: t.endpoint, keys: { p256dh: t.p256dh, auth: t.auth } }, payload, { TTL: 60 * 60 * 24 });
        } catch (e) {
          const status = (e as { statusCode?: number }).statusCode;
          // The device unsubscribed or the browser was reset: forget it.
          if (status === 404 || status === 410) await supabase.rpc("prune_push_subscription", { ep: t.endpoint });
          else console.error("push failed", status ?? e);
        }
      }),
    );
  });
}

/**
 * Push to both sides of a conversation without a signed-in user.
 *
 * The cron route has no session, so push_targets() (which needs auth.uid()) can't be
 * called the normal way. This reads the two members' devices with the service role and
 * sends the same lock-screen-safe note. The title is the sender's name, never the
 * meeting time, the link, the note or the reason.
 */
export async function notifyConversationAsSystem(conversationId: string, event: PushEvent, senderName: string) {
  try {
    const vapid = env.vapid();
    if (!vapid) return;

    const admin = createAdminClient();
    const { data: conv } = await admin
      .from("conversations")
      .select("doctor_id, patient_id")
      .eq("id", conversationId)
      .maybeSingle();
    if (!conv) return;

    const { data: rows, error } = await admin
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth, user_id")
      .in("user_id", [conv.doctor_id, conv.patient_id]);
    if (error || !rows?.length) return;

    webpush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);
    await Promise.all(
      rows.map(async (r) => {
        const payload = JSON.stringify({
          title: senderName,
          body: bodyFor(event),
          url: urlFor(r.user_id === conv.doctor_id ? "doctor" : "patient", conversationId),
          tag: `conv-${conversationId}`,
        });
        try {
          await webpush.sendNotification({ endpoint: r.endpoint, keys: { p256dh: r.p256dh, auth: r.auth } }, payload, { TTL: 60 * 60 * 24 });
        } catch (e) {
          const status = (e as { statusCode?: number }).statusCode;
          if (status === 404 || status === 410) await admin.from("push_subscriptions").delete().eq("endpoint", r.endpoint);
          else console.error("push failed", status ?? e);
        }
      }),
    );
  } catch (e) {
    // A notification problem must never fail the cron run.
    console.error("system push failed", e);
  }
}

/** What happened, and nothing more. Never the message or any medical detail. */
function bodyFor(event: PushEvent) {
  if (event === "prescription") return "Sent you a prescription.";
  if (event === "file") return "Sent you a file.";
  if (event === "meeting_scheduled") return "Scheduled a meeting.";
  if (event === "meeting_moved") return "Moved a meeting.";
  if (event === "meeting_cancelled") return "Cancelled a meeting.";
  if (event === "meeting_completed") return "Marked a meeting as done.";
  if (event === "meeting_reminder") return "Meeting in 15 minutes.";
  if (event === "check_in_set") return "Set a check-in.";
  if (event === "check_in_moved") return "Moved a check-in.";
  if (event === "check_in_cancelled") return "Cancelled a check-in.";
  if (event === "check_in_done") return "Marked a check-in as done.";
  if (event === "check_in_reminder") return "Check-in due today.";
  if (event === "meeting") return "Set up a meeting.";
  if (event === "check_in") return "Set a check-in.";
  return "New message.";
}

/** Where the notification opens. A patient goes straight to that doctor's chat. */
function urlFor(role: "doctor" | "patient", conversationId: string) {
  if (role === "doctor") return `/doctor/c/${conversationId}`;
  return `/chat/${conversationId}`;
}

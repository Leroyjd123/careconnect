import "server-only";
import { after } from "next/server";
import webpush from "web-push";
import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export type PushEvent = "message" | "file" | "prescription";

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
          title: "CareConnect",
          body: bodyFor(event, t.sender_name),
          url: urlFor(event, t.recipient_role, conversationId),
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

function bodyFor(event: PushEvent, sender: string) {
  if (event === "prescription") return `${sender} sent you a prescription.`;
  if (event === "file") return `${sender} sent a file.`;
  return `New message from ${sender}.`;
}

function urlFor(event: PushEvent, role: "doctor" | "patient", conversationId: string) {
  if (role === "doctor") return `/doctor/c/${conversationId}`;
  return event === "prescription" ? "/prescriptions" : "/chat";
}

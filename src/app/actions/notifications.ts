"use server";

import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult, PushSubscriptionInput } from "@/lib/types";

/** Remember this browser so we can notify it. Called after the user allows notifications. */
export async function savePushSubscription(sub: PushSubscriptionInput, userAgent?: string): Promise<ActionResult> {
  const profile = await requireProfile();
  if (!sub?.endpoint?.startsWith("https://") || !sub.keys?.p256dh || !sub.keys?.auth) {
    return { ok: false, error: "We couldn't turn on notifications. Please try again." };
  }

  const supabase = await createClient();
  // Same browser, new keys (or a different person on a shared device): replace the old row.
  await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
  const { error } = await supabase.from("push_subscriptions").insert({
    user_id: profile.id,
    endpoint: sub.endpoint,
    p256dh: sub.keys.p256dh,
    auth: sub.keys.auth,
    user_agent: userAgent?.slice(0, 300) ?? null,
  });
  if (error) {
    console.error("save push subscription failed", error);
    return { ok: false, error: "We couldn't turn on notifications. Please try again." };
  }
  return { ok: true };
}

/** Forget this browser. Called when the user turns notifications off, and on sign-out. */
export async function deletePushSubscription(endpoint: string): Promise<ActionResult> {
  await requireProfile();
  const supabase = await createClient();
  const { error } = await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
  if (error) return { ok: false, error: "We couldn't turn off notifications. Please try again." };
  return { ok: true };
}

import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Profile } from "@/lib/types";

/**
 * One audit_log row for a write made with the service role (0005).
 * DB triggers only log writes made with a user session, so every service-role write
 * that changes a meeting, check-in, block, patient details, message or prescription calls this.
 * Never throws: a failed log is reported, the user's action still stands.
 */
export async function logAudit(
  admin: SupabaseClient,
  actor: Pick<Profile, "id" | "role"> | null,
  entry: { action: string; targetType: string; targetId?: string | null; details?: Record<string, unknown> },
) {
  const { error } = await admin.from("audit_log").insert({
    actor_id: actor?.id ?? null,
    actor_role: actor?.role ?? "system",
    action: entry.action,
    target_type: entry.targetType,
    target_id: entry.targetId ?? null,
    details: entry.details ?? {},
  });
  if (error) console.error("audit_log insert failed", entry.action, error);
}

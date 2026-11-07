import { NextResponse } from "next/server";
import { logAudit } from "@/lib/audit";
import { notifyConversationAsSystem } from "@/lib/push";
import { createAdminClient } from "@/lib/supabase/admin";
import { hourInAppZone, todayInAppZone } from "@/lib/utils";
import type { CheckIn, Meeting } from "@/lib/types";

/**
 * The reminders cron (PLAN §7 Phase D, decision 38).
 *
 * Called every 5 minutes by cron-job.org with:
 *   Authorization: Bearer <CRON_SECRET>
 *
 * It does three things:
 *   a) reminds both sides 15 minutes before a meeting starts,
 *   b) marks a meeting complete 15 minutes after it started, when the doctor's own
 *      setting says so (decision 36, Q-I),
 *   c) reminds both sides once on the morning a check-in is due.
 *
 * Everything here runs with the service role, so every change writes its own
 * audit_log row (DB triggers only log writes made with a user session).
 */

const REMINDER_WINDOW_MIN = 15;
const AUTO_COMPLETE_MIN = 15;

export async function GET(request: Request) {
  // The secret is the only thing that opens this route. Never say what is wrong.
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get("authorization");
  if (!secret || header !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date();
  const counts = { meetingReminders: 0, meetingsCompleted: 0, checkInReminders: 0 };

  // ── a) Meeting reminders: starting within the next 15 minutes ──────
  const windowEnd = new Date(now.getTime() + REMINDER_WINDOW_MIN * 60_000).toISOString();
  const { data: dueMeetings } = await admin
    .from("meetings")
    .select("*")
    .eq("status", "scheduled")
    .is("reminded_at", null)
    .gt("starts_at", now.toISOString())
    .lte("starts_at", windowEnd);

  for (const m of (dueMeetings ?? []) as Meeting[]) {
    const { error } = await admin.from("meetings").update({ reminded_at: now.toISOString() }).eq("id", m.id).is("reminded_at", null);
    // Another run may have set it already; then there is nothing to send.
    if (error) {
      console.error("reminders: meeting not marked reminded", m.id, error);
      continue;
    }
    await notifyConversationAsSystem(m.conversation_id, "meeting_reminder", await senderName(admin, m.doctor_id));
    await logAudit(admin, null, { action: "meeting.reminded", targetType: "meeting", targetId: m.id });
    counts.meetingReminders += 1;
  }

  // ── b) Auto-complete: started 15 minutes ago, and the doctor wants it ──
  const autoCompleteBefore = new Date(now.getTime() - AUTO_COMPLETE_MIN * 60_000).toISOString();
  const { data: toComplete } = await admin
    .from("meetings")
    .select("*")
    .eq("status", "scheduled")
    .lte("starts_at", autoCompleteBefore);

  for (const m of (toComplete ?? []) as Meeting[]) {
    const { data: doctor } = await admin.from("profiles").select("meeting_auto_complete").eq("id", m.doctor_id).maybeSingle();
    if (!doctor?.meeting_auto_complete) continue;
    const { error } = await admin.from("meetings").update({ status: "completed" }).eq("id", m.id).eq("status", "scheduled");
    if (error) {
      console.error("reminders: meeting not completed", m.id, error);
      continue;
    }
    await logAudit(admin, null, { action: "meeting.completed", targetType: "meeting", targetId: m.id, details: { auto: true } });
    counts.meetingsCompleted += 1;
  }

  // ── c) Check-in reminders: due today, once, in the morning only ────
  // After 08:00 in the app time zone, so the patient hears about it in the day.
  if (hourInAppZone(now) >= 8) {
    const today = todayInAppZone(now);
    const { data: dueCheckIns } = await admin
      .from("check_ins")
      .select("*")
      .eq("status", "scheduled")
      .is("reminded_at", null)
      .lte("due_on", today);

    for (const c of (dueCheckIns ?? []) as CheckIn[]) {
      const { error } = await admin.from("check_ins").update({ reminded_at: now.toISOString() }).eq("id", c.id).is("reminded_at", null);
      if (error) {
        console.error("reminders: check-in not marked reminded", c.id, error);
        continue;
      }
      await notifyConversationAsSystem(c.conversation_id, "check_in_reminder", await senderName(admin, c.doctor_id));
      await logAudit(admin, null, { action: "check_in.reminded", targetType: "check_in", targetId: c.id });
      counts.checkInReminders += 1;
    }
  }

  return NextResponse.json(counts);
}

/** The doctor's name, for the notification title. Never anything medical. */
async function senderName(admin: ReturnType<typeof createAdminClient>, doctorId: string) {
  const { data } = await admin.from("profiles").select("full_name").eq("id", doctorId).maybeSingle();
  const name = (data as { full_name: string | null } | null)?.full_name?.trim();
  return name || "CareConnect";
}

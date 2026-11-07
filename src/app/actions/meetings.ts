"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { notifyConversation, type PushEvent } from "@/lib/push";
import { toIsoInAppZone, todayInAppZone } from "@/lib/utils";
import type { ActionResult, CheckIn, Meeting } from "@/lib/types";

/**
 * Meetings and check-ins (PLAN §7 Phase D, decisions 29–42 and 68–72).
 *
 * Only the conversation's doctor writes these (RLS checks that, and can_write() stops a
 * blocked or deactivated conversation). Each write posts a card in the chat through the
 * post_appointment_message() RPC and pushes a short, lock-screen-safe note.
 */

// ── Validation ───────────────────────────────────────────────────

const LINK_RE = /^https:\/\/\S+$/;

/** Any https:// link (decision 29), at most 500 characters. */
function cleanLink(raw: string): { ok: true; value: string } | { ok: false; error: string } {
  const value = raw.trim();
  if (!value) return { ok: false, error: "Paste the meeting link." };
  if (value.length > 500) return { ok: false, error: "That link is too long." };
  if (!LINK_RE.test(value)) return { ok: false, error: "The link must start with https://" };
  return { ok: true, value };
}

/** 5 to 240 minutes (the database check). */
function cleanDuration(raw: number): { ok: true; value: number } | { ok: false; error: string } {
  if (!Number.isFinite(raw) || !Number.isInteger(raw)) return { ok: false, error: "Choose how long the meeting is." };
  if (raw < 5 || raw > 240) return { ok: false, error: "A meeting can be between 5 minutes and 4 hours." };
  return { ok: true, value: raw };
}

/** An optional note, at most 500 characters. */
function cleanNote(raw: string): { ok: true; value: string | null } | { ok: false; error: string } {
  const value = raw.trim();
  if (value.length > 500) return { ok: false, error: "That note is too long." };
  return { ok: true, value: value || null };
}

/** A check-in reason: 2 to 300 characters (the database check). */
function cleanReason(raw: string): { ok: true; value: string } | { ok: false; error: string } {
  const value = raw.trim();
  if (value.length < 2) return { ok: false, error: "Say what the check-in is about." };
  if (value.length > 300) return { ok: false, error: "That reason is too long." };
  return { ok: true, value };
}

/** A due date: today or later. */
function cleanDueDate(raw: string): { ok: true; value: string } | { ok: false; error: string } {
  const value = raw.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return { ok: false, error: "Choose a date." };
  if (value < todayInAppZone()) return { ok: false, error: "Pick a date from today onwards." };
  return { ok: true, value };
}

/** A start moment in the app time zone, not in the past when scheduling. */
function cleanStart(date: string, time: string, allowPast: boolean): { ok: true; value: string } | { ok: false; error: string } {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date.trim())) return { ok: false, error: "Choose a date." };
  if (!/^\d{2}:\d{2}$/.test(time.trim())) return { ok: false, error: "Choose a time." };
  const iso = toIsoInAppZone(date.trim(), time.trim());
  if (Number.isNaN(Date.parse(iso))) return { ok: false, error: "Choose a date and a time." };
  if (!allowPast && Date.parse(iso) <= Date.now()) return { ok: false, error: "Pick a time that hasn't passed yet." };
  return { ok: true, value: iso };
}

/** The conversation this appointment belongs to, and the doctor writing it. */
async function doctorAndConversation(conversationId: string) {
  const profile = await requireProfile("doctor");
  const supabase = await createClient();
  const { data } = await supabase
    .from("conversations")
    .select("id, doctor_id, patient_id")
    .eq("id", conversationId)
    .maybeSingle();
  const conv = data as { id: string; doctor_id: string; patient_id: string } | null;
  if (!conv || conv.doctor_id !== profile.id) return { ok: false as const, error: "That chat isn't yours." };

  // can_write() is the same rule the database uses. Asking it first means a refusal is a
  // clear sentence instead of a generic "that didn't work".
  const { data: writable } = await supabase.rpc("can_write", { conv: conversationId });
  if (writable === false) {
    return { ok: false as const, error: "You can't add to this chat right now. Your account is blocked or paused." };
  }
  return { ok: true as const, profile, supabase, conv };
}

/** Post the chat card and push. The card is what both sides see in the conversation. */
async function announce(
  supabase: Awaited<ReturnType<typeof createClient>>,
  kind: "meeting" | "check_in",
  id: string,
  conversationId: string,
  event: PushEvent,
) {
  const { error } = await supabase.rpc("post_appointment_message", { appt_kind: kind, appt: id });
  if (error) console.error("post_appointment_message failed", error);
  await notifyConversation(conversationId, event);
}

/**
 * Is this doctor allowed to write into this conversation right now?
 * can_write() is the same rule the database uses. Asking it first means a refusal is a
 * clear sentence instead of a generic "that didn't work".
 */
async function canWrite(supabase: Awaited<ReturnType<typeof createClient>>, conversationId: string) {
  const { data } = await supabase.rpc("can_write", { conv: conversationId });
  return data !== false;
}

const BLOCKED_MESSAGE = "You can't change this chat right now. Your account is blocked or paused.";


// ── Meetings ────────────────────────────────────────────────────

export type MeetingInput = {
  conversationId: string;
  /** YYYY-MM-DD, in the app time zone. */
  date: string;
  /** "HH:mm", in the app time zone. */
  time: string;
  durationMin: number;
  /** Any https:// link (decision 29). */
  meetUrl: string;
  /** Optional note for the patient. */
  note?: string;
};

/** Schedule a meeting and post the card in the chat. */
export async function scheduleMeeting(input: MeetingInput): Promise<ActionResult<{ id: string }>> {
  const owner = await doctorAndConversation(input.conversationId);
  if (!owner.ok) return { ok: false, error: owner.error };

  const starts = cleanStart(input.date, input.time, false);
  if (!starts.ok) return { ok: false, error: starts.error };
  const duration = cleanDuration(input.durationMin);
  if (!duration.ok) return { ok: false, error: duration.error };
  const link = cleanLink(input.meetUrl);
  if (!link.ok) return { ok: false, error: link.error };
  const note = cleanNote(input.note ?? "");
  if (!note.ok) return { ok: false, error: note.error };

  const { data, error } = await owner.supabase
    .from("meetings")
    .insert({
      conversation_id: owner.conv.id,
      doctor_id: owner.profile.id,
      patient_id: owner.conv.patient_id,
      starts_at: starts.value,
      duration_min: duration.value,
      meet_url: link.value,
      note: note.value,
      created_by: owner.profile.id,
    })
    .select("id")
    .single();
  if (error || !data) {
    console.error("scheduleMeeting failed", error);
    return { ok: false, error: "We couldn't schedule that meeting. Please try again." };
  }

  await announce(owner.supabase, "meeting", data.id, owner.conv.id, "meeting_scheduled");
  revalidatePath(`/doctor/c/${owner.conv.id}`);
  return { ok: true, data: { id: data.id } };
}

/** Move a meeting, or change its duration, link or note (decision 34). */
export async function updateMeeting(id: string, input: Omit<MeetingInput, "conversationId">): Promise<ActionResult> {
  const owner = await requireProfile("doctor");
  const supabase = await createClient();
  const { data: before } = await supabase.from("meetings").select("*").eq("id", id).maybeSingle();
  const meeting = before as Meeting | null;
  if (!meeting || meeting.doctor_id !== owner.id) return { ok: false, error: "That meeting isn't yours." };
  if (meeting.status !== "scheduled") return { ok: false, error: "This meeting is already finished." };
  if (!(await canWrite(supabase, meeting.conversation_id))) return { ok: false, error: BLOCKED_MESSAGE };

  const starts = cleanStart(input.date, input.time, false);
  if (!starts.ok) return { ok: false, error: starts.error };
  const duration = cleanDuration(input.durationMin);
  if (!duration.ok) return { ok: false, error: duration.error };
  const link = cleanLink(input.meetUrl);
  if (!link.ok) return { ok: false, error: link.error };
  const note = cleanNote(input.note ?? "");
  if (!note.ok) return { ok: false, error: note.error };

  const { error } = await supabase
    .from("meetings")
    .update({
      starts_at: starts.value,
      duration_min: duration.value,
      meet_url: link.value,
      note: note.value,
    })
    .eq("id", id)
    .eq("doctor_id", owner.id);
  if (error) {
    console.error("updateMeeting failed", error);
    return { ok: false, error: "We couldn't move that meeting. Please try again." };
  }

  await announce(supabase, "meeting", id, meeting.conversation_id, "meeting_moved");
  revalidatePath(`/doctor/c/${meeting.conversation_id}`);
  return { ok: true };
}


/** Cancel a meeting. The chat shows "Meeting cancelled" (decision 35). */
export async function cancelMeeting(id: string): Promise<ActionResult> {
  const owner = await requireProfile("doctor");
  const supabase = await createClient();
  const { data: before } = await supabase.from("meetings").select("*").eq("id", id).maybeSingle();
  const meeting = before as Meeting | null;
  if (!meeting || meeting.doctor_id !== owner.id) return { ok: false, error: "That meeting isn't yours." };
  if (meeting.status !== "scheduled") return { ok: false, error: "This meeting is already finished." };
  if (!(await canWrite(supabase, meeting.conversation_id))) return { ok: false, error: BLOCKED_MESSAGE };

  const { error } = await supabase.from("meetings").update({ status: "cancelled" }).eq("id", id).eq("doctor_id", owner.id);
  if (error) {
    console.error("cancelMeeting failed", error);
    return { ok: false, error: "We couldn't cancel that meeting. Please try again." };
  }

  await announce(supabase, "meeting", id, meeting.conversation_id, "meeting_cancelled");
  revalidatePath(`/doctor/c/${meeting.conversation_id}`);
  return { ok: true };
}

/** Mark a meeting as done (decision 36). */
export async function completeMeeting(id: string): Promise<ActionResult> {
  const owner = await requireProfile("doctor");
  const supabase = await createClient();
  const { data: before } = await supabase.from("meetings").select("*").eq("id", id).maybeSingle();
  const meeting = before as Meeting | null;
  if (!meeting || meeting.doctor_id !== owner.id) return { ok: false, error: "That meeting isn't yours." };
  if (meeting.status !== "scheduled") return { ok: false, error: "This meeting is already finished." };
  if (!(await canWrite(supabase, meeting.conversation_id))) return { ok: false, error: BLOCKED_MESSAGE };

  const { error } = await supabase.from("meetings").update({ status: "completed" }).eq("id", id).eq("doctor_id", owner.id);
  if (error) {
    console.error("completeMeeting failed", error);
    return { ok: false, error: "We couldn't update that meeting. Please try again." };
  }

  await announce(supabase, "meeting", id, meeting.conversation_id, "meeting_completed");
  revalidatePath(`/doctor/c/${meeting.conversation_id}`);
  return { ok: true };
}

/**
 * "Mark meetings complete automatically 15 minutes after they start" (decision 36, Q-I).
 * The doctor's own setting, on their profile.
 */
export async function setMeetingAutoComplete(on: boolean): Promise<ActionResult> {
  const profile = await requireProfile("doctor");
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ meeting_auto_complete: on }).eq("id", profile.id);
  if (error) {
    console.error("setMeetingAutoComplete failed", error);
    return { ok: false, error: "We couldn't save that setting. Please try again." };
  }
  revalidatePath("/doctor/settings");
  return { ok: true };
}


// ── Check-ins ────────────────────────────────────────────────────

export type CheckInInput = {
  conversationId: string;
  /** YYYY-MM-DD, in the app time zone. */
  dueOn: string;
  /** Why the patient should come back. 2–300 characters. */
  reason: string;
};

/** Schedule a check-in: a reminder to meet again on a date (decision 68). */
export async function scheduleCheckIn(input: CheckInInput): Promise<ActionResult<{ id: string }>> {
  const owner = await doctorAndConversation(input.conversationId);
  if (!owner.ok) return { ok: false, error: owner.error };

  const due = cleanDueDate(input.dueOn);
  if (!due.ok) return { ok: false, error: due.error };
  const reason = cleanReason(input.reason);
  if (!reason.ok) return { ok: false, error: reason.error };

  const { data, error } = await owner.supabase
    .from("check_ins")
    .insert({
      conversation_id: owner.conv.id,
      doctor_id: owner.profile.id,
      patient_id: owner.conv.patient_id,
      due_on: due.value,
      reason: reason.value,
      created_by: owner.profile.id,
    })
    .select("id")
    .single();
  if (error || !data) {
    console.error("scheduleCheckIn failed", error);
    return { ok: false, error: "We couldn't set that check-in. Please try again." };
  }

  await announce(owner.supabase, "check_in", data.id, owner.conv.id, "check_in_set");
  revalidatePath(`/doctor/c/${owner.conv.id}`);
  return { ok: true, data: { id: data.id } };
}

/** Move a check-in to a new date, or change its reason (decision 70). */
export async function updateCheckIn(id: string, input: Omit<CheckInInput, "conversationId">): Promise<ActionResult> {
  const owner = await requireProfile("doctor");
  const supabase = await createClient();
  const { data: before } = await supabase.from("check_ins").select("*").eq("id", id).maybeSingle();
  const checkIn = before as CheckIn | null;
  if (!checkIn || checkIn.doctor_id !== owner.id) return { ok: false, error: "That check-in isn't yours." };
  if (checkIn.status !== "scheduled") return { ok: false, error: "This check-in is already finished." };
  if (!(await canWrite(supabase, checkIn.conversation_id))) return { ok: false, error: BLOCKED_MESSAGE };

  const due = cleanDueDate(input.dueOn);
  if (!due.ok) return { ok: false, error: due.error };
  const reason = cleanReason(input.reason);
  if (!reason.ok) return { ok: false, error: reason.error };

  const { error } = await supabase
    .from("check_ins")
    .update({ due_on: due.value, reason: reason.value })
    .eq("id", id)
    .eq("doctor_id", owner.id);
  if (error) {
    console.error("updateCheckIn failed", error);
    return { ok: false, error: "We couldn't move that check-in. Please try again." };
  }

  await announce(supabase, "check_in", id, checkIn.conversation_id, "check_in_moved");
  revalidatePath(`/doctor/c/${checkIn.conversation_id}`);
  return { ok: true };
}

/** Mark a check-in as done (decision 70). */
export async function completeCheckIn(id: string): Promise<ActionResult> {
  const owner = await requireProfile("doctor");
  const supabase = await createClient();
  const { data: before } = await supabase.from("check_ins").select("*").eq("id", id).maybeSingle();
  const checkIn = before as CheckIn | null;
  if (!checkIn || checkIn.doctor_id !== owner.id) return { ok: false, error: "That check-in isn't yours." };
  if (checkIn.status !== "scheduled") return { ok: false, error: "This check-in is already finished." };
  if (!(await canWrite(supabase, checkIn.conversation_id))) return { ok: false, error: BLOCKED_MESSAGE };

  const { error } = await supabase.from("check_ins").update({ status: "done" }).eq("id", id).eq("doctor_id", owner.id);
  if (error) {
    console.error("completeCheckIn failed", error);
    return { ok: false, error: "We couldn't update that check-in. Please try again." };
  }

  await announce(supabase, "check_in", id, checkIn.conversation_id, "check_in_done");
  revalidatePath(`/doctor/c/${checkIn.conversation_id}`);
  return { ok: true };
}

/** Cancel a check-in. */
export async function cancelCheckIn(id: string): Promise<ActionResult> {
  const owner = await requireProfile("doctor");
  const supabase = await createClient();
  const { data: before } = await supabase.from("check_ins").select("*").eq("id", id).maybeSingle();
  const checkIn = before as CheckIn | null;
  if (!checkIn || checkIn.doctor_id !== owner.id) return { ok: false, error: "That check-in isn't yours." };
  if (checkIn.status !== "scheduled") return { ok: false, error: "This check-in is already finished." };
  if (!(await canWrite(supabase, checkIn.conversation_id))) return { ok: false, error: BLOCKED_MESSAGE };

  const { error } = await supabase.from("check_ins").update({ status: "cancelled" }).eq("id", id).eq("doctor_id", owner.id);
  if (error) {
    console.error("cancelCheckIn failed", error);
    return { ok: false, error: "We couldn't cancel that check-in. Please try again." };
  }

  await announce(supabase, "check_in", id, checkIn.conversation_id, "check_in_cancelled");
  revalidatePath(`/doctor/c/${checkIn.conversation_id}`);
  return { ok: true };
}

/**
 * Turn a check-in into a video meeting (decision 70): the meeting is created, the
 * check-in links to it and becomes done.
 */
export async function convertCheckInToMeeting(
  checkInId: string,
  meetingInput: MeetingInput,
): Promise<ActionResult<{ meetingId: string }>> {
  const owner = await doctorAndConversation(meetingInput.conversationId);
  if (!owner.ok) return { ok: false, error: owner.error };

  const supabase = owner.supabase;
  const { data: before } = await supabase.from("check_ins").select("*").eq("id", checkInId).maybeSingle();
  const checkIn = before as CheckIn | null;
  if (!checkIn || checkIn.doctor_id !== owner.profile.id) return { ok: false, error: "That check-in isn't yours." };
  if (checkIn.status !== "scheduled") return { ok: false, error: "This check-in is already finished." };

  const starts = cleanStart(meetingInput.date, meetingInput.time, false);
  if (!starts.ok) return { ok: false, error: starts.error };
  const duration = cleanDuration(meetingInput.durationMin);
  if (!duration.ok) return { ok: false, error: duration.error };
  const link = cleanLink(meetingInput.meetUrl);
  if (!link.ok) return { ok: false, error: link.error };
  // The check-in's reason becomes the meeting's note, so nothing is lost (decision 70).
  const note = cleanNote(meetingInput.note?.trim() || checkIn.reason);
  if (!note.ok) return { ok: false, error: note.error };

  const { data: meeting, error: meetingError } = await supabase
    .from("meetings")
    .insert({
      conversation_id: owner.conv.id,
      doctor_id: owner.profile.id,
      patient_id: owner.conv.patient_id,
      starts_at: starts.value,
      duration_min: duration.value,
      meet_url: link.value,
      note: note.value,
      created_by: owner.profile.id,
    })
    .select("id")
    .single();
  if (meetingError || !meeting) {
    console.error("convertCheckInToMeeting failed", meetingError);
    return { ok: false, error: "We couldn't schedule that meeting. Please try again." };
  }

  const { error: linkError } = await supabase
    .from("check_ins")
    .update({ status: "done", meeting_id: meeting.id })
    .eq("id", checkInId)
    .eq("doctor_id", owner.profile.id);
  if (linkError) {
    console.error("convertCheckInToMeeting: check-in not linked", linkError);
    // Undo the meeting, so trying again doesn't leave a second one behind.
    const { error: undoError } = await supabase.from("meetings").update({ status: "cancelled" }).eq("id", meeting.id);
    if (undoError) console.error("convertCheckInToMeeting: meeting not undone", undoError);
    return { ok: false, error: "We couldn't turn this check-in into a meeting. Please try again." };
  }

  await announce(supabase, "meeting", meeting.id, owner.conv.id, "meeting_scheduled");
  await announce(supabase, "check_in", checkInId, owner.conv.id, "check_in_done");
  revalidatePath(`/doctor/c/${owner.conv.id}`);
  return { ok: true, data: { meetingId: meeting.id } };
}

import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { todayInAppZone } from "@/lib/utils";
import type { CheckIn, ConversationWithPeople, InboxRow, Medicine, MedicineOption, Meeting, Message, OtherDoctor, Prescription, PrescriptionWithPeople, Profile } from "@/lib/types";

// All server-side reads live here. Pages call these; they never build queries inline.
// Every query runs as the signed-in user, so RLS decides what comes back.

/** Conversations for the signed-in user, newest first, with unread counts. */
export const getMyConversations = cache(async (): Promise<InboxRow[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("my_conversations");
  if (error) throw new Error(`my_conversations failed: ${error.message}`);
  return ((data ?? []) as InboxRow[]).map((r) => ({ ...r, unread_count: Number(r.unread_count) }));
});

/** One conversation plus both people. null if it doesn't exist or isn't yours. */
export const getConversation = cache(async (id: string): Promise<ConversationWithPeople | null> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("conversations")
    .select("*, doctor:profiles!conversations_doctor_id_fkey(*), patient:profiles!conversations_patient_id_fkey(*)")
    .eq("id", id)
    .maybeSingle();
  return (data as ConversationWithPeople | null) ?? null;
});

/** The doctor's patients, newest conversation first. */
export const getMyPatients = cache(
  async (): Promise<{ conversationId: string; patient: Profile; blockedAt: string | null }[]> => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];
    // Explicit doctor filter: RLS also lets the admin see every conversation.
    const { data, error } = await supabase
      .from("conversations")
      .select("id, created_at, blocked_at, patient:profiles!conversations_patient_id_fkey(*)")
      .eq("doctor_id", user.id)
      .order("created_at", { ascending: false });
    if (error) throw new Error(`patients failed: ${error.message}`);
    return ((data ?? []) as unknown as { id: string; blocked_at: string | null; patient: Profile }[]).map((r) => ({
      conversationId: r.id,
      patient: r.patient,
      blockedAt: r.blocked_at,
    }));
  },
);

/** Latest messages, oldest first (ready to render top-to-bottom). */
export async function getMessages(conversationId: string, limit = 200): Promise<Message[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`messages failed: ${error.message}`);
  return ((data ?? []) as Message[]).reverse();
}

const RX_SELECT =
  "*, prescription_items(*), doctor:profiles!prescriptions_doctor_id_fkey(*), patient:profiles!prescriptions_patient_id_fkey(*)";

function sortItems(rx: PrescriptionWithPeople): PrescriptionWithPeople {
  return { ...rx, prescription_items: [...(rx.prescription_items ?? [])].sort((a, b) => a.position - b.position) };
}

/** Prescriptions in a conversation, newest first. Patients only ever get issued ones (RLS). */
export async function getPrescriptions(conversationId: string): Promise<PrescriptionWithPeople[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("prescriptions")
    .select(RX_SELECT)
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`prescriptions failed: ${error.message}`);
  return ((data ?? []) as unknown as PrescriptionWithPeople[]).map(sortItems);
}

/** Every issued prescription for the signed-in patient, newest first. */
export async function getMyIssuedPrescriptions(): Promise<PrescriptionWithPeople[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("prescriptions")
    .select(RX_SELECT)
    .eq("status", "issued")
    .order("issued_at", { ascending: false });
  if (error) throw new Error(`prescriptions failed: ${error.message}`);
  return ((data ?? []) as unknown as PrescriptionWithPeople[]).map(sortItems);
}

export const getPrescription = cache(async (id: string): Promise<PrescriptionWithPeople | null> => {
  const supabase = await createClient();
  const { data } = await supabase.from("prescriptions").select(RX_SELECT).eq("id", id).maybeSingle();
  return data ? sortItems(data as unknown as PrescriptionWithPeople) : null;
});

/** Active medicines from the shared master list, for the composer's suggestions (0004, shared since 0005). */
export async function getMedicineSuggestions(): Promise<MedicineOption[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("medicines").select("name, default_dose").eq("active", true).order("name");
  return (data ?? []) as MedicineOption[];
}

/** Every medicine in the shared master list, including inactive and merged ones (Settings). */
export async function getMyMedicines(): Promise<Medicine[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("medicines").select("*").order("name");
  return (data ?? []) as Medicine[];
}

/** IDs of prescriptions that a newer issued one replaces (to show "Replaced"). */
export function replacedIds(list: Prescription[]): string[] {
  return list.filter((p) => p.status === "issued" && p.replaces_id).map((p) => p.replaces_id as string);
}

/**
 * The patient's other doctors, by name only (0005, decision 26).
 * The RPC returns nothing unless the "also consults" setting is on for this pair,
 * and only the doctor who shares a conversation with the patient can call it.
 * It is RLS-protected, so a failure here must not take the whole conversation down:
 * the panel simply shows no names.
 */
export const getOtherDoctors = cache(async (patientId: string): Promise<OtherDoctor[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("other_doctors", { patient: patientId });
  if (error) {
    console.error("other_doctors failed", error);
    return [];
  }
  return (data ?? []) as OtherDoctor[];
});

// ─────────────────────────────────────────────────────────────────
// Meetings and check-ins (0005, decisions 29–42 and 68–72)
// ─────────────────────────────────────────────────────────────────

/** The meetings and check-ins of one conversation. Both lists are newest first. */
export const getAppointments = cache(async (conversationId: string): Promise<{ meetings: Meeting[]; checkIns: CheckIn[] }> => {
  const supabase = await createClient();
  const [meetings, checkIns] = await Promise.all([
    supabase.from("meetings").select("*").eq("conversation_id", conversationId).order("starts_at", { ascending: false }),
    supabase.from("check_ins").select("*").eq("conversation_id", conversationId).order("due_on", { ascending: false }),
  ]);
  if (meetings.error) throw new Error(`meetings failed: ${meetings.error.message}`);
  if (checkIns.error) throw new Error(`check_ins failed: ${checkIns.error.message}`);
  return {
    meetings: (meetings.data ?? []) as Meeting[],
    checkIns: (checkIns.data ?? []) as CheckIn[],
  };
});

/** One meeting or check-in, by id. null when it isn't there. */
export const getAppointment = cache(async (id: string): Promise<{ meeting: Meeting | null; checkIn: CheckIn | null }> => {
  const supabase = await createClient();
  const [meeting, checkIn] = await Promise.all([
    supabase.from("meetings").select("*").eq("id", id).maybeSingle(),
    supabase.from("check_ins").select("*").eq("id", id).maybeSingle(),
  ]);
  return {
    meeting: (meeting.data as Meeting | null) ?? null,
    checkIn: (checkIn.data as CheckIn | null) ?? null,
  };
});

/**
 * The patient's next scheduled meeting with each doctor, for /home (Q-D).
 * Only meetings that have not started yet and are not cancelled.
 */
export const getUpcomingForPatient = cache(async (): Promise<Record<string, Meeting>> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("meetings")
    .select("*")
    .eq("status", "scheduled")
    .gt("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true });
  if (error) throw new Error(`meetings failed: ${error.message}`);
  // The earliest meeting per conversation wins.
  const next: Record<string, Meeting> = {};
  for (const m of (data ?? []) as Meeting[]) {
    if (!next[m.conversation_id]) next[m.conversation_id] = m;
  }
  return next;
});

/**
 * The conversations where a check-in is due today or overdue (decision: the inbox badge).
 * The doctor only: RLS already limits the rows to their own patients.
 */
export const getDoctorDueCheckIns = cache(async (): Promise<string[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("check_ins")
    .select("conversation_id, due_on")
    .eq("status", "scheduled")
    .lte("due_on", todayInAppZone());
  if (error) {
    console.error("check_ins failed", error);
    return [];
  }
  return [...new Set(((data ?? []) as { conversation_id: string }[]).map((r) => r.conversation_id))];
});

/**
 * The doctor's scheduled meetings that overlap a given window, for the overlap warning
 * (decision 41). Overlapping is a warning, never a block.
 */
export const getDoctorMeetingsBetween = cache(async (fromIso: string, toIso: string): Promise<Meeting[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("meetings")
    .select("*")
    .eq("status", "scheduled")
    .gte("starts_at", fromIso)
    .lte("starts_at", toIso)
    .order("starts_at", { ascending: true });
  if (error) {
    console.error("meetings failed", error);
    return [];
  }
  return (data ?? []) as Meeting[];
});


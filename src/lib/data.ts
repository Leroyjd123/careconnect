import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { todayInAppZone } from "@/lib/utils";
import type { AuditEntry, CheckIn, ConversationWithPeople, InboxRow, Medicine, MedicineOption, Meeting, Message, OtherDoctor, Prescription, PrescriptionWithPeople, Profile, ProfileStatus } from "@/lib/types";

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

// ─────────────────────────────────────────────────────────────────
// Admin reads (0005). RLS's is_admin() opens these to the admin, so they
// run with the normal client, as the signed-in admin.
// ─────────────────────────────────────────────────────────────────

/** One row of the admin's conversation list. */
export type AdminConversation = {
  id: string;
  doctorId: string;
  doctorName: string;
  patientId: string;
  patientName: string;
  lastMessageAt: string | null;
  /** The conversation's block (0005). */
  blockedAt: string | null;
  /** How many messages the chat holds. */
  messageCount: number;
  /** The row shape the shared ConversationList takes. */
  row: InboxRow;
};

/** Every conversation, for the admin's list. */
export async function getAdminConversations(filterDoctorId?: string): Promise<AdminConversation[]> {
  await requireProfile("admin");
  const supabase = await createClient();

  let query = supabase
    .from("conversations")
    .select(
      "id, doctor_id, patient_id, last_message_at, last_message_preview, blocked_at, doctor:profiles!conversations_doctor_id_fkey(id, full_name, status, specialty), patient:profiles!conversations_patient_id_fkey(id, full_name, status, specialty)",
    )
    .order("last_message_at", { ascending: false, nullsFirst: false });
  if (filterDoctorId) query = query.eq("doctor_id", filterDoctorId);
  const { data, error } = await query;
  if (error) {
    console.error("getAdminConversations failed", error);
    return [];
  }

  const rows = (data ?? []) as unknown as {
    id: string;
    doctor_id: string;
    patient_id: string;
    last_message_at: string | null;
    last_message_preview: string | null;
    blocked_at: string | null;
    doctor: { id: string; full_name: string; status: ProfileStatus; specialty: string | null } | null;
    patient: { id: string; full_name: string; status: ProfileStatus; specialty: string | null } | null;
  }[];

  // How many messages each chat holds, in one query.
  const { data: counts } = await supabase.from("messages").select("conversation_id");
  const perConversation = new Map<string, number>();
  for (const m of (counts ?? []) as { conversation_id: string }[]) {
    perConversation.set(m.conversation_id, (perConversation.get(m.conversation_id) ?? 0) + 1);
  }

  return rows.map((r) => {
    const doctorName = r.doctor?.full_name ?? "Doctor";
    const patientName = r.patient?.full_name ?? "Patient";
    return {
      id: r.id,
      doctorId: r.doctor_id,
      doctorName,
      patientId: r.patient_id,
      patientName,
      lastMessageAt: r.last_message_at,
      blockedAt: r.blocked_at,
      messageCount: perConversation.get(r.id) ?? 0,
      row: {
        id: r.id,
        // The admin's list is built around the patient (the row's headline).
        other_id: r.patient_id,
        other_name: patientName,
        other_status: r.patient?.status ?? "active",
        other_specialty: r.doctor?.specialty ?? null,
        last_message_at: r.last_message_at,
        last_message_preview: r.last_message_preview,
        // The admin reads every chat, so nothing is unread for them.
        unread_count: 0,
        blocked_at: r.blocked_at,
        other_doctor_name: doctorName,
      },
    };
  });
}

/** The action-code groups the audit screen filters by. */
export const AUDIT_ACTION_GROUPS: Record<string, string[]> = {
  views: ["admin.conversation_viewed", "admin.file_viewed"],
  messages: ["message.edited", "message.removed", "admin.message_sent"],
  prescriptions: ["rx.cancelled_by_admin", "admin.correction_draft_created"],
  people: [
    "admin.doctor_invited",
    "admin.doctor_invite_created",
    "admin.doctor_updated",
    "admin.doctor_deactivated",
    "admin.doctor_reactivated",
    "admin.doctor_settings_updated",
    "admin.doctor_clinic_changed",
    "admin.patient_invited",
    "admin.patient_invite_created",
    "admin.patient_assigned",
    "admin.patient_doctor_added",
    "admin.patient_settings_updated",
    "profile.details_changed",
    "profile.account_blocked",
    "profile.account_unblocked",
    "conversation.blocked",
    "conversation.unblocked",
  ],
  meetings: [
    "meeting.scheduled",
    "meeting.changed",
    "meeting.cancelled",
    "meeting.completed",
    "meeting.reminded",
    "check_in.scheduled",
    "check_in.changed",
    "check_in.done",
    "check_in.cancelled",
    "check_in.reminded",
  ],
};

/**
 * The audit log for the admin. RLS's audit_select_admin opens it to the admin only.
 * Newest first, 50 to a page.
 */
export async function getAdminAuditLog(options: {
  page?: number;
  actorQuery?: string;
  actionGroup?: string;
  from?: string;
  to?: string;
}): Promise<{ rows: AuditEntry[]; total: number }> {
  await requireProfile("admin");
  const supabase = await createClient();
  const page = Math.max(1, options.page ?? 1);
  const perPage = 50;

  let query = supabase.from("audit_log").select("*", { count: "exact" }).order("created_at", { ascending: false });

  const actorQuery = options.actorQuery?.trim();
  if (actorQuery) {
    // The actor's name lives on their profile; find the ids first.
    const { data: people } = await supabase.from("profiles").select("id").ilike("full_name", `%${actorQuery}%`);
    const ids = (people ?? []).map((p) => p.id);
    // The cron has no actor, so "system" finds the system rows.
    if (actorQuery.toLowerCase() === "system") ids.push(null as unknown as string);
    if (ids.length === 0) return { rows: [], total: 0 };
    query = query.in("actor_id", ids);
  }

  const actionGroup = options.actionGroup ?? "all";
  if (actionGroup !== "all") {
    const actions = AUDIT_ACTION_GROUPS[actionGroup];
    if (!actions) return { rows: [], total: 0 };
    query = query.in("action", actions);
  }

  if (options.from) query = query.gte("created_at", `${options.from}T00:00:00.000Z`);
  if (options.to) query = query.lte("created_at", `${options.to}T23:59:59.999Z`);

  const { data, error, count } = await query.range((page - 1) * perPage, page * perPage - 1);
  if (error) {
    console.error("getAdminAuditLog failed", error);
    return { rows: [], total: 0 };
  }
  return { rows: (data ?? []) as AuditEntry[], total: count ?? 0 };
}

/** The admin's own profile, for the audit rows' actor name. */
export async function getAdminActorNames(ids: string[]): Promise<Record<string, string>> {
  if (ids.length === 0) return {};
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("id, full_name").in("id", ids);
  const names: Record<string, string> = {};
  for (const p of (data ?? []) as { id: string; full_name: string }[]) names[p.id] = p.full_name || "Unknown";
  return names;
}

// ─────────────────────────────────────────────────────────────────
// The admin's appointments (decision 76) and the profile pages (77)
// ─────────────────────────────────────────────────────────────────

/** One row of the admin's appointments list: a meeting or a check-in, with both people. */
export type AdminAppointment = {
  type: "meeting" | "check_in";
  id: string;
  conversationId: string;
  doctorId: string;
  doctorName: string;
  patientId: string;
  patientName: string;
  clinicName: string | null;
  /** The meeting's start, or the check-in's due date. */
  when: string;
  /** The meeting's status, or the check-in's. */
  status: string;
  meeting: Meeting | null;
  checkIn: CheckIn | null;
};

/** The filters for the admin's appointments list. */
export type AdminAppointmentFilters = {
  /** "all" | "meeting" | "check_in". */
  type?: string;
  /** The status, e.g. "scheduled". Empty means every status. */
  status?: string;
  /** The doctor's id. */
  doctorId?: string;
  /** The patient's id. */
  patientId?: string;
  /** The clinic's id (the doctor's clinic). */
  clinicId?: string;
  /** YYYY-MM-DD, inclusive. */
  from?: string;
  to?: string;
  page?: number;
};

/**
 * Every meeting and check-in, for the admin (decision 76). Upcoming first, then the
 * past. RLS's `or is_admin()` opens both tables to the admin, so this runs with the
 * normal client.
 */
export async function getAdminAppointments(filters: AdminAppointmentFilters = {}): Promise<{
  rows: AdminAppointment[];
  total: number;
  meetingCount: number;
  checkInCount: number;
}> {
  await requireProfile("admin");
  const supabase = await createClient();
  const page = Math.max(1, filters.page ?? 1);
  const perPage = 50;

  // The people, and the clinic behind each doctor.
  const { data: people } = await supabase.from("profiles").select("id, full_name, clinic_id");
  const peopleRows = (people ?? []) as { id: string; full_name: string; clinic_id: string | null }[];
  const nameById = new Map<string, string>();
  const clinicIdByPerson = new Map<string, string | null>();
  for (const p of peopleRows) {
    nameById.set(p.id, p.full_name || "Unknown");
    clinicIdByPerson.set(p.id, p.clinic_id);
  }
  const { data: clinics } = await supabase.from("clinics").select("id, name");
  const clinicNameById = new Map<string, string>();
  for (const c of (clinics ?? []) as { id: string; name: string }[]) clinicNameById.set(c.id, c.name);

  const wantType = filters.type && filters.type !== "all" ? filters.type : null;
  // A clinic filter means "the doctors in this clinic".
  const clinicDoctorIds = filters.clinicId
    ? peopleRows.filter((p) => p.clinic_id === filters.clinicId).map((p) => p.id)
    : null;

  const fromIso = filters.from ? `${filters.from}T00:00:00.000Z` : null;
  const toIso = filters.to ? `${filters.to}T23:59:59.999Z` : null;
  // An impossible id, so a query for one type returns nothing from the other table.
  const NONE = "00000000-0000-0000-0000-000000000000";

  // Both tables are read in full, so the two kinds can be merged and sorted together
  // ("upcoming first, then the past") and the page cut out of the sorted list.
  let meetingQuery = supabase.from("meetings").select("*");
  if (wantType === "check_in") meetingQuery = meetingQuery.eq("id", NONE);
  if (filters.doctorId) meetingQuery = meetingQuery.eq("doctor_id", filters.doctorId);
  if (filters.patientId) meetingQuery = meetingQuery.eq("patient_id", filters.patientId);
  if (clinicDoctorIds) meetingQuery = meetingQuery.in("doctor_id", clinicDoctorIds);
  if (filters.status) meetingQuery = meetingQuery.eq("status", filters.status);
  if (fromIso) meetingQuery = meetingQuery.gte("starts_at", fromIso);
  if (toIso) meetingQuery = meetingQuery.lte("starts_at", toIso);

  let checkInQuery = supabase.from("check_ins").select("*");
  if (wantType === "meeting") checkInQuery = checkInQuery.eq("id", NONE);
  if (filters.doctorId) checkInQuery = checkInQuery.eq("doctor_id", filters.doctorId);
  if (filters.patientId) checkInQuery = checkInQuery.eq("patient_id", filters.patientId);
  if (clinicDoctorIds) checkInQuery = checkInQuery.in("doctor_id", clinicDoctorIds);
  if (filters.status) checkInQuery = checkInQuery.eq("status", filters.status);
  if (filters.from) checkInQuery = checkInQuery.gte("due_on", filters.from);
  if (filters.to) checkInQuery = checkInQuery.lte("due_on", filters.to);

  const [meetings, checkIns] = await Promise.all([meetingQuery, checkInQuery]);
  if (meetings.error) console.error("getAdminAppointments: meetings failed", meetings.error);
  if (checkIns.error) console.error("getAdminAppointments: check_ins failed", checkIns.error);

  const clinicNameFor = (doctorId: string) => {
    const clinicId = clinicIdByPerson.get(doctorId);
    return clinicId ? (clinicNameById.get(clinicId) ?? null) : null;
  };

  const rows: AdminAppointment[] = [];
  for (const m of (meetings.data ?? []) as Meeting[]) {
    rows.push({
      type: "meeting",
      id: m.id,
      conversationId: m.conversation_id,
      doctorId: m.doctor_id,
      doctorName: nameById.get(m.doctor_id) ?? "Doctor",
      patientId: m.patient_id,
      patientName: nameById.get(m.patient_id) ?? "Patient",
      clinicName: clinicNameFor(m.doctor_id),
      when: m.starts_at,
      status: m.status,
      meeting: m,
      checkIn: null,
    });
  }
  for (const c of (checkIns.data ?? []) as CheckIn[]) {
    rows.push({
      type: "check_in",
      id: c.id,
      conversationId: c.conversation_id,
      doctorId: c.doctor_id,
      doctorName: nameById.get(c.doctor_id) ?? "Doctor",
      patientId: c.patient_id,
      patientName: nameById.get(c.patient_id) ?? "Patient",
      clinicName: clinicNameFor(c.doctor_id),
      when: c.due_on,
      status: c.status,
      meeting: null,
      checkIn: c,
    });
  }

  // Upcoming first (soonest first), then the past (most recent first).
  const now = Date.now();
  const timeOf = (r: AdminAppointment) =>
    r.type === "meeting" ? Date.parse(r.when) : Date.parse(`${r.when}T12:00:00`);
  const isPast = (r: AdminAppointment) => r.status !== "scheduled" || timeOf(r) < now;
  rows.sort((a, b) => {
    const aPast = isPast(a);
    const bPast = isPast(b);
    if (aPast !== bPast) return aPast ? 1 : -1;
    return aPast ? timeOf(b) - timeOf(a) : timeOf(a) - timeOf(b);
  });

  // The counts are for the filtered set, before the page is cut out of it.
  const meetingCount = rows.filter((r) => r.type === "meeting").length;
  const checkInCount = rows.filter((r) => r.type === "check_in").length;
  const total = rows.length;

  return { rows: rows.slice((page - 1) * perPage, page * perPage), total, meetingCount, checkInCount };
}

/** One person's profile by id, with the clinic name. Null when they don't exist. */
export const getProfileById = cache(async (id: string): Promise<(Profile & { clinicName: string | null }) | null> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*, clinic:clinics(name)")
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const row = data as unknown as Profile & { clinic: { name: string } | null };
  return { ...row, clinicName: row.clinic?.name ?? null };
});

/** Every chat of one person, for the admin's profile pages. */
export const getChatsOfPerson = cache(
  async (personId: string, role: "doctor" | "patient"): Promise<AdminConversation[]> => {
    const supabase = await createClient();
    const column = role === "doctor" ? "doctor_id" : "patient_id";
    const { data, error } = await supabase
      .from("conversations")
      .select(
        "id, doctor_id, patient_id, last_message_at, last_message_preview, blocked_at, doctor:profiles!conversations_doctor_id_fkey(id, full_name, status, specialty), patient:profiles!conversations_patient_id_fkey(id, full_name, status, specialty)",
      )
      .eq(column, personId)
      .order("last_message_at", { ascending: false, nullsFirst: false });
    if (error) {
      console.error("getChatsOfPerson failed", error);
      return [];
    }
    const rows = (data ?? []) as unknown as {
      id: string;
      doctor_id: string;
      patient_id: string;
      last_message_at: string | null;
      last_message_preview: string | null;
      blocked_at: string | null;
      doctor: { id: string; full_name: string; status: ProfileStatus; specialty: string | null } | null;
      patient: { id: string; full_name: string; status: ProfileStatus; specialty: string | null } | null;
    }[];
    return rows.map((r) => {
      const doctorName = r.doctor?.full_name ?? "Doctor";
      const patientName = r.patient?.full_name ?? "Patient";
      return {
        id: r.id,
        doctorId: r.doctor_id,
        doctorName,
        patientId: r.patient_id,
        patientName,
        lastMessageAt: r.last_message_at,
        blockedAt: r.blocked_at,
        messageCount: 0,
        row: {
          id: r.id,
          other_id: r.patient_id,
          other_name: patientName,
          other_status: r.patient?.status ?? "active",
          other_specialty: r.doctor?.specialty ?? null,
          last_message_at: r.last_message_at,
          last_message_preview: r.last_message_preview,
          unread_count: 0,
          blocked_at: r.blocked_at,
          other_doctor_name: doctorName,
        },
      };
    });
  },
);

/**
 * The number of prescriptions a doctor has issued, and how many appointments they have
 * this month. For the admin's doctor profile.
 */
export const getDoctorStats = cache(async (doctorId: string): Promise<{ prescriptions: number; meetingsThisMonth: number }> => {
  const supabase = await createClient();
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);

  const [prescriptions, meetings] = await Promise.all([
    supabase.from("prescriptions").select("id", { count: "exact", head: true }).eq("doctor_id", doctorId).eq("status", "issued"),
    supabase.from("meetings").select("id", { count: "exact", head: true }).eq("doctor_id", doctorId).gte("starts_at", monthStart.toISOString()),
  ]);
  return { prescriptions: prescriptions.count ?? 0, meetingsThisMonth: meetings.count ?? 0 };
});

/** The report (file) messages of one conversation, newest first. */
export const getConversationReports = cache(async (conversationId: string): Promise<Message[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .eq("kind", "file")
    .not("file_path", "is", null)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("getConversationReports failed", error);
    return [];
  }
  return (data ?? []) as Message[];
});

/** The prescriptions of one person, for the admin's profile pages. */
export const getPrescriptionsOfPerson = cache(
  async (personId: string, role: "doctor" | "patient"): Promise<PrescriptionWithPeople[]> => {
    const supabase = await createClient();
    const column = role === "doctor" ? "doctor_id" : "patient_id";
    const { data, error } = await supabase
      .from("prescriptions")
      .select(RX_SELECT)
      .eq(column, personId)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("getPrescriptionsOfPerson failed", error);
      return [];
    }
    return ((data ?? []) as unknown as PrescriptionWithPeople[]).map(sortItems);
  },
);

/** The appointments of one person, for the admin's profile pages. */
export const getAppointmentsOfPerson = cache(
  async (personId: string, role: "doctor" | "patient"): Promise<{ meetings: Meeting[]; checkIns: CheckIn[] }> => {
    const supabase = await createClient();
    const column = role === "doctor" ? "doctor_id" : "patient_id";
    const [meetings, checkIns] = await Promise.all([
      supabase.from("meetings").select("*").eq(column, personId).order("starts_at", { ascending: false }),
      supabase.from("check_ins").select("*").eq(column, personId).order("due_on", { ascending: false }),
    ]);
    if (meetings.error) console.error("getAppointmentsOfPerson: meetings failed", meetings.error);
    if (checkIns.error) console.error("getAppointmentsOfPerson: check_ins failed", checkIns.error);
    return {
      meetings: (meetings.data ?? []) as Meeting[],
      checkIns: (checkIns.data ?? []) as CheckIn[],
    };
  },
);

/**
 * The doctor's own chat with one patient, if there is one. The doctor's patient profile
 * page only exists for a patient the doctor actually talks to.
 */
export const getConversationBetween = cache(
  async (doctorId: string, patientId: string): Promise<ConversationWithPeople | null> => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("conversations")
      .select("*, doctor:profiles!conversations_doctor_id_fkey(*), patient:profiles!conversations_patient_id_fkey(*)")
      .eq("doctor_id", doctorId)
      .eq("patient_id", patientId)
      .maybeSingle();
    return (data as ConversationWithPeople | null) ?? null;
  },
);




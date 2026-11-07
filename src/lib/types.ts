// Domain types. Mirror supabase/migrations/0001…0005.
// If you change the schema, change these in the same commit.

export type Role = "doctor" | "patient" | "admin";
export type Language = "en" | "kn" | "ml";
export type ProfileStatus = "invited" | "active";

export type Profile = {
  id: string;
  role: Role;
  full_name: string;
  email: string | null;
  phone: string | null;
  specialty: string | null;
  reg_no: string | null;
  language: Language;
  status: ProfileStatus;
  /** Recorded by the doctor (0004). */
  date_of_birth: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  /** Account-wide block, set by the admin only (0005; per-doctor blocks live on conversations). */
  blocked_at: string | null;
  /** Doctors: their clinic (0005). */
  clinic_id: string | null;
  /** "Also consults" visibility; null = inherit (patient → doctor → clinic → false) (0005). */
  show_other_doctors: boolean | null;
  /** Doctors: mark meetings complete 15 min after start (0005). */
  meeting_auto_complete: boolean;
  /** Doctors: deactivated by the admin; their conversations become read-only (0005). */
  deactivated_at: string | null;
  /** Accepted the privacy notice and terms (0005). */
  terms_accepted_at: string | null;
  invited_by: string | null;
  activated_at: string | null;
  created_at: string;
};

export type Conversation = {
  id: string;
  doctor_id: string;
  patient_id: string;
  last_message_at: string | null;
  last_message_preview: string | null;
  /** The doctor blocked this patient in this conversation only (0005). */
  blocked_at: string | null;
  created_at: string;
};

/** Row in clinics (0005). */
export type Clinic = { id: string; name: string; show_other_doctors: boolean | null; created_at: string };

/** Row returned by the my_conversations() RPC. "other" = the person you're talking to. */
export type InboxRow = {
  id: string;
  other_id: string;
  other_name: string;
  other_status: ProfileStatus;
  other_specialty: string | null;
  last_message_at: string | null;
  last_message_preview: string | null;
  unread_count: number;
};

export type MessageKind = "text" | "file" | "prescription" | "meeting" | "check_in";
export type SenderRole = "doctor" | "patient" | "admin";

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  kind: MessageKind;
  body: string | null;
  file_path: string | null;
  file_name: string | null;
  file_size: number | null;
  file_type: string | null;
  prescription_id: string | null;
  read_at: string | null;
  /** Set when the doctor removed a report; the file fields are then null (0003). */
  deleted_at: string | null;
  /** 0005: appointment cards, who sent it, admin edits and removals. */
  meeting_id: string | null;
  check_in_id: string | null;
  sender_role: SenderRole;
  edited_at: string | null;
  removed_at: string | null;
  removed_by: string | null;
  created_at: string;
};

export type MeetingStatus = "scheduled" | "completed" | "cancelled";
export type CheckInStatus = "scheduled" | "done" | "cancelled";

/** Row in meetings (0005). A video meeting by pasted link. */
export type Meeting = {
  id: string;
  conversation_id: string;
  doctor_id: string;
  patient_id: string;
  starts_at: string;
  duration_min: number;
  meet_url: string;
  note: string | null;
  status: MeetingStatus;
  reminded_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

/** Row in check_ins (0005). A reminder to meet again on a date. */
export type CheckIn = {
  id: string;
  conversation_id: string;
  doctor_id: string;
  patient_id: string;
  /** YYYY-MM-DD. Format via lib/utils, never parse by hand. */
  due_on: string;
  reason: string;
  status: CheckInStatus;
  meeting_id: string | null;
  reminded_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

/** Row in audit_log (0005). Admin-only. */
export type AuditEntry = {
  id: string;
  actor_id: string | null;
  actor_role: Role | "system";
  action: string;
  target_type: string;
  target_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
};

/** Row returned by other_doctors() (0005). */
export type OtherDoctor = { id: string; full_name: string; specialty: string | null };

export type PrescriptionStatus = "draft" | "issued";

/** One editable medicine row. Shared by the composer and the saveDraft action. */
export type DraftItem = { medicine: string; dose: string; frequency: string; duration: string; timing: string | null };

export type PrescriptionItem = {
  id: string;
  prescription_id: string;
  position: number;
  medicine: string;
  dose: string;
  frequency: string;
  duration: string;
  timing: string | null;
};

export type Prescription = {
  id: string;
  conversation_id: string;
  doctor_id: string;
  patient_id: string;
  status: PrescriptionStatus;
  diagnosis: string | null;
  advice: string | null;
  replaces_id: string | null;
  issued_at: string | null;
  /** Cancelled by the admin (0005). Stays on record; a correction replaces it. */
  cancelled_at: string | null;
  cancelled_by: string | null;
  created_at: string;
  updated_at: string;
  prescription_items?: PrescriptionItem[];
};

/**
 * Rows joined with the people on them. Declared here (not in data.ts) so Client
 * Components can use the type without importing the server-only module.
 */
export type PrescriptionWithPeople = Prescription & { doctor: Profile; patient: Profile };
export type ConversationWithPeople = Conversation & { doctor: Profile; patient: Profile };

/** Shape every server action returns, so forms handle errors the same way. */
/** Row in medicines (0004, shared since 0005). Never deleted; deactivated or merged. */
export type Medicine = {
  id: string;
  /** Who added it (0005: the list is shared by all doctors). */
  doctor_id: string | null;
  name: string;
  default_dose: string | null;
  active: boolean;
  merged_into: string | null;
  created_at: string;
  updated_at: string;
};

/** What the prescription composer needs from the master list. */
export type MedicineOption = { name: string; default_dose: string | null };

/** Row in invite_links (0003). A one-time link the doctor shares; the patient makes their own account. */
export type InviteLink = {
  id: string;
  token: string;
  /** null for doctor invites (0005). */
  doctor_id: string | null;
  role: "patient" | "doctor";
  created_at: string;
  expires_at: string;
  used_at: string | null;
  used_by: string | null;
  revoked_at: string | null;
};

/** Row in push_subscriptions (0002). One per browser/device with notifications on. */
export type PushSubscriptionRow = {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent: string | null;
  created_at: string;
};

/** What the browser hands us after PushManager.subscribe(), via toJSON(). */
export type PushSubscriptionInput = { endpoint: string; keys: { p256dh: string; auth: string } };

export type ActionResult<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

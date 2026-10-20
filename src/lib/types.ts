// Domain types. Mirror supabase/migrations/0001_init.sql.
// If you change the schema, change these in the same commit.

export type Role = "doctor" | "patient";
export type Language = "en" | "kn" | "hi";
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
  created_at: string;
};

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

export type MessageKind = "text" | "file" | "prescription";

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
  created_at: string;
};

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
export type ActionResult<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

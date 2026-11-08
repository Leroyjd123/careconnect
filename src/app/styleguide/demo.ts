// Fake data for /styleguide only. Fixed dates so server and browser render the same.
import type { AuditEntry, CheckIn, DraftItem, InboxRow, Meeting, Message, PrescriptionWithPeople, Profile } from "@/lib/types";

export const NOW = "2026-10-12T04:50:00.000Z";
export const EARLIER = "2026-10-08T09:15:00.000Z";

const base = { phone: null, language: "en" as const, invited_by: null, created_at: EARLIER, date_of_birth: null, height_cm: null, weight_kg: null, blocked_at: null, clinic_id: null, show_other_doctors: null, meeting_auto_complete: true, deactivated_at: null, terms_accepted_at: EARLIER };

export const doctor: Profile = {
  ...base,
  id: "demo-doctor",
  role: "doctor",
  full_name: "Dr. Sharma",
  email: "doctor@example.com",
  specialty: "General Physician",
  reg_no: "KMC 123456",
  status: "active",
  activated_at: EARLIER,
};

export const patient: Profile = {
  ...base,
  id: "demo-patient",
  role: "patient",
  full_name: "Ravi Kumar",
  email: "ravi@example.com",
  specialty: null,
  reg_no: null,
  status: "active",
  activated_at: NOW,
  date_of_birth: "1988-04-12",
  height_cm: 172,
  weight_kg: 74.5,
  phone: "+919876543210",
};

export const pendingPatient: Profile = { ...patient, id: "demo-pending", full_name: "Kavya Nair", email: "kavya@example.com", status: "invited", activated_at: null };

export const medicine: DraftItem = { medicine: "Paracetamol 650 mg", dose: "1 tablet", frequency: "1-0-1", duration: "3 days", timing: "After food" };

export const fileMessage: Message = {
  id: "demo-file",
  conversation_id: "demo",
  sender_id: patient.id,
  kind: "file",
  body: "Blood test from Friday",
  file_path: "demo/Blood_Report.pdf",
  file_name: "Blood_Report.pdf",
  file_size: 2516582,
  file_type: "application/pdf",
  prescription_id: null,
  read_at: null,
  deleted_at: null,
  meeting_id: null,
  check_in_id: null,
  sender_role: "patient",
  edited_at: null,
  removed_at: null,
  removed_by: null,
  created_at: NOW,
};

export const imageMessage: Message = { ...fileMessage, id: "demo-image", body: null, file_name: "Rash_photo.jpg", file_type: "image/jpeg", file_size: 812000 };

/** A message the admin sent (decision 48, Q-J). */
export const adminMessage: Message = {
  ...fileMessage,
  id: "demo-admin",
  kind: "text",
  body: "Please book a follow-up with Dr. Vipin John.",
  file_path: null,
  file_name: null,
  file_size: null,
  file_type: null,
  sender_role: "admin",
};

/** A message the admin edited (decision 49). */
export const editedMessage: Message = {
  ...fileMessage,
  id: "demo-edited",
  kind: "text",
  body: "Please book a follow-up with Dr. Vipin John.",
  file_path: null,
  file_name: null,
  file_size: null,
  file_type: null,
  edited_at: NOW,
};

/** A message the admin removed (decision 50). */
export const removedMessage: Message = {
  ...fileMessage,
  id: "demo-removed-by-admin",
  kind: "text",
  body: "This message was removed.",
  file_path: null,
  file_name: null,
  file_size: null,
  file_type: null,
  removed_at: NOW,
  removed_by: "demo-admin-id",
};

/** The audit log rows for the styleguide. */
export const auditRows: AuditEntry[] = [
  {
    id: "a1",
    actor_id: "demo-admin-id",
    actor_role: "admin",
    action: "admin.conversation_viewed",
    target_type: "conversation",
    target_id: "c1",
    details: {},
    created_at: NOW,
  },
  {
    id: "a2",
    actor_id: doctor.id,
    actor_role: "doctor",
    action: "message.edited",
    target_type: "message",
    target_id: "demo-edited",
    details: { before: { body: "Please book a follow-up." }, after: { body: "Please book a follow-up with Dr. Vipin John." } },
    created_at: EARLIER,
  },
  {
    id: "a3",
    actor_id: null,
    actor_role: "system",
    action: "meeting.reminded",
    target_type: "meeting",
    target_id: "m1",
    details: {},
    created_at: "2026-10-10T04:50:00.000Z",
  },
];

export const prescription: PrescriptionWithPeople = {
  id: "demo-rx",
  conversation_id: "demo",
  doctor_id: doctor.id,
  patient_id: patient.id,
  status: "issued",
  diagnosis: "Viral fever",
  advice: "Drink plenty of water. Come back if the fever lasts more than 3 days.",
  replaces_id: null,
  issued_at: NOW,
  cancelled_at: null,
  cancelled_by: null,
  created_at: NOW,
  updated_at: NOW,
  doctor,
  patient,
  prescription_items: [
    { id: "i1", prescription_id: "demo-rx", position: 0, ...medicine },
    { id: "i2", prescription_id: "demo-rx", position: 1, medicine: "Vitamin D3 60K", dose: "1 capsule", frequency: "Once a week", duration: "8 weeks", timing: "With milk" },
  ],
};

export const inbox: InboxRow[] = [
  { id: "c1", other_id: patient.id, other_name: "Ravi Kumar", other_status: "active", other_specialty: null, last_message_at: NOW, last_message_preview: "I've been having a headache since yesterday.", unread_count: 2 },
  { id: "c2", other_id: "p2", other_name: "Priya Mehta", other_status: "active", other_specialty: null, last_message_at: EARLIER, last_message_preview: "Thank you, doctor.", unread_count: 0 },
  { id: "c3", other_id: pendingPatient.id, other_name: "Kavya Nair", other_status: "invited", other_specialty: null, last_message_at: null, last_message_preview: null, unread_count: 0 },
];

export const patientRows = [
  { conversationId: "c1", patient },
  { conversationId: "c2", patient: { ...patient, id: "p2", full_name: "Priya Mehta", email: "priya@example.com" } },
  { conversationId: "c3", patient: pendingPatient },
];

/** The patient's own list of doctors (ConversationList with viewerRole="patient"). */
export const patientDoctors: InboxRow[] = [
  { id: "d1", other_id: "demo-doctor-1", other_name: "Dr. Vipin John", other_status: "active", other_specialty: "General Medicine", last_message_at: NOW, last_message_preview: "I've been having a headache since yesterday.", unread_count: 2 },
  { id: "d2", other_id: "demo-doctor-2", other_name: "Dr. Meera Nair", other_status: "active", other_specialty: "Dermatology", last_message_at: EARLIER, last_message_preview: "The rash is much better, thank you.", unread_count: 0 },
  { id: "d3", other_id: "demo-doctor-3", other_name: "Dr. Arjun Rao", other_status: "active", other_specialty: "Cardiology", last_message_at: null, last_message_preview: null, unread_count: 0 },
];

// ── Meetings and check-ins (Phase D) ─────────────────────────────
// The states of the appointment card, one of each. "Now" is a meeting that has already
// started, so "Join meeting" is live; the rest show the other badges.

const meetingBase = {
  conversation_id: "demo-conversation",
  doctor_id: doctor.id,
  patient_id: patient.id,
  duration_min: 15,
  meet_url: "https://meet.google.com/abc-defg-hij",
  note: null,
  reminded_at: null,
  created_by: doctor.id,
  created_at: EARLIER,
  updated_at: EARLIER,
};

/** A meeting later today: "Scheduled". */
export const meetingScheduled: Meeting = {
  ...meetingBase,
  id: "demo-meeting-scheduled",
  starts_at: "2026-10-12T09:00:00.000Z",
  status: "scheduled",
};

/** A meeting starting in a few minutes: "Starting soon", joinable. */
export const meetingSoon: Meeting = {
  ...meetingBase,
  id: "demo-meeting-soon",
  starts_at: "2026-10-12T05:05:00.000Z",
  status: "scheduled",
};

/** A meeting that has started: "Now", joinable. */
export const meetingNow: Meeting = {
  ...meetingBase,
  id: "demo-meeting-now",
  starts_at: "2026-10-12T04:45:00.000Z",
  status: "scheduled",
};

/** A meeting that is over: "Completed". */
export const meetingCompleted: Meeting = {
  ...meetingBase,
  id: "demo-meeting-completed",
  starts_at: "2026-10-08T06:00:00.000Z",
  status: "completed",
};

/** A meeting that was called off: "Cancelled". */
export const meetingCancelled: Meeting = {
  ...meetingBase,
  id: "demo-meeting-cancelled",
  starts_at: "2026-10-09T06:00:00.000Z",
  status: "cancelled",
};

const checkInBase = {
  conversation_id: "demo-conversation",
  doctor_id: doctor.id,
  patient_id: patient.id,
  meeting_id: null,
  reminded_at: null,
  created_by: doctor.id,
  created_at: EARLIER,
  updated_at: EARLIER,
};

/** A check-in due later: "Scheduled". */
export const checkInScheduled: CheckIn = {
  ...checkInBase,
  id: "demo-checkin-scheduled",
  due_on: "2026-10-15",
  reason: "Review BP after new tablets",
  status: "scheduled",
};

/** A check-in due today: "Due today". */
export const checkInDueToday: CheckIn = {
  ...checkInBase,
  id: "demo-checkin-due",
  due_on: "2026-10-12",
  reason: "Review BP after new tablets",
  status: "scheduled",
};

/** A check-in whose date has passed: "Overdue". */
export const checkInOverdue: CheckIn = {
  ...checkInBase,
  id: "demo-checkin-overdue",
  due_on: "2026-10-09",
  reason: "Review BP after new tablets",
  status: "scheduled",
};

/** A check-in that was dealt with: "Done". */
export const checkInDone: CheckIn = {
  ...checkInBase,
  id: "demo-checkin-done",
  due_on: "2026-10-10",
  reason: "Review BP after new tablets",
  status: "done",
};

/** A check-in that was called off: "Cancelled". */
export const checkInCancelled: CheckIn = {
  ...checkInBase,
  id: "demo-checkin-cancelled",
  due_on: "2026-10-11",
  reason: "Review BP after new tablets",
  status: "cancelled",
};

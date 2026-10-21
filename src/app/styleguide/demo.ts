// Fake data for /styleguide only. Fixed dates so server and browser render the same.
import type { DraftItem, InboxRow, Message, PrescriptionWithPeople, Profile } from "@/lib/types";

export const NOW = "2026-10-12T04:50:00.000Z";
export const EARLIER = "2026-10-08T09:15:00.000Z";

const base = { phone: null, language: "en" as const, invited_by: null, created_at: EARLIER };

export const doctor: Profile = {
  ...base,
  id: "demo-doctor",
  role: "doctor",
  full_name: "Dr. Sharma",
  email: "doctor@example.com",
  specialty: "General Physician",
  reg_no: "[REG NO]",
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
  created_at: NOW,
};

export const imageMessage: Message = { ...fileMessage, id: "demo-image", body: null, file_name: "Rash_photo.jpg", file_type: "image/jpeg", file_size: 812000 };

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

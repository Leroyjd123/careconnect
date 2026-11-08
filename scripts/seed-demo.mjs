// Demo data for testing and demos: clinics, doctors, patients, chats, prescriptions,
// meetings and check-ins. Approved by Leroy 2026-11-08 (all users are dummy accounts).
//
//   DEMO_PASSWORD='…' node --env-file=.env.local scripts/seed-demo.mjs
//
// - Insert-only and repeatable: anything that already exists (by email / pair) is skipped.
//   It never changes passwords of existing accounts and never deletes anything.
// - New demo accounts use @careconnect.demo emails and DEMO_PASSWORD (never committed).
// - Uses the service role, so it writes one audit_log row ("demo.seeded") for the run.

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const password = process.env.DEMO_PASSWORD;
if (!url || !key) throw new Error("Run with --env-file=.env.local");
if (!password || password.length < 8) throw new Error("Set DEMO_PASSWORD (8+ characters) for the new demo accounts.");

const db = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
const must = (r, what) => {
  if (r.error) throw new Error(`${what}: ${r.error.message}`);
  return r.data;
};

const CLINICS = ["Asha Family Clinic (demo)", "Sunrise Heart Centre (demo)", "Lakeview Children's Clinic (demo)"];

const DOCTORS = [
  // The existing doctor account keeps its login; it only gets a clinic if it has none.
  { email: "doctor@careconnect.com", existing: true, clinic: 0 },
  { email: "dr.ananya@careconnect.demo", name: "Dr. Ananya Rao", specialty: "General Physician", reg: "KMC 48211", phone: "+919845000101", clinic: 0 },
  { email: "dr.vikram@careconnect.demo", name: "Dr. Vikram Menon", specialty: "Cardiologist", reg: "TCMC 30987", phone: "+919845000102", clinic: 1 },
  { email: "dr.fatima@careconnect.demo", name: "Dr. Fatima Sheikh", specialty: "Paediatrician", reg: "KMC 51320", phone: "+919845000103", clinic: 2 },
];

const PATIENTS = [
  { email: "patient@yopmail.com", existing: true, doctors: [0, 1] },
  { email: "ravi.kumar@careconnect.demo", name: "Ravi Kumar", phone: "+919900000201", dob: "1968-04-12", h: 172, w: 81, lang: "kn", doctors: [1, 2] },
  { email: "lakshmi.nair@careconnect.demo", name: "Lakshmi Nair", phone: "+919900000202", dob: "1975-09-30", h: 158, w: 64, lang: "ml", doctors: [2] },
  { email: "arjun.shetty@careconnect.demo", name: "Arjun Shetty", phone: "+919900000203", dob: "1992-01-18", h: 178, w: 74, lang: "en", doctors: [0, 1] },
  { email: "meera.iyer@careconnect.demo", name: "Meera Iyer", phone: "+919900000204", dob: "2016-06-05", h: 121, w: 23, lang: "en", doctors: [3] },
  { email: "sameer.khan@careconnect.demo", name: "Sameer Khan", phone: "+919900000205", dob: "1984-11-22", h: 169, w: 88, lang: "en", doctors: [1, 3] },
];

const CHAT = [
  ["patient", "Good morning doctor, I've been feeling a bit dizzy since yesterday."],
  ["doctor", "Good morning. Did you take your tablets with food? Please check your BP and send me the reading."],
  ["patient", "Yes, after breakfast. BP is 138/88 this morning."],
  ["doctor", "Thank you. That's slightly high. Let's keep an eye on it. I'll send you a prescription."],
];

const RX = [
  { diagnosis: "Hypertension, stage 1", advice: "Less salt, walk 30 minutes a day. Check BP every morning.", items: [
    { medicine: "Amlodipine 5 mg", dose: "1 tablet", frequency: "1-0-0", duration: "30 days", timing: "After food" },
  ] },
  { diagnosis: "Seasonal cold", advice: "Warm fluids and rest.", items: [
    { medicine: "Paracetamol 650 mg", dose: "1 tablet", frequency: "1-0-1", duration: "3 days", timing: "After food" },
    { medicine: "Cetirizine 10 mg", dose: "1 tablet", frequency: "0-0-1", duration: "5 days", timing: null },
  ] },
];

const day = 86_400_000;
const isoDate = (d) => new Date(d).toISOString().slice(0, 10);

async function findProfileByEmail(email) {
  return must(await db.from("profiles").select("id, role, full_name, clinic_id").eq("email", email).maybeSingle(), `find ${email}`);
}

async function ensureUser(email, name, extra) {
  const found = await findProfileByEmail(email);
  if (found) return { id: found.id, created: false };
  const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: name } });
  if (error) throw new Error(`create ${email}: ${error.message}`);
  must(await db.from("profiles").update({ full_name: name, status: "active", activated_at: new Date().toISOString(), terms_accepted_at: new Date().toISOString(), ...extra }).eq("id", data.user.id), `profile ${email}`);
  return { id: data.user.id, created: true };
}

const summary = { clinics: 0, doctors: 0, patients: 0, conversations: 0, messages: 0, prescriptions: 0, meetings: 0, checkIns: 0 };

// Clinics
const clinicIds = [];
for (const name of CLINICS) {
  const existing = must(await db.from("clinics").select("id").eq("name", name).maybeSingle(), "clinic lookup");
  if (existing) { clinicIds.push(existing.id); continue; }
  clinicIds.push(must(await db.from("clinics").insert({ name, show_other_doctors: true }).select("id").single(), "clinic insert").id);
  summary.clinics++;
}

// Doctors
const doctorIds = [];
for (const d of DOCTORS) {
  if (d.existing) {
    const p = await findProfileByEmail(d.email);
    if (!p) throw new Error(`${d.email} not found`);
    if (!p.clinic_id) must(await db.from("profiles").update({ clinic_id: clinicIds[d.clinic] }).eq("id", p.id), "doctor clinic");
    doctorIds.push(p.id);
    continue;
  }
  const u = await ensureUser(d.email, d.name, { role: "doctor", specialty: d.specialty, reg_no: d.reg, phone: d.phone, clinic_id: clinicIds[d.clinic] });
  doctorIds.push(u.id);
  if (u.created) summary.doctors++;
}

// Patients + their chats
for (const p of PATIENTS) {
  let patientId;
  if (p.existing) {
    const found = await findProfileByEmail(p.email);
    if (!found) throw new Error(`${p.email} not found`);
    patientId = found.id;
  } else {
    const u = await ensureUser(p.email, p.name, { role: "patient", phone: p.phone, date_of_birth: p.dob, height_cm: p.h, weight_kg: p.w, language: p.lang, invited_by: doctorIds[p.doctors[0]] });
    patientId = u.id;
    if (u.created) summary.patients++;
  }

  for (const [n, di] of p.doctors.entries()) {
    const doctorId = doctorIds[di];
    let conv = must(await db.from("conversations").select("id").eq("doctor_id", doctorId).eq("patient_id", patientId).maybeSingle(), "conv lookup");
    if (!conv) {
      conv = must(await db.from("conversations").insert({ doctor_id: doctorId, patient_id: patientId }).select("id").single(), "conv insert");
      summary.conversations++;
    }
    // Only fill a chat that is still empty, so real test messages are never mixed up.
    const { count } = await db.from("messages").select("id", { count: "exact", head: true }).eq("conversation_id", conv.id);
    if (count) continue;

    const start = Date.now() - 3 * day;
    for (const [i, [who, body]] of CHAT.entries()) {
      must(await db.from("messages").insert({
        conversation_id: conv.id, sender_id: who === "doctor" ? doctorId : patientId, kind: "text", body,
        created_at: new Date(start + i * 15 * 60_000).toISOString(), read_at: new Date(start + i * 15 * 60_000 + 60_000).toISOString(),
      }), "message");
      summary.messages++;
    }

    // An issued prescription: draft → items → issued, then its chat message.
    const rxDef = RX[(n + di) % RX.length];
    const rx = must(await db.from("prescriptions").insert({ conversation_id: conv.id, doctor_id: doctorId, patient_id: patientId, diagnosis: rxDef.diagnosis, advice: rxDef.advice }).select("id").single(), "rx");
    must(await db.from("prescription_items").insert(rxDef.items.map((it, position) => ({ ...it, position, prescription_id: rx.id }))), "rx items");
    const issuedAt = new Date(start + 2 * 3_600_000).toISOString();
    must(await db.from("prescriptions").update({ status: "issued", issued_at: issuedAt }).eq("id", rx.id), "rx issue");
    must(await db.from("messages").insert({ conversation_id: conv.id, sender_id: doctorId, kind: "prescription", prescription_id: rx.id, created_at: issuedAt }), "rx message");
    summary.prescriptions++;

    // A meeting (upcoming for the first chat, past for the others) and a check-in.
    const startsAt = n === 0 ? new Date(Date.now() + (di + 1) * day).setHours(11, 0, 0, 0) : Date.now() - 2 * day;
    const meeting = must(await db.from("meetings").insert({
      conversation_id: conv.id, doctor_id: doctorId, patient_id: patientId, starts_at: new Date(startsAt).toISOString(),
      duration_min: 15, meet_url: "https://meet.google.com/demo-careconnect", note: "Follow-up on BP readings",
      status: n === 0 ? "scheduled" : "completed", created_by: doctorId,
    }).select("id").single(), "meeting");
    must(await db.from("messages").insert({ conversation_id: conv.id, sender_id: doctorId, kind: "meeting", meeting_id: meeting.id }), "meeting message");
    summary.meetings++;

    const dueOffsets = [0, -2, 7]; // due today, overdue, next week
    const checkIn = must(await db.from("check_ins").insert({
      conversation_id: conv.id, doctor_id: doctorId, patient_id: patientId,
      due_on: isoDate(Date.now() + dueOffsets[(di + n) % 3] * day), reason: "Review BP after new tablets", created_by: doctorId,
    }).select("id").single(), "check-in");
    must(await db.from("messages").insert({ conversation_id: conv.id, sender_id: doctorId, kind: "check_in", check_in_id: checkIn.id }), "check-in message");
    summary.checkIns++;
  }
}

must(await db.from("audit_log").insert({ actor_id: null, actor_role: "system", action: "demo.seeded", target_type: "system", details: summary }), "audit");
console.log("Demo data added:", summary);

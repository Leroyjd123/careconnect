// Realistic demo data around Udupi and Madikeri (approved by Leroy 2026-11-08; all users are dummy accounts).
//
//   DEMO_PASSWORD='…' node --env-file=.env.local scripts/seed-demo.mjs
//
// What it builds:
// - 6 clinics, 11 doctors (incl. doctor@careconnect.com), 22 patients (incl. patient@yopmail.com).
// - ~35 chats with condition-specific conversations spread over the past weeks, referrals between
//   doctors, live-looking activity today (unread messages, a meeting starting now, one later today),
//   issued prescriptions (one corrected), meetings (upcoming, completed, cancelled), check-ins
//   (due today, overdue, upcoming, done) and one blocked chat.
// - Sample files from scripts/demo-files/{reports,checkups,prescriptions}/ are uploaded to Storage and
//   sent in the chats by the patient (round-robin). Empty folders are simply skipped.
//
// Safety:
// - Insert-only and repeatable: existing accounts are reused (never changed, passwords untouched),
//   a chat that already has messages is left alone. Nothing is ever deleted.
// - New demo accounts use @careconnect.demo emails and DEMO_PASSWORD (never committed).
// - Service role, so the run writes one audit_log row ("demo.seeded").

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
// A standalone Node script, outside the Next app, so it builds its own service-role client.
// eslint-disable-next-line no-restricted-imports
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

// ── Time helpers (India time, UTC+5:30) ──────────────────────────
const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const IST = 330 * MIN;
const NOW = Date.now();
/** A moment `days` from today at hh:mm India time. */
function istAt(days, hh, mm = 0) {
  const ist = new Date(NOW + IST);
  const base = Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate(), hh, mm) - IST;
  return base + days * DAY;
}
/** YYYY-MM-DD in India time, `days` from today. */
const istDate = (days) => new Date(NOW + IST + days * DAY).toISOString().slice(0, 10);
const iso = (t) => new Date(t).toISOString();

// ── Places and people ────────────────────────────────────────────
const CLINICS = [
  "Udupi Family Clinic",           // 0 · Udupi
  "Manipal Heart Care",            // 1 · Manipal
  "Malpe Children's Clinic",       // 2 · Malpe
  "Kundapura Women's Health",      // 3 · Kundapura
  "Madikeri Health Centre",        // 4 · Madikeri
  "Kushalnagar Community Clinic",  // 5 · Kushalnagar
];

// key → doctor. `existing` accounts keep their login and name; they only get a clinic if they have none.
const DOCTORS = {
  john:      { email: "doctor@careconnect.com", existing: true, clinic: 0 },
  shenoy:    { name: "Dr. Prakash Shenoy", specialty: "General Physician", reg: "KMC 48211", clinic: 0 },
  shetty:    { name: "Dr. Deepika Shetty", specialty: "ENT Specialist", reg: "KMC 50113", clinic: 0 },
  kamath:    { name: "Dr. Shwetha Kamath", specialty: "Cardiologist", reg: "KMC 30987", clinic: 1 },
  pai:       { name: "Dr. Aditya Pai", specialty: "Endocrinologist", reg: "KMC 46620", clinic: 1 },
  bhat:      { name: "Dr. Raghavendra Bhat", specialty: "Paediatrician", reg: "KMC 51320", clinic: 2 },
  hegde:     { name: "Dr. Sushma Hegde", specialty: "Gynaecologist", reg: "KMC 52219", clinic: 3 },
  poonacha:  { name: "Dr. Kavya Poonacha", specialty: "Diabetologist", reg: "KMC 44876", clinic: 4 },
  muthanna:  { name: "Dr. Ganapathy Muthanna", specialty: "Orthopaedic Surgeon", reg: "KMC 39542", clinic: 4 },
  cariappa:  { name: "Dr. Nisha Cariappa", specialty: "Dermatologist", reg: "KMC 53004", clinic: 5 },
  rai:       { name: "Dr. Harish Rai", specialty: "Pulmonologist", reg: "KMC 41785", clinic: null }, // independent
};

// key → patient: [name, dateOfBirth, heightCm, weightKg, language]
const PATIENTS = {
  you:       { email: "patient@yopmail.com", existing: true },
  ramesh:    ["Ramesh Acharya", "1962-04-12", 168, 79, "kn"],
  sunitha:   ["Sunitha Pai", "1978-09-30", 156, 62, "kn"],
  deepak:    ["Deepak Kotian", "1990-01-18", 176, 74, "en"],
  anvi:      ["Anvi Rao", "2017-06-05", 118, 21, "kn"],
  bopanna:   ["Bopanna Kariappa", "1958-11-22", 171, 84, "en"],
  pooja:     ["Pooja Ammaiah", "1987-03-09", 160, 58, "en"],
  nagesh:    ["Nagesh Poojary", "1971-08-14", 165, 70, "kn"],
  shruthi:   ["Shruthi Bhandary", "1995-02-27", 158, 66, "en"],
  ganesh:    ["Ganesh Naik", "1966-12-03", 170, 88, "kn"],
  latha:     ["Latha Devadiga", "1983-05-19", 152, 71, "kn"],
  arjun:     ["Arjun Karkera", "2014-10-11", 142, 35, "en"],
  vinay:     ["Vinay Somaiah", "1975-07-07", 179, 92, "en"],
  rohini:    ["Rohini Uthappa", "1992-09-15", 163, 55, "en"],
  kishore:   ["Kishore Salian", "1956-01-30", 166, 73, "kn"],
  divya:     ["Divya Prabhu", "1998-04-21", 161, 52, "en"],
  mohammed:  ["Mohammed Rafiq", "1980-11-02", 173, 81, "en"],
  geetha:    ["Geetha Shettigar", "1969-03-25", 155, 68, "kn"],
  aarav:     ["Aarav Mendon", "2020-08-17", 98, 15, "kn"],
  chengappa: ["Chengappa Belliappa", "1961-06-29", 174, 77, "en"],
  fathima:   ["Fathima Beary", "1993-12-08", 157, 60, "en"],
  sudhir:    ["Sudhir Kamath", "1977-10-13", 172, 86, "kn"],
};

// ── Conditions: what the chat is about ───────────────────────────
// history = older exchange, recent = the latest lines. `file` = which demo-files folder the patient sends from.
const CASES = {
  bp: {
    history: [["p", "Namaskara doctor, my BP has been high for a week. Morning readings around 150/95."], ["d", "Thank you for checking. Any headache or giddiness? Please send me a photo of your readings."], ["p", "Slight headache in the evenings. Sending the readings now."]],
    recent: [["d", "Your readings are better this week. Keep the salt low and continue the tablet."], ["p", "Thank you doctor. Should I continue the morning walk?"], ["d", "Yes, 30 minutes daily. We'll review at the check-in."]],
    file: "checkups", rx: { diagnosis: "Essential hypertension", advice: "Low salt diet. Walk 30 minutes daily. Check BP every morning and note it down.", items: [["Amlodipine 5 mg", "1 tablet", "1-0-0", "30 days", "After food"]] },
    checkIn: "Review BP readings after new tablet",
  },
  diabetes: {
    history: [["p", "Doctor, my fasting sugar was 168 today. I have been eating rice twice a day."], ["d", "Please get an HbA1c and fasting lipid profile done and share the report."], ["p", "Done at the lab near the bus stand. Sending the report."]],
    recent: [["d", "HbA1c is 8.1. We need to tighten control. I've updated your tablets."], ["p", "Okay doctor. Can I have one cup of coffee with sugar?"], ["d", "Without sugar please. Small portions of rice, more vegetables and dal."]],
    file: "reports", rx: { diagnosis: "Type 2 diabetes mellitus, uncontrolled", advice: "Avoid sweets and sugary drinks. Small rice portions. Walk after dinner.", items: [["Metformin 500 mg", "1 tablet", "1-0-1", "90 days", "After food"], ["Glimepiride 1 mg", "1 tablet", "1-0-0", "90 days", "Before food"]] },
    checkIn: "Fasting sugar and HbA1c review",
  },
  child_fever: {
    history: [["p", "Doctor, my child has fever since last night, 101°F. Not eating properly."], ["d", "Is she drinking water and passing urine normally? Any rash or cough?"], ["p", "Drinking a little. Mild cough, no rash."]],
    recent: [["d", "Give the syrup as prescribed, plenty of fluids. Sponge with normal water if fever goes above 102."], ["p", "Fever came down this morning. She ate idli."], ["d", "Very good. Continue for 3 days. Message me if fever returns."]],
    file: "checkups", rx: { diagnosis: "Viral fever with upper respiratory infection", advice: "Plenty of fluids, light food, rest. Sponging if fever is above 102°F.", items: [["Paracetamol syrup 250 mg/5 ml", "5 ml", "1-1-1", "3 days", "After food"], ["Cetirizine syrup 5 mg/5 ml", "2.5 ml", "0-0-1", "5 days", null]] },
    checkIn: "Check fever and appetite",
  },
  pregnancy: {
    history: [["p", "Good morning doctor, 24 weeks now. The scan report came today."], ["d", "Please share it. How are the baby's movements?"], ["p", "Movements are good. Sending the scan."]],
    recent: [["d", "Scan is normal. Baby is growing well. Continue iron and calcium."], ["p", "I feel tired in the afternoons, is that normal?"], ["d", "It's common. Rest well and keep your iron tablets. We'll do a sugar test at 26 weeks."]],
    file: "reports", rx: { diagnosis: "Antenatal care, 24 weeks", advice: "Iron after lunch, calcium after dinner. Left-side sleeping. Report any bleeding or reduced movements at once.", items: [["Ferrous ascorbate 100 mg", "1 tablet", "0-1-0", "30 days", "After food"], ["Calcium carbonate 500 mg + Vit D3", "1 tablet", "0-0-1", "30 days", "After food"]] },
    checkIn: "Glucose tolerance test at 26 weeks",
  },
  knee: {
    history: [["p", "Doctor, my right knee pains when I climb stairs. Worse in the morning."], ["d", "How long has this been going on? Any swelling?"], ["p", "About two months. Slight swelling in the evening. I got an X-ray done."]],
    recent: [["d", "The X-ray shows early wear in the knee joint. Physiotherapy will help a lot."], ["p", "Okay. Can I still go for my walk in the estate?"], ["d", "Yes, on flat ground. Avoid steep slopes for now and do the exercises daily."]],
    file: "reports", rx: { diagnosis: "Early osteoarthritis, right knee", advice: "Quadriceps exercises twice daily. Hot pack in the evening. Avoid squatting and steep slopes.", items: [["Aceclofenac 100 mg", "1 tablet", "1-0-1", "5 days", "After food"], ["Glucosamine 1500 mg", "1 sachet", "1-0-0", "60 days", "After food"]] },
    checkIn: "Knee pain review after physiotherapy",
  },
  asthma: {
    history: [["p", "Doctor, breathing trouble again at night since the rains started."], ["d", "Are you using the inhaler properly? Any fever or yellow phlegm?"], ["p", "No fever. I think I am using the inhaler wrongly."]],
    recent: [["d", "Use the spacer with the inhaler and rinse your mouth after. I've added a preventer."], ["p", "Much better since two days. Sleeping well."], ["d", "Great. Keep the preventer daily even when you feel fine."]],
    file: "checkups", rx: { diagnosis: "Bronchial asthma, partly controlled", advice: "Use the spacer. Rinse mouth after the preventer inhaler. Avoid smoke and damp rooms.", items: [["Budesonide + Formoterol 200/6 inhaler", "2 puffs", "1-0-1", "30 days", null], ["Montelukast 10 mg", "1 tablet", "0-0-1", "30 days", null]] },
    checkIn: "Night symptoms and inhaler technique",
  },
  thyroid: {
    history: [["p", "Doctor, I feel tired all the time and I'm gaining weight."], ["d", "Let's check your thyroid. Please do TSH, T3 and T4 and send the report."], ["p", "Here is the report."]],
    recent: [["d", "Your TSH is high, so the thyroid is underactive. One small tablet every morning will fix it."], ["p", "Do I take it before tea?"], ["d", "Yes, on an empty stomach, 30 minutes before tea or breakfast."]],
    file: "reports", rx: { diagnosis: "Hypothyroidism", advice: "Take the tablet on an empty stomach, 30 minutes before breakfast or tea. Repeat TSH in 6 weeks.", items: [["Levothyroxine 50 mcg", "1 tablet", "1-0-0", "60 days", "Before food"]] },
    checkIn: "Repeat TSH after 6 weeks",
  },
  skin: {
    history: [["p", "Doctor, itchy red patches on my arms for two weeks. Sending a photo."], ["d", "Thanks. Any new soap, detergent or medicine recently?"], ["p", "I changed the washing powder last month."]],
    recent: [["d", "Looks like contact dermatitis. Change back to the old powder and apply the cream."], ["p", "The itching is much less now."], ["d", "Good. Use the cream only for 7 days, then the moisturiser daily."]],
    file: "checkups", rx: { diagnosis: "Allergic contact dermatitis", advice: "Stop the new detergent. Cotton clothes. Moisturise twice daily.", items: [["Mometasone 0.1% cream", "Thin layer", "1-0-1", "7 days", null], ["Levocetirizine 5 mg", "1 tablet", "0-0-1", "10 days", null]] },
    checkIn: "Check skin after cream course",
  },
  cardiac: {
    history: [["p", "Doctor, Dr. Shenoy asked me to consult you. I get chest heaviness while walking uphill."], ["d", "Thank you for reaching out. Please share your ECG and the echo report."], ["p", "Sending both reports."]],
    recent: [["d", "The ECG shows some changes. I'd like you to do a TMT this week."], ["p", "Okay doctor, I will book it. Should I stop walking?"], ["d", "Walk on flat ground only, slowly. If pain comes at rest, go to the hospital immediately."]],
    file: "reports", rx: { diagnosis: "Stable angina, under evaluation", advice: "Avoid exertion and heavy meals. Keep the spray with you. Go to hospital at once if pain lasts more than 10 minutes.", items: [["Aspirin 75 mg", "1 tablet", "0-1-0", "30 days", "After food"], ["Atorvastatin 40 mg", "1 tablet", "0-0-1", "30 days", "After food"], ["Nitroglycerin 0.4 mg spray", "1 spray", "When needed", "30 days", null]] },
    checkIn: "TMT result review",
  },
  ear: {
    history: [["p", "Doctor, ear pain and blocked feeling since swimming at Malpe beach."], ["d", "Any discharge from the ear? Fever?"], ["p", "A little discharge yesterday, no fever."]],
    recent: [["d", "It's an outer ear infection. Use the drops and keep the ear dry."], ["p", "Pain is less. Can I bathe normally?"], ["d", "Yes, but put cotton with a little coconut oil in the ear while bathing. No swimming for 2 weeks."]],
    file: null, rx: { diagnosis: "Otitis externa, left ear", advice: "Keep the ear dry. No swimming for 2 weeks. Don't use earbuds.", items: [["Ciprofloxacin + Dexamethasone ear drops", "4 drops", "1-1-1", "7 days", null], ["Ibuprofen 400 mg", "1 tablet", "1-0-1", "3 days", "After food"]] },
    checkIn: "Ear check after drops",
  },
  back: {
    history: [["p", "Doctor, lower back pain after lifting coconut sacks at the shop."], ["d", "Is the pain going down the leg? Any numbness?"], ["p", "No, only in the lower back."]],
    recent: [["d", "It's a muscle strain. Rest for 3 days, then start the stretches I sent."], ["p", "I'm feeling better. Can I go back to the shop?"], ["d", "Yes, but no heavy lifting for 2 weeks. Bend your knees when you lift."]],
    file: null, rx: { diagnosis: "Acute lumbar muscle strain", advice: "Rest 3 days. Hot water bag twice daily. No heavy lifting for 2 weeks.", items: [["Diclofenac 50 mg", "1 tablet", "1-0-1", "5 days", "After food"], ["Thiocolchicoside 4 mg", "1 tablet", "1-0-1", "5 days", "After food"]] },
    checkIn: "Back pain follow-up",
  },
  pcos: {
    history: [["p", "Doctor, my periods are irregular for 6 months and I have acne."], ["d", "Please get an ultrasound of the abdomen and the hormone tests I've listed."], ["p", "Reports are ready, sharing now."]],
    recent: [["d", "The scan shows polycystic ovaries. Diet and exercise will help the most."], ["p", "Will I need tablets for long?"], ["d", "Let's start for 3 months and review. Regular exercise is the main treatment."]],
    file: "reports", rx: { diagnosis: "Polycystic ovary syndrome", advice: "45 minutes of exercise 5 days a week. Fewer sweets and fried snacks.", items: [["Metformin 500 mg", "1 tablet", "0-0-1", "90 days", "After food"], ["Myo-inositol 2 g", "1 sachet", "1-0-0", "90 days", null]] },
    checkIn: "Cycle and weight review",
  },
  rhinitis: {
    history: [["p", "Doctor, sneezing every morning and blocked nose, especially in the coffee estate."], ["d", "Is it worse in the mist season? Any wheezing?"], ["p", "Yes, worse in the mist. No wheezing."]],
    recent: [["d", "This is allergic rhinitis. Use the nasal spray daily for a month."], ["p", "Sneezing is much less now."], ["d", "Good. Continue the spray through the monsoon."]],
    file: null, rx: { diagnosis: "Allergic rhinitis", advice: "Steam inhalation at night. Cover nose and mouth in dusty or misty places.", items: [["Fluticasone nasal spray", "2 sprays each nostril", "1-0-0", "30 days", null], ["Fexofenadine 120 mg", "1 tablet", "0-0-1", "15 days", null]] },
    checkIn: "Nasal symptoms review",
  },
};

// ── Who sees whom ────────────────────────────────────────────────
// lastMin: minutes since the last message. unread: the doctor hasn't read the patient's last N messages.
// patientUnread: the patient hasn't read the doctor's last message. meeting: now | today | upcoming | completed | cancelled.
// checkIn: days from today (negative = overdue) or "done". prior: an old file from another folder ("prescriptions").
const CHATS = [
  // Your two test accounts: busy, so every screen has something to show.
  { p: "you", d: "john", c: "bp", start: 40, lastMin: 6, unread: 2, meeting: "now", checkIn: 0, correction: true, prior: "prescriptions" },
  { p: "you", d: "kamath", c: "cardiac", start: 18, lastMin: 180, patientUnread: true, meeting: "upcoming", checkIn: 5 },
  { p: "you", d: "cariappa", c: "skin", start: 9, lastMin: 3 * 24 * 60, meeting: "completed", checkIn: "done" },
  { p: "deepak", d: "john", c: "back", start: 12, lastMin: 25, unread: 1, meeting: "today", checkIn: 3 },
  { p: "nagesh", d: "john", c: "diabetes", start: 60, lastMin: 2 * 60, meeting: "upcoming", checkIn: -2, prior: "prescriptions" },
  { p: "geetha", d: "john", c: "thyroid", start: 30, lastMin: 26 * 60, meeting: "completed", checkIn: 0 },
  { p: "mohammed", d: "john", c: "rhinitis", start: 8, lastMin: 4 * 24 * 60, meeting: "cancelled", checkIn: 10 },
  { p: "kishore", d: "john", c: "bp", start: 90, lastMin: 6 * 24 * 60, meeting: "completed", checkIn: "done", blocked: true },
  { p: "fathima", d: "john", c: "ear", start: 5, lastMin: 50, unread: 3, checkIn: 2 },

  // Udupi / Manipal
  { p: "ramesh", d: "shenoy", c: "bp", start: 45, lastMin: 3 * 60, meeting: "completed", checkIn: -1 },
  { p: "ramesh", d: "kamath", c: "cardiac", start: 14, lastMin: 40, unread: 1, meeting: "today", checkIn: 7 },
  { p: "ramesh", d: "pai", c: "diabetes", start: 20, lastMin: 2 * 24 * 60, meeting: "upcoming", checkIn: 12 },
  { p: "sudhir", d: "shenoy", c: "diabetes", start: 35, lastMin: 15, unread: 2, checkIn: 0, prior: "prescriptions" },
  { p: "sudhir", d: "pai", c: "thyroid", start: 25, lastMin: 5 * 24 * 60, meeting: "completed", checkIn: "done" },
  { p: "shruthi", d: "shetty", c: "ear", start: 6, lastMin: 70, meeting: "today", checkIn: 4 },
  { p: "divya", d: "shetty", c: "rhinitis", start: 15, lastMin: 22 * 60, checkIn: -3 },
  { p: "divya", d: "pai", c: "pcos", start: 28, lastMin: 3 * 24 * 60, meeting: "upcoming", checkIn: 20 },
  { p: "ganesh", d: "kamath", c: "cardiac", start: 50, lastMin: 9 * 60, patientUnread: true, meeting: "completed", checkIn: 1 },
  { p: "ganesh", d: "shenoy", c: "diabetes", start: 70, lastMin: 7 * 24 * 60, checkIn: "done" },

  // Malpe / Kundapura
  { p: "anvi", d: "bhat", c: "child_fever", start: 3, lastMin: 12, unread: 1, meeting: "now", checkIn: 1 },
  { p: "arjun", d: "bhat", c: "asthma", start: 40, lastMin: 2 * 24 * 60, meeting: "completed", checkIn: 6 },
  { p: "aarav", d: "bhat", c: "child_fever", start: 2, lastMin: 5 * 60, patientUnread: true, checkIn: 0 },
  { p: "sunitha", d: "hegde", c: "pcos", start: 32, lastMin: 30 * 60, meeting: "upcoming", checkIn: 8 },
  { p: "latha", d: "hegde", c: "pregnancy", start: 120, lastMin: 35, unread: 1, meeting: "upcoming", checkIn: 14, prior: "prescriptions" },
  { p: "shruthi", d: "hegde", c: "pregnancy", start: 60, lastMin: 4 * 60, meeting: "today", checkIn: 0 },

  // Madikeri / Kushalnagar / independent
  { p: "bopanna", d: "poonacha", c: "diabetes", start: 80, lastMin: 18, unread: 2, meeting: "upcoming", checkIn: -4 },
  { p: "bopanna", d: "muthanna", c: "knee", start: 20, lastMin: 6 * 60, meeting: "completed", checkIn: 9 },
  { p: "chengappa", d: "muthanna", c: "knee", start: 10, lastMin: 2 * 60, meeting: "today", checkIn: 2 },
  { p: "chengappa", d: "poonacha", c: "diabetes", start: 65, lastMin: 4 * 24 * 60, meeting: "completed", checkIn: "done" },
  { p: "pooja", d: "poonacha", c: "thyroid", start: 22, lastMin: 3 * 60, checkIn: 15 },
  { p: "pooja", d: "hegde", c: "pcos", start: 16, lastMin: 2 * 24 * 60, meeting: "cancelled", checkIn: 11 },
  { p: "vinay", d: "rai", c: "asthma", start: 30, lastMin: 55, unread: 1, meeting: "upcoming", checkIn: 3 },
  { p: "vinay", d: "muthanna", c: "back", start: 7, lastMin: 3 * 24 * 60, checkIn: "done" },
  { p: "rohini", d: "cariappa", c: "skin", start: 11, lastMin: 8 * 60, meeting: "completed", checkIn: 4 },
  { p: "rohini", d: "rai", c: "rhinitis", start: 26, lastMin: 6 * 24 * 60, checkIn: -6 },
];

// ── Demo files ───────────────────────────────────────────────────
const FILE_DIR = path.join(path.dirname(new URL(import.meta.url).pathname), "demo-files");
const MIME = { ".pdf": "application/pdf", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" };
const FILES = {};
for (const folder of ["reports", "checkups", "prescriptions"]) {
  const dir = path.join(FILE_DIR, folder);
  FILES[folder] = fs.existsSync(dir)
    ? fs.readdirSync(dir).filter((f) => MIME[path.extname(f).toLowerCase()]).sort().map((f) => path.join(dir, f))
    : [];
}
const fileTurn = { reports: 0, checkups: 0, prescriptions: 0 };
function nextFile(folder) {
  const list = FILES[folder] ?? [];
  if (!list.length) return null;
  return list[fileTurn[folder]++ % list.length];
}
async function uploadFile(conversationId, filePath) {
  const bytes = fs.readFileSync(filePath);
  if (bytes.length > 10 * 1024 * 1024) { console.warn("skipped (over 10 MB):", path.basename(filePath)); return null; }
  const name = path.basename(filePath);
  const safe = name.replace(/[^\w.-]+/g, "_");
  const storagePath = `${conversationId}/${crypto.randomUUID()}-${safe}`;
  const type = MIME[path.extname(name).toLowerCase()];
  must(await db.storage.from("attachments").upload(storagePath, bytes, { contentType: type, upsert: false }), `upload ${name}`);
  return { file_path: storagePath, file_name: name, file_size: bytes.length, file_type: type };
}

// ── Accounts ─────────────────────────────────────────────────────
const slug = (name) => name.replace(/^Dr\.\s*/, "").toLowerCase().replace(/[^a-z]+/g, ".").replace(/^\.|\.$/g, "");
let phoneSeq = 0;
const nextPhone = (prefix) => `+91${prefix}${String(100 + phoneSeq++).padStart(5, "0")}`;

async function findProfileByEmail(email) {
  return must(await db.from("profiles").select("id, clinic_id").eq("email", email).maybeSingle(), `find ${email}`);
}
async function ensureUser(email, name, extra) {
  const found = await findProfileByEmail(email);
  if (found) return { id: found.id, created: false };
  const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: name } });
  if (error) throw new Error(`create ${email}: ${error.message}`);
  const stamp = iso(NOW - 120 * DAY);
  must(await db.from("profiles").update({ full_name: name, status: "active", activated_at: stamp, terms_accepted_at: stamp, ...extra }).eq("id", data.user.id), `profile ${email}`);
  return { id: data.user.id, created: true };
}

const summary = { clinics: 0, doctors: 0, patients: 0, chats: 0, messages: 0, files: 0, prescriptions: 0, meetings: 0, checkIns: 0 };

const clinicIds = [];
for (const name of CLINICS) {
  const existing = must(await db.from("clinics").select("id").eq("name", name).maybeSingle(), "clinic lookup");
  if (existing) { clinicIds.push(existing.id); continue; }
  clinicIds.push(must(await db.from("clinics").insert({ name, show_other_doctors: true }).select("id").single(), "clinic insert").id);
  summary.clinics++;
}

const doctorId = {};
for (const [k, d] of Object.entries(DOCTORS)) {
  if (d.existing) {
    const p = await findProfileByEmail(d.email);
    if (!p) throw new Error(`${d.email} not found`);
    if (!p.clinic_id) must(await db.from("profiles").update({ clinic_id: clinicIds[d.clinic] }).eq("id", p.id), "doctor clinic");
    doctorId[k] = p.id;
    continue;
  }
  const u = await ensureUser(`dr.${slug(d.name).split(".").pop()}@careconnect.demo`, d.name, {
    role: "doctor", specialty: d.specialty, reg_no: d.reg, phone: nextPhone("98450"), clinic_id: d.clinic === null ? null : clinicIds[d.clinic],
  });
  doctorId[k] = u.id;
  if (u.created) summary.doctors++;
}

const patientId = {};
for (const [k, p] of Object.entries(PATIENTS)) {
  if (p.existing) {
    const found = await findProfileByEmail(p.email);
    if (!found) throw new Error(`${p.email} not found`);
    patientId[k] = found.id;
    continue;
  }
  const [name, dob, h, w, lang] = p;
  const firstDoctor = CHATS.find((c) => c.p === k)?.d;
  const u = await ensureUser(`${slug(name)}@careconnect.demo`, name, {
    role: "patient", phone: nextPhone("99000"), date_of_birth: dob, height_cm: h, weight_kg: w, language: lang,
    invited_by: firstDoctor ? doctorId[firstDoctor] : null,
  });
  patientId[k] = u.id;
  if (u.created) summary.patients++;
}

// ── Chats ────────────────────────────────────────────────────────
async function issuePrescription(conv, dId, pId, rx, at, replacesId = null) {
  const row = must(await db.from("prescriptions").insert({
    conversation_id: conv, doctor_id: dId, patient_id: pId, diagnosis: rx.diagnosis, advice: rx.advice, replaces_id: replacesId, created_at: iso(at - 10 * MIN),
  }).select("id").single(), "rx");
  must(await db.from("prescription_items").insert(rx.items.map(([medicine, dose, frequency, duration, timing], position) => ({
    prescription_id: row.id, position, medicine, dose, frequency, duration, timing,
  }))), "rx items");
  must(await db.from("prescriptions").update({ status: "issued", issued_at: iso(at) }).eq("id", row.id), "rx issue");
  summary.prescriptions++;
  return row.id;
}

function meetingStart(kind, startDay) {
  if (kind === "now") return NOW - 5 * MIN;                        // "Join meeting" is live
  if (kind === "today") return NOW + (2 + Math.floor(Math.random() * 4)) * HOUR;
  if (kind === "upcoming") return istAt(1 + Math.floor(Math.random() * 6), [10, 11, 16, 17][Math.floor(Math.random() * 4)], 30);
  if (kind === "cancelled") return istAt(2, 18, 0);
  return istAt(-Math.max(1, Math.floor(startDay / 2)), 17, 0);    // completed
}

for (const chat of CHATS) {
  const dId = doctorId[chat.d];
  const pId = patientId[chat.p];
  const kase = CASES[chat.c];

  let conv = must(await db.from("conversations").select("id").eq("doctor_id", dId).eq("patient_id", pId).maybeSingle(), "conv lookup");
  if (!conv) {
    conv = must(await db.from("conversations").insert({ doctor_id: dId, patient_id: pId, created_at: iso(NOW - chat.start * DAY) }).select("id").single(), "conv insert");
    summary.chats++;
  }
  const { count } = await db.from("messages").select("id", { count: "exact", head: true }).eq("conversation_id", conv.id);
  if (count) continue; // never mix demo lines into a chat that already has messages

  // Build the timeline: history near the start, recent lines ending `lastMin` ago.
  const begin = NOW - chat.start * DAY + 10 * HOUR;
  const end = NOW - chat.lastMin * MIN;
  const events = [];
  kase.history.forEach(([who, body], i) => events.push({ at: begin + i * 25 * MIN, who, body }));
  const afterHistory = begin + kase.history.length * 25 * MIN;
  if (chat.prior) events.push({ at: begin - 5 * MIN, who: "p", file: chat.prior, body: null });
  if (kase.file) events.push({ at: afterHistory - 10 * MIN, who: "p", file: kase.file });
  events.push({ at: afterHistory + 2 * HOUR, who: "d", rx: kase.rx });
  // Doctor's own follow-up cards, scheduled between history and the recent lines.
  const middle = Math.min(afterHistory + Math.max(1, (end - afterHistory) / 2), end - 40 * MIN);
  if (chat.meeting) events.push({ at: Math.min(middle, NOW - 30 * MIN), who: "d", meeting: chat.meeting });
  if (chat.checkIn !== undefined) events.push({ at: Math.min(middle + 20 * MIN, NOW - 20 * MIN), who: "d", checkIn: chat.checkIn });
  if (chat.correction) events.push({ at: afterHistory + 5 * HOUR, who: "d", correction: true });
  const gap = Math.min(40 * MIN, Math.max(2 * MIN, (end - middle) / (kase.recent.length + 1)));
  kase.recent.forEach(([who, body], i) => events.push({ at: end - (kase.recent.length - 1 - i) * gap, who, body }));
  // Unread patient messages for the doctor: extra lines at the very end.
  const extra = ["Doctor, one more question when you are free.", "Also my mother wants to consult you, can I share your number?", "Thank you 🙏"];
  for (let i = 0; i < (chat.unread ?? 0) - 1; i++) events.push({ at: end + (i + 1) * MIN, who: "p", body: extra[i % extra.length], unread: true });
  events.sort((a, b) => a.at - b.at);

  // The last N patient lines are unread for the doctor; the last doctor line may be unread for the patient.
  const patientLines = events.filter((e) => e.who === "p" && e.body);
  patientLines.slice(-(chat.unread ?? 0) || patientLines.length).forEach((e) => { if (chat.unread) e.unread = true; });
  const doctorLines = events.filter((e) => e.who === "d" && e.body);
  if (chat.patientUnread && doctorLines.length) doctorLines[doctorLines.length - 1].unread = true;

  let firstRx = null;
  for (const e of events) {
    const sender = e.who === "d" ? dId : pId;
    const base = { conversation_id: conv.id, sender_id: sender, created_at: iso(e.at), read_at: e.unread ? null : iso(Math.min(e.at + 7 * MIN, NOW)) };
    if (e.body) {
      must(await db.from("messages").insert({ ...base, kind: "text", body: e.body }), "message");
      summary.messages++;
    } else if (e.file) {
      const f = nextFile(e.file);
      if (!f) continue;
      const up = await uploadFile(conv.id, f);
      if (!up) continue;
      must(await db.from("messages").insert({ ...base, kind: "file", ...up }), "file message");
      summary.files++;
    } else if (e.rx) {
      firstRx = await issuePrescription(conv.id, dId, pId, e.rx, e.at);
      must(await db.from("messages").insert({ ...base, kind: "prescription", prescription_id: firstRx }), "rx message");
    } else if (e.correction && firstRx) {
      const fixed = { ...kase.rx, advice: `${kase.rx.advice} Corrected: tablet strength updated.`, items: kase.rx.items.map(([m, ...rest], i) => [i === 0 ? m.replace("5 mg", "2.5 mg") : m, ...rest]) };
      const id = await issuePrescription(conv.id, dId, pId, fixed, e.at, firstRx);
      must(await db.from("messages").insert({ ...base, kind: "prescription", prescription_id: id }), "rx correction message");
    } else if (e.meeting) {
      const startsAt = meetingStart(e.meeting, chat.start);
      const status = e.meeting === "completed" ? "completed" : e.meeting === "cancelled" ? "cancelled" : "scheduled";
      const m = must(await db.from("meetings").insert({
        conversation_id: conv.id, doctor_id: dId, patient_id: pId, starts_at: iso(startsAt), duration_min: [15, 15, 20, 30][summary.meetings % 4],
        meet_url: `https://meet.google.com/cc-demo-${String(summary.meetings + 1).padStart(3, "0")}`, note: kase.checkIn,
        status, created_by: dId, created_at: iso(e.at), reminded_at: e.meeting === "now" ? iso(NOW - 15 * MIN) : null,
      }).select("id").single(), "meeting");
      must(await db.from("messages").insert({ ...base, kind: "meeting", meeting_id: m.id }), "meeting message");
      summary.meetings++;
    } else if (e.checkIn !== undefined) {
      const done = e.checkIn === "done";
      const ci = must(await db.from("check_ins").insert({
        conversation_id: conv.id, doctor_id: dId, patient_id: pId, due_on: istDate(done ? -3 : e.checkIn), reason: kase.checkIn,
        status: done ? "done" : "scheduled", created_by: dId, created_at: iso(e.at),
        reminded_at: !done && e.checkIn < 0 ? iso(istAt(e.checkIn, 8, 5)) : null,
      }).select("id").single(), "check-in");
      must(await db.from("messages").insert({ ...base, kind: "check_in", check_in_id: ci.id }), "check-in message");
      summary.checkIns++;
    }
  }

  if (chat.blocked) must(await db.from("conversations").update({ blocked_at: iso(NOW - 2 * DAY) }).eq("id", conv.id), "block");
}

must(await db.from("audit_log").insert({ actor_id: null, actor_role: "system", action: "demo.seeded", target_type: "system", details: summary }), "audit");
console.log("Demo data added:", summary);
console.log("Demo files found:", Object.fromEntries(Object.entries(FILES).map(([k, v]) => [k, v.length])));

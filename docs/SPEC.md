# CareConnect MVP — build spec

**Principle:** it should feel like messaging a familiar doctor, not using a medical application.
Patients: reassuring and obvious. Doctor: fast and organised.

Design reference: the Round 2 hi-fi canvas (glass, mint, forest green). Tokens in `src/app/globals.css`.

## Roles and access

- Several doctors (0005), each with their own patients. A patient can be invited by more than one doctor and then has one conversation per doctor. Doctors are added by the superadmin (Phase E); until then by hand (SETUP.md).
- Superadmin (`role = 'admin'`): sees and manages everything; see docs/PLAN.md.
- Patients exist only by invitation. Sign-up is disabled. A wrong email or password gets "That email and password don’t match. Please try again."
- Each patient has one ongoing conversation with each of their doctors. No new thread per question.
- Sign-in for everyone: email or mobile number + password.
- Joining, two ways: (1) **Share a link** (default): the doctor creates a one-time link (7 days) and shares it anywhere; the patient opens `/join/<token>` and gives name, email and/or mobile (at least one), and a password. No email, no code. (2) **Send by email**: Supabase invite email → `/set-password`.

## Routes

| Route | Who | Screen (canvas ref) |
|---|---|---|
| `/login` | all | Email + password ✅ |
| `/join/[token]` | patient | Make an account from the doctor's shared link ✅. A doctor link (from the admin) opens "Join as a doctor" instead ✅ |
| `/set-password` | all | Choose a password after opening an invite link ✅ |
| `/auth/confirm` | all | Invite link landing → `/set-password` ✅ |
| `/home` | patient | One card per doctor (name, specialty, latest message, unread count, "Open chat"), Prescriptions + Send a report tiles (B1) ✅ |
| `/chat` | patient | One doctor → that chat. Two or more → "Your doctors" list (B2, B4, B5) ✅ |
| `/chat/[conversationId]` | patient | The chat with one doctor. Back goes to "/chat" with two or more doctors, otherwise "/home" ✅ |
| `/prescriptions` | patient | Issued list, newest first, "Replaced" marked, the doctor's name on each; filter chips by doctor when there are two or more (C1, C4). The chips come from the prescriptions' own doctors, so a card can always be filtered by its doctor (Q-L) ✅ |
| `/prescriptions/[id]` | patient | Full prescription, DoseSchedule, Download (print) (C2) ✅ |
| `/profile` | patient | Name, email, language (EN/ಕನ್ನಡ/മലയാളം), own health details (date of birth, height, weight), privacy, help, sign out (C3) ✅ |
| `/doctor` | doctor | Inbox. Desktop: list + empty conversation pane. Phone: list (D2, E1, D9) |
| `/doctor/c/[id]` | doctor | Same 3 columns with conversation open + PatientPanel (D2, D3, D6, E2). The panel is a read-only summary; every action opens a popup (P1–P5) ✅ |
| `/doctor/settings/medicines` | doctor | Master medicines: add, edit, deactivate, merge (never delete) ✅ |
| `/doctor/settings` | doctor | Account details (name, email, specialty, reg no), current version, release notes ✅ |
| `/doctor/patients` | doctor | Patients + invite status, `?invite=1` opens InviteDialog (D7, D8) |
| `/privacy`, `/terms` | all | Plain-language privacy notice and terms of use (public) ✅ |
| `/rx/[id]/print` | both | Print-friendly prescription; browser "Save as PDF" (C2 Download) |
| `/admin` | admin | Overview: counts only — doctors, patients, chats, meetings this week. Four cards, no charts (56) ✅ |
| `/admin/doctors` | admin | Every doctor: name, specialty, clinic, patient count, status badge (Active / Deactivated). Search, invite, edit, deactivate ✅ |
| `/admin/patients` | admin | Every patient: name, contact, the doctors they see, status. Search by name, mobile number or email; `?doctor=<id>` filters to one doctor's patients ✅ |
| `/admin/clinics` | admin | Clinics: create, rename, the "also consults" setting, and the doctors in each (Q-B) ✅ |
| `/admin/conversations` | admin | Every chat: the patient, the doctor, the last message, a Blocked badge. Search by name; `?doctor=<id>` filters ✅ |
| `/admin/c/[id]` | admin | One chat, with the admin's actions: send as admin, edit, remove, block, cancel a prescription ✅ |
| `/admin/audit` | admin | The audit log: filter by who, by what, and by date ✅ |
| `/styleguide` | dev only | All shared components |

## Several doctors (Phase C, decisions 22–28)

- A patient has one chat per doctor. Chats with different doctors are completely separate: messages, reports and prescriptions never mix.
- `/chat`: no doctor → "No doctor connected yet". One doctor → that chat opens straight away. Two or more → "Your doctors" and "Tap a doctor to open your chat with them.", a list of doctors with their name, specialty, latest message and unread count.
- `/chat/<id>`: the chat with one doctor. The back button says "Back to your doctors" when the patient has two or more doctors, otherwise "Back to home".
- `/home`: one card per doctor, in the order the doctors were added. Each card: doctor's name, specialty, the latest message with its time, the unread count, and an "Open chat" button. Only the first card's button is the one primary button; the rest are secondary.
- "Send a report" on home: with one doctor it opens that chat with the attach sheet; with two or more it opens the doctor's list, so the patient picks who the report is for.
- `/prescriptions`: one list. Every card says which doctor issued it. With two or more doctors, chips below the header filter the list: "All" and one chip per doctor. The choice stays in the query string (`?doctor=<id>`), so a reload keeps it.
- `/profile` → "Health details": the patient sees their own date of birth, height and weight, and can edit them with "Edit". The same rules the doctor uses. Every change is audit logged.
- A doctor's `PatientPanel` may show "Also consults": the names and specialties of the patient's other doctors, and the line "Chats with other doctors stay private." It is off by default and the patient, the doctor or the clinic decides.

## Chat

- Bubbles: mine = right, mint. Theirs = left, white glass. Time under each. "Seen" on my last read message.
- Day dividers ("Today", "Yesterday", "Mon, 12 Oct") and a "N new messages" divider at the first unread.
- Composer fixed at the bottom: attach (left), text, send (right, the one primary button). Enter sends on desktop, newline on phone.
- Live updates via Supabase Realtime on `messages` filtered by conversation. Mark read on open and on new incoming message while open.
- Search icon in the header filters loaded messages client-side (past questions live in the chat; no separate Questions screen).
- Prescription cards appear inline. Tapping opens the full prescription.
- States: empty conversation (suggested starters: "I have a question about my medicine", "I want to send a report"), sending, failed (Try again / Remove), offline banner ("You're offline. Messages will send when you're back online."), unread.

## Attachments

- PDF, JPG, PNG, WEBP, HEIC. Max 10 MB. Private bucket, signed URLs (5 min).
- Patient flow: Attach → sheet (Take a photo / Choose a photo / Choose a file / Cancel) → preview with optional note → "Send to Dr. …" → bubble with progress → done or failed.
- Doctor sees attachments in chat and in PatientPanel → Reports. Opens in FileViewer (PDF/image preview, Download, "Reply about this report"). Unsupported types show "Can't preview, download to open".

## Doctor workspace

- Desktop menu collapses to an icon rail; the patient column can be hidden to widen the chat. Both remembered per browser.
- Patient details the doctor can edit: name, email, mobile (changing either changes what the patient signs in with), date of birth (age shown), height (cm), weight (kg).
- Block / Activate a patient. Per conversation (0005): the patient can't message or upload in this doctor's chat; they can still sign in, read their history and use chats with other doctors. Shown as "Blocked" with icon. Every block and activation is audit logged.
- Patient's composer when blocked: "You can't send messages in this chat. You can still read your messages and prescriptions."
- When a doctor is deactivated by the admin, patient sees: "{Doctor name} is no longer available here. You can still read your messages and prescriptions." Doctor sees: "Your account is deactivated. Contact CareConnect to send messages again."

## Patient panel and popups (Phase P, decision 73)

- The right-hand panel is a **read-only summary**. Top to bottom: identity (avatar, name, phone, email, joined date, status badge) → details (age, height, weight) → latest prescription (date, medicine names, "View") → reports (count + the 2 latest, "View all") → "Also consults" (only when the setting is on). Nothing is edited inside the panel.
- Every action opens a popup, and the popup is opened by the **query string**, so a link works, a reload works and Back works. Closing replaces the URL, so the history never fills up with popups.
  - `?rx=new` → write a prescription (or resume the newest draft). `?rx=<id>` → read an issued one, or continue a draft. `?rx=new&replaces=<id>` → a correction, prefilled.
  - `?details=1` → edit the patient's name, email, mobile, date of birth, height and weight.
  - `?prescriptions=1` → every prescription in the chat. `?reports=1` → every report in the chat.
  - `?panel=1` → the patient panel as a sheet (phone only).
- The wide popups use `Dialog size="lg"`: ~720px on a desktop, a full-height sheet on a phone, with the body scrolling and the footer in place.
- Block and Activate keep a small confirmation dialog inside the panel, because it acts at once and the doctor has to be sure.
- On a phone the panel opens as a sheet from the chat header, with the same sections. There is no second, mobile-only panel.
- **Next up**: the next meeting and the next check-in, as compact cards. Empty state: "Nothing scheduled — Set a meeting or a check-in for {first name}."

## Meetings and check-ins (Phase D, decisions 29–42, 68–72)

Two kinds of appointment, one card and one popup, switched by `type`.

- A **meeting** is a video call at a time: a pasted `https://` link (Google Meet, Zoom, anything), a date, a time, a length and an optional note.
- A **check-in** is a reminder to come back on a date: a due date and a reason. No link, no time of day.

### The card (in the chat, on the patient's home, in the panel)

- **Meeting**: a badge with words and an icon — "Scheduled", "Starting soon" (15 minutes or less), "Now", "Completed", "Cancelled". The date, the time and the length are shown.
- **Check-in**: a badge with words and an icon — "Scheduled" (with the due date, e.g. "Due Fri, 15 Nov"), "Due today", "Overdue", "Done", "Cancelled". The reason is shown.
- **"Join meeting"** opens the link in a new tab. It only becomes live 10 minutes before the start and stops at the end; before then it reads "Join meeting (opens 10 minutes before)".
- The doctor gets a "Manage" link on the card, which opens the popup for that appointment.
- The patient's home shows that doctor's next meeting on their card.

### The popup (the doctor)

- Opened by the query string: `?appt=meeting`, `?appt=check_in`, `?appt=<id>`. Closing replaces the URL, so the history stays clean.
- A new appointment starts on the **Meeting** tab; the **Segmented** switches to **Check-in**.
- **Meeting form**: date, time, how long (15 minutes, 30, 45, 60 or Custom), the meeting link, and an optional note for the patient.
- **Check-in form**: "In" chips (3 days, 1 week, 2 weeks, 1 month, or a custom date) and a reason. The reason is required.
- If the meeting overlaps another of the doctor's meetings, a banner says so — "You already have a meeting at {time}. You can still schedule this one." It warns, it never blocks.
- An existing appointment can be **rescheduled** (date, time, length, link, note), **cancelled** (with a confirmation) or **marked done**. A check-in can also be **turned into a meeting**: the meeting form opens prefilled, the reason becomes the note, and the check-in links to the meeting and becomes done.
- The doctor opens the popup from the panel's "Schedule" button, from the "Manage" link on a card, and from the panel's "Next up" cards.

### Rules

- Only the conversation's doctor schedules. A patient asks with **"Request a meeting"**, which sends the message "I'd like to schedule a video meeting." and creates nothing.
- A link must start with `https://` and be at most 500 characters. A meeting lasts 5 to 240 minutes. A note is at most 500 characters. A reason is 2 to 300 characters. A meeting cannot start in the past, and a check-in cannot be due in the past.
- Every change posts a card in the chat, so both sides see the same history.
- The doctor's inbox shows a small **"Check-in due"** badge on a conversation with a check-in due today or overdue.
- **Settings → Meetings → Mark meetings complete automatically**: on by default. When it is on, a meeting is marked done 15 minutes after it starts.
- The reminders cron sends both sides "Meeting in 15 minutes" before a meeting, and "Check-in due today" once on the morning a check-in is due. The notification never shows the time, the link, the note or the reason.

### Doctor copy

- "Schedule a meeting", "Set a check-in", "Join meeting", "Meeting cancelled", "Check-in due", "Request a meeting", "Nothing scheduled", "Turn into a meeting", "Mark done", "Overdue", "Due today".

## Superadmin (Phase E, part 1: decisions 43–46, 52, 54, 56, Q-B)

One superadmin role (decision 8). The admin signs in with the same email + password as
everyone else and lands on `/admin`. A doctor or a patient who opens `/admin` is sent back to
their own home.

### The screens

- **`/admin` — Overview.** Counts only, no charts (decision 56): **Doctors**, **Patients**,
  **Chats**, **Meetings this week**. Each card links to where that number can be acted on.
- **`/admin/doctors` — Doctors.** Every doctor: name, specialty, clinic, how many patients
  they have, and a status badge (**Active** / **Deactivated**, words + an icon). Search by
  name, specialty or email. "Invite doctor" and "Manage" on each row.
- **`/admin/patients` — Patients.** Every patient: name, email or mobile number, the doctors
  they see, and a status badge (**Active** / **Invite pending** / **Account blocked**). Search by
  name, mobile number or email. `?doctor=<id>` shows one doctor's patients only.
- **`/admin/clinics` — Clinics.** A clinic has a name, an "also consults" setting and its
  doctors. A doctor belongs to one clinic at most (Q-B).
- **`/admin/conversations` — Conversations.** Every chat: the patient, the doctor, the last
  message time, and a **Blocked** badge when the chat is blocked. Search by either name.
  `?doctor=<id>` shows one doctor's chats only. Each row opens the chat.
- **`/admin/c/[id]` — A chat.** The same chat the doctor and the patient see, with the admin's
  actions on it. The header names the patient and the doctor and has the **Block chat** toggle.
- **`/admin/audit` — Audit log.** Everything an admin has changed, newest first, 50 to a page.
  Filters: **Who** (a name, or "system"), **What happened** (**All** / **Views** / **Messages**
  / **Prescriptions** / **People** / **Meetings**), and a date from and to. Each row says who
  did what and when; the details open underneath, in plain words.

### What the admin can do

- **Invite a doctor** (decisions 18, 44): a one-time link or an email. Only the admin can
  invite doctors. The doctor opens the link, adds their name, specialty, registration number,
  email or mobile number, and a password, and lands on `/doctor`. No patient, no chat.
- **Edit a doctor**: name, specialty, registration number, clinic.
- **Deactivate a doctor** (decision 52): their patients can still read their history, but
  nobody can send anything in their chats. "Reactivate" undoes it. Both ask first.
- **A doctor's settings**: "Show a patient's other doctors" (**On** / **Off** / **Follow the
  clinic**) and "Mark meetings complete automatically" (**On** / **Off**).
- **Invite a patient** and assign them to one or more doctors (decision 45). A patient who
  already has an account keeps their name and their first inviter.
- **Add a doctor to an existing patient.** Nobody is ever moved between doctors (decision 46).
- **Block one chat** (decision 11): the patient can't send in that doctor's chat only.
- **Block the whole account** (decision 12): they can't sign in or send to any doctor. Their
  history stays on record.
- **A patient's setting**: "Show their other doctors" (**On** / **Off** / **Follow the
  doctor**).
- **Clinics**: create, rename, set the "also consults" setting, and move doctors in and out.

### Moderating a chat (part 2: decisions 47–50, 55, Q-C, Q-J)

- **Read every chat** (decision 47): the messages, the reports, the prescriptions, the meetings
  and the check-ins.
- **Send a message as the admin** (decision 48). It is labelled **"CareConnect Admin"** on both
  sides (Q-J) and sits in the middle of the chat. It never shows as the doctor or the patient.
- **Edit a message** (decision 49): the new words replace the old ones, and both sides see
  **"Edited"**.
- **Remove a message** (decision 50): both sides see **"Message removed by admin"**. A report's
  file is deleted too.
- **Block the chat** from the chat's header, with the same question as everywhere else.
- **Opening a chat and opening a report are recorded** (decision 55), in the audit log.
- **Cancel an issued prescription** (Q-C): it stays on record and shows **"Cancelled by admin"**
  everywhere the patient and the doctor see it, including the print page. It is never edited in
  place.
- **Write a correction on the doctor's behalf** (Q-C): the admin writes the new prescription and
  it is saved as a draft for that doctor. The doctor sends it to the patient from their own
  chat. An issued prescription is never changed.
- **Scheduling a meeting as the admin is not part of this phase.** The admin can see the meeting
  and check-in cards, but the doctor schedules them.

### Admin copy

- "Overview", "Doctors", "Patients", "Clinics", "Conversations", "Audit log", "Invite doctor",
  "Invite patient", "Create clinic", "Manage", "Deactivate", "Reactivate", "Block chat",
  "Unblock chat", "Block the account", "Unblock the account", "Add a doctor", "Chats", "Chat",
  "Open chat", "Show a patient's other doctors", "Follow the clinic", "Follow the doctor",
  "Mark meetings complete automatically", "Nothing scheduled", "Join as a doctor",
  "Everything on CareConnect, at a glance.", "Open prescription", "Edit", "Remove",
  "Save change", "Remove message", "Edit this message", "Remove this message?",
  "Write a correction", "Cancel this prescription", "Apply filters", "Clear filters",
  "Who", "From", "To", "All", "Views", "Messages", "Prescriptions", "People", "Meetings",
  "Blocked", "CareConnect Admin", "Message as CareConnect Admin", "Cancelled by admin",
  "Cancelled by admin", "Edited", "Message removed by admin",
  "Everything an admin has changed, newest first.",
  "Nothing recorded yet", "Every change an admin makes shows up here.",
  "No conversations yet", "When a patient starts a chat with a doctor, it shows up here.",
  "No further details.", "Open the chat", "Page {n} of {m}", "Previous", "Next",
  "Both the patient and the doctor will see the change, marked as edited.",
  "Both the patient and the doctor will see “Message removed by admin”. A report's file is
  deleted too.",
  "Cancel this prescription? It stays on record and shows as cancelled.",
  "This prescription was cancelled by the admin. It stays on record.",
  "This corrects the prescription from {doctor}. The doctor sends it to the patient.",
  "Save correction", "The correction is saved as a draft for {doctor} to send. Issued
  prescriptions are never changed in place.",
  "Medicines", "Add a medicine", "Diagnosis", "Advice",
  "You can unblock the chat at any time.",
  "This chat is read-only while it is blocked.",
  "A clinic groups doctors. A doctor belongs to one clinic at most.",
  "Create one above, then add your doctors to it.", "No doctor yet.", "No contact yet",
  "No clinic", "No clinic yet.", "There are no doctors yet. Invite a doctor first.",
  "Nobody yet.", "Choose a doctor", "Invite a patient and assign them to a doctor.",
  "Invite a doctor and they'll appear here.", "The patient keeps their other doctors. Nobody
  is moved away.", "They can't sign in or send anything to any doctor. Their history stays on
  record.", "When it follows the clinic, the clinic's own setting decides.",
  "When it follows the doctor, the doctor's own setting decides.",
  "To read or moderate a chat, open the patient's conversation with their doctor.",
  "Only the admin can invite doctors, so keep this link to yourself until you send it.",
  "One link is for one doctor.", "Tick every doctor the patient should see. You can choose
  more than one.", "This link has been used.", "This link doesn't work any more.",
  "This link has expired. Ask CareConnect for a new one.",
  "There's already an account with this email or number. Sign in instead.",
  "Set up your CareConnect account with this link. You'll invite your own patients afterwards.",
  "You'll sign in with either.", "Use at least 8 characters for your password.",
  "Enter a 10-digit Indian mobile number.", "That email doesn't look right. Check it and try
  again.", "Enter your full name.", "Add your email or your mobile number, so you can sign in
  later.", "We couldn't send the invitation. Check the email address and try again.",
  "We couldn't create the invitation. Please try again.",
  "We couldn't save these details. Please try again.", "We couldn't save these settings.
  Please try again.", "We couldn't save this setting. Please try again.",
  "We couldn't create the clinic. Please try again.", "We couldn't rename the clinic. Please
  try again.", "We couldn't change this doctor's clinic. Please try again.",
  "We couldn't block this chat. Please try again.", "We couldn't unblock this chat. Please try
  again.", "We couldn't block this account. Please try again.", "We couldn't unblock this
  account. Please try again.", "We couldn't deactivate this doctor. Please try again.",
  "We couldn't reactivate this doctor. Please try again.", "We couldn't add this doctor.
  Please try again.", "We couldn't connect this patient to their doctors. Please try again.",
  "We couldn't create a link. Please try again.", "Doctor not found.", "Patient not found.",
  "Clinic not found.", "Chat not found.", "This email belongs to a doctor account.",
  "One of the chosen doctors isn't there any more. Please try again.",
  "The invitation was sent but the profile wasn't set up. Please try again.",
  "The invitation was sent but the chats couldn't be created. Please try again.",
  "already sees this patient."
- The admin is labelled **"Admin"** in the UI (decision 8, Q-J).

## Master medicines

- Settings → Master medicines. ONE list shared by every doctor (0005): name + strength, optional usual dose.
- Doctors add. Only the superadmin edits, deactivates (stops suggesting) and merges duplicates (the duplicate becomes inactive and points at the kept one). No delete, so nothing is lost.
- Doctor copy: "The list every doctor shares. Medicines are suggested when you write a prescription. Add any that are missing. To change or merge one, contact CareConnect."
- The prescription medicine field suggests active medicines and fills the usual dose. Free text still works; "Save to my medicines" adds a new name.
- Issued prescriptions keep the name they were written with; editing the master list never changes them.

## Removing reports

- The doctor can remove a report from the file viewer ("Remove report", with a confirmation).
- The file is deleted from Storage; the chat keeps a "Report removed by the doctor" line so the record stays honest.
- The admin removes a report the same way: the file is deleted from Storage and the chat shows
  "Message removed by admin" (decision 50).
- Limits: 10 MB per file (bucket setting). Total storage is set by the Supabase plan.

## Prescriptions

- Doctor writes from a popup: the conversation's "New prescription" opens a wide popup (`Dialog size="lg"`). Same component on phone, where it is a full-height sheet.
- Patient name and date are filled in and read-only. Fields: diagnosis/notes (optional), medicines (search text + dose + frequency chips + duration chips + timing chips), advice.
- Quick picks: `FREQUENCY_OPTIONS`, `DURATION_OPTIONS`, `TIMING_OPTIONS` in `lib/constants.ts`. Nothing is pre-selected. "Custom…" reveals a text input.
- Medicine search in the MVP = free text with suggestions from the doctor's own previous prescriptions (no drug database).
- Draft autosaves (debounced 1.5 s) and shows "Draft · saved 10:19 AM · not visible to Ravi". Closing the popup keeps the draft; "?rx=new" resumes it.
- Review dialog shows the patient identity strip, a table of medicines, advice and the lock notice:
  "Ravi will see this in his chat and under Prescriptions. Once issued it is locked. To correct it, you issue a new version that replaces this one, and both stay on record."
- Issue → locked, card posted in chat, success banner "Prescription issued. Ravi can see it in his chat and under Prescriptions."
- Correction: "Issue a correction" on an issued card → new draft prefilled, `replacesId` set. Older one shows "Replaced".
- The admin cancels an issued prescription (Q-C): the row stays, with a "Cancelled by admin" badge
  (words + an icon) on the card in chat, on the full prescription, on the patient's list and on the
  print page. Only `cancelled_at` and `cancelled_by` change; nothing else in the row does.
- The admin writes a correction on the doctor's behalf (Q-C): a new draft with the conversation's
  doctor as its doctor, so the doctor issues it from their own chat. The admin never issues it.
- Patient view: medicine name, dose + timing, DoseSchedule slots, duration, doctor's advice, Download PDF (print page), "Ask Dr. … about this".
- Print page includes doctor name, specialty, `reg_no`, patient name, date, medicines table, advice. `[REG NO]` placeholder until filled.

## Invites

- Doctor enters full name + email → `invitePatient()` → Supabase invite email → patient appears in inbox as "Invite pending" (dashed avatar).
- Patient joins by clicking the invite link and choosing a password. First sign-in flips status to Active.
- Patients page shows Active / Invite pending, with Resend for pending and Open chat for active.
- "Email not delivered" from the hi-fi is out of scope for the MVP (needs delivery webhooks).

- Already a patient (Q-K): signed in → `/join/<token>` shows "Join {Doctor}… You're signed in as {name}. Accept to start a separate chat with this doctor. Your other doctors won't see it." + "Accept invitation". Signed out → under the form: "Already use CareConnect with another doctor?" + "Sign in to accept" (`/login?next=/join/<token>`; sign-in returns only to `/join/<token>` paths). Accepting uses up the link and is audit logged.

## Patient profile & language

- Languages: English, ಕನ್ನಡ, മലയാളം (0005; Hindi removed). Language switch saves to `profiles.language`. All copy stays English this round; the switch is wired for later translation.

## Notifications

- Web push, opt-in per device: patients in Profile, the doctor in Settings ("Turn on notifications").
- Sent when the other person sends a message, a file, or (to the patient) issues a prescription.
- The title is the sender's name ("Dr. Rao"), so the right doctor is clear on a lock screen. The body says what happened and nothing more: "New message." / "Sent you a file." / "Sent you a prescription." Never the content, never a medical detail.
- Tapping opens that conversation: the patient goes to `/chat/<id>`, the doctor to `/doctor/c/<id>`.
- States: on, off, blocked by the browser, iPhone not on the Home Screen (explains how), unsupported browser.
- Signing out removes this device, so the next person on a shared phone doesn't get alerts.

## Accessibility & copy

- Body text 16px on phone. Targets 44px. Icons + labels. Contrast ≥ 4.5:1 (tokens already pass).
- Error copy says what happened and what to do. Never show raw error messages to users.

## Out of scope

Video/voice calls, appointments, payments, AI, pharmacy, group chats, analytics, multiple staff roles, native apps,
push notifications (later: web push or WhatsApp), translations (language switch is stored only).

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
| `/join/[token]` | patient | Make an account from the doctor's shared link ✅ |
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
- **Next up** (the next meeting and the next check-in) is Phase D. Until then the section is a placeholder.

## Master medicines

- Settings → Master medicines. ONE list shared by every doctor (0005): name + strength, optional usual dose.
- Doctors add. Only the superadmin edits, deactivates (stops suggesting) and merges duplicates (the duplicate becomes inactive and points at the kept one). No delete, so nothing is lost.
- Doctor copy: "The list every doctor shares. Medicines are suggested when you write a prescription. Add any that are missing. To change or merge one, contact CareConnect."
- The prescription medicine field suggests active medicines and fills the usual dose. Free text still works; "Save to my medicines" adds a new name.
- Issued prescriptions keep the name they were written with; editing the master list never changes them.

## Removing reports

- The doctor can remove a report from the file viewer ("Remove report", with a confirmation).
- The file is deleted from Storage; the chat keeps a "Report removed by the doctor" line so the record stays honest.
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

# CareConnect MVP — build spec

**Principle:** it should feel like messaging a familiar doctor, not using a medical application.
Patients: reassuring and obvious. Doctor: fast and organised.

Design reference: the Round 2 hi-fi canvas (glass, mint, forest green). Tokens in `src/app/globals.css`.

## Roles and access

- One doctor account (created by hand, see SETUP.md). Schema already supports more doctors later.
- Patients exist only by invitation. Sign-up is disabled. A wrong email or password gets "That email and password don’t match. Please try again."
- Each patient has one ongoing conversation with their doctor. No new thread per question.
- Sign-in for everyone: email or mobile number + password.
- Joining, two ways: (1) **Share a link** (default): the doctor creates a one-time link (7 days) and shares it anywhere; the patient opens `/join/<token>` and gives name, email and/or mobile (at least one), and a password. No email, no code. (2) **Send by email**: Supabase invite email → `/set-password`.

## Routes

| Route | Who | Screen (canvas ref) |
|---|---|---|
| `/login` | all | Email + password ✅ |
| `/join/[token]` | patient | Make an account from the doctor's shared link ✅ |
| `/set-password` | all | Choose a password after opening an invite link ✅ |
| `/auth/confirm` | all | Invite link landing → `/set-password` ✅ |
| `/home` | patient | Doctor card, latest message, Chat CTA, Prescriptions + Send a report tiles (B1) ✅ |
| `/chat` | patient | Conversation with the doctor (B2), attach flow (B3, B4), states (B5) |
| `/prescriptions` | patient | Issued list, newest first, "Replaced" marked (C1, C4) |
| `/prescriptions/[id]` | patient | Full prescription, DoseSchedule, Download (print) (C2) |
| `/profile` | patient | Name, email, language (EN/ಕನ್ನಡ/हिन्दी), privacy, help, sign out (C3) |
| `/doctor` | doctor | Inbox. Desktop: list + empty conversation pane. Phone: list (D2, E1, D9) |
| `/doctor/c/[id]` | doctor | Same 3 columns with conversation open + PatientPanel (D2, D3, D6, E2) |
| `/doctor/settings` | doctor | Account details (name, email, specialty, reg no), current version, release notes ✅ |
| `/doctor/patients` | doctor | Patients + invite status, `?invite=1` opens InviteDialog (D7, D8) |
| `/rx/[id]/print` | both | Print-friendly prescription; browser "Save as PDF" (C2 Download) |
| `/styleguide` | dev only | All shared components |

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

## Removing reports

- The doctor can remove a report from the file viewer ("Remove report", with a confirmation).
- The file is deleted from Storage; the chat keeps a "Report removed by the doctor" line so the record stays honest.
- Limits: 10 MB per file (bucket setting). Total storage is set by the Supabase plan.

## Prescriptions

- Doctor writes from the conversation (desktop: right-hand panel; phone: full screen). Same component.
- Patient name and date are filled in and read-only. Fields: diagnosis/notes (optional), medicines (search text + dose + frequency chips + duration chips + timing chips), advice.
- Quick picks: `FREQUENCY_OPTIONS`, `DURATION_OPTIONS`, `TIMING_OPTIONS` in `lib/constants.ts`. Nothing is pre-selected. "Custom…" reveals a text input.
- Medicine search in the MVP = free text with suggestions from the doctor's own previous prescriptions (no drug database).
- Draft autosaves (debounced 1.5 s) and shows "Draft · saved 10:19 AM · not visible to Ravi". Drafts listed in PatientPanel with "Continue draft".
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

## Patient profile & language

- Language switch saves to `profiles.language`. All copy stays English this round; the switch is wired for later translation.

## Notifications

- Web push, opt-in per device: patients in Profile, the doctor in Settings ("Turn on notifications").
- Sent when the other person sends a message, a file, or (to the patient) issues a prescription.
- Text: "New message from Dr. Rao." / "Dr. Rao sent a file." / "Dr. Rao sent you a prescription." Never the content.
- Tapping opens the chat (patient), the prescriptions list (patient, for a prescription) or the conversation (doctor).
- States: on, off, blocked by the browser, iPhone not on the Home Screen (explains how), unsupported browser.
- Signing out removes this device, so the next person on a shared phone doesn't get alerts.

## Accessibility & copy

- Body text 16px on phone. Targets 44px. Icons + labels. Contrast ≥ 4.5:1 (tokens already pass).
- Error copy says what happened and what to do. Never show raw error messages to users.

## Out of scope

Video/voice calls, appointments, payments, AI, pharmacy, group chats, analytics, multiple staff roles, native apps,
push notifications (later: web push or WhatsApp), translations (language switch is stored only).

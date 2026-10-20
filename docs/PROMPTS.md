# Build plan for Claude Code

**Status: phases 1–6 are built.** This file is kept as the record of what each phase covered and what
to test. For what exists now, read `docs/COMPONENTS.md` and open `/styleguide`.

Still outstanding, because they need a running Supabase project (`docs/SETUP.md`):

- End-to-end test with two browsers (doctor + patient): invite, chat, upload, prescribe, correct.
- `supabase/tests/rls_smoke.sql` on a throwaway local Postgres.
- Deploy (SETUP.md step 7) and walk the PRD acceptance criteria on a real phone.

---

## Phase 0 — Set up (you, ~20 min)

Follow `docs/SETUP.md` steps 1–6. Then `npm install && npm run dev`, sign in as the doctor, and confirm you land on `/doctor`.

---

## Phase 1 — Invite a patient

```
Read CLAUDE.md, docs/COMPONENTS.md and docs/SPEC.md (Invites section).
Build InviteDialog in src/components/doctor/InviteDialog.tsx using Dialog, Field, TextInput and Button.
It calls the existing invitePatient() server action. Show field errors inline and the server error with FieldError.
Open it whenever any /doctor route has ?invite=1 (mount it once in src/app/doctor/layout.tsx; closing removes the param).
On success: close, show Banner tone="success" "Invitation sent to {name} ({email}).", and refresh.
Do not create new primitives. Update docs/COMPONENTS.md status and add InviteDialog to /styleguide.
```
Test: invite your own second email. Accept the email, sign in with the code, land on /home with the doctor card.

---

## Phase 2 — Chat (shared by patient and doctor)

```
Read CLAUDE.md, docs/COMPONENTS.md and docs/SPEC.md (Chat section).
Build ONE chat used by both roles:
- src/components/chat/Conversation.tsx (client): renders messages with MessageItem, day dividers via isNewDay/formatDay,
  the "N new messages" divider, auto-scrolls to bottom, subscribes to Supabase Realtime INSERTs on messages for this
  conversation (getBrowserClient), dedupes by id, calls markRead() on mount and on each incoming message.
- src/components/chat/MessageItem.tsx: switch on kind → MessageBubble text / FileCard / PrescriptionCard.
- src/components/chat/Composer.tsx: floating glass pill with attach IconButton (disabled until Phase 3), auto-growing
  textarea, primary send IconButton. Optimistic send with pending → sent / failed (Try again, Remove). Offline Banner
  using navigator.onLine + online/offline events; queue sends while offline.
- src/components/doctor/ConversationList.tsx from the current /doctor page list, with search and Segmented All/Unread.
  Refresh on Realtime changes to conversations.
Pages:
- /chat (patient): PageHeader with doctor Avatar, name, specialty, search icon. Conversation fills the screen.
- /doctor/c/[conversationId]: desktop 3 columns (ConversationList | Conversation | placeholder panel), phone = just the
  conversation with a back link to /doctor. /doctor desktop shows ConversationList + an EmptyState pane.
Use getConversation/getMessages/getPrescriptions from lib/data.ts. Empty conversation state per SPEC.
No forked doctor/patient chat components.
```
Test: two browsers (doctor + patient), messages appear live both ways, unread counts clear.

---

## Phase 3 — Reports and the doctor's patient panel

```
Read CLAUDE.md, docs/COMPONENTS.md and docs/SPEC.md (Attachments section).
- src/components/chat/AttachSheet.tsx: Dialog variant="sheet" with Take a photo (input capture="environment"),
  Choose a photo (accept image/*), Choose a file (accept application/pdf), Cancel. Then a preview step (image preview
  or FileCard), optional note, "Send to Dr. …". Upload with lib/upload.ts uploadAttachment(), then sendAttachment().
  Show progress state in the chat (pending bubble) and failure with Try again / Remove.
- Enable the attach button in Composer. /chat?attach=1 opens the sheet directly (Home "Send a report" tile).
- src/components/chat/FileViewer.tsx: full-panel viewer using getFileUrl(): <iframe> for PDF, <img> for images,
  "Can't preview" + Download for others. Header: back, file name, meta, Download (secondary), "Reply about this report" (primary).
- src/components/doctor/PatientPanel.tsx: identity (Avatar ring, name, email, joined), "New prescription" Button
  variant="soft" (disabled until Phase 4), Segmented Reports/Prescriptions, Reports list of FileCard rows from file messages.
Wire FileViewer into /doctor/c/[id] (opens over the chat column via ?file=<messageId>) and into patient chat (tap opens).
```

---

## Phase 4 — Prescriptions

```
Read CLAUDE.md, docs/COMPONENTS.md and docs/SPEC.md (Prescriptions section).
Build with the existing saveDraft / issuePrescription / deleteDraft actions and lib/data.ts reads:
- rx/MedicineFields.tsx: medicine TextInput with suggestions (datalist from this doctor's past item names), dose,
  ChipGroup frequency/duration/timing with a "Custom…" option revealing a TextInput, Remove.
- rx/PrescriptionComposer.tsx: patient + date strip (read-only), diagnosis, medicines (Add medicine), advice,
  debounced autosave via saveDraft with the "Draft · saved …" Banner, Save draft, "Review prescription" (primary).
  Same component renders as the right panel on desktop (/doctor/c/[id]?rx=new or ?rx=<draftId>) and full screen on phone.
- rx/ReviewIssueDialog.tsx: identity strip, items table, advice, lock notice, Back to edit / Issue prescription.
  After issue: close composer, success Banner, the card arrives in chat via Realtime.
- rx/PrescriptionView.tsx: read-only full prescription with DoseSchedule per item.
- PatientPanel Prescriptions tab: drafts (dashed, "Continue draft"), issued, replaced (replacedIds()).
- "Issue a correction" action on issued cards (doctor side only) → new draft prefilled with replacesId.
- Patient /prescriptions (list with "Latest" and "Replaced" badges, EmptyState, Skeleton loading via loading.tsx,
  error.tsx with Try again) and /prescriptions/[id] using PrescriptionView + "Download PDF" (link to /rx/[id]/print)
  + "Ask Dr. … about this" (/chat).
- /rx/[id]/print: requireProfile(), getPrescription(), plain white print layout, window.print() on load.
```

---

## Phase 5 — Patients page, profile, polish

```
Read CLAUDE.md, docs/COMPONENTS.md and docs/SPEC.md.
- doctor/PatientsTable.tsx + /doctor/patients: search, ChipGroup filter (All / Active / Invite pending), Badge statuses,
  actions Resend (resendInvite) and Open chat, "Invite patient" primary button (?invite=1). Horizontal scroll on phone.
- /profile: Card with Avatar + name + email, Segmented language (updateMyProfile), Privacy notice, Help, Sign out (danger).
- Doctor first-run: /doctor with no conversations shows the D9 welcome (logo, Invite patient, 3 steps).
- Add loading.tsx and error.tsx to (patient) and doctor segments using Skeleton and EmptyState.
```

---

## Phase 6 — Hardening and launch

```
Read CLAUDE.md. Audit the whole app:
1. Delete ComingSoon and any unused component. Search for duplicate components and merge them.
2. Grep for hex colours, backdrop-filter, raw <button className="bg-…"> and fix to tokens/primitives.
3. Check every page at 390px and 1440px. Check keyboard navigation and focus rings. aria-labels on IconButtons.
4. Confirm RLS by running supabase/tests/rls_smoke.sql (see supabase/tests/README.md).
5. npm run build. List anything you could not verify.
```
Then deploy (SETUP.md step 7) and run the PRD acceptance criteria end to end with a real patient phone.

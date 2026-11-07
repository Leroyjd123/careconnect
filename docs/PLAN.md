# Build plan: v0.7 → v0.9 (multi-doctor, meetings, superadmin, landing)

**Status:** approved scope, not started. Last updated: 2026-11-07.
**Owner:** Leroy (product). Builders: any agent.

This file is self-contained. You do NOT need the conversation it came from. Read it top to bottom once,
then work from the **Progress tracker** (§2). It sits beside, and never overrides, `CLAUDE.md`, except where
§5 "Exceptions to CLAUDE.md" says so explicitly.

Read order for a new agent: `CLAUDE.md` → this file → `docs/WORKLOG.md` → `docs/COMPONENTS.md` → `docs/SPEC.md`.

---

## 0. How to use and update this file

- **Tick boxes** in §2 as you finish tasks. One line of notes max per task (commit hash, gotcha).
- **Never silently change a decision** in §3. If something must change, add a row to §9 (Change log)
  and ask Leroy first.
- **Open questions** live in §8. Do not build anything that depends on an open question. Ask, record the
  answer in §3, delete it from §8.
- **New components** need Leroy's approval first (§6). Record approvals in §6, with date.
- When a phase finishes, also update `docs/WORKLOG.md` (State + Decisions log), as CLAUDE.md requires.
- Keep it short. Facts, not narration.

---

## 1. What we are building (one paragraph)

CareConnect is an **invite-only** doctor–patient messaging app (Next.js 15 + Supabase, see `CLAUDE.md`).
Today it assumes one doctor. This plan makes it:

1. **Multi-doctor**: many doctors, each with their own patients.
2. **Multi-doctor per patient**: a patient invited by two doctors sees two separate chats.
3. **Meetings**: doctor (or admin) schedules a video meeting by pasting a link (Google Meet, Zoom, any `https://`).
4. **Superadmin panel** at `/admin`: add doctors and patients, view and moderate everything, audit log.
5. **Landing page** at `/` for signed-out visitors, pitched at doctors.

Positioning: doctors connect with their patients **anywhere, anytime**. Marketing angle: local doctors can
grow their local practice because their local patients reach them more easily. It is NOT a marketplace:
no public sign-up, no doctor discovery, no booking calendar, no location search, no payments, no fees.

---

## 2. Progress tracker

Work on branch `feature/multi-doctor` (create it from `main`). One commit per phase.
After each phase: `npm run typecheck && npm run lint && npm run build` must pass.

| Phase | Name | Release | Status |
|---|---|---|---|
| A | Database migration 0005 | – | ✅ applied to Supabase 2026-11-07 |
| B | Multi-doctor clean-up | v0.7.0 | ✅ done 2026-11-07 |
| C | Patient with several doctors | v0.7.0 | ✅ done 2026-11-07 |
| P | Patient panel → summary + popups | v0.7.0 | ✅ done 2026-11-07 (Next up waits for Phase D) |
| D | Meetings + check-ins | v0.7.0 | ☐ |
| E | Superadmin panel + audit log | v0.8.0 | ☐ |
| G | Landing page | v0.9.0 | ☐ components approved |
| F | Docs, consent, releases | each release | ☐ |

Order: **A → B → C → P → D → E → G → F** (F's doc updates also happen inside each phase).

---

## 3. Decisions (answered by Leroy, 2026-11-07)

Numbers match the original question list so answers can be traced.

### General
| # | Decision |
|---|---|
| 1 | Keep the name "CareConnect". |
| 2 | Order A→B→C→P→D→E→G→F. Stop after Phase A for review. |
| 3 | One commit per phase on a feature branch. |
| 4 | Agents may push and deploy this plan's work without asking each time. |
| 5 | **No invented placeholders.** If a real value is missing (contact, copy, image), ask Leroy. |
| 6 | Market: India (₹, Indian mobile numbers, DPDP Act 2023). |
| 7 | Patient languages: **English, Kannada, Malayalam** (Hindi removed). See Q-A below. |

### Database and roles (Phase A)
| # | Decision |
|---|---|
| 8 | One superadmin role. No admin permission tiers. |
| 9 | First admin created by hand in Supabase, email `admin@careconnect.com`. **Never write the password in the repo, docs, commits or logs.** Leroy holds it. |
| 10 | An admin is never also a doctor (separate accounts). |
| 11 | Blocking is **per conversation**: blocks one doctor's chat only. |
| 12 | Admin can also block a whole account. |
| 13 | A blocked patient can still read history, cannot send or upload. |
| 14 | Inviting an existing patient by email must not overwrite their name or first `invited_by`. |
| 15 | No new RLS smoke tests required for this plan (see §5). |

### Multi-doctor (Phase B)
| # | Decision |
|---|---|
| 16 | **One shared master medicines list** for all doctors (not per doctor). |
| 17 | Doctors can still invite patients themselves. |
| 18 | Doctors cannot invite doctors. Only the admin can. |
| 19 | Registration number is NOT required to issue. If empty, the print page omits the line (no `[REG NO]`). |
| 20 | Legal pages say "your doctor", never a hard-coded name. |
| 21 | Specialty is free text for now. |

### Patient with several doctors (Phase C)
| # | Decision |
|---|---|
| 22 | One doctor → `/chat` opens that chat directly. Two or more → list of doctors. |
| 23 | Home shows one card per doctor. (Confirmed, Q-D.) |
| 24 | Prescriptions page: one list, each labelled with the doctor's name. |
| 25 | Filter chips by doctor when there are two or more. |
| 26 | A doctor may see the patient's **other doctors as name cards** ("Also consults: Dr. X, specialty"), never their chats. **Off by default**, controlled by the superadmin at clinic, doctor and patient level. See Q-B below. |
| 27 | Shared patient details (DOB, height, weight): any of the patient's doctors can edit. **Audit logged.** |
| 28 | Patients can edit their own DOB, height, weight in Profile. **Audit logged.** |

### Meetings (Phase D)
| # | Decision |
|---|---|
| 29 | Any `https://` link is accepted. |
| 30 | Only doctors and the admin schedule meetings. |
| 31 | Patients get a "Request a meeting" button. It only sends a normal chat message; it creates nothing. |
| 32 | Default duration 15 min. Doctor (or admin) sets it; the patient never does. |
| 33 | "Join meeting" becomes active 10 minutes before the start. |
| 34 | Doctor can reschedule (time, duration, link, note). |
| 35 | Doctor can cancel; chat shows "Meeting cancelled". |
| 36 | Completion: doctor can mark complete by hand, AND a setting "auto-complete 15 minutes after start" exists, editable by the doctor and the superadmin. Default: **on**. |
| 37 | Push when scheduled, moved or cancelled. Sender name only. |
| 38 | Reminder push 15 min before, via external free cron (cron-job.org) calling a protected route. |
| 39 | No 1-day-before reminder. |
| 40 | Several upcoming meetings per patient–doctor pair are allowed. |
| 41 | Overlap with another of the doctor's meetings: warn, don't block. |
| 42 | Admin can schedule on a doctor's behalf. |

### Superadmin (Phase E)
| # | Decision |
|---|---|
| 43 | `/admin` in this same app. |
| 44 | Admin invites doctors (link or email). |
| 45 | Admin invites patients and assigns them to one or more doctors. |
| 46 | No "move patient between doctors". Add another doctor instead. |
| 47 | Admin reads every chat, report, prescription, meeting. |
| 48 | Admin sends messages, always labelled **"Admin"**, never as the doctor or patient. |
| 49 | Admin can edit or delete any message. Audit logged. |
| 50 | Deleted message shows "Message removed by admin". |
| 51 | Admin can edit or cancel issued prescriptions. **How** is an open question, see Q-C below. |
| 52 | Admin can deactivate a doctor; their patients can read but not send. |
| 53 | **No fees.** Do not add any fee field. |
| 54 | Audit log covers admin actions, meeting changes, blocks, patient-detail edits. |
| 55 | Audit log also records admin **views** of chats and files. |
| 56 | Admin overview: simple counts, no charts. |

### Consent and releases (Phase F)
| # | Decision |
|---|---|
| 57 | Required "I agree to the privacy notice and terms" checkbox on `/join` and `/set-password`. |
| 58 | Existing users: set `terms_accepted_at` directly in the migration (there is only one user). |
| 59 | Releases: v0.7.0 (multi-doctor + meetings), v0.8.0 (admin), v0.9.0 (landing). |

### Landing (Phase G)
| # | Decision |
|---|---|
| 60 | Landing at `/` in this app, aimed at doctors and clinics. |
| 61 | **No WhatsApp** for now. Single contact: email `leroy.social@gmail.com` (mailto). |
| 62 | Sections and look follow design inspirations Leroy will provide. Do not design before receiving them. |
| 63 | Not "hyperlocal" in the product; the pitch mentions local doctors reaching local patients more easily. |
| 64 | Pricing line: "No charges". Never "free pilot". |
| 65 | Minimal imagery. Leroy generates and supplies images. Do not use stock photos or AI images yourself. |
| 66 | English only. |

### Resolved open questions (2026-11-07, all "yes")
| ID | Decision |
|---|---|
| Q-A | Malayalam replaces Hindi. Existing `hi` users move to `en`. Language stays a saved preference (no translation work in this plan). |
| Q-B | Add a minimal `clinics` table (name, `show_other_doctors`). Each doctor belongs to at most one clinic. Admin-managed. |
| Q-C | Admin never edits an issued prescription in place. Admin can **cancel** it (shown "Cancelled by admin", stays on record) and issue a **correction on the doctor's behalf** via `replaces_id`. |
| Q-D | Patient home: one card per doctor (name, specialty, latest message, unread count, "Open chat", that doctor's next meeting). |
| Q-E | Shared medicines: any doctor adds; only the admin edits, deactivates, merges. |
| Q-F/G | Landing inspirations received (§7 Phase G). Real app screenshots may be used as images; other imagery from Leroy. |
| Q-H | Legal pages contact: `leroy.social@gmail.com`. |
| Q-I | Meeting auto-complete defaults to on. |
| Q-J | Admin messages are labelled "CareConnect Admin". |
| Q-K | A signed-in patient can accept another doctor's invite link; signed out, "Sign in to accept" returns to the link. Built in Phase B follow-up. |

### Added 2026-11-07 (after the component review)
| # | Decision |
|---|---|
| 67 | ASCII designs for components 1–11 approved ("looks fine"). Landing headline font: Inter heavy (no serif). Landing CTA: "Get in touch" → mailto `leroy.social@gmail.com`. |
| 68 | **Check-ins (follow-ups)**: the doctor (or admin) schedules a check-in "in N days" with a reason. It is a reminder to meet again, not a meeting. No link, no time of day: a due date. |
| 69 | On the due date, both the patient and the doctor get a push ("Dr. X: check-in due today") and the card in the chat shows "Due today". |
| 70 | A check-in can be: marked done, rescheduled (new date), cancelled, or **turned into a video meeting** (opens the meeting popup prefilled; the check-in links to the meeting and becomes done). |
| 71 | Patients cannot create check-ins; they can use "Request a meeting" (decision 31). |
| 72 | Meetings and check-ins share ONE card and ONE popup, switched by `type`: `AppointmentCard`, `AppointmentDialog` (replaces the approved `MeetingCard` / `MeetingDialog` names; same designs). |
| 73 | **Patient panel redesign**: the right-hand panel becomes a read-only **summary** ("description field"). Every create/edit action opens a **popup** (`Dialog`): New prescription, Schedule meeting, Schedule check-in, Edit details, Block, View all reports, View all prescriptions. Nothing is edited inside the panel itself. |
| 74 | The doctor's inbox list and chat header stay as they are (screenshot of 2026-11-07 approved as the baseline look). |

### Explicitly out of scope (from an older "marketplace" blueprint, reviewed and rejected)
Public sign-up, doctor discovery or search, location / radius / pincode, patient self-booking calendar,
availability slots, video SDKs (Jitsi, Daily, WebRTC), SMS / OTP, payments, fees, ratings, analytics charts,
recordings, Firebase, a separate backend, Docker, REST API docs. Do not build any of these.

---

## 4. Rules (strict)

All of `CLAUDE.md` applies. These are the ones agents break most, plus the additions for this plan.

### 4.1 Design system: existing components only
1. **Build every screen from the components in `docs/COMPONENTS.md`.** Primitives: `Button`/`ButtonLink`/`IconButton`,
   `Card`, `Field`/`TextInput`/`TextArea`, `Segmented`, `ChipGroup`, `Dialog`, `Avatar`, `Badge`/`CountBadge`,
   `EmptyState`/`Banner`/`Skeleton`, `IconTile`, `Logo`. Layout: `TabBar`, `DoctorSidebar`, `PageHeader`,
   `SettingsRow`, `ErrorScreen`, `LegalPage`, `NotificationToggle`, `LayoutToggle`.
2. **A new component file needs Leroy's written approval.** Before creating one, add a row to §6 with:
   name, why no existing component can be extended, and the proposed props. Stop and ask. Do not build it
   "temporarily".
3. **Extending an existing component** (new prop or variant) is allowed without approval if it is backward-compatible.
   Update `docs/COMPONENTS.md` and `/styleguide` in the same commit. Mention it in the phase summary.
4. **Moving** a component (e.g. `doctor/ConversationList` → shared) counts as a structural change: list it in §6 and ask.
5. Page-local markup made only of primitives (a `Card` with a heading and a list) is fine and is not a "component".
   If the same markup appears in 2+ pages, it becomes a component, which needs approval.
6. Tokens only. No hex colours, no `backdrop-filter`, no arbitrary Tailwind values for colour, radius or shadow.
7. One `variant="primary"` button per screen. Touch targets ≥ 44px. Patient text ≥ 16px. Icons paired with text for patients.
   Status never by colour alone (badge text + icon).
8. No new runtime dependencies. No UI kits, date libraries, state libraries.

### 4.2 Data and security
1. RLS is the boundary. Every new table gets policies in migration 0005.
2. All writes are server actions returning `ActionResult`. All reads go through `src/lib/data.ts`.
3. Admin writes live in `src/app/actions/admin.ts`, each starting with `requireProfile("admin")`.
4. Every admin write, every admin view of a chat or file, every meeting change, every block and every
   patient-detail edit writes one row to `audit_log`.
5. Notifications name the sender only. Never meeting time, link, message text or medical detail.
6. Never store or print secrets: the admin password, `CRON_SECRET`, service-role key.
7. Schema change = migration + `src/lib/types.ts` in the same commit.

### 4.3 Copy
Plain, warm, short. "Schedule meeting", "Join meeting", "Request a meeting", "Meeting cancelled",
"Message removed by admin", "No charges". Add every new string to `docs/SPEC.md`.

### 4.4 Definition of done (per phase)
- typecheck, lint, build pass.
- Loading, empty and error states exist for anything new that fetches or submits.
- Checked at 390px and 1440px.
- `COMPONENTS.md`, `/styleguide`, `SPEC.md`, `WORKLOG.md`, `releases.ts` updated where relevant.
- Tracker in §2 ticked.

---

## 5. Exceptions to CLAUDE.md (approved for this plan only)

| CLAUDE.md rule | Exception |
|---|---|
| "extend `supabase/tests/rls_smoke.sql` if you add a policy" | Not required for this plan (decision 15). Still write the policies carefully. |
| `createAdminClient()` only in `actions/patients.ts` (+ `emailForPhone`) | Also allowed in `src/app/actions/admin.ts` (after `requireProfile("admin")`) and in `src/app/api/cron/reminders/route.ts` (after checking `CRON_SECRET`). Update CLAUDE.md in Phase A. |
| "Issued prescriptions are immutable (DB trigger)" | Admin-only path, design per Q-B/Q-E. Doctors' immutability is unchanged. |
| Master medicines per doctor (migration 0004) | Becomes one shared list (decision 16). |
| Languages en / kn / hi | Becomes en / kn / ml (decision 7). |

---

## 6. New components: approval register

Approval status per row. Rows marked ✅ were approved by Leroy on 2026-11-07. Each row says what is proposed and which existing pieces it reuses.
Leroy: reply "approve <name>" or suggest an alternative. Agents: do not build an unapproved row.

| Proposed | Phase | Why an existing one can't be extended | Built from | Status |
|---|---|---|---|---|
| `chat/AppointmentCard` (`type`: meeting \| check_in) | D | Shown in chat, patient home and PatientPanel. Nothing displays a scheduled item today. | `Card`, `IconTile`, `Badge`, `ButtonLink` | ✅ approved 2026-11-07 |
| `chat/AppointmentDialog` (`type`: meeting \| check_in) | D | Schedule / reschedule form. Opens from chat header, PatientPanel and admin. | `Dialog`, `Segmented`, `Field`, `TextInput`, `TextArea`, `ChipGroup allowCustom`, `Button` | ✅ approved 2026-11-07 |
| `Dialog` size `lg` (extension, no new file) | P | Prescription composer and "view all" lists need a wide popup (≈720px desktop, full-screen sheet on phone). | `Dialog` | allowed (extension) |
| Move `doctor/ConversationList` → `chat/ConversationList` + `viewerRole` prop | C, E | Patients (2+ doctors) and admin need the same list. Move, don't copy. | itself | ✅ approved 2026-11-07 · done in Phase C |
| Rename `layout/DoctorSidebar` → `layout/AppSidebar` with `items` prop | E | Admin needs the same sidebar with different links. | itself | ✅ approved 2026-11-07 |
| `admin/AuditLogTable` | E | No table of events exists. `PatientsTable` is patient-specific. | `Card`, `Badge`, `Segmented`, `TextInput` | ✅ approved 2026-11-07 |
| `doctor/OtherDoctorsCard` (or a `PatientPanel` section, no new file) | C | Show "Also consults: Dr. X". Prefer a section inside `PatientPanel`, which needs no approval. | `Card`, `Avatar` | ⏳ prefer no new file |
| `marketing/MarketingHeader` | G | Public top bar (logo, anchors, Sign in, Contact). App headers are signed-in only. | `Logo`, `ButtonLink` | ✅ approved 2026-11-07 |
| `marketing/DisplayHeading` | G | Large two-tone headline (ink + forest accent line), optional eyebrow. Used in every section. | tokens only | ✅ approved 2026-11-07 |
| `marketing/RotatingWord` | G | Headline word cycling ("…for reports / prescriptions / follow-ups"). Respects reduced motion. | tokens only | ✅ approved 2026-11-07 |
| `marketing/ChipMarquee` | G | Slow-scrolling rows of chips ("What you can handle"). Pauses on hover, static if reduced motion. | `Badge`-style chips | ✅ approved 2026-11-07 |
| `marketing/FeatureChecklist` | G | Check-icon list in 1 or 2 columns, title + optional line. | `IconTile` (sm) | ✅ approved 2026-11-07 |
| `marketing/PhoneFrame` | G | Device frame around a real app screenshot (`next/image`). | `Card` | ✅ approved 2026-11-07 |
| `Card` variant `tone="feature"` (extension, no new file) | G | Large clickable feature tile with title, chevron, image slot. | `Card` | allowed (extension) |

Allowed without approval (backward-compatible extensions, list them in the phase summary):
- `MessageItem`: handle `kind = 'meeting'` and the "Admin" sender label and "Message removed by admin".
- `MessageBubble`: an `author="admin"` style (token-based).
- `PatientPanel`: "Meetings" tab, "Schedule meeting" action, other-doctors section.
- `PatientsTable`, `PatientDetailsDialog`, `InviteDialog`: `viewerRole="admin"` / doctor picker / role picker.
- `PrescriptionCard` / `PrescriptionView`: show the issuing doctor's name.

---

## 7. Phase details

### Phase A: migration `supabase/migrations/0005_multi_doctor_meetings_admin.sql`
Stop after this phase. Leroy reviews the SQL before it is applied to Supabase.

- [x] **Roles**: `profiles.role` check allows `'admin'`. Helper `is_admin()` (security definer).
- [x] **Admin read**: every select policy (profiles, conversations, messages, prescriptions, prescription_items,
      medicines, invite_links, push_subscriptions excluded, meetings, storage `attachments`) gets `or public.is_admin()`.
      Admin writes go through `actions/admin.ts` with the service role, not RLS.
- [x] **Clinics** (per Q-B/Q-E): `clinics (id, name, created_at)`, `profiles.clinic_id` for doctors.
- [x] **Visibility setting**: `show_other_doctors boolean null` on `clinics`, doctor `profiles`, patient `profiles`.
      Effective value: patient → doctor → clinic → default `false` (first non-null wins).
- [x] **Per-chat blocking**: `conversations.blocked_at`. Copy existing `profiles.blocked_at` of patients into
      their conversations. Rewrite `messages_insert` and `attachments_upload` to check the conversation's block
      AND the account block. Keep `profiles.blocked_at` as the admin's account-wide block.
- [x] **Doctor deactivation**: `profiles.deactivated_at`. Conversations of a deactivated doctor are read-only
      for both sides (same check as blocking).
- [x] **Meetings**: `meetings (id, conversation_id, doctor_id, patient_id, starts_at, duration_min default 15,
      meet_url check like 'https://%', note, status check in ('scheduled','completed','cancelled'),
      reminded_at, created_by, created_at, updated_at)`. Index `(doctor_id, starts_at)`.
      RLS: members of the conversation read; the conversation's doctor inserts/updates. Admin via service role.
- [x] **Meeting messages**: `messages.kind` allows `'meeting'`, new `messages.meeting_id`. Content check updated.
- [x] **Check-ins**: `check_ins (id, conversation_id, doctor_id, patient_id, due_on date, reason text,
      status check in ('scheduled','done','cancelled'), meeting_id null references meetings, reminded_at,
      created_by, created_at, updated_at)`. Index `(doctor_id, due_on)`. RLS same as meetings.
      `messages.kind` also allows `'check_in'` with `messages.check_in_id`. Audit trigger on insert/update.
- [x] **Auto-complete setting**: `profiles.meeting_auto_complete boolean not null default true` (doctors).
- [x] **Admin messages**: `messages.sender_role text` (`doctor | patient | admin`), `messages.edited_at`,
      `messages.removed_at`, `messages.removed_by`.
- [x] **Audit log**: `audit_log (id, actor_id, actor_role, action, target_type, target_id, details jsonb, created_at)`.
      Select: admin only. Insert: triggers + service role. No update/delete for anyone.
      Triggers on: meetings insert/update, conversations.blocked_at change, profiles DOB/height/weight change.
- [x] **Doctor invites**: `invite_links.role` (`patient | doctor`), `doctor_id` nullable when role = doctor.
- [x] **Consent**: `profiles.terms_accepted_at`. Set to `now()` for all existing users (decision 58).
- [x] **Languages**: `profiles.language` check becomes `('en','kn','ml')`. Existing `'hi'` → `'en'`.
- [x] **Shared medicines**: drop per-doctor uniqueness; unique on `lower(trim(name))`; merge duplicates first;
      RLS: any doctor reads and adds; edit/deactivate/merge by any doctor or admin (per Q-B/Q-E).
- [x] Profile grants: patients may update own `date_of_birth, height_cm, weight_kg` (decision 28).
- [x] `src/lib/types.ts` updated. `CLAUDE.md` §"Data and security" updated with §5 exceptions.
- [x] **STOP. Ask Leroy to review and apply 0005.** Applied 2026-11-07; admin account promoted.

Phase A notes (2026-11-07):
- Written: `supabase/migrations/0005_multi_doctor_meetings_admin.sql`, `src/lib/types.ts`, `LANGUAGES` (ml), `homeFor("admin")`, CLAUDE.md exceptions, `.clinerules`.
- Also done here (was Phase B): `attachments_delete_doctor` tightened to the conversation's own doctor.
- Writes via the service role skip the audit triggers → the action must insert its own `audit_log` row
  (e.g. `updatePatientDetails`, `setPatientBlocked` in Phase B).
- After applying 0005 and BEFORE Phase B ships: doctors can no longer edit/deactivate/merge medicines
  (admin-only now), and patients previously blocked still carry an auth ban → Phase B lifts it.
- New RPCs: `is_admin()`, `can_write(conv)`, `post_appointment_message(kind, id)`, `other_doctors(patient)`.

### Phase B: multi-doctor clean-up (v0.7.0)
- [x] Remove `CLINIC.doctor` from `src/lib/constants.ts`; read the doctor from the conversation/invite.
- [x] `/privacy`, `/terms`, all copy: "your doctor". Ask Leroy for the real contact line (no placeholder).
- [x] Tighten storage policy `attachments_delete_doctor` to the conversation's own doctor.
- [x] `setPatientBlocked` → sets `conversations.blocked_at` (no auth ban).
- [x] Print page: omit the registration line when empty.
- [x] Medicines actions and `/doctor/settings/medicines` use the shared list.
- [x] Language picker: English / ಕನ್ನಡ / മലയാളം.
- [x] Check every doctor query is scoped to `doctor_id = me` (inbox, patients, invite links).

Phase B notes (2026-11-07):
- `CLINIC` removed; `CONTACT_EMAIL` in `lib/constants.ts`. Legal pages say "your doctor" and now state that the
  CareConnect team can open conversations and that each opening is recorded (admin access, decision 47).
- New `src/lib/audit.ts` → `logAudit()` for every service-role write. Used by `updatePatientDetails`,
  `setPatientBlocked`, and the admin-only medicine actions.
- `Conversation` got `readOnlyNotice` (blocked conversation / deactivated doctor). `PatientPanel` got `blockedAt`,
  `PatientsTable` rows got `blockedAt`, `MedicineList` got `canManage` (admin). All backward-compatible extensions.
- Medicine edit/deactivate/merge are admin-only (CLAUDE.md exception updated). Doctors' Settings page only adds.
- Doctor invite links (`role = 'doctor'`) are refused by `/join` until Phase E builds the doctor flow.
- Release 0.7.0 started in `releases.ts`; `package.json` bumped to 0.7.0. C, P and D add to the same release.

### Phase C: patient with several doctors (v0.7.0)
- [x] `/chat`: 1 doctor → that chat; 2+ → doctor list (shared `ConversationList`, pending approval).
- [x] `/chat/[conversationId]`: reuses `Conversation`.
- [x] `/home`: one doctor card per doctor (built from `Card`, `Avatar`, `ButtonLink`).
- [x] `/prescriptions`: doctor name on each; `ChipGroup` filter by doctor when 2+.
- [x] Profile: patient edits own DOB, height, weight (audit logged).
- [x] Doctor's `PatientPanel`: "Also consults" name cards when the effective `show_other_doctors` is true.
- [x] Push notifications name the right doctor.

**Phase C notes**

- `doctor/ConversationList` → `chat/ConversationList` (move, approved in §6). New `viewerRole` prop: `"doctor"` (default, unchanged inbox) or `"patient"` (the patient's list of doctors).
- `/chat` is now a router: 0 → EmptyState, 1 → `redirect("/chat/<id>")` (keeps `?attach=1`), 2+ → "Your doctors" + the list. The chat body moved to `/chat/[conversationId]`, with `notFound()` unless the conversation is the patient's.
- `lib/utils.ts` grew `validateHealthDetails()`; `updatePatientDetails` and the new `updateMyHealthDetails` (normal client, audit trigger) both use it.
- Extensions (backward-compatible): `PrescriptionCard` `doctorName`, `PatientPanel` `otherDoctors`, `ChipGroup` `optionValues`.
- Page-local client parts (no new component files): `app/(patient)/prescriptions/DoctorFilter.tsx`, `app/(patient)/profile/HealthDetailsSection.tsx` + `HealthDetailsDialog.tsx`.
- Verified by hand against the live project: 1 doctor (redirect + home card + no filter) and 2 doctors (list, two chats, home cards, chip filter, "Also consults" only when the setting is on).

### Phase P: patient panel → summary + popups (v0.7.0)
Goal: the right-hand `PatientPanel` only shows information; every action opens a `Dialog`.
- [x] Panel sections (read-only, top to bottom): identity (avatar, name, contact, joined, status badge) →
      details (age, height, weight) → **Next up** (next meeting and next check-in, as compact `AppointmentCard`s)
      → **Latest prescription** (date, medicine names, "View") → **Reports** (count + 2 latest `FileCard`s,
      "View all") → **Also consults** (only when enabled).
      Done, except **Next up**: it needs `AppointmentCard` from Phase D, so the section is a placeholder comment for now.
- [x] Action bar under identity: `New prescription` (the panel's one primary), `Schedule` menu
      (Meeting / Check-in), `⋯` (Edit details, Block, Invite again).
      Done: `New prescription` (primary), then `Edit details` and `Block`. The `Schedule` menu and `Invite again`
      need Phase D and the invite flow, so they are not here yet.
- [x] Popups (all `Dialog`, query-string driven so links work): `?rx=new` / `?rx=<id>` → `PrescriptionComposer`
      inside `Dialog size="lg"`; `?appt=meeting` / `?appt=check_in` / `?appt=<id>` → `AppointmentDialog`;
      `?details=1` → `PatientDetailsDialog`; `?reports=1` / `?prescriptions=1` → lists in `Dialog size="lg"`.
      Done, except the appointment popups: `AppointmentDialog` is Phase D.
- [x] Remove the Reports/Prescriptions tabs and the inline composer from the panel. Phone: panel opens as a sheet
      from the chat header, same sections.
- [x] Autosave, review-and-issue and corrections keep working inside the popup (closing keeps the draft).

Phase P notes (2026-11-07):
- `Dialog` grew `size?: "md" | "lg"` (no new file): "lg" is ~720px on a desktop and a full-height sheet on a phone,
  with the body scrolling. It also grew `closeHref`, so a popup opened by the query string closes with
  `router.replace` and the browser history never fills up with popups.
- The popups live in `PatientPopups` (same file as `PatientPanel`, so no new component file), mounted in the page
  and **outside** the patient column: a native `<dialog>` inside a `display:none` ancestor is not painted, and the
  column hides itself on a phone.
- The panel's inline composer and its segmented tabs are gone. The panel is read-only; `Edit details` is a link to
  `?details=1`. Block/Activate keeps a small confirmation dialog in the panel, because it acts at once.
- `?rx=new` resumes the newest plain draft, so closing the popup never loses the doctor's work.
- On a phone the panel opens as a sheet (`?panel=1`) from the chat header. The same component, `variant="sheet"`.
- Q-L resolved: the patient's filter chips come from the prescriptions' own doctors, not from their chat list, so a
  card can always be filtered by its doctor.
- `getOtherDoctors()` now logs the error and returns `[]` instead of throwing: a failure there must not take the
  whole conversation down.
- Fixed a sideways scroll on a phone: the doctor's flex rows needed `min-w-0`, so the chat column stopped growing to
  its content width and the chat header's buttons stayed on screen at 390px.
- Verified by hand against the live project at 1440px and 390px: every popup opens, closing replaces the URL and
  keeps the history length, autosave survives a close, review-and-issue works, a correction prefills and marks the
  old one "Replaced", and the patient's list still shows both prescriptions.

### Phase D: meetings + check-ins (v0.7.0)
- [ ] `src/app/actions/meetings.ts`: `scheduleMeeting`, `updateMeeting`, `cancelMeeting`, `completeMeeting`,
      `setMeetingAutoComplete`. Each posts a `kind='meeting'` message and pushes "Dr. X scheduled / moved /
      cancelled a meeting".
- [ ] Doctor entry points: chat header and `PatientPanel` → `?meet=new` / `?meet=<id>` (query string pattern).
- [ ] Form: date, time, duration (`ChipGroup` 15 default, 30, 45, custom), link (any `https://`), note.
      Overlap with the doctor's other meetings → `Banner` warning, still allowed.
- [ ] Meeting card in chat; "Upcoming meeting" on patient home; "Meetings" tab in `PatientPanel`.
- [ ] "Join meeting" enabled from 10 min before start until the end; status badge text + icon.
- [ ] Patient "Request a meeting" → sends the chat message "I'd like to schedule a video meeting."
- [ ] Doctor Settings: toggle "Mark meetings complete automatically 15 minutes after they start".
- [ ] **Check-ins**: `scheduleCheckIn`, `updateCheckIn`, `completeCheckIn`, `cancelCheckIn`, `convertCheckInToMeeting`
      in `actions/meetings.ts`. Popup: type = Check-in, "In" chips (3 days, 1 week, 2 weeks, 1 month, Custom date)
      → due date, reason (required, e.g. "Review BP after new tablets").
- [ ] Check-in card states: Scheduled ("Due Fri, 15 Nov"), Due today, Overdue (badge text + icon), Done, Cancelled.
      Doctor actions: Mark done, Reschedule, Cancel, Turn into meeting.
- [ ] Cron route also sends the check-in push once on the due date (morning run, `reminded_at`) to both sides.
- [ ] Doctor inbox: conversations with a check-in due today or overdue show a small "Check-in due" badge.
- [ ] `src/app/api/cron/reminders/route.ts`: checks `Authorization: Bearer ${CRON_SECRET}`; sends the
      15-minute reminder once (`reminded_at`); auto-completes meetings where the doctor's setting is on.
      Add `CRON_SECRET` to `.env.example` and `docs/SETUP.md` (cron-job.org every 5 min).

### Phase E: superadmin (v0.8.0)
- [ ] `src/app/admin/layout.tsx` with `requireProfile("admin")`. `homeFor('admin')` = `/admin`. Middleware allows it.
- [ ] `/admin`: counts (doctors, patients, conversations, meetings this week).
- [ ] `/admin/doctors`: list, invite (link or email, role = doctor), edit name / specialty / reg no / clinic,
      deactivate / reactivate, show-other-doctors and auto-complete settings, view their patients.
- [ ] `/admin/patients`: list + search, invite and assign to one or more doctors, add a doctor, edit details,
      block per conversation or whole account, show-other-doctors setting.
- [ ] `/admin/clinics` (per Q-B/Q-E): name, show-other-doctors setting, member doctors.
- [ ] `/admin/c/[id]`: `Conversation` with `viewerRole="admin"`: send as "Admin", edit/remove messages,
      remove reports, schedule meetings, prescription cancel + correction per Q-C. Viewing writes an audit row.
- [ ] `/admin/audit`: filter by actor, action, date.
- [ ] `src/app/actions/admin.ts` for all of the above; every action writes `audit_log`.

### Phase G: landing (v0.9.0)
- [ ] `/` shows the landing to signed-out visitors; signed-in users still redirect to their home.
- [ ] Middleware: `/` public. `robots.ts` + `sitemap.ts` allow `/`, `/privacy`, `/terms` only.
- [ ] Inspirations (2026-11-07): Zarla (centred hero, eyebrow, one CTA + reassurance line), PlushCare (split hero,
      feature tiles with image, round-icon feature list + photo, chip cloud), Amazon One Medical (big display
      headlines with a coloured second line, rotating word, "With the app you can" checklist beside a phone).
- [ ] Sections: header → hero (split, phone screenshot) → "Get in touch with your patients for {rotating word}"
      → feature tiles (Chat, Reports, Prescriptions, Video meetings, Multilingual, Privacy) → "Your patients can"
      checklist + phone → chip marquee "What you can handle" → privacy strip → FAQ → closing CTA → footer.
- [ ] Images: real app screenshots from seeded demo data (no real patient data). Other imagery only from Leroy.
- [ ] Font: Inter, heavy weight, tight tracking for display headlines (decision 67).
- [ ] Contact: `mailto:leroy.social@gmail.com`. No WhatsApp. Pricing line "No charges".
- [ ] Images only from Leroy. English only. Copy into `docs/SPEC.md` § Landing.

### Phase F: docs, consent, releases (runs inside each phase)
- [ ] Consent checkbox on `/join` and `/set-password`; sets `terms_accepted_at`.
- [ ] `docs/SPEC.md`, `docs/COMPONENTS.md`, `/styleguide`, `PRODUCT.md`, `docs/SETUP.md` (first admin, cron, env).
- [ ] `docs/WORKLOG.md`: State + Decisions log entries for each phase.
- [ ] `src/lib/releases.ts` + `package.json`: 0.7.0, 0.8.0, 0.9.0.

---

## 8. Open questions

Q-A…Q-J answered "yes" on 2026-11-07, recorded in §3 "Resolved open questions".

| ID | Question | Recommendation | Blocks |
|---|---|---|---|
| ~~Q-K~~ | Resolved 2026-11-07 (yes) and built: `acceptInviteLink`, `/join` accept card, `/login?next=`. | – | – |
| ~~Q-L~~ | Resolved 2026-11-07 and built in Phase P: the prescriptions filter chip list comes from the prescriptions' own doctors, so a card can always be filtered by its doctor — even when that doctor is no longer in the patient's chats. The blocked-but-still-has-"Send a report" case is fine as it is. | – | – |

---

## 9. Change log

| Date | Change | By |
|---|---|---|
| 2026-11-07 | Added check-ins (68–72), patient panel redesign Phase P (73–74); components approved; meeting components renamed Appointment*. | Claude |
| 2026-11-07 | Open questions Q-A…Q-J answered yes; landing inspirations and proposed components added. | Claude |
| 2026-11-07 | Plan created from Leroy's answers to 66 questions. | Claude |

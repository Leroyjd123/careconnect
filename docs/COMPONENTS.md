# Component inventory

The single list of reusable pieces. **Check here before building anything.**
Status: ✅ built — reuse it, extend it with a prop, never copy it.

## Primitives — `src/components/ui`

| Component | File | Use for | Status |
|---|---|---|---|
| `Button`, `ButtonLink`, `IconButton`, `Spinner`, `buttonStyles()` | `ui/Button.tsx` | Every button and button-styled link. Variants: primary, secondary (glass), outline (on solid white, e.g. PrescriptionCard), soft, ghost, danger. | ✅ |
| `IconTile` | `ui/IconTile.tsx` | The 44px rounded icon square. `tone`: soft (mint) or solid (forest). Never hand-build it. | ✅ |
| `Card` | `ui/Card.tsx` | Every surface. Tones: glass, subtle, strong, solid, dashed (not sent yet), feature (the landing page's tiles). `as={Link}` for clickable tiles. | ✅ |
| `Field`, `TextInput`, `TextArea`, `InputAddon`, `FieldError` | `ui/Field.tsx` | Every form control with label, hint and error. | ✅ |
| `Segmented` | `ui/Segmented.tsx` | Exactly-one-of switches: All/Unread, Reports/Prescriptions, language. | ✅ |
| `ChipGroup` | `ui/ChipGroup.tsx` | Quick picks: frequency, duration, timing, patient filters. `allowCustom` adds a "Custom…" chip with a text input. | ✅ |
| `Dialog` | `ui/Dialog.tsx` | Modals (invite, review & issue) and bottom sheets (attach). `size="lg"` = a wide popup (~720px on desktop, a full-height sheet on a phone) whose body scrolls; `closeHref` closes to a URL without adding history. | ✅ |
| `Avatar` | `ui/Avatar.tsx` | Initials avatar. `doctor` = forest, `pending` = dashed. | ✅ |
| `Badge`, `CountBadge` | `ui/Badge.tsx` | Status pills and unread counts. | ✅ |
| `EmptyState`, `Banner`, `Skeleton` | `ui/Feedback.tsx` | Empty/error screens, inline status (issued, offline, failed), loading. | ✅ |
| `Logo`, `LogoMark` | `ui/Logo.tsx` | Brand. | ✅ |
| `BackgroundScene` | `ui/BackgroundScene.tsx` | Root layout only. | ✅ |

## Layout — `src/components/layout`

| Component | File | Use for | Status |
|---|---|---|---|
| `TabBar` | `layout/TabBar.tsx` | The floating glass bottom bar. ONE implementation: patient tabs and the doctor's phone nav differ only in `items`. | ✅ |
| `PatientTabBar` | `layout/PatientTabBar.tsx` | Patient items for `TabBar` (Home, Prescriptions, Profile). Hides on /chat. | ✅ |
| `AppSidebar` | `layout/AppSidebar.tsx` | App nav: glass sidebar ≥1024px (collapsible to an icon rail, remembered in a cookie), `TabBar` below. ONE sidebar for the doctor and the admin: the `items` prop gives the links, and the icon is picked by name inside the component (so no icon component ever crosses the server/client boundary). The doctor passes `DOCTOR_NAV`; the admin passes Overview / Doctors / Patients / Clinics. `doctorAvatar` makes the avatar forest green for doctors. | ✅ |
| `LayoutToggle` | `layout/LayoutToggle.tsx` | Icon button that flips a remembered layout cookie and re-renders (hide/show patient details). | ✅ |
| `NotificationToggle` | `layout/NotificationToggle.tsx` | Notifications card: turn web push on/off for this device. ONE component for patient Profile and doctor Settings (`audience`). `preview` pins a state for the styleguide. | ✅ |
| `SettingsRow` | `layout/SettingsRow.tsx` | Tappable settings line: IconTile + title + hint. Patient Profile. | ✅ |
| `ErrorScreen` | `layout/ErrorScreen.tsx` | What every `error.tsx` renders. Same wording in both apps; only the way back differs. | ✅ |
| `LegalPage` | `layout/LegalPage.tsx` | Plain-language legal page shell: title, last-updated date, short sections. `/privacy` and `/terms`. | ✅ |
| `PageHeader` | `layout/PageHeader.tsx` | Glass top bar: back, avatar, title, subtitle, actions. Chat + detail screens. | ✅ |

## Chat — `src/components/chat` (shared by doctor and patient)

| Component | File | Use for | Status |
|---|---|---|---|
| `MessageBubble`, `ChatDivider` | `chat/MessageBubble.tsx` | Bubbles (`mine` decides side/colour), day and "new" dividers. `author="admin"`: the admin's own message — centred, neutral, labelled "CareConnect Admin" (decision 48, Q-J). | ✅ |
| `FileCard`, `FileTypeTile` | `chat/FileCard.tsx` | Attachment rows in chat, Reports list, upload preview. `href` makes the row open the viewer. | ✅ |
| `Conversation` | `chat/Conversation.tsx` | Message list + realtime + mark-read + sending + composer. Used by `/chat`, `/doctor/c/[id]` AND `/admin/c/[id]`; the role only changes props (`header`, `fileHrefBase`, `rxHrefBase`, `correctionHrefBase`, `starters`, `readOnlyNotice`: replaces the composer with a Banner when the conversation is blocked or the doctor deactivated, 0005). `viewerRole="admin"`: the admin sends through `sendAdminMessage` (labelled "CareConnect Admin"), does not mark anything read, cannot attach a file (RLS only lets a chat member upload one), and gets the Edit / Remove buttons on each message (decisions 48–50). | ✅ |
| `Composer` | `chat/Composer.tsx` | Floating input pill: attach button, auto-growing textarea, send. `offline` shows the banner. | ✅ |
| `MessageItem` | `chat/MessageItem.tsx` | Switch on `message.kind` → text bubble / FileCard / PrescriptionCard. Also renders pending and failed sends. `viewerRole="admin"`: the admin's moderation buttons (`adminActions`). A removed message shows "Message removed by admin" (decision 50); an edited one shows "Edited" (decision 49). | ✅ |
| `AttachSheet` | `chat/AttachSheet.tsx` | Dialog sheet: take photo / choose photo / choose file → preview → note → send. | ✅ |
| `FileViewer` | `chat/FileViewer.tsx` | PDF/image viewer on a 5-minute signed URL, with Download. Doctor gets `onRemove` (Remove report, with confirm). Opened by `?file=<messageId>`. |
| `ConversationList` | `chat/ConversationList.tsx` | One list, two viewers. `viewerRole="doctor"` (default): the inbox, with search + All/Unread, pending invites with a dashed avatar; rendered once by `doctor/(inbox)/layout.tsx`, hides itself on a phone when a conversation is open. `viewerRole="patient"`: the patient's list of doctors (name, specialty, latest message, unread count) on `/chat`; links to `/chat/<id>`. `viewerRole="admin"`: every chat on `/admin/conversations`; links to `/admin/c/<id>`, shows the patient's name with the doctor's under it, and a "Blocked" badge when the chat is blocked. `dueCheckIns` (optional): conversation ids with a check-in due today or overdue → a "Check-in due" badge. | ✅ |
| `AppointmentCard` | `chat/AppointmentCard.tsx` | The card for a meeting and for a check-in, switched by `type` (decision 72). Meeting states: Scheduled / Starting soon / Now / Completed / Cancelled. Check-in states: Scheduled ("Due Fri, 15 Nov") / Due today / Overdue / Done / Cancelled. Every state is a Badge with words **and** an icon. "Join meeting" opens the link in a new tab and is only live from 10 minutes before the start (decision 33). `compact` for the panel and the patient's home; `actions` for the doctor's buttons; `href` for a "Manage" link. | ✅ |
| `AppointmentDialog` | `chat/AppointmentDialog.tsx` | The popup for a meeting and for a check-in, switched by `type`. A new appointment opens on the Meeting tab; the `Segmented` switches to Check-in. Meeting form: date, time, length (`ChipGroup`: 15 default, 30, 45, 60, Custom), link (`TextInput type=url`), optional note. Check-in form: "In" chips (3 days, 1 week, 2 weeks, 1 month, Custom date) → the due date, plus a required reason. Overlap with the doctor's other meetings → a `Banner` warning, still allowed (decision 41). An existing appointment: Reschedule / Cancel (confirm) / Mark done; a check-in can also be turned into a meeting. Opened by `?appt=meeting` / `?appt=check_in` / `?appt=<id>`. | ✅ |

## Prescriptions — `src/components/rx` (shared)

| Component | File | Use for | Status |
|---|---|---|---|
| `PrescriptionCard` | `rx/PrescriptionCard.tsx` | Card in chat (both sides) and in the patient list. `replaced` / `latest` change the badge. `doctorName` adds the issuing doctor (the patient's list). `cancelled`: the admin cancelled it (Q-C) → a "Cancelled by admin" badge with an icon. | ✅ |
| `DoseSchedule` | `rx/DoseSchedule.tsx` | Morning / Afternoon / Night slots from "1-0-1". | ✅ |
| `PrescriptionView` | `rx/PrescriptionView.tsx` | Full read-only prescription. Patient detail, doctor "View" and the print page (`variant="print"`). A cancelled prescription shows a "Cancelled by admin" badge (Q-C). | ✅ |
| `PrescriptionComposer` | `rx/PrescriptionComposer.tsx` | Draft editor: medicines, diagnosis, advice, 1.5 s autosave, review. ONE component for the wide popup and the phone sheet. | ✅ |
| `MedicineFields` | `rx/MedicineFields.tsx` | One medicine row inside the composer. Suggests from the master list (fills the usual dose); "Save to my medicines" for new names. | ✅ |
| `ReviewIssueDialog` | `rx/ReviewIssueDialog.tsx` | Dialog: patient identity strip + table + lock notice + Issue. | ✅ |

## Doctor-only — `src/components/doctor`

| Component | File | Use for | Status |
|---|---|---|---|
| `ConversationList` | `doctor/ConversationList.tsx` | Inbox list with search + All/Unread. Rendered once by `doctor/(inbox)/layout.tsx`; hides itself on a phone when a conversation is open. | ✅ |
| `PatientPanel` | `doctor/PatientPanel.tsx` | Read-only summary of the patient (decision 73): identity, details, latest prescription, latest reports, "Also consults". Nothing is edited here — every action opens a popup. `variant="sheet"` is the phone version. `otherDoctors` adds the "Also consults" section (names only). Hideable on desktop. | ✅ |
| `PatientPopups` | `doctor/PatientPopups.tsx` | The doctor's popups for one patient, opened by the query string: `?rx=new` / `?rx=<id>` / `?rx=new&replaces=<id>`, `?details=1`, `?prescriptions=1`, `?reports=1`, `?panel=1`, `?appt=meeting` / `?appt=check_in` / `?appt=<id>`. Closing replaces the URL, so the history stays clean. Mounted outside the patient column: a native `<dialog>` inside a `display:none` ancestor is not painted. | ✅ |
| `InviteDialog` | `doctor/InviteDialog.tsx` | "Share a link" (one-time `/join` link, copy / share / WhatsApp) or "Send by email" → `invitePatient()`. Mounted once in `doctor/layout.tsx`, opened by `?invite=1` anywhere in /doctor. | ✅ |
| `PatientsTable` | `doctor/PatientsTable.tsx` | Patients with status (Active / Invite pending / Blocked; `blockedAt` per row = conversation block) + actions (resend, open chat). | ✅ |
| `PatientDetailsDialog` | `doctor/PatientDetailsDialog.tsx` | Doctor edits name, email, mobile, date of birth, height, weight. Opened from `PatientPopups` (`?details=1`). | ✅ |
| `ChipGroup` `optionValues` | `ui/ChipGroup.tsx` | When a chip's label isn't its value: the patient's prescription filter shows a doctor's name but keeps their id. | ✅ |
| `MedicineList` | `doctor/MedicineList.tsx` | Shared master medicines (0005). Doctors add; `canManage` (admin) adds Edit / Deactivate / Merge. No delete. `/doctor/settings/medicines`. | ✅ |
| `ReleaseNotes` | `doctor/ReleaseNotes.tsx` | Version history on `/doctor/settings`, from `RELEASES` in `lib/releases.ts`. First entry marked Current. | ✅ |

## Admin — `src/app/admin` (page-local, one folder per screen)

Every admin screen is a **server component** page plus a **page-local client component** in the
same folder. No new shared component file was added (PLAN §6: the admin's screens reuse the
existing primitives).

| Part | File | What it does | Status |
|---|---|---|---|
| Shell | `admin/layout.tsx` | `requireProfile("admin")`, then the `AppSidebar` with the admin's links (Overview, Conversations, Doctors, Patients, Clinics, Audit log). Same shape as `doctor/layout.tsx`. | ✅ |
| Overview | `admin/page.tsx` | Counts only (decision 56): doctors, patients, chats, meetings this week. Four cards, no charts. | ✅ |
| Conversations | `admin/conversations/page.tsx` + `AdminConversations.tsx` | Every chat: the patient, the doctor, the last message and a "Blocked" badge. The rows are the shared `ConversationList` with `viewerRole="admin"`. `?doctor=<id>` filters to one doctor's chats. | ✅ |
| A chat | `admin/c/[id]/page.tsx` | The shared `Conversation` with `viewerRole="admin"`. The header names the patient and the doctor and has the Block chat toggle. Opening the chat writes one "admin.conversation_viewed" audit row. | ✅ |
| Chat header | `admin/c/[id]/AdminConversationHeader.tsx` | Both names, each linking to their admin profile, and the per-chat block (decision 11) behind a confirmation. | ✅ |
| Chat popups | `admin/c/[id]/AdminConversationPopups.tsx` | The file viewer, the prescription with "Cancel this prescription" and "Write a correction" (Q-C). | ✅ |
| Correction | `admin/c/[id]/AdminCorrectionDialog.tsx` | The admin writes a correction on the doctor's behalf. Saved as a draft with the conversation's doctor, so the doctor issues it (Q-C). Reuses `MedicineFields`. | ✅ |
| Audit log | `admin/audit/page.tsx` + `AdminAudit.tsx` | The filters (who, what, from, to) and the table. The filters live in the query string. | ✅ |
| Audit table | `components/admin/AuditLogTable.tsx` | The one new shared component (PLAN §6, approved). Newest first, 50 to a page, the action codes in plain words, the details in an expandable row. | ✅ |
| Doctors | `admin/doctors/page.tsx` + `AdminDoctors.tsx` | The list: name, specialty, clinic, patient count, status badge (Active / Deactivated). Search. "Patients" links to `/admin/patients?doctor=<id>`. | ✅ |
| Doctor popup | `admin/doctors/DoctorDialog.tsx` | Name, specialty, registration number, clinic; "also consults" (On / Off / Follow the clinic); auto-complete (On / Off); deactivate / reactivate behind a confirmation. | ✅ |
| Invite doctor | `admin/doctors/InviteDoctorDialog.tsx` | A one-time link or an email (decision 44). Only the admin can invite doctors (decision 18). | ✅ |
| Patients | `admin/patients/page.tsx` + `AdminPatients.tsx` | The list: name, contact, the doctors they see, status badge. Search by name, mobile number or email. `?doctor=<id>` filters to one doctor's patients. | ✅ |
| Patient popup | `admin/patients/PatientDialog.tsx` | Their doctors, block/unblock per chat, "add a doctor" (never move), "also consults", block/unblock the whole account (decision 12). | ✅ |
| Invite patient | `admin/patients/InvitePatientDialog.tsx` | Name + email, then tick one or more doctors (decision 45). | ✅ |
| Clinics | `admin/clinics/page.tsx` + `AdminClinics.tsx` | Create, rename, the "also consults" setting, and the doctors in each clinic (Q-B). | ✅ |

## Marketing — `src/components/marketing` (the landing page only, PLAN §6)

The six pieces the landing page at `/` is built from. They are not used inside the app.

| Component | File | What it does | Status |
|---|---|---|---|
| `MarketingHeader` | `marketing/MarketingHeader.tsx` | The public top bar: the logo, the anchor links, "Sign in" and "Get in touch". Props: `links` ({href, label}), `signInHref`, `contactHref`. The anchor links hide on a phone. | ✅ |
| `DisplayHeading` | `marketing/DisplayHeading.tsx` | The big headline (decision 67): Inter, heavy, tight tracking, an optional eyebrow, and a coloured accent line. Props: `eyebrow`, `children`, `accent`, `size` ("md" | "lg"), `as` ("h1" | "h2" | "h3"). | ✅ |
| `RotatingWord` | `marketing/RotatingWord.tsx` | The headline word that cycles. Props: `words`, `interval`. Respects reduced motion (the first word stays), pauses on hover, and puts the whole list in the markup for screen readers — nothing is announced on every change. A client component. | ✅ |
| `ChipMarquee` | `marketing/ChipMarquee.tsx` | The slow-scrolling row of chips. Props: `chips`, `label`, `duration`. Pauses on hover, static with reduced motion, and the second row is `aria-hidden` so the chips are read once. A client component. | ✅ |
| `FeatureChecklist` | `marketing/FeatureChecklist.tsx` | The check list ("Your patients can"). Props: `title`, `subtitle`, `items` ({label, detail}), `columns` (1 | 2). | ✅ |
| `PhoneFrame` | `marketing/PhoneFrame.tsx` | The phone around an app screenshot. Props: `image` (a `LandingImage`). While the image is missing it draws a placeholder box at the final size (decision 65). | ✅ |

**The landing page's own parts** (page-local, in `src/app/`): `FeatureTiles.tsx`, `PrivacyStrip.tsx`,
`FaqList.tsx`, `LandingFooter.tsx`. The page is `src/app/page.tsx`.

**The images** live in one place: `src/lib/landing.ts` (`LANDING_IMAGES`, plus the rotating words, the
chips, the checklist and the FAQ). Every `src` is `null` until Leroy supplies the real files; the slot
list is in `docs/SPEC.md` § Landing → "Images needed".

## Server actions — `src/app/actions` (already written; build UI on these)

| Action | File |
|---|---|
| `login`, `setPassword`, `signOut` | `actions/auth.ts` |
| `updatePatientDetails`, `setPatientBlocked`, `invitePatient`, `resendInvite`, `createInviteLink`, `revokeInviteLink`, `checkInviteLink`, `joinWithInviteLink` | `actions/patients.ts` |
| `savePushSubscription`, `deletePushSubscription` | `actions/notifications.ts` |
| `sendMessage`, `sendAttachment`, `getFileUrl`, `markRead`, `removeReport` | `actions/messages.ts` |
| `saveDraft`, `issuePrescription`, `deleteDraft` | `actions/prescriptions.ts` |
| `scheduleMeeting`, `updateMeeting`, `cancelMeeting`, `completeMeeting`, `setMeetingAutoComplete`, `scheduleCheckIn`, `updateCheckIn`, `completeCheckIn`, `cancelCheckIn`, `convertCheckInToMeeting` | `actions/meetings.ts` |
| `getAdminOverview`, `getAdminDoctors`, `getAdminPatients`, `getAdminClinics`, `createDoctorInviteLink`, `inviteDoctorByEmail`, `updateAdminDoctor`, `setDoctorDeactivated`, `updateAdminDoctorSettings`, `createAdminPatientInviteLink`, `inviteAdminPatient`, `addDoctorToPatient`, `setAdminConversationBlocked`, `setAdminAccountBlocked`, `updateAdminPatientSettings`, `createClinic`, `renameClinic`, `updateClinicSettings`, `setDoctorClinic`, `joinWithDoctorInviteLink` | `actions/admin.ts` — every one starts with `requireProfile("admin")`; every service-role write writes an `audit_log` row |
| `logAdminConversationView`, `logAdminFileView`, `sendAdminMessage`, `editAdminMessage`, `removeAdminMessage`, `cancelAdminPrescription`, `createAdminCorrectionDraft` | `actions/admin.ts` — Phase E part 2. Every one starts with `requireProfile("admin")` before `createAdminClient()`; every write writes an `audit_log` row |
| `addMedicine`, `updateMedicine`, `setMedicineActive`, `mergeMedicine` | `actions/medicines.ts` |
| `updateMyProfile`, `updateMyHealthDetails` | `actions/profile.ts` |

## Reads — `src/lib/data.ts`

`getMyConversations`, `getConversation`, `getMyPatients`, `getMessages`, `getPrescriptions`, `getMyIssuedPrescriptions`,
`getPrescription`, `getMedicineSuggestions`, `getOtherDoctors`, `replacedIds`,
`getAppointments` (a conversation's meetings + check-ins), `getAppointment`, `getUpcomingForPatient` (the patient's
next meeting per doctor), `getDoctorDueCheckIns` (conversations with a check-in due today or overdue),
`getDoctorMeetingsBetween` (the doctor's other meetings, for the overlap warning),
`getAdminConversations` (every chat, for the admin's list; `?doctor=<id>` filters),
`getAdminAuditLog` (the audit log, newest first, 50 to a page; filtered by actor, action group and dates),
`getAdminActorNames` (the names of the actors in the audit rows),
`AUDIT_ACTION_GROUPS` (the action codes behind the audit screen's filters).

## Page-local client components

Not shared, so they live beside their page rather than in `src/components`:
`app/login/LoginForm.tsx` (`next` = return to an invite link), `app/join/[token]/AcceptInvite.tsx` (signed-in patient accepts another doctor's link), `app/join/[token]/JoinForm.tsx` (the patient makes their account from a link), `app/join/[token]/DoctorJoinForm.tsx` (a doctor makes their own account from the admin's link), `app/(patient)/profile/LanguagePicker.tsx`, `app/(patient)/profile/HealthDetailsSection.tsx` + `HealthDetailsDialog.tsx` (the patient edits their own DOB, height and weight), `app/(patient)/prescriptions/DoctorFilter.tsx` (filter the prescription list by doctor, `?doctor=<id>`), `app/rx/[id]/print/AutoPrint.tsx`, `app/doctor/settings/MeetingAutoComplete.tsx` (the doctor switches auto-complete on and off).

## How state is split

- **Server components** read (`lib/data.ts`) and pass plain data down. No inline queries.
- **`Conversation`** owns everything about sending: the pending queue, offline retry, realtime merge and mark-read.
  `Composer`, `MessageItem` and `AttachSheet` stay presentational so there is one place to debug a message that didn't arrive.
- **Query string, not component state**, for anything a link should be able to open:
  `?invite=1`, `?attach=1`, `?file=<messageId>`, `?rx=new|<id>`, `?rx=new&replaces=<id>`, `?issued=1`,
  `?appt=meeting|check_in|<id>`, `?panel=1`.

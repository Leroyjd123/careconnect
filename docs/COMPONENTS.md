# Component inventory

The single list of reusable pieces. **Check here before building anything.**
Status: ✅ built — reuse it, extend it with a prop, never copy it.

## Primitives — `src/components/ui`

| Component | File | Use for | Status |
|---|---|---|---|
| `Button`, `ButtonLink`, `IconButton`, `Spinner`, `buttonStyles()` | `ui/Button.tsx` | Every button and button-styled link. Variants: primary, secondary (glass), outline (on solid white, e.g. PrescriptionCard), soft, ghost, danger. | ✅ |
| `IconTile` | `ui/IconTile.tsx` | The 44px rounded icon square. `tone`: soft (mint) or solid (forest). Never hand-build it. | ✅ |
| `Card` | `ui/Card.tsx` | Every surface. Tones: glass, subtle, strong, solid, dashed (not sent yet). `as={Link}` for clickable tiles. | ✅ |
| `Field`, `TextInput`, `TextArea`, `InputAddon`, `FieldError` | `ui/Field.tsx` | Every form control with label, hint and error. | ✅ |
| `Segmented` | `ui/Segmented.tsx` | Exactly-one-of switches: All/Unread, Reports/Prescriptions, language. | ✅ |
| `ChipGroup` | `ui/ChipGroup.tsx` | Quick picks: frequency, duration, timing, patient filters. `allowCustom` adds a "Custom…" chip with a text input. | ✅ |
| `Dialog` | `ui/Dialog.tsx` | Modals (invite, review & issue) and bottom sheets (attach). | ✅ |
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
| `DoctorSidebar` | `layout/DoctorSidebar.tsx` | Doctor nav: glass sidebar ≥1024px, `TabBar` below. | ✅ |
| `NotificationToggle` | `layout/NotificationToggle.tsx` | Notifications card: turn web push on/off for this device. ONE component for patient Profile and doctor Settings (`audience`). `preview` pins a state for the styleguide. | ✅ |
| `SettingsRow` | `layout/SettingsRow.tsx` | Tappable settings line: IconTile + title + hint. Patient Profile. | ✅ |
| `ErrorScreen` | `layout/ErrorScreen.tsx` | What every `error.tsx` renders. Same wording in both apps; only the way back differs. | ✅ |
| `PageHeader` | `layout/PageHeader.tsx` | Glass top bar: back, avatar, title, subtitle, actions. Chat + detail screens. | ✅ |

## Chat — `src/components/chat` (shared by doctor and patient)

| Component | File | Use for | Status |
|---|---|---|---|
| `MessageBubble`, `ChatDivider` | `chat/MessageBubble.tsx` | Bubbles (`mine` decides side/colour), day and "new" dividers. | ✅ |
| `FileCard`, `FileTypeTile` | `chat/FileCard.tsx` | Attachment rows in chat, Reports list, upload preview. `href` makes the row open the viewer. | ✅ |
| `Conversation` | `chat/Conversation.tsx` | Message list + realtime + mark-read + sending + composer. Used by `/chat` AND `/doctor/c/[id]`; the role only changes props (`header`, `fileHrefBase`, `rxHrefBase`, `correctionHrefBase`, `starters`). | ✅ |
| `Composer` | `chat/Composer.tsx` | Floating input pill: attach button, auto-growing textarea, send. `offline` shows the banner. | ✅ |
| `MessageItem` | `chat/MessageItem.tsx` | Switch on `message.kind` → text bubble / FileCard / PrescriptionCard. Also renders pending and failed sends. | ✅ |
| `AttachSheet` | `chat/AttachSheet.tsx` | Dialog sheet: take photo / choose photo / choose file → preview → note → send. | ✅ |
| `FileViewer` | `chat/FileViewer.tsx` | PDF/image viewer on a 5-minute signed URL, with Download. Doctor gets `onRemove` (Remove report, with confirm). Opened by `?file=<messageId>`. | ✅ |

## Prescriptions — `src/components/rx` (shared)

| Component | File | Use for | Status |
|---|---|---|---|
| `PrescriptionCard` | `rx/PrescriptionCard.tsx` | Card in chat (both sides) and in the patient list. `replaced` / `latest` change the badge. | ✅ |
| `DoseSchedule` | `rx/DoseSchedule.tsx` | Morning / Afternoon / Night slots from "1-0-1". | ✅ |
| `PrescriptionView` | `rx/PrescriptionView.tsx` | Full read-only prescription. Patient detail, doctor "View" and the print page (`variant="print"`). | ✅ |
| `PrescriptionComposer` | `rx/PrescriptionComposer.tsx` | Draft editor: medicines, diagnosis, advice, 1.5 s autosave, review. ONE component for the desktop panel and the phone full screen. | ✅ |
| `MedicineFields` | `rx/MedicineFields.tsx` | One medicine row inside the composer. | ✅ |
| `ReviewIssueDialog` | `rx/ReviewIssueDialog.tsx` | Dialog: patient identity strip + table + lock notice + Issue. | ✅ |

## Doctor-only — `src/components/doctor`

| Component | File | Use for | Status |
|---|---|---|---|
| `ConversationList` | `doctor/ConversationList.tsx` | Inbox list with search + All/Unread. Rendered once by `doctor/(inbox)/layout.tsx`; hides itself on a phone when a conversation is open. | ✅ |
| `PatientPanel` | `doctor/PatientPanel.tsx` | Right column: patient identity, New prescription, Reports/Prescriptions tabs. | ✅ |
| `InviteDialog` | `doctor/InviteDialog.tsx` | "Share a link" (one-time `/join` link, copy / share / WhatsApp) or "Send by email" → `invitePatient()`. Mounted once in `doctor/layout.tsx`, opened by `?invite=1` anywhere in /doctor. | ✅ |
| `PatientsTable` | `doctor/PatientsTable.tsx` | Patients with status + actions (resend, open chat). | ✅ |
| `ReleaseNotes` | `doctor/ReleaseNotes.tsx` | Version history on `/doctor/settings`, from `RELEASES` in `lib/releases.ts`. First entry marked Current. | ✅ |

## Server actions — `src/app/actions` (already written; build UI on these)

| Action | File |
|---|---|
| `login`, `setPassword`, `signOut` | `actions/auth.ts` |
| `invitePatient`, `resendInvite`, `createInviteLink`, `revokeInviteLink`, `checkInviteLink`, `joinWithInviteLink` | `actions/patients.ts` |
| `savePushSubscription`, `deletePushSubscription` | `actions/notifications.ts` |
| `sendMessage`, `sendAttachment`, `getFileUrl`, `markRead`, `removeReport` | `actions/messages.ts` |
| `saveDraft`, `issuePrescription`, `deleteDraft` | `actions/prescriptions.ts` |
| `updateMyProfile` | `actions/profile.ts` |

## Reads — `src/lib/data.ts`

`getMyConversations`, `getConversation`, `getMyPatients`, `getMessages`, `getPrescriptions`, `getMyIssuedPrescriptions`,
`getPrescription`, `getMedicineSuggestions`, `replacedIds`.

## Page-local client components

Not shared, so they live beside their page rather than in `src/components`:
`app/login/LoginForm.tsx`, `app/(patient)/profile/LanguagePicker.tsx`, `app/rx/[id]/print/AutoPrint.tsx`.

## How state is split

- **Server components** read (`lib/data.ts`) and pass plain data down. No inline queries.
- **`Conversation`** owns everything about sending: the pending queue, offline retry, realtime merge and mark-read.
  `Composer`, `MessageItem` and `AttachSheet` stay presentational so there is one place to debug a message that didn't arrive.
- **Query string, not component state**, for anything a link should be able to open:
  `?invite=1`, `?attach=1`, `?file=<messageId>`, `?rx=new|<id>`, `?rx=new&replaces=<id>`, `?issued=1`.

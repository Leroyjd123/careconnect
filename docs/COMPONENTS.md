# Component inventory

The single list of reusable pieces. **Check here before building anything.**
Status: ✅ built in the starter · 🔜 build once in the phase shown, then reuse everywhere.

## Primitives — `src/components/ui`

| Component | File | Use for | Status |
|---|---|---|---|
| `Button`, `ButtonLink`, `IconButton`, `Spinner`, `buttonStyles()` | `ui/Button.tsx` | Every button and button-styled link. Variants: primary, secondary, soft, ghost, danger. | ✅ |
| `Card` | `ui/Card.tsx` | Every surface. Tones: glass, subtle, strong, solid. `as={Link}` for clickable tiles. | ✅ |
| `Field`, `TextInput`, `TextArea`, `InputAddon`, `FieldError` | `ui/Field.tsx` | Every form control with label, hint and error. | ✅ |
| `Segmented` | `ui/Segmented.tsx` | Exactly-one-of switches: All/Unread, Reports/Prescriptions, language. | ✅ |
| `ChipGroup` | `ui/ChipGroup.tsx` | Quick picks: frequency, duration, timing, patient filters. | ✅ |
| `Dialog` | `ui/Dialog.tsx` | Modals (invite, review & issue) and bottom sheets (attach). | ✅ |
| `Avatar` | `ui/Avatar.tsx` | Initials avatar. `doctor` = forest, `pending` = dashed. | ✅ |
| `Badge`, `CountBadge` | `ui/Badge.tsx` | Status pills and unread counts. | ✅ |
| `EmptyState`, `Banner`, `Skeleton` | `ui/Feedback.tsx` | Empty/error screens, inline status (issued, offline, failed), loading. | ✅ |
| `Logo`, `LogoMark` | `ui/Logo.tsx` | Brand. | ✅ |
| `BackgroundScene` | `ui/BackgroundScene.tsx` | Root layout only. | ✅ |

## Layout — `src/components/layout`

| Component | File | Use for | Status |
|---|---|---|---|
| `PatientTabBar` | `layout/PatientTabBar.tsx` | Patient bottom nav (Home, Prescriptions, Profile). Hides on /chat. | ✅ |
| `DoctorSidebar` | `layout/DoctorSidebar.tsx` | Doctor nav: sidebar ≥1024px, bottom bar below. | ✅ |
| `PageHeader` | `layout/PageHeader.tsx` | Glass top bar: back, avatar, title, subtitle, actions. Chat + detail screens. | ✅ |
| `ComingSoon` | `layout/ComingSoon.tsx` | Starter placeholder. Delete in Phase 6. | ✅ (temporary) |

## Chat — `src/components/chat` (shared by doctor and patient)

| Component | File | Use for | Status |
|---|---|---|---|
| `MessageBubble`, `ChatDivider` | `chat/MessageBubble.tsx` | Bubbles (`mine` decides side/colour), day and "new" dividers. | ✅ |
| `FileCard`, `FileTypeTile` | `chat/FileCard.tsx` | Attachment rows in chat, Reports list, upload preview. | ✅ |
| `Conversation` | `chat/Conversation.tsx` | Message list + realtime + mark-read + composer. Props: `conversationId`, `meId`, `initialMessages`, `prescriptions`, `header`. Used by `/chat` AND `/doctor/c/[id]`. | 🔜 Phase 2 |
| `Composer` | `chat/Composer.tsx` | Floating input pill: attach button, textarea, send. Offline queue state. | 🔜 Phase 2 |
| `MessageItem` | `chat/MessageItem.tsx` | Switch on `message.kind` → text bubble / FileCard / PrescriptionCard. | 🔜 Phase 2 |
| `AttachSheet` | `chat/AttachSheet.tsx` | Dialog sheet: take photo / choose photo / choose file → preview → send. | 🔜 Phase 3 |
| `FileViewer` | `chat/FileViewer.tsx` | PDF/image viewer with download. Doctor D3 and patient tap-to-open. | 🔜 Phase 3 |

## Prescriptions — `src/components/rx` (shared)

| Component | File | Use for | Status |
|---|---|---|---|
| `PrescriptionCard` | `rx/PrescriptionCard.tsx` | Card in chat (both sides) and in the patient list. | ✅ |
| `DoseSchedule` | `rx/DoseSchedule.tsx` | Morning / Afternoon / Night slots from "1-0-1". | ✅ |
| `PrescriptionView` | `rx/PrescriptionView.tsx` | Full read-only prescription. Used by patient detail, doctor "View", and print page. | 🔜 Phase 4 |
| `PrescriptionComposer` | `rx/PrescriptionComposer.tsx` | Draft editor: medicines (ChipGroup quick picks), diagnosis, advice, save draft, review. ONE component for desktop panel and mobile full screen. | 🔜 Phase 4 |
| `MedicineFields` | `rx/MedicineFields.tsx` | One medicine row inside the composer. | 🔜 Phase 4 |
| `ReviewIssueDialog` | `rx/ReviewIssueDialog.tsx` | Dialog: patient identity strip + table + lock notice + Issue. | 🔜 Phase 4 |

## Doctor-only — `src/components/doctor`

| Component | File | Use for | Status |
|---|---|---|---|
| `ConversationList` | `doctor/ConversationList.tsx` | Inbox list with search + All/Unread. Used by /doctor and /doctor/c/[id] (desktop column) and phone inbox. | 🔜 Phase 2 |
| `PatientPanel` | `doctor/PatientPanel.tsx` | Right column: patient identity, New prescription, Reports/Prescriptions tabs. | 🔜 Phase 3 |
| `InviteDialog` | `doctor/InviteDialog.tsx` | Name + email form → `invitePatient()`. Opened by `?invite=1` anywhere in /doctor. | 🔜 Phase 1 |
| `PatientsTable` | `doctor/PatientsTable.tsx` | Patients with status + actions (resend, open chat). | 🔜 Phase 5 |

## Server actions — `src/app/actions` (already written; build UI on these)

| Action | File |
|---|---|
| `login`, `signOut` | `actions/auth.ts` |
| `invitePatient`, `resendInvite` | `actions/patients.ts` |
| `sendMessage`, `sendAttachment`, `getFileUrl`, `markRead` | `actions/messages.ts` |
| `saveDraft`, `issuePrescription`, `deleteDraft` | `actions/prescriptions.ts` |
| `updateMyProfile` | `actions/profile.ts` |

## Reads — `src/lib/data.ts`

`getMyConversations`, `getConversation`, `getMessages`, `getPrescriptions`, `getMyIssuedPrescriptions`, `getPrescription`, `replacedIds`.

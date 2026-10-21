---
target: /styleguide page
total_score: 20
max_score: 36
na_heuristics: 5
p0_count: 1
p1_count: 2
timestamp: 2026-10-20T12-56-16Z
slug: src-app-styleguide-styleguide-tsx
---
Method: dual-agent (A: design review · B: detector). Browser overlay skipped: Chrome extension not connected.

Score 20/36 (Acceptable; Error Prevention n/a). H1 2, H2 3, H3 2, H4 2, H5 n/a, H6 2, H7 1, H8 3, H9 2, H10 3.

P0 Live side effects: DoctorSidebar sign-out form, PatientsTable resendInvite, ConversationList realtime channel, NotificationToggle requestPermission/subscribe/save. Fix: presentational props + no-op demo handlers; fixed NotificationToggle states.
P1 Not organised around the merge decision: unlabelled variants, candidates never side by side, Review list unlinked at the bottom.
P1 Coverage gaps: InviteDialog (hand-rolled copy instead), FileViewer, Conversation, PrescriptionComposer, login/set-password, print variant, focus states, long/Indic text, empty composites.
P2 No responsive review: TOC hidden below lg, no 390px frames, fixed-height frames clip.
P2 Page a11y/typography: group h2 13px uppercase vs section h3 19px (inverted), 11px meta, no scroll-spy/aria-current.
Detector: 10 design-system-font-size advisories (5 page, 5 components: FileCard 10px, Feedback 21px, PatientPanel/PrescriptionView 19px, Badge 11px). Page uses off-scale 19/11px and rounded-xl/3xl itself.

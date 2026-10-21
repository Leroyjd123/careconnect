# Worklog — agent handoff context

Single source of truth for "where is this build right now".
**Read this before starting any task. Update it before you finish.**

Rules for whoever edits this file:
- Keep it short. Facts, not narration. One line per item.
- Move items between sections rather than rewriting them.
- Record decisions and blockers, not code — code lives in the repo.
- Never delete the Decisions log; it is why things are the way they are.

---

## State — 2026-10-20

- Phases 1–6 of `docs/PROMPTS.md` are built. Every route in `docs/SPEC.md` exists; no placeholders left.
- `npm run typecheck && npm run lint && npm run build` pass. 16 routes compile.
- Connected to a Supabase project. Verified by hand: doctor and patient password sign-in, patient invite (existing-account path).
- Sign-in switched from email OTP to email + password (see Decisions log). Invite email → `/set-password`.
- v0.5.0: invite links (`/join`), mobile-number sign-in, doctor can remove reports. Migration 0003 applied on the Supabase project (2026-10-21). Doctor profile set to Dr. Vipin John, General Medicine.
- v0.4.0: web push notifications (needs migration 0002 + VAPID env on Vercel). Not yet tested on real devices.
- v0.3.0: `/doctor/settings` with version + release notes; version on patient Profile.
- `PRODUCT.md` and `DESIGN.md` added (product record and visual system).
- Not verified: chat both ways + realtime, uploads, prescriptions, invite email to a new address, 390px/1440px pass.

## Next

1. Two-browser end-to-end test: chat both ways → upload a report → issue a prescription → issue a correction.
2. Forgot-password flow (none exists; reset is manual in Supabase for now).
3. Custom SMTP (Resend) so invites reach any address (`docs/SETUP.md` §3).
4. `supabase/tests/rls_smoke.sql` on a throwaway local Postgres (`supabase/tests/README.md`).
5. Keyboard-nav and focus-ring pass at 390px and 1440px.
6. Deploy (`docs/SETUP.md` step 7), then the PRD acceptance criteria on a real phone.

## Blocked

- RLS smoke test — no Postgres installed on this machine; do not run it against the real project.
- Invite emails to non-team addresses — Supabase built-in email; needs custom SMTP.

## Decisions log

Newest last. Never delete an entry; add a superseding one instead.

- **Doctor inbox is a route group**, `src/app/doctor/(inbox)/layout.tsx`, so `ConversationList` renders once and keeps its scroll, search and filter while conversations open beside it. Putting it in the pages would remount it on every navigation.
- **Query string over component state** for anything a link should be able to open: `?invite=1`, `?attach=1`, `?file=<messageId>`, `?rx=new|<id>`, `?rx=new&replaces=<id>`, `?issued=1`. This is why the invite form is mounted once in `doctor/layout.tsx` and every "Invite patient" is a plain link.
- **`Conversation` owns all send state** — pending queue, offline hold-and-retry, realtime merge, mark-read. `Composer`, `MessageItem` and `AttachSheet` are presentational, so a message that didn't arrive has one place to debug.
- **Joined types live in `lib/types.ts`**, not `lib/data.ts` or the action files: `data.ts` is `server-only`, so a Client Component cannot import a type from it. Applies to `PrescriptionWithPeople`, `ConversationWithPeople`, `DraftItem`.
- **`replacedIds()` returns `string[]`** and pages pass it down as a prop, for the same reason.
- **Extended primitives instead of forking them**: `ChipGroup.allowCustom` (the "Custom…" chip, used by all three prescription pickers), `FileCard.href`, `PrescriptionCard.draft` / `.latest`.
- **`layout/TabBar.tsx` extracted** — the patient tab bar and the doctor's phone nav were the same markup twice. Items differ; the component does not.
- **`FileViewer` overlays the chat** (`absolute inset-0`) rather than replacing it, so `Conversation` keeps its state and realtime channel while a report is open.
- **Attachments are enabled for both roles.** The spec only describes the patient flow, but nothing in the schema or RLS restricts it and the doctor needs it.
- **Lock-notice copy says "their chat", not the spec's "his chat".** There is no gender field on `profiles`, so the neutral wording is the only correct one. Deliberate deviation from `docs/SPEC.md`.
- **Doctor layout is `h-dvh`** with each column scrolling internally, so the inbox, chat and panel scroll independently. Patient `/chat` sets its own `h-dvh`.
- **Autosave skips while a medicine row is half-filled**, because `saveDraft` rejects a named medicine without dose/frequency/duration. The draft banner only appears after a save that actually landed.
- **`savingRef` in the composer and `inFlight` in `Conversation`** guard against a double submit and against React StrictMode invoking an effect twice — without them, dev mode sends each queued message twice.
- **Page-local client components stay beside their page**, not in `src/components`: `app/login/LoginForm.tsx`, `app/(patient)/profile/LanguagePicker.tsx`, `app/rx/[id]/print/AutoPrint.tsx`. They are not shared, so they are not in the inventory.

- **Email + password sign-in, not OTP** (2026-10-20). Supabase's built-in email (~2/hour, team members only) made code sign-in unusable for testing, and the owner asked for passwords. The only email sent is the invite; its link signs the user in and `/set-password` makes them choose one. Resend invite still uses a magic-link email for the same landing. Supersedes the "email → 6-digit code" sign-in in the original spec.
- **`EMAIL_RE` lives in `lib/constants.ts`**, shared by the login and invite actions.

- **Release notes are code, not a table** (`src/lib/releases.ts`). They change only when the app is deployed, so a DB table would add RLS and admin UI for nothing. `package.json` version must match `RELEASES[0].version`.
- **Doctor got a Settings page** (`/doctor/settings`) to hold account details and release notes; it is the 4th nav item. Profile fields are read-only there until an edit flow is specced.

- **Search: noindex everywhere, previews on** (v0.3.1). It is a private medical app, so `robots.ts` disallows all and metadata says noindex; Open Graph + `opengraph-image.tsx` still give a branded card when the link is shared. Metadata image routes are listed in `PUBLIC_FILES` in `middleware.ts` so crawlers reach them signed out. `app/brand-mark.tsx` repeats brand hex values because generated images cannot read CSS tokens.

- **Web push via `web-push` + a plain `public/sw.js`** (v0.4.0, dependency approved by the owner). No push vendor (OneSignal, Firebase): one small server library, keys in env, works on Chrome/Edge/Firefox/Safari and iOS Home Screen apps.
- **Senders read devices through `push_targets()`**, a security-definer RPC that returns only the other member's subscriptions for a conversation the caller is in. Keeps `createAdminClient()` confined to `patients.ts`. Dead endpoints (404/410) are pruned via `prune_push_subscription()`.
- **Push is sent with `after()`**, so it never delays or fails a message send; `notifyConversation()` swallows all errors.
- **Sign-out forgets the device** using the `cc_push_ep` cookie set when notifications are turned on.

- **`/styleguide` is the design-system review page**: foundations (colour swatches read live from CSS tokens, type scale, radius, shadow, glass, icons), every primitive and composite with real states and demo data (`app/styleguide/demo.ts`), and a "Merge & fix list" of candidates. Still dev-only.
- **`Button variant="outline"`** for secondary actions on solid white surfaces (PrescriptionCard), where glass is invisible. Card action rows wrap instead of squeezing text.

- **Styleguide is side-effect free.** Composites that call server actions or open realtime take an override used only by `/styleguide`: `DoctorSidebar.signOutAction`, `PatientsTable.onResend`, `ConversationList.live`, `NotificationToggle.preview`/`previewError`, `InviteDialog.inviteAction`, `FileViewer.getUrl`, `LoginForm.loginAction`, `SetPasswordForm.saveAction`. `Conversation` and `PrescriptionComposer` are not on the page (too many live actions); the Coverage table says so. Production call sites pass nothing, so app behaviour is unchanged.

- **Styleguide phone preview is an iframe of itself** (`/styleguide?frame=1`), not a narrow box: Tailwind breakpoints follow the viewport, so only an iframe shows real 390px behaviour. Live-data boxes are drag-resizable instead of clipping.

- **`ink-3` renamed to `ink-label`** (2026-10-20). It is darker than `ink-2`, so a number implied the wrong order. Names now say the job. No colour changed.
- **Type scale is closed**: 34 / 28 / 22 / 17 / 16 / 15 / 14 / 13 / 12, plus 11 for the unread counter. 10, 19 and 21px were folded in (owner decision).

- **Review list applied** (v0.4.1): `IconTile`, `SettingsRow`, `ErrorScreen` and `Card tone="dashed"` replace hand-built copies; PrescriptionCard is a Card; small buttons and chips 44px; patient file and medicine names 16px; every radius is a token. Only the Hindi/Kannada check stays open (needs real translations).

- **Invite links** (v0.5.0): one-time token in `invite_links`, 7 days. `/join/<token>` is public; `joinWithInviteLink` claims the link atomically, creates a confirmed account with the service role, links the conversation, signs in. Email invite kept as the second option.
- **Phone sign-in without SMS**: phone-only patients get an auth email `<91number>@phone.careconnect.invalid` that never receives mail; `login()` maps a typed mobile number to it. Real phone OTP would need an SMS provider + DLT (India). `profiles.email` stays null for them; `profiles.phone` holds +91….
- **Reports are removed, not erased from history**: `remove_report()` clears the file fields and sets `deleted_at`; the chat shows "Report removed by the doctor". The patient sees it after a refresh (no realtime UPDATE handling yet).

## Known gaps — deliberate, not bugs

- No way to list or cancel invite links in the UI yet (`revokeInviteLink` exists). Links expire after 7 days.
- No forgot-password flow yet. Reset a password in Supabase (Authentication → Users) until it exists.

- `/privacy` is a placeholder — needs the clinic's reviewed notice before launch.
- Prescriptions print `[REG NO]` until `profiles.reg_no` is filled for the doctor.
- `themeColor` in `app/layout.tsx` is a raw hex. It duplicates `--color-forest`; viewport metadata cannot take a Tailwind class.
- "Email not delivered" from the hi-fi is out of scope for the MVP (needs delivery webhooks) — see `docs/SPEC.md`.

## Done

- **Phase 1** — `InviteDialog`, mounted once in the doctor layout, opened by `?invite=1`, success banner survives the close.
- **Phase 2** — `Conversation`, `MessageItem`, `Composer`, `ConversationList`. Realtime, day and "N new messages" dividers, Seen, search, optimistic send, offline queue. One chat for both roles.
- **Phase 3** — `AttachSheet` (camera / photo / PDF → preview → note → send), `FileViewer` on 5-minute signed URLs, `PatientPanel` with Reports and Prescriptions tabs.
- **Phase 4** — `MedicineFields`, `PrescriptionComposer` (1.5s autosave), `ReviewIssueDialog`, `PrescriptionView`, corrections via `replacesId`, patient list and detail, `/rx/[id]/print` with `AutoPrint`.
- **Phase 5** — `PatientsTable` with Resend / Open chat, `/profile` with the language switch, doctor first-run welcome, `loading.tsx` and `error.tsx` for both segments.
- **Phase 6** — deleted `ComingSoon`, merged the duplicate tab bars and draft card, replaced the last three raw `<button>`s with primitives, confirmed no hex colours or hand-rolled glass outside `globals.css`, updated `docs/COMPONENTS.md` and `/styleguide`.

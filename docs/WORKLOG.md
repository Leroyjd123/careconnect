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

## Known gaps — deliberate, not bugs

- No forgot-password flow yet. Reset a password in Supabase (Authentication → Users) until it exists.

- `FileCard` renders the file name at 15px; the patient body-text rule is ≥16px. Left alone rather than shifting the starter's type scale.
- `Button size="sm"` is 40px, under the 44px minimum. Only used on doctor-only surfaces. Patient-facing controls use the default size; `Segmented` was raised to 44px for `/profile`.
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

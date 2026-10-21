# CareConnect — rules for Claude Code

Doctor–patient messaging MVP. Patients chat with their doctor, send reports and see prescriptions.
The doctor manages conversations, reviews reports, issues prescriptions and invites patients.

Read before any task: this file, `docs/WORKLOG.md` (where the build is right now) and `docs/COMPONENTS.md`.
Product detail lives in `docs/SPEC.md`. Setup lives in `docs/SETUP.md`.

## Stack (do not change without asking)

- Next.js 15 App Router, React 19, TypeScript strict. One app, one repo, deployed to Vercel.
- Supabase: Postgres + RLS, email + password auth (invite email sets the password), private Storage, Realtime. Schema: `supabase/migrations/`.
- Tailwind CSS v4. Tokens in `src/app/globals.css`. Icons: `lucide-react` only. Font: Inter (self-hosted).
- Web push: `web-push` (server only, `src/lib/push.ts`) + `public/sw.js`. Approved 2026-10-20.
- No other runtime dependencies. Do NOT add: UI kits (shadcn, MUI, Radix), state libraries (Redux, Zustand,
  React Query), ORMs (Prisma, Drizzle), date libraries, form libraries, CSS-in-JS. Ask first if you think one is needed.

## Commands

```
npm run dev        # http://localhost:3000, styleguide at /styleguide
npm run typecheck
npm run lint
npm run build      # must pass before you say a task is done
```

## Where things go (keep it monolithic and flat)

```
src/app/(patient)/…        patient screens: /home /chat /prescriptions /profile
src/app/doctor/…           doctor screens: /doctor /doctor/c/[id] /doctor/patients
src/app/actions/*.ts       ALL writes. Server actions, grouped by domain. Return ActionResult.
src/lib/data.ts            ALL server reads. Pages call these; no inline queries in pages.
src/lib/supabase/*         server.ts (default), client.ts (browser: realtime + uploads only), admin.ts (invites only)
src/lib/{types,constants,utils,auth,upload,push,releases}.ts
src/components/ui/*        design-system primitives (Button, Card, Field, Dialog…)
src/components/chat/*      chat pieces shared by doctor AND patient
src/components/rx/*        prescription pieces shared by doctor AND patient
src/components/layout/*    shells, nav, headers
src/components/doctor/*    doctor-only composites (only if not shareable)
src/components/patient/*   patient-only composites (only if not shareable)
```

## No duplicate components (the most important rule)

1. Before creating a component, search `docs/COMPONENTS.md`, `/styleguide` and `src/components`.
   If something close exists, extend it with a prop or variant. Do not copy it.
2. Doctor and patient share the same chat and prescription components. Differences are props
   (`mine`, `viewerRole`), never forked files like `DoctorMessageBubble`.
3. Desktop and mobile share the same component. Use responsive classes, never `XMobile.tsx` copies.
4. One component per file. File name = component name. Named exports only.
5. When you add or change a shared component, update `docs/COMPONENTS.md` and `/styleguide` in the same change.
6. Do not hand-roll what a primitive covers: no raw `<button className="bg-forest…">` (use Button),
   no custom modals (use Dialog), no ad-hoc glass styles (use Card or the glass utilities).

## Styling

- Tokens only: `bg-forest`, `text-ink-2`, `rounded-card`, `shadow-float`, `glass`, `glass-strong`…
  Never write a hex colour or a `backdrop-filter` in a component.
- One `variant="primary"` Button per screen. Secondary actions use `secondary`, `soft` or `ghost`.
- Touch targets ≥ 44px. Patient body text ≥ 16px. Icons always paired with a text label for patients.
- Status never relies on colour alone: badge text + icon.
- The background (`BackgroundScene`) is rendered once in the root layout. Pages don't add blobs or patterns.
- Dates and times only via `src/lib/utils.ts` (fixed `APP_TIME_ZONE`) to avoid hydration mismatches.

## Data and security

- RLS is the security boundary. Never rely on hiding UI. Every table has policies in the migration.
- `createAdminClient()` (service role) is allowed ONLY in `src/app/actions/patients.ts`: after `requireProfile("doctor")`,
  or in the invite-link functions (`checkInviteLink`, `joinWithInviteLink`) where the one-time token is the boundary.
  One more: `emailForPhone()` in `actions/auth.ts` (not exported), so a mobile number can sign in to an email account.
- Files are private. Show them with `getFileUrl()` (5-minute signed URL). Never make the bucket public or store URLs.
- Uploads go browser → Storage via `lib/upload.ts`, then `sendAttachment()`. Never send file bytes through a server action.
- Issued prescriptions are immutable (DB trigger). Corrections = new draft with `replacesId`, then issue.
- Notifications go through `notifyConversation()` in `lib/push.ts`. Never put message text or medical detail in a
  notification: it shows on lock screens. Name the sender only.
- Schema changes: add a new numbered file in `supabase/migrations/`, update `src/lib/types.ts` in the same change,
  and extend `supabase/tests/rls_smoke.sql` if you add a policy.
- Server components: `requireProfile()` at the top of every layout/page that needs a user.

## Copy

Plain, warm, short. "Send message", not "Submit". "We couldn't send the code. Please try again." not error codes.
Use the exact strings in `docs/SPEC.md` where given.

## Definition of done

- User-visible change? Add it to the top release in `src/lib/releases.ts` (or start a new one and bump `package.json`).

- `npm run typecheck && npm run lint && npm run build` pass.
- Loading, empty and error states exist for anything that fetches or submits.
- Works at 390px wide and at 1440px wide.
- No new component that duplicates an existing one. COMPONENTS.md and /styleguide updated.

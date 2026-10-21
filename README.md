# CareConnect

Private messaging between a doctor and their patients: chat, report uploads and prescriptions.
Next.js 15 + Supabase, deployed on Vercel.

## Docs

| File | What's in it |
|---|---|
| `docs/SETUP.md` | Supabase project, auth settings, email templates, env, doctor account, deploy. **Start here.** |
| `docs/SPEC.md` | What the app does, screen by screen, with the exact copy. |
| `docs/WORKLOG.md` | Where the build is: state, next steps, blockers, decisions log. |
| `CLAUDE.md` | Rules for working on the code (stack, folders, no duplicate components, security). |
| `docs/COMPONENTS.md` | Inventory of shared components. Also live at `/styleguide` in dev. |
| `PRODUCT.md` | Who it's for, positioning, product principles. |
| `DESIGN.md` | Visual system: tokens, type, glass surfaces, do's and don'ts. |
| `docs/PROMPTS.md` | Build history, phase by phase. |

## Run it locally

You need Node 20+ and a free Supabase project.

1. Create the Supabase project and run every file in `supabase/migrations/` in order (0001, 0002, 0003…) in the SQL Editor (`docs/SETUP.md` §1–2).
2. Copy the env file and fill in the Supabase values (Project Settings → API):
   ```
   cp .env.example .env.local
   ```
   `SUPABASE_SERVICE_ROLE_KEY` is the secret key. It is only used to invite patients and must never reach the browser.
3. Create the doctor account with a password (`docs/SETUP.md` §5).
4. Start the app:
   ```
   npm install
   npm run dev        # http://localhost:3000, styleguide at /styleguide
   ```

**Sign-in** is email or mobile number + password for everyone. Accounts exist only by invitation. The doctor either
**shares a one-time link** (copy or WhatsApp; the patient opens it, adds name, email and/or mobile, and a password; no
email or code needed) or **sends an email invite** (the patient opens it and chooses a password).

**Testing tip.** Supabase's built-in email only sends to members of your Supabase team, about 2 per hour. To test without
email, create the patient in Supabase (Authentication → Users → Add user, with a password, "Auto confirm" ticked),
then invite that same email from the doctor screen. The app links the existing account and opens the chat. For real
invites, set up custom SMTP (`docs/SETUP.md` §3).

## Screens

| Route | Who | What |
|---|---|---|
| `/login` | all | Email + password. Invite-only: accounts are created by the doctor, never by sign-up. |
| `/join/[token]` | patient | Doctor's shared invite link: make an account with name, email or mobile, and password. |
| `/auth/confirm`, `/set-password` | all | Email invite lands here; the patient chooses a password. |
| `/home` | patient | Doctor card, latest message, prescriptions + "Send a report" tiles. |
| `/chat` | patient | The conversation. Attach sheet (`?attach=1`), file viewer (`?file=`), search, offline queue. |
| `/prescriptions`, `/prescriptions/[id]` | patient | Issued list with Latest/Replaced, full prescription with dose schedule. |
| `/profile` | patient | Name, email, language, privacy, help, sign out. |
| `/doctor` | doctor | Inbox list + empty pane. First run shows the welcome and 3 steps. |
| `/doctor/c/[id]` | doctor | Inbox \| conversation \| patient panel. `?rx=new` / `?rx=<id>` swaps in the prescription composer. |
| `/doctor/patients` | doctor | Status table with Resend and Open chat. `?invite=1` opens the invite form. |
| `/doctor/settings` | doctor | Account details, notifications, current version and release notes. |
| `/rx/[id]/print` | both | Plain sheet for printing or "Save as PDF". |
| `/styleguide` | dev | Every shared component. |

## Reports and storage

Patients (and the doctor) send PDFs and photos up to 10 MB each, stored privately in Supabase Storage. The doctor can
remove a report from the viewer; the chat keeps a "Report removed by the doctor" line. Total space depends on the
Supabase plan (about 1 GB on Free, 100 GB on Pro; check supabase.com/pricing).

## Notifications

Web push for new messages, files and prescriptions. Needs migration `0002` and three `VAPID` env vars
(`docs/SETUP.md` §8). Each person turns it on from Profile (patient) or Settings (doctor). On iPhone it only works
after "Add to Home Screen".

## Versions and release notes

The version and release notes live in `src/lib/releases.ts` (newest first; the first entry is the running version).
The doctor sees them under **Settings**; patients see the version at the bottom of **Profile**.

To ship a release: add an entry at the top of `RELEASES`, set the same `version` in `package.json`
(`npm version <x.y.z> --no-git-tag-version`), commit, then tag it: `git tag v<x.y.z> && git push --tags`.
New features bump the minor number (0.3.0 → 0.4.0); fixes bump the patch (0.3.0 → 0.3.1).

## Checks

```
npm run typecheck && npm run lint && npm run build
```

Stop `npm run dev` before `npm run build`: both write to `.next`, and building under a running dev server breaks it
(`rm -rf .next` and restart if that happens).

The RLS smoke test needs a throwaway local Postgres: see `supabase/tests/README.md`.

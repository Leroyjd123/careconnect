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

1. Create the Supabase project and run `supabase/migrations/0001_init.sql` in the SQL Editor (`docs/SETUP.md` §1–2).
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

**Sign-in** is email + password for everyone. Accounts exist only by invitation: the doctor invites a patient, the
patient gets one email, opens the link and chooses a password.

**Testing tip.** Supabase's built-in email only sends to members of your Supabase team, about 2 per hour. To test without
email, create the patient in Supabase (Authentication → Users → Add user, with a password, "Auto confirm" ticked),
then invite that same email from the doctor screen. The app links the existing account and opens the chat. For real
invites, set up custom SMTP (`docs/SETUP.md` §3).

## Screens

| Route | Who | What |
|---|---|---|
| `/login` | all | Email + password. Invite-only: accounts are created by the doctor, never by sign-up. |
| `/auth/confirm`, `/set-password` | all | Invite link lands here; the patient chooses a password. |
| `/home` | patient | Doctor card, latest message, prescriptions + "Send a report" tiles. |
| `/chat` | patient | The conversation. Attach sheet (`?attach=1`), file viewer (`?file=`), search, offline queue. |
| `/prescriptions`, `/prescriptions/[id]` | patient | Issued list with Latest/Replaced, full prescription with dose schedule. |
| `/profile` | patient | Name, email, language, privacy, help, sign out. |
| `/doctor` | doctor | Inbox list + empty pane. First run shows the welcome and 3 steps. |
| `/doctor/c/[id]` | doctor | Inbox \| conversation \| patient panel. `?rx=new` / `?rx=<id>` swaps in the prescription composer. |
| `/doctor/patients` | doctor | Status table with Resend and Open chat. `?invite=1` opens the invite form. |
| `/rx/[id]/print` | both | Plain sheet for printing or "Save as PDF". |
| `/styleguide` | dev | Every shared component. |

## Checks

```
npm run typecheck && npm run lint && npm run build
```

Stop `npm run dev` before `npm run build`: both write to `.next`, and building under a running dev server breaks it
(`rm -rf .next` and restart if that happens).

The RLS smoke test needs a throwaway local Postgres: see `supabase/tests/README.md`.

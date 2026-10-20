# CareConnect

Private messaging between a doctor and their patients: chat, report uploads and prescriptions.
Next.js 15 + Supabase, deployed on Vercel.

- **Set up:** `docs/SETUP.md`
- **Build with Claude Code:** start with `CLAUDE.md`, then run the phases in `docs/PROMPTS.md`
- **What to build:** `docs/SPEC.md`
- **What already exists:** `docs/COMPONENTS.md` and `/styleguide` in dev

```
cp .env.example .env.local
npm install
npm run dev
```

## What's in the starter

| Done | Still to build (phases) |
|---|---|
| Database schema, RLS, triggers, private storage, realtime (tested) | Invite dialog (1) |
| Email-code sign-in, invite landing, role routing, sign out | Chat UI with realtime (2) |
| Design tokens + all shared UI primitives + styleguide | Uploads, file viewer, patient panel (3) |
| Patient home, doctor inbox list, navigation shells | Prescription composer, review, patient views, print (4) |
| Every server action and data read | Patients page, profile, loading/error states (5) |

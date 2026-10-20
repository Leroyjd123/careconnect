# Setup: Supabase, email, Vercel

About 30 minutes. Everything below is on free tiers.

## 1. Supabase project

1. Create a project at supabase.com. Pick the region closest to your users (Mumbai `ap-south-1` for India).
2. **SQL Editor → New query →** paste `supabase/migrations/0001_init.sql` → Run. It creates the tables, RLS policies,
   triggers, the private `attachments` bucket and Realtime publication.
3. **Project Settings → API:** copy the Project URL, the anon (or publishable) key and the service_role key.

## 2. Auth settings (Authentication → …)

- **Sign In / Providers → Email:** enabled. **Allow new users to sign up: OFF** (invite-only).
  Confirm email: ON. **Email OTP length: 6**. OTP expiry: 3600 seconds.
- **URL Configuration:** Site URL = your Vercel URL (`http://localhost:3000` while developing).
  Redirect URLs: add `http://localhost:3000/**` and `https://YOUR-APP.vercel.app/**`.
- **Emails → Templates.** Replace two templates so they match the app:

**Magic Link** (used for sign-in codes and "resend invite"):

```html
<h2>Your CareConnect code</h2>
<p>Enter this code to sign in:</p>
<p style="font-size:28px;font-weight:700;letter-spacing:6px">{{ .Token }}</p>
<p>Or <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">sign in with one tap</a>.</p>
<p>The code expires in 1 hour. If you didn't ask for it, you can ignore this email.</p>
```

**Invite user:**

```html
<h2>You're invited to CareConnect</h2>
<p>Your doctor has invited you to message the clinic, share reports and get your prescriptions.</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite">Join CareConnect</a></p>
<p>If the link has expired, open {{ .SiteURL }} and sign in with this email address. We'll send you a code.</p>
```

## 3. Email delivery (required before real patients)

Supabase's built-in email only sends to members of your Supabase team and is capped at about 2 emails per hour.
That is fine for testing with your own address, not for patients.

Free option: **Resend** (free plan: 3,000 emails/month, 100/day).
1. Sign up at resend.com, add and verify a domain you own (add the DNS records it shows).
2. Create an API key.
3. Supabase **Authentication → Emails → SMTP Settings → Enable custom SMTP**:
   host `smtp.resend.com`, port `465`, user `resend`, password = the API key,
   sender `no-reply@yourdomain.com`, sender name `CareConnect`.
4. **Authentication → Rate Limits:** raise "emails sent per hour" to what you need (e.g. 100).

## 4. Local env

```
cp .env.example .env.local   # fill in the 3 Supabase values
npm install
npm run dev
```

## 5. Create the doctor account

1. Supabase **Authentication → Users → Add user → Create new user**: the doctor's email, tick "Auto confirm".
2. SQL Editor:

```sql
update public.profiles
set role = 'doctor', status = 'active',
    full_name = 'Dr. [NAME]', specialty = 'General Physician', reg_no = '[REG NO]'
where email = 'doctor@example.com';
```

3. Open http://localhost:3000, enter the doctor's email, enter the code. You land on `/doctor`.

## 6. Check it

- `/styleguide` (dev only) shows every shared component.
- Optional: run the RLS smoke test (`supabase/tests/README.md`).

## 7. Deploy to Vercel

1. Push the repo to GitHub. Vercel → **Add New Project** → import it. Framework: Next.js (auto).
2. Environment variables (Production + Preview): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL=https://YOUR-APP.vercel.app`.
3. Deploy. Then set Supabase Site URL to the Vercel URL (step 2).

Notes:
- Supabase free projects pause after a week without activity. Open the app weekly, or upgrade before launch.
- Vercel's request body limit (4.5 MB) doesn't matter: files upload straight from the browser to Supabase Storage.

## Switching to phone OTP later

1. Pick an SMS provider (Twilio, MessageBird, Vonage or Textlocal in Supabase settings; for India, DLT registration is required).
2. Supabase **Providers → Phone**: enable and add the provider keys.
3. Code changes: `login()` in `src/app/actions/auth.ts` uses `signInWithOtp({ phone })` and `verifyOtp({ phone, token, type: "sms" })`;
   the login form gets the `+91` `InputAddon`; `invitePatient()` creates the user with `admin.createUser({ phone, phone_confirm: true })`
   and sends the invite SMS. Keep email as a fallback field on the profile.

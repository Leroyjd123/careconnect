# Setup: Supabase, email, Vercel

About 30 minutes. Everything below is on free tiers.

## 1. Supabase project

1. Create a project at supabase.com. Pick the region closest to your users (Mumbai `ap-south-1` for India).
2. **SQL Editor → New query →** paste `supabase/migrations/0001_init.sql` → Run. It creates the tables, RLS policies,
   triggers, the private `attachments` bucket and Realtime publication.
   Then run every later file in `supabase/migrations/` in order (`0002_push_subscriptions.sql`, `0003_invite_links_and_report_delete.sql`, …).
3. **Project Settings → API:** copy the Project URL, the anon (or publishable) key and the service_role key.

## 2. Auth settings (Authentication → …)

- **Sign In / Providers → Email:** enabled. **Allow new users to sign up: OFF** (invite-only).
  Confirm email: ON. Email OTP expiry (how long invite links work): 86400 seconds.
- **URL Configuration:** Site URL = your Vercel URL (`http://localhost:3000` while developing).
  Redirect URLs: add `http://localhost:3000/**` and `https://YOUR-APP.vercel.app/**`.
- **Emails → Templates.** Replace two templates so they match the app:

**Magic Link** (used only for "resend invite"):

```html
<h2>You're invited to CareConnect</h2>
<p>Your doctor has invited you to message the clinic, share reports and get your prescriptions.</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">Join CareConnect</a></p>
```

**Invite user:**

```html
<h2>You're invited to CareConnect</h2>
<p>Your doctor has invited you to message the clinic, share reports and get your prescriptions.</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite">Join CareConnect</a></p>
<p>You'll choose a password after you open the link. If it has expired, ask your doctor to send a new invitation.</p>
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

1. Supabase **Authentication → Users → Add user → Create new user**: the doctor's email and a password, tick "Auto confirm".
2. SQL Editor:

```sql
update public.profiles
set role = 'doctor', status = 'active',
    full_name = 'Dr. [NAME]', specialty = 'General Physician', reg_no = '[REG NO]'
where email = 'doctor@example.com';
```

3. Open http://localhost:3000 and sign in with that email and password. You land on `/doctor`.

## 6. Check it

- `/styleguide` (dev only) shows every shared component.
- Optional: run the RLS smoke test (`supabase/tests/README.md`).

## 7. Deploy to Vercel

1. Push the repo to GitHub. Vercel → **Add New Project** → import it. Framework: Next.js (auto).
2. Environment variables (Production + Preview): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL=https://YOUR-APP.vercel.app`,
   and for notifications `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (see §8).
3. Deploy. Then set Supabase Site URL to the Vercel URL (step 2).

Notes:
- Supabase free projects pause after a week without activity. Open the app weekly, or upgrade before launch.
- Vercel's request body limit (4.5 MB) doesn't matter: files upload straight from the browser to Supabase Storage.

## 8. Web push notifications

1. Run `supabase/migrations/0002_push_subscriptions.sql` in the SQL Editor.
2. Generate a key pair once: `npx web-push generate-vapid-keys`. Put it in `.env.local` and in Vercel
   (Production + Preview), then redeploy:
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY` = the public key
   - `VAPID_PRIVATE_KEY` = the private key (secret)
   - `VAPID_SUBJECT` = `mailto:` + an address you own, e.g. `mailto:support@yourclinic.com`
   Use the SAME pair everywhere. Changing it later silently breaks every existing subscription.
3. Each person turns notifications on themselves: patients in **Profile**, the doctor in **Settings**.

Notes:
- iPhone: only works once CareConnect is added to the Home Screen (iOS 16.4+), and opened from there.
- Notifications say who sent something, never what it says. They show on lock screens.
- Without the keys the app works normally and the Notifications card says the browser can't show them.

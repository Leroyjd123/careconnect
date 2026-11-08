-- Reset the database to a clean beta state (approved by Leroy 2026-11-08).
--
-- Keeps ONLY these three accounts (their logins and profiles):
--   doctor@careconnect.com, patient@yopmail.com, admin@careconnect.com
-- Deletes everything else: other users, all chats, messages, prescriptions, meetings,
-- check-ins, clinics, invite links and the audit log. The shared medicine list stays.
--
-- Run it in the Supabase SQL editor (it needs the database owner to switch the
-- issued-prescription lock off for a moment). Then run scripts/seed-demo.mjs.
-- Stored files are removed separately (the SQL editor can't delete Storage files).
-- If migration 0006 (audit_log lock) has been applied, this script handles it too.

begin;

create temp table keep_users on commit drop as
  select id from auth.users
  where email in ('doctor@careconnect.com', 'patient@yopmail.com', 'admin@careconnect.com');

do $$ begin
  if (select count(*) from keep_users) <> 3 then
    raise exception 'Expected 3 accounts to keep, found %', (select count(*) from keep_users);
  end if;
end $$;

-- Locks off for this transaction only.
alter table public.prescriptions disable trigger prescriptions_lock;
alter table public.prescription_items disable trigger prescription_items_lock;
do $$ begin
  if exists (select 1 from pg_trigger where tgname = 'audit_log_append_only') then
    execute 'alter table public.audit_log disable trigger audit_log_append_only';
  end if;
end $$;

-- All chat content (messages, prescriptions, meetings and check-ins go with their conversation).
delete from public.messages;
delete from public.check_ins;
delete from public.meetings;
delete from public.prescription_items;
delete from public.prescriptions;
delete from public.conversations;

delete from public.invite_links;
delete from public.audit_log;

-- The medicine list stays, but nothing may point at a user who is about to go.
update public.medicines set doctor_id = null where doctor_id not in (select id from keep_users);

-- Kept accounts: no clinic, no inviter.
update public.profiles set clinic_id = null, invited_by = null where id in (select id from keep_users);
update public.profiles set full_name = 'CareConnect Admin'
  where id in (select id from keep_users) and role = 'admin' and coalesce(full_name, '') = '';
delete from public.clinics;

-- Every other account (profiles and push subscriptions go with them).
delete from public.push_subscriptions where user_id not in (select id from keep_users);
delete from auth.users where id not in (select id from keep_users);

-- Locks back on.
alter table public.prescriptions enable trigger prescriptions_lock;
alter table public.prescription_items enable trigger prescription_items_lock;
do $$ begin
  if exists (select 1 from pg_trigger where tgname = 'audit_log_append_only') then
    execute 'alter table public.audit_log enable trigger audit_log_append_only';
  end if;
end $$;

commit;

-- Check: should show exactly the three accounts.
select email, role, full_name from public.profiles order by role;

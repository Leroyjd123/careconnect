-- 0005: multi-doctor, per-conversation blocking, clinics, meetings, check-ins, superadmin,
-- audit log, consent, Malayalam, shared medicines. Plan: docs/PLAN.md Phase A.
--
-- Conventions in this file:
-- * Admin READS go through RLS (`or public.is_admin()` on select policies).
-- * Admin WRITES go through the service role in src/app/actions/admin.ts, which also writes its own
--   audit_log rows. Triggers below only log writes made by a signed-in user (auth.uid() is not null),
--   so service-role writes are never logged twice.
-- * Nothing is ever hard-deleted from audit_log.

-- ─────────────────────────────────────────────────────────────
-- 1. Roles: admin
-- ─────────────────────────────────────────────────────────────

alter table public.profiles drop constraint profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('doctor', 'patient', 'admin'));

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- ─────────────────────────────────────────────────────────────
-- 2. Clinics and per-level settings
-- ─────────────────────────────────────────────────────────────

create table public.clinics (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null check (length(trim(name)) between 2 and 120),
  -- null = not set at this level. Effective value: patient → doctor → clinic → false.
  show_other_doctors  boolean,
  created_at          timestamptz not null default now()
);

alter table public.profiles
  add column clinic_id              uuid references public.clinics (id) on delete set null,  -- doctors
  add column show_other_doctors     boolean,                                                  -- doctors + patients
  add column meeting_auto_complete  boolean not null default true,                            -- doctors
  add column deactivated_at         timestamptz,                                              -- doctors
  add column terms_accepted_at      timestamptz;                                              -- everyone

alter table public.clinics enable row level security;
create policy "clinics_select" on public.clinics for select to authenticated using (
  public.is_admin()
  or exists (select 1 from profiles p where p.id = auth.uid() and p.clinic_id = clinics.id)
);
-- No insert/update/delete policies: clinics are managed by the admin through the service role.

-- Consent (decision 58): existing users are recorded as accepted.
update public.profiles set terms_accepted_at = now() where terms_accepted_at is null;

-- ─────────────────────────────────────────────────────────────
-- 3. Languages: en / kn / ml (Hindi removed, decision 7 / Q-A)
-- ─────────────────────────────────────────────────────────────

update public.profiles set language = 'en' where language = 'hi';
alter table public.profiles drop constraint profiles_language_check;
alter table public.profiles add constraint profiles_language_check check (language in ('en', 'kn', 'ml'));

-- ─────────────────────────────────────────────────────────────
-- 4. Profile columns users may edit themselves
--    Patients edit their own DOB / height / weight (decision 28); consent is their own to give.
-- ─────────────────────────────────────────────────────────────

grant update (date_of_birth, height_cm, weight_kg, terms_accepted_at) on public.profiles to authenticated;

-- ─────────────────────────────────────────────────────────────
-- 5. Per-conversation blocking (decisions 11–13, 52)
--    profiles.blocked_at stays as the admin's account-wide block.
-- ─────────────────────────────────────────────────────────────

alter table public.conversations add column blocked_at timestamptz;

-- Until now a block meant "this patient, with the only doctor". Move it onto their conversations.
-- NOTE for Phase B: those patients still carry an auth ban from setPatientBlocked(); lift it there.
update public.conversations c
set blocked_at = p.blocked_at
from public.profiles p
where p.id = c.patient_id and p.role = 'patient' and p.blocked_at is not null;
update public.profiles set blocked_at = null where role = 'patient' and blocked_at is not null;

-- Can the signed-in user write into this conversation?
-- Member, own account not blocked, doctor not deactivated, and (if patient) the conversation not blocked.
create or replace function public.can_write(conv uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from conversations c
    join profiles d on d.id = c.doctor_id
    join profiles me on me.id = auth.uid()
    where c.id = conv
      and auth.uid() in (c.doctor_id, c.patient_id)
      and me.blocked_at is null
      and d.deactivated_at is null
      and (c.blocked_at is null or auth.uid() = c.doctor_id)
  );
$$;
revoke execute on function public.can_write(uuid) from public, anon;
grant execute on function public.can_write(uuid) to authenticated;

-- ─────────────────────────────────────────────────────────────
-- 6. Meetings and check-ins (decisions 29–42, 68–72)
-- ─────────────────────────────────────────────────────────────

create table public.meetings (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references public.conversations (id) on delete cascade,
  doctor_id        uuid not null references public.profiles (id),
  patient_id       uuid not null references public.profiles (id),
  starts_at        timestamptz not null,
  duration_min     int not null default 15 check (duration_min between 5 and 240),
  meet_url         text not null check (meet_url ~* '^https://[^\s]+$' and length(meet_url) <= 500),
  note             text check (note is null or length(note) <= 500),
  status           text not null default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled')),
  reminded_at      timestamptz,
  created_by       uuid not null references public.profiles (id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index meetings_doctor_starts_idx on public.meetings (doctor_id, starts_at);
create index meetings_conversation_idx on public.meetings (conversation_id, starts_at desc);
create index meetings_reminder_idx on public.meetings (starts_at) where status = 'scheduled' and reminded_at is null;

create table public.check_ins (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references public.conversations (id) on delete cascade,
  doctor_id        uuid not null references public.profiles (id),
  patient_id       uuid not null references public.profiles (id),
  due_on           date not null,
  reason           text not null check (length(trim(reason)) between 2 and 300),
  status           text not null default 'scheduled' check (status in ('scheduled', 'done', 'cancelled')),
  meeting_id       uuid references public.meetings (id) on delete set null,  -- set when turned into a meeting
  reminded_at      timestamptz,
  created_by       uuid not null references public.profiles (id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index check_ins_doctor_due_idx on public.check_ins (doctor_id, due_on);
create index check_ins_conversation_idx on public.check_ins (conversation_id, due_on desc);
create index check_ins_reminder_idx on public.check_ins (due_on) where status = 'scheduled' and reminded_at is null;

-- doctor_id / patient_id must match the conversation, whoever writes the row.
create or replace function public.appointment_matches_conversation()
returns trigger language plpgsql set search_path = public as $$
begin
  if not exists (
    select 1 from conversations c
    where c.id = new.conversation_id and c.doctor_id = new.doctor_id and c.patient_id = new.patient_id
  ) then
    raise exception 'Doctor and patient do not match this conversation';
  end if;
  new.updated_at = now();
  return new;
end;
$$;
create trigger meetings_match before insert or update on public.meetings
  for each row execute function public.appointment_matches_conversation();
create trigger check_ins_match before insert or update on public.check_ins
  for each row execute function public.appointment_matches_conversation();

alter table public.meetings enable row level security;
alter table public.check_ins enable row level security;

-- Read: both members and the admin. Write: the conversation's doctor (admin uses the service role).
create policy "meetings_select" on public.meetings for select to authenticated
  using (auth.uid() in (doctor_id, patient_id) or public.is_admin());
create policy "meetings_insert" on public.meetings for insert to authenticated
  with check (doctor_id = auth.uid() and created_by = auth.uid() and public.can_write(conversation_id));
create policy "meetings_update" on public.meetings for update to authenticated
  using (doctor_id = auth.uid()) with check (doctor_id = auth.uid() and public.can_write(conversation_id));

create policy "check_ins_select" on public.check_ins for select to authenticated
  using (auth.uid() in (doctor_id, patient_id) or public.is_admin());
create policy "check_ins_insert" on public.check_ins for insert to authenticated
  with check (doctor_id = auth.uid() and created_by = auth.uid() and public.can_write(conversation_id));
create policy "check_ins_update" on public.check_ins for update to authenticated
  using (doctor_id = auth.uid()) with check (doctor_id = auth.uid() and public.can_write(conversation_id));
-- No delete: cancel instead.

-- ─────────────────────────────────────────────────────────────
-- 7. Messages: meeting / check-in cards, admin sender, edit and remove
-- ─────────────────────────────────────────────────────────────

alter table public.messages
  add column meeting_id   uuid references public.meetings (id),
  add column check_in_id  uuid references public.check_ins (id),
  add column sender_role  text check (sender_role in ('doctor', 'patient', 'admin')),
  add column edited_at    timestamptz,
  add column removed_at   timestamptz,   -- "Message removed by admin"
  add column removed_by   uuid references public.profiles (id);

update public.messages m set sender_role = p.role from public.profiles p where p.id = m.sender_id;
alter table public.messages alter column sender_role set not null;

alter table public.messages drop constraint messages_kind_check;
alter table public.messages add constraint messages_kind_check
  check (kind in ('text', 'file', 'prescription', 'meeting', 'check_in'));

alter table public.messages drop constraint message_has_content;
alter table public.messages add constraint message_has_content check (
  removed_at is not null
  or (kind = 'text' and length(trim(coalesce(body, ''))) > 0)
  or (kind = 'file' and (file_path is not null or deleted_at is not null))
  or (kind = 'prescription' and prescription_id is not null)
  or (kind = 'meeting' and meeting_id is not null)
  or (kind = 'check_in' and check_in_id is not null)
);

-- sender_role is always taken from the sender's profile, never from the client.
create or replace function public.set_sender_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  select role into new.sender_role from profiles where id = new.sender_id;
  return new;
end;
$$;
create trigger messages_sender_role before insert on public.messages
  for each row execute function public.set_sender_role();

-- Inbox preview for the new kinds. Admin removals keep the old preview.
create or replace function public.touch_conversation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update conversations
  set last_message_at = new.created_at,
      last_message_preview = case new.kind
        when 'text' then left(new.body, 140)
        when 'file' then 'Sent ' || coalesce(new.file_name, 'a file')
        when 'meeting' then 'Video meeting'
        when 'check_in' then 'Check-in'
        else 'Prescription'
      end
  where id = new.conversation_id;
  return new;
end;
$$;

-- Users send text and files only, and only where can_write() allows. Cards are posted by the RPC below.
drop policy "messages_insert" on public.messages;
create policy "messages_insert" on public.messages for insert to authenticated
  with check (
    sender_id = auth.uid()
    and kind in ('text', 'file')
    and read_at is null
    and removed_at is null
    and public.can_write(conversation_id)
  );

drop policy "messages_select" on public.messages;
create policy "messages_select" on public.messages for select to authenticated
  using (public.is_member(conversation_id) or public.is_admin());

-- Post the chat card for a meeting or check-in the caller (the conversation's doctor) just wrote.
create or replace function public.post_appointment_message(appt_kind text, appt uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  conv uuid;
  msg_id uuid;
begin
  if appt_kind = 'meeting' then
    select conversation_id into conv from meetings where id = appt and doctor_id = auth.uid();
  elsif appt_kind = 'check_in' then
    select conversation_id into conv from check_ins where id = appt and doctor_id = auth.uid();
  else
    raise exception 'Unknown appointment kind';
  end if;
  if conv is null or not public.can_write(conv) then
    raise exception 'Appointment not found';
  end if;

  insert into messages (conversation_id, sender_id, kind, meeting_id, check_in_id)
  values (
    conv, auth.uid(), appt_kind,
    case when appt_kind = 'meeting' then appt end,
    case when appt_kind = 'check_in' then appt end
  )
  returning id into msg_id;
  return msg_id;
end;
$$;
revoke execute on function public.post_appointment_message(text, uuid) from public, anon;
grant execute on function public.post_appointment_message(text, uuid) to authenticated;

-- The doctor still issues prescriptions in a blocked conversation (they are the record), but not
-- when their own account is deactivated or blocked.
create or replace function public.issue_prescription(rx uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  p prescriptions;
  msg_id uuid;
begin
  select * into p from prescriptions where id = rx for update;
  if p.id is null or p.doctor_id <> auth.uid() then
    raise exception 'Prescription not found';
  end if;
  if not public.can_write(p.conversation_id) then
    raise exception 'This conversation is read-only';
  end if;
  if p.status <> 'draft' then
    raise exception 'Prescription already issued';
  end if;
  if not exists (select 1 from prescription_items where prescription_id = rx) then
    raise exception 'Add at least one medicine';
  end if;

  update prescriptions set status = 'issued', issued_at = now() where id = rx;

  insert into messages (conversation_id, sender_id, kind, prescription_id)
  values (p.conversation_id, auth.uid(), 'prescription', rx)
  returning id into msg_id;

  return msg_id;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- 8. Prescriptions: admin cancel (Q-C). Never edited in place.
-- ─────────────────────────────────────────────────────────────

alter table public.prescriptions
  add column cancelled_at  timestamptz,
  add column cancelled_by  uuid references public.profiles (id);

-- Issued rows stay locked, with ONE exception: setting cancelled_at/cancelled_by once,
-- with every other column unchanged. Only the service role (admin action) can do that,
-- because rx_update only matches drafts.
create or replace function public.lock_issued_prescription()
returns trigger language plpgsql set search_path = public as $$
begin
  if old.status = 'issued' then
    if tg_op = 'UPDATE'
       and old.cancelled_at is null
       and new.cancelled_at is not null
       and (to_jsonb(new) - array['cancelled_at', 'cancelled_by', 'updated_at'])
         = (to_jsonb(old) - array['cancelled_at', 'cancelled_by', 'updated_at'])
    then
      new.updated_at = now();
      return new;
    end if;
    raise exception 'Issued prescriptions cannot be changed. Issue a correction instead.';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  new.updated_at = now();
  return new;
end;
$$;

drop policy "rx_select" on public.prescriptions;
create policy "rx_select" on public.prescriptions for select to authenticated using (
  doctor_id = auth.uid() or (patient_id = auth.uid() and status = 'issued') or public.is_admin()
);
-- rx_items_select inherits through rx_select, so the admin can read items too.

-- ─────────────────────────────────────────────────────────────
-- 9. Admin read access on existing tables
-- ─────────────────────────────────────────────────────────────

drop policy "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles for select to authenticated using (
  id = auth.uid()
  or public.is_admin()
  or exists (
    select 1 from conversations c
    where (c.doctor_id = auth.uid() and c.patient_id = profiles.id)
       or (c.patient_id = auth.uid() and c.doctor_id = profiles.id)
  )
);

drop policy "conversations_select" on public.conversations;
create policy "conversations_select" on public.conversations for select to authenticated
  using (auth.uid() in (doctor_id, patient_id) or public.is_admin());

drop policy "invite_links_select_own" on public.invite_links;
create policy "invite_links_select_own" on public.invite_links for select to authenticated
  using (doctor_id = auth.uid() or public.is_admin());

drop policy "attachments_read" on storage.objects;
create policy "attachments_read" on storage.objects for select to authenticated using (
  bucket_id = 'attachments'
  and (public.is_member(((storage.foldername(name))[1])::uuid) or public.is_admin())
);

drop policy "attachments_upload" on storage.objects;
create policy "attachments_upload" on storage.objects for insert to authenticated with check (
  bucket_id = 'attachments'
  and public.can_write(((storage.foldername(name))[1])::uuid)
);

-- Only the doctor OF THAT conversation may delete its files (was: any doctor who is a member).
drop policy "attachments_delete_doctor" on storage.objects;
create policy "attachments_delete_doctor" on storage.objects for delete to authenticated using (
  bucket_id = 'attachments'
  and exists (
    select 1 from conversations c
    where c.id = ((storage.foldername(name))[1])::uuid and c.doctor_id = auth.uid()
  )
);

-- ─────────────────────────────────────────────────────────────
-- 10. Invite links can invite doctors (admin only, via service role)
-- ─────────────────────────────────────────────────────────────

alter table public.invite_links
  add column role text not null default 'patient' check (role in ('patient', 'doctor')),
  alter column doctor_id drop not null;
alter table public.invite_links add constraint invite_link_has_doctor
  check (role = 'doctor' or doctor_id is not null);

-- Doctors may only create patient links (decision 18).
drop policy "invite_links_insert_own" on public.invite_links;
create policy "invite_links_insert_own" on public.invite_links for insert to authenticated
  with check (
    doctor_id = auth.uid() and role = 'patient' and public.is_doctor()
    and used_at is null and revoked_at is null
  );

-- ─────────────────────────────────────────────────────────────
-- 11. One shared master medicines list (decision 16, Q-E)
--     Any doctor reads and adds. Only the admin edits, deactivates, merges (service role).
--     doctor_id now means "added by".
-- ─────────────────────────────────────────────────────────────

-- Merge same-name duplicates across doctors into the oldest row.
with ranked as (
  select id,
         first_value(id) over (partition by lower(trim(name)) order by created_at, id) as keep_id
  from public.medicines
  where merged_into is null
)
update public.medicines m
set merged_into = r.keep_id, active = false, updated_at = now()
from ranked r
where m.id = r.id and r.id <> r.keep_id;

drop index public.medicines_doctor_name_idx;
create unique index medicines_name_idx on public.medicines (lower(trim(name))) where merged_into is null;
alter table public.medicines alter column doctor_id drop not null;

drop policy "medicines_select_own" on public.medicines;
drop policy "medicines_insert_own" on public.medicines;
drop policy "medicines_update_own" on public.medicines;
create policy "medicines_select" on public.medicines for select to authenticated
  using (public.is_doctor() or public.is_admin());
create policy "medicines_insert" on public.medicines for insert to authenticated
  with check (doctor_id = auth.uid() and public.is_doctor() and active and merged_into is null);
-- No update/delete policy: edits are admin-only through the service role.
revoke update on public.medicines from authenticated;

-- ─────────────────────────────────────────────────────────────
-- 12. "Also consults" (decision 26, Q-B)
--     Names of the patient's other doctors, only for one of their doctors, only when enabled.
-- ─────────────────────────────────────────────────────────────

create or replace function public.other_doctors(patient uuid)
returns table (id uuid, full_name text, specialty text)
language sql stable security definer set search_path = public as $$
  select o.id, o.full_name, o.specialty
  from profiles me
  join profiles pt on pt.id = patient
  left join clinics cl on cl.id = me.clinic_id
  join conversations mine on mine.doctor_id = me.id and mine.patient_id = pt.id
  join conversations c on c.patient_id = pt.id and c.doctor_id <> me.id
  join profiles o on o.id = c.doctor_id
  where me.id = auth.uid()
    and me.role = 'doctor'
    and coalesce(pt.show_other_doctors, me.show_other_doctors, cl.show_other_doctors, false)
  order by o.full_name;
$$;
revoke execute on function public.other_doctors(uuid) from public, anon;
grant execute on function public.other_doctors(uuid) to authenticated;

-- ─────────────────────────────────────────────────────────────
-- 13. Audit log (decisions 27, 28, 49, 54, 55)
-- ─────────────────────────────────────────────────────────────

create table public.audit_log (
  id           uuid primary key default gen_random_uuid(),
  actor_id     uuid references public.profiles (id) on delete set null,  -- null = system (cron)
  actor_role   text not null check (actor_role in ('doctor', 'patient', 'admin', 'system')),
  action       text not null,          -- e.g. 'meeting.scheduled', 'conversation.blocked', 'admin.viewed_chat'
  target_type  text not null,          -- 'meeting' | 'check_in' | 'conversation' | 'profile' | 'message' | 'prescription' | 'file' | …
  target_id    uuid,
  details      jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);
create index audit_log_created_idx on public.audit_log (created_at desc);
create index audit_log_actor_idx on public.audit_log (actor_id, created_at desc);
create index audit_log_target_idx on public.audit_log (target_type, target_id);

alter table public.audit_log enable row level security;
create policy "audit_select_admin" on public.audit_log for select to authenticated using (public.is_admin());
-- No insert/update/delete for users. Triggers (security definer) and the service role write it.
revoke insert, update, delete on public.audit_log from authenticated, anon;

-- One row for a write made by a signed-in user. Service-role writes (auth.uid() null) log themselves.
create or replace function public.write_audit(act text, t_type text, t_id uuid, info jsonb)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return; end if;
  insert into audit_log (actor_id, actor_role, action, target_type, target_id, details)
  select auth.uid(), coalesce(p.role, 'patient'), act, t_type, t_id, coalesce(info, '{}'::jsonb)
  from profiles p where p.id = auth.uid();
end;
$$;
revoke execute on function public.write_audit(text, text, uuid, jsonb) from public, anon, authenticated;

create or replace function public.audit_appointment()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  kind text := case tg_table_name when 'meetings' then 'meeting' else 'check_in' end;
begin
  if tg_op = 'INSERT' then
    perform write_audit(kind || '.scheduled', kind, new.id, to_jsonb(new));
  elsif new.status is distinct from old.status then
    perform write_audit(kind || '.' || new.status, kind, new.id, jsonb_build_object('from', old.status));
  else
    perform write_audit(kind || '.changed', kind, new.id,
      jsonb_build_object('before', to_jsonb(old), 'after', to_jsonb(new)));
  end if;
  return new;
end;
$$;
create trigger meetings_audit after insert or update on public.meetings
  for each row execute function public.audit_appointment();
create trigger check_ins_audit after insert or update on public.check_ins
  for each row execute function public.audit_appointment();

create or replace function public.audit_conversation_block()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.blocked_at is distinct from old.blocked_at then
    perform write_audit(
      case when new.blocked_at is null then 'conversation.unblocked' else 'conversation.blocked' end,
      'conversation', new.id, '{}'::jsonb);
  end if;
  return new;
end;
$$;
create trigger conversations_audit after update of blocked_at on public.conversations
  for each row execute function public.audit_conversation_block();

create or replace function public.audit_profile_details()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (new.date_of_birth, new.height_cm, new.weight_kg)
     is distinct from (old.date_of_birth, old.height_cm, old.weight_kg) then
    perform write_audit('profile.details_changed', 'profile', new.id, jsonb_build_object(
      'before', jsonb_build_object('date_of_birth', old.date_of_birth, 'height_cm', old.height_cm, 'weight_kg', old.weight_kg),
      'after',  jsonb_build_object('date_of_birth', new.date_of_birth, 'height_cm', new.height_cm, 'weight_kg', new.weight_kg)));
  end if;
  return new;
end;
$$;
create trigger profiles_details_audit after update of date_of_birth, height_cm, weight_kg on public.profiles
  for each row execute function public.audit_profile_details();

-- ─────────────────────────────────────────────────────────────
-- 14. Realtime: cards update live when a meeting or check-in changes
-- ─────────────────────────────────────────────────────────────

alter publication supabase_realtime add table public.meetings;
alter publication supabase_realtime add table public.check_ins;

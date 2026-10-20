-- CareConnect MVP schema.
-- Run once in Supabase → SQL Editor (or `supabase db push`).
-- Rule of thumb: the browser can only do what these policies allow. The UI never enforces access on its own.

create extension if not exists pgcrypto;

-- ─────────────────────────────────────────────────────────────
-- Tables
-- ─────────────────────────────────────────────────────────────

create table public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  role          text not null default 'patient' check (role in ('doctor', 'patient')),
  full_name     text not null default '',
  email         text,
  phone         text,
  specialty     text,                 -- doctors only, e.g. 'General Physician'
  reg_no        text,                 -- doctors only, printed on prescriptions
  language      text not null default 'en' check (language in ('en', 'kn', 'hi')),
  status        text not null default 'invited' check (status in ('invited', 'active')),
  invited_by    uuid references public.profiles (id),
  activated_at  timestamptz,
  created_at    timestamptz not null default now()
);

create table public.conversations (
  id                    uuid primary key default gen_random_uuid(),
  doctor_id             uuid not null references public.profiles (id) on delete cascade,
  patient_id            uuid not null references public.profiles (id) on delete cascade,
  last_message_at       timestamptz,
  last_message_preview  text,
  created_at            timestamptz not null default now(),
  unique (doctor_id, patient_id)
);

create table public.prescriptions (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references public.conversations (id) on delete cascade,
  doctor_id        uuid not null references public.profiles (id),
  patient_id       uuid not null references public.profiles (id),
  status           text not null default 'draft' check (status in ('draft', 'issued')),
  diagnosis        text,
  advice           text,
  replaces_id      uuid references public.prescriptions (id),  -- set when this corrects an earlier one
  issued_at        timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table public.prescription_items (
  id               uuid primary key default gen_random_uuid(),
  prescription_id  uuid not null references public.prescriptions (id) on delete cascade,
  position         int  not null default 0,
  medicine         text not null,
  dose             text not null,
  frequency        text not null,   -- '1-0-1', 'Once a week', 'When needed', …
  duration         text not null,   -- '3 days', '8 weeks', …
  timing           text             -- 'After food', 'Before food', null
);

create table public.messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references public.conversations (id) on delete cascade,
  sender_id        uuid not null references public.profiles (id),
  kind             text not null default 'text' check (kind in ('text', 'file', 'prescription')),
  body             text,
  file_path        text,
  file_name        text,
  file_size        bigint,
  file_type        text,
  prescription_id  uuid references public.prescriptions (id),
  read_at          timestamptz,
  created_at       timestamptz not null default now(),
  constraint message_has_content check (
    (kind = 'text' and length(trim(coalesce(body, ''))) > 0)
    or (kind = 'file' and file_path is not null)
    or (kind = 'prescription' and prescription_id is not null)
  )
);

create index messages_conversation_created_idx on public.messages (conversation_id, created_at);
create index prescriptions_conversation_idx on public.prescriptions (conversation_id, created_at desc);
create index prescription_items_rx_idx on public.prescription_items (prescription_id, position);
create index conversations_doctor_idx on public.conversations (doctor_id, last_message_at desc);

-- ─────────────────────────────────────────────────────────────
-- Helpers (security definer so policies don't recurse)
-- ─────────────────────────────────────────────────────────────

create or replace function public.is_doctor()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'doctor');
$$;

create or replace function public.is_member(conv uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from conversations c
    where c.id = conv and auth.uid() in (c.doctor_id, c.patient_id)
  );
$$;

-- ─────────────────────────────────────────────────────────────
-- Triggers
-- ─────────────────────────────────────────────────────────────

-- New auth user → profile. Role always starts as 'patient'; promote the doctor by hand (see docs/SETUP.md).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- First sign-in → invite becomes active.
create or replace function public.handle_first_sign_in()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.last_sign_in_at is null and new.last_sign_in_at is not null then
    update profiles set status = 'active', activated_at = now()
    where id = new.id and status = 'invited';
  end if;
  return new;
end;
$$;

create trigger on_auth_user_signed_in
  after update of last_sign_in_at on auth.users
  for each row execute function public.handle_first_sign_in();

-- Every message bumps its conversation for inbox sorting.
create or replace function public.touch_conversation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update conversations
  set last_message_at = new.created_at,
      last_message_preview = case new.kind
        when 'text' then left(new.body, 140)
        when 'file' then 'Sent ' || coalesce(new.file_name, 'a file')
        else 'Prescription'
      end
  where id = new.conversation_id;
  return new;
end;
$$;

create trigger on_message_created
  after insert on public.messages
  for each row execute function public.touch_conversation();

-- Issued prescriptions are locked. Corrections are new rows with replaces_id.
create or replace function public.lock_issued_prescription()
returns trigger language plpgsql set search_path = public as $$
begin
  if old.status = 'issued' then
    raise exception 'Issued prescriptions cannot be changed. Issue a correction instead.';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  new.updated_at = now();
  return new;
end;
$$;

create trigger prescriptions_lock
  before update or delete on public.prescriptions
  for each row execute function public.lock_issued_prescription();

create or replace function public.lock_issued_items()
returns trigger language plpgsql set search_path = public as $$
declare
  rx_id uuid := coalesce(new.prescription_id, old.prescription_id);
begin
  if exists (select 1 from prescriptions where id = rx_id and status = 'issued') then
    raise exception 'Issued prescriptions cannot be changed. Issue a correction instead.';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create trigger prescription_items_lock
  before insert or update or delete on public.prescription_items
  for each row execute function public.lock_issued_items();

-- ─────────────────────────────────────────────────────────────
-- RPCs (the only way to do multi-step writes)
-- ─────────────────────────────────────────────────────────────

-- Inbox / home list for whoever is signed in.
create or replace function public.my_conversations()
returns table (
  id uuid,
  other_id uuid,
  other_name text,
  other_status text,
  other_specialty text,
  last_message_at timestamptz,
  last_message_preview text,
  unread_count bigint
)
language sql stable security definer set search_path = public as $$
  select
    c.id,
    o.id,
    o.full_name,
    o.status,
    o.specialty,
    c.last_message_at,
    c.last_message_preview,
    (select count(*) from messages m
      where m.conversation_id = c.id and m.sender_id <> auth.uid() and m.read_at is null)
  from conversations c
  join profiles o on o.id = case when c.doctor_id = auth.uid() then c.patient_id else c.doctor_id end
  where auth.uid() in (c.doctor_id, c.patient_id)
  order by c.last_message_at desc nulls last, c.created_at desc;
$$;

-- Mark the other person's messages as read.
create or replace function public.mark_read(conv uuid)
returns void language sql security definer set search_path = public as $$
  update messages set read_at = now()
  where conversation_id = conv
    and sender_id <> auth.uid()
    and read_at is null
    and public.is_member(conv);
$$;

-- Draft → issued, and post the prescription card into the chat. One transaction.
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

revoke execute on function public.issue_prescription(uuid) from public, anon;
revoke execute on function public.mark_read(uuid) from public, anon;
revoke execute on function public.my_conversations() from public, anon;
grant execute on function public.issue_prescription(uuid) to authenticated;
grant execute on function public.mark_read(uuid) to authenticated;
grant execute on function public.my_conversations() to authenticated;

-- ─────────────────────────────────────────────────────────────
-- Row level security
-- ─────────────────────────────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.prescriptions enable row level security;
alter table public.prescription_items enable row level security;

-- profiles: see yourself and the people you share a conversation with.
create policy "profiles_select" on public.profiles for select to authenticated using (
  id = auth.uid()
  or exists (
    select 1 from conversations c
    where (c.doctor_id = auth.uid() and c.patient_id = profiles.id)
       or (c.patient_id = auth.uid() and c.doctor_id = profiles.id)
  )
);
create policy "profiles_update_self" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
-- Users may only change these columns. role and status are never client-editable.
revoke update on public.profiles from authenticated;
grant update (full_name, phone, language) on public.profiles to authenticated;

-- conversations: read only. Created by the invite server action.
create policy "conversations_select" on public.conversations for select to authenticated
  using (auth.uid() in (doctor_id, patient_id));

-- messages: members read; members send text or files as themselves.
create policy "messages_select" on public.messages for select to authenticated
  using (public.is_member(conversation_id));
create policy "messages_insert" on public.messages for insert to authenticated
  with check (
    sender_id = auth.uid()
    and kind in ('text', 'file')
    and read_at is null
    and public.is_member(conversation_id)
  );

-- prescriptions: doctor owns drafts; patient sees only issued ones.
create policy "rx_select" on public.prescriptions for select to authenticated using (
  doctor_id = auth.uid() or (patient_id = auth.uid() and status = 'issued')
);
create policy "rx_insert" on public.prescriptions for insert to authenticated with check (
  doctor_id = auth.uid()
  and status = 'draft'
  and exists (
    select 1 from conversations c
    where c.id = prescriptions.conversation_id and c.doctor_id = auth.uid() and c.patient_id = prescriptions.patient_id
  )
);
create policy "rx_update" on public.prescriptions for update to authenticated
  using (doctor_id = auth.uid() and status = 'draft')
  with check (doctor_id = auth.uid() and status = 'draft');
create policy "rx_delete" on public.prescriptions for delete to authenticated
  using (doctor_id = auth.uid() and status = 'draft');

create policy "rx_items_select" on public.prescription_items for select to authenticated using (
  exists (select 1 from prescriptions p where p.id = prescription_items.prescription_id)  -- inherits rx_select
);
create policy "rx_items_write" on public.prescription_items for all to authenticated
  using (exists (
    select 1 from prescriptions p
    where p.id = prescription_items.prescription_id and p.doctor_id = auth.uid() and p.status = 'draft'
  ))
  with check (exists (
    select 1 from prescriptions p
    where p.id = prescription_items.prescription_id and p.doctor_id = auth.uid() and p.status = 'draft'
  ));

-- ─────────────────────────────────────────────────────────────
-- Storage: private bucket, files live under <conversation_id>/...
-- ─────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'attachments', 'attachments', false, 10485760,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do nothing;

create policy "attachments_read" on storage.objects for select to authenticated using (
  bucket_id = 'attachments'
  and public.is_member(((storage.foldername(name))[1])::uuid)
);
create policy "attachments_upload" on storage.objects for insert to authenticated with check (
  bucket_id = 'attachments'
  and public.is_member(((storage.foldername(name))[1])::uuid)
);

-- ─────────────────────────────────────────────────────────────
-- Realtime: live chat and inbox updates
-- ─────────────────────────────────────────────────────────────

alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.conversations;

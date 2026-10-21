-- 1. Patient details the doctor records, and blocking.
--    Edited only by the doctor through actions/patients.ts (service role, after checking the doctor
--    shares a conversation with this patient). Patients can read their own row as before.

alter table public.profiles
  add column date_of_birth date,
  add column height_cm numeric(5, 1) check (height_cm is null or height_cm between 30 and 260),
  add column weight_kg numeric(5, 1) check (weight_kg is null or weight_kg between 1 and 400),
  add column blocked_at timestamptz;

create or replace function public.is_blocked()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and blocked_at is not null);
$$;

-- A blocked account can't send messages or upload files, even with a session that is still valid.
drop policy "messages_insert" on public.messages;
create policy "messages_insert" on public.messages for insert to authenticated
  with check (
    sender_id = auth.uid()
    and kind in ('text', 'file')
    and read_at is null
    and public.is_member(conversation_id)
    and not public.is_blocked()
  );

drop policy "attachments_upload" on storage.objects;
create policy "attachments_upload" on storage.objects for insert to authenticated with check (
  bucket_id = 'attachments'
  and public.is_member(((storage.foldername(name))[1])::uuid)
  and not public.is_blocked()
);

-- 2. Master medicine list, per doctor. Never deleted: medicines are deactivated or merged, so
--    nothing that was ever prescribed loses its name. (Issued prescriptions store the text anyway.)

create table public.medicines (
  id            uuid primary key default gen_random_uuid(),
  doctor_id     uuid not null references public.profiles (id) on delete cascade,
  name          text not null check (length(trim(name)) between 2 and 120),
  default_dose  text check (default_dose is null or length(default_dose) <= 60),
  active        boolean not null default true,
  merged_into   uuid references public.medicines (id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint medicine_not_merged_into_self check (merged_into is null or merged_into <> id),
  constraint merged_is_inactive check (merged_into is null or active = false)
);
create unique index medicines_doctor_name_idx on public.medicines (doctor_id, lower(trim(name)));

alter table public.medicines enable row level security;

create policy "medicines_select_own" on public.medicines for select to authenticated
  using (doctor_id = auth.uid());
create policy "medicines_insert_own" on public.medicines for insert to authenticated
  with check (doctor_id = auth.uid() and public.is_doctor());
create policy "medicines_update_own" on public.medicines for update to authenticated
  using (doctor_id = auth.uid()) with check (doctor_id = auth.uid());
-- No delete policy, and no delete grant: rows can't be removed.
revoke delete on public.medicines from authenticated;

-- Start each doctor's list from what they have already prescribed.
insert into public.medicines (doctor_id, name)
select distinct on (p.doctor_id, lower(trim(i.medicine))) p.doctor_id, trim(i.medicine)
from public.prescription_items i
join public.prescriptions p on p.id = i.prescription_id
where length(trim(i.medicine)) >= 2
on conflict do nothing;

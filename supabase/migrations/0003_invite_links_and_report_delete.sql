-- 1. Shareable invite links: the doctor creates a one-time link; the patient opens it and
--    makes their own account (name, email and/or phone, password). No email or code needed.
--    Only the doctor reads or writes links through RLS. The patient's side runs in a server action
--    (actions/patients.ts) that checks the token, so the table is never exposed to anonymous users.

create table public.invite_links (
  id          uuid primary key default gen_random_uuid(),
  token       text not null unique,
  doctor_id   uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default now() + interval '7 days',
  used_at     timestamptz,
  used_by     uuid references public.profiles (id) on delete set null,
  revoked_at  timestamptz
);
create index invite_links_doctor_idx on public.invite_links (doctor_id, created_at desc);

alter table public.invite_links enable row level security;

create policy "invite_links_select_own" on public.invite_links for select to authenticated
  using (doctor_id = auth.uid());
create policy "invite_links_insert_own" on public.invite_links for insert to authenticated
  with check (doctor_id = auth.uid() and public.is_doctor() and used_at is null and revoked_at is null);
-- Doctors may only revoke (set revoked_at); claiming happens server-side with the service role.
create policy "invite_links_update_own" on public.invite_links for update to authenticated
  using (doctor_id = auth.uid()) with check (doctor_id = auth.uid());
revoke update on public.invite_links from authenticated;
grant update (revoked_at) on public.invite_links to authenticated;

-- 2. Doctor can remove a report. The chat keeps a "Report removed" line so the history stays honest;
--    the file itself is deleted from Storage by the server action.

alter table public.messages add column deleted_at timestamptz;

alter table public.messages drop constraint message_has_content;
alter table public.messages add constraint message_has_content check (
  (kind = 'text' and length(trim(coalesce(body, ''))) > 0)
  or (kind = 'file' and (file_path is not null or deleted_at is not null))
  or (kind = 'prescription' and prescription_id is not null)
);

-- Marks the report removed and returns its storage path so the caller can delete the file.
-- Only the doctor of that conversation, only file messages, only once.
create or replace function public.remove_report(msg uuid)
returns text language plpgsql security definer set search_path = public as $$
declare
  path text;
begin
  select m.file_path into path
  from messages m
  join conversations c on c.id = m.conversation_id
  where m.id = msg and m.kind = 'file' and m.deleted_at is null and c.doctor_id = auth.uid();

  if path is null then
    raise exception 'report not found';
  end if;

  update messages
  set deleted_at = now(), file_path = null, file_name = null, file_size = null, file_type = null, body = null
  where id = msg;

  return path;
end;
$$;
revoke execute on function public.remove_report(uuid) from public, anon;
grant execute on function public.remove_report(uuid) to authenticated;

-- The doctor of a conversation may delete files in its folder.
create policy "attachments_delete_doctor" on storage.objects for delete to authenticated using (
  bucket_id = 'attachments'
  and public.is_doctor()
  and public.is_member(((storage.foldername(name))[1])::uuid)
);

-- Shareable invite links: a doctor can make one link that many patients use.
-- Each patient still creates their own account. A multi-use link is never marked used;
-- it stays open until it expires or the doctor cancels it. use_count is how many joined.
-- Claims on these links happen server-side with the service role (actions/patients.ts),
-- so the existing policies are unchanged: doctors insert with used_at null and may only set revoked_at.

alter table public.invite_links
  add column multi_use boolean not null default false,
  add column use_count integer not null default 0 check (use_count >= 0);

-- Only patient links can be shared with many people; doctor links stay one-time.
alter table public.invite_links add constraint invite_link_multi_use_patient_only
  check (not multi_use or role = 'patient');

-- Atomic +1 for the server action (service role only).
create or replace function public.increment_invite_link_use(link_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.invite_links set use_count = use_count + 1 where id = link_id;
$$;
revoke all on function public.increment_invite_link_use(uuid) from public, anon, authenticated;

-- Web push: one row per browser/device that turned notifications on.
-- Users manage only their own rows. Senders never read the table directly:
-- push_targets() returns the OTHER member's devices for a conversation the caller belongs to.

create table public.push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  endpoint    text not null unique,
  p256dh      text not null,
  auth        text not null,
  user_agent  text,
  created_at  timestamptz not null default now()
);
create index push_subscriptions_user_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

create policy "push_select_own" on public.push_subscriptions for select to authenticated
  using (user_id = auth.uid());
create policy "push_insert_own" on public.push_subscriptions for insert to authenticated
  with check (user_id = auth.uid());
create policy "push_update_own" on public.push_subscriptions for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "push_delete_own" on public.push_subscriptions for delete to authenticated
  using (user_id = auth.uid());

-- Devices of the other person in a conversation, plus who they are, so the server can notify them.
-- Keys are useless without the server's VAPID private key, so returning them to a member is safe.
create or replace function public.push_targets(conv uuid)
returns table (endpoint text, p256dh text, auth text, recipient_role text, sender_name text)
language sql stable security definer set search_path = public as $$
  select s.endpoint, s.p256dh, s.auth, r.role, coalesce(nullif(me.full_name, ''), 'CareConnect')
  from conversations c
  join profiles me on me.id = auth.uid()
  join profiles r on r.id = case when c.doctor_id = auth.uid() then c.patient_id else c.doctor_id end
  join push_subscriptions s on s.user_id = r.id
  where c.id = conv and auth.uid() in (c.doctor_id, c.patient_id);
$$;

-- Drop a device the push service says is gone (HTTP 404/410). Endpoints are unguessable URLs,
-- and only members of the conversation can reach this through push_targets().
create or replace function public.prune_push_subscription(ep text)
returns void language sql security definer set search_path = public as $$
  delete from push_subscriptions where endpoint = ep;
$$;

revoke execute on function public.push_targets(uuid) from public, anon;
revoke execute on function public.prune_push_subscription(text) from public, anon;
grant execute on function public.push_targets(uuid) to authenticated;
grant execute on function public.prune_push_subscription(text) to authenticated;

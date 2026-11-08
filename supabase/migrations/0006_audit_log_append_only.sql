-- 0006: audit_log is append-only (2026-11-08).
--
-- The audit log is the record of who did what. Until now the service role could edit
-- or delete rows; test scripts did. This trigger refuses every UPDATE and DELETE on
-- audit_log for everyone, the service role included. INSERT is unchanged, so logAudit()
-- and the audit triggers keep working.
--
-- To clean up on purpose (e.g. before launch), the database owner disables the trigger
-- in the SQL editor, runs the cleanup and enables it again:
--   alter table public.audit_log disable trigger audit_log_append_only;
--   ...
--   alter table public.audit_log enable trigger audit_log_append_only;

-- Note: audit_log.actor_id is "on delete set null". Deleting a profile that has audit rows is
-- therefore refused too, which is intended: accounts are deactivated or blocked, never deleted.

create or replace function public.audit_log_refuse_change()
returns trigger language plpgsql set search_path = public as $$
begin
  raise exception 'audit_log is append-only: rows cannot be changed or deleted';
end;
$$;

drop trigger if exists audit_log_append_only on public.audit_log;
create trigger audit_log_append_only
  before update or delete on public.audit_log
  for each row execute function public.audit_log_refuse_change();

-- TRUNCATE skips row triggers, so refuse it separately.
drop trigger if exists audit_log_no_truncate on public.audit_log;
create trigger audit_log_no_truncate
  before truncate on public.audit_log
  for each statement execute function public.audit_log_refuse_change();

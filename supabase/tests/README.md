# RLS smoke test

Checks that patients only see their own conversation, can't change their role, can't see drafts,
and that issued prescriptions can't be edited, on a throwaway local Postgres (16+).

```
createdb cc_test
psql -d cc_test -f supabase/tests/supabase_stub.sql
psql -d cc_test -f supabase/migrations/0001_init.sql
psql -d cc_test -f supabase/tests/rls_smoke.sql
dropdb cc_test
```

Expected: every `-- expect …` statement errors as described; the rest print counts
(patient sees 1 conversation, 0 drafts, 1 issued prescription; other patient sees 0 messages).
Never run this against your real Supabase project.

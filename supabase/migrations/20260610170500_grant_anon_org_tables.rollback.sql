-- Rollback for 20260610170500_grant_anon_org_tables.sql
-- Keep the SELECT grants if orgs/jobs should stay publicly readable; revoke INSERT (demo).
revoke insert on public.org_jobs  from anon, authenticated;
revoke insert on public.org_posts from anon, authenticated;
-- Uncomment to also remove public read:
-- revoke select on public.orgs     from anon, authenticated;
-- revoke select on public.org_jobs from anon, authenticated;
-- revoke select on public.org_posts from anon, authenticated;

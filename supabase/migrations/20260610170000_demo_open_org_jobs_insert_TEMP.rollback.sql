-- Rollback for 20260610170000_demo_open_org_jobs_insert_TEMP.sql
drop policy if exists "DEMO_org_jobs_insert_open" on public.org_jobs;
drop policy if exists "DEMO_org_posts_insert_open" on public.org_posts;

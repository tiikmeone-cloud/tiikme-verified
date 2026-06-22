-- Rollback for 20260610150000_org_jobs_rich_fields.sql
alter table public.org_jobs drop constraint if exists org_jobs_content_is_object;
alter table public.org_jobs drop column if exists job_function;
alter table public.org_jobs drop column if exists experience_level;
alter table public.org_jobs drop column if exists certs_required;
alter table public.org_jobs drop column if exists content;

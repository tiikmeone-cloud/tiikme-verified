-- Align org_jobs with what the Jobs board actually renders (the Opening shape:
-- function, experience level, certs required, and the Otta-style editorial blocks).
-- Previously the post form captured far less than the Jobs detail view shows.
--
-- job_function    — department/function (Engineering, Design, …)
-- experience_level— seniority band shown on the job
-- certs_required  — certifications the role expects (verified Flex certs match these)
-- content         — editorial blocks: what_involves[], who_you_are[], benefits[], our_take

alter table public.org_jobs
  add column if not exists job_function     text,
  add column if not exists experience_level text,
  add column if not exists certs_required   text[] not null default '{}',
  add column if not exists content          jsonb  not null default '{}'::jsonb;

alter table public.org_jobs
  add constraint org_jobs_content_is_object check (jsonb_typeof(content) = 'object') not valid;

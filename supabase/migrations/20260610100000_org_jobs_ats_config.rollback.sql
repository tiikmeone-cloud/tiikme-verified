-- Rollback for 20260610100000_org_jobs_ats_config.sql
alter table public.org_jobs drop constraint if exists org_jobs_screening_is_array;
alter table public.org_jobs drop constraint if exists org_jobs_scoring_weights_is_object;
alter table public.org_jobs drop constraint if exists org_jobs_pipeline_config_is_object;
alter table public.org_jobs drop column if exists screening;
alter table public.org_jobs drop column if exists scoring_weights;
alter table public.org_jobs drop column if exists pipeline_config;

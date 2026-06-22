-- Stage 3: per-job ATS configuration on org_jobs.
--
-- screening       — array of {q, kind, must_have}; must_have answers are knockouts.
-- scoring_weights — {skill, cert, squad, vector, experience}; how this role ranks
--                   candidates. Should sum to 100 (enforced in the form, not the DB,
--                   so partial drafts are still storable).
-- pipeline_config — {stages[], auto_rules{}}; the ATS stages and automation rules.
--
-- All jsonb with sensible defaults so the 3 existing rows backfill cleanly.

alter table public.org_jobs
  add column if not exists screening       jsonb not null default '[]'::jsonb,
  add column if not exists scoring_weights jsonb not null default
    '{"skill":40,"cert":15,"squad":20,"vector":15,"experience":10}'::jsonb,
  add column if not exists pipeline_config jsonb not null default
    '{"stages":["applied","screening","shortlisted","interview","offer","hired"],"auto_rules":{"auto_reject_on_knockout":true,"auto_shortlist_enabled":false,"auto_shortlist_min_score":80}}'::jsonb;

-- light shape guards (defense in depth; the form is the primary validator)
alter table public.org_jobs
  add constraint org_jobs_screening_is_array       check (jsonb_typeof(screening) = 'array')       not valid,
  add constraint org_jobs_scoring_weights_is_object check (jsonb_typeof(scoring_weights) = 'object') not valid,
  add constraint org_jobs_pipeline_config_is_object check (jsonb_typeof(pipeline_config) = 'object') not valid;

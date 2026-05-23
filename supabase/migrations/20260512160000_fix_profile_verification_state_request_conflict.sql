-- Phase 2 follow-up:
-- materialize_verification_from_request uses ON CONFLICT (request_id), which
-- requires a real unique/exclusion constraint. The original partial unique
-- index is not enough for Postgres to infer a conflict target there.

ALTER TABLE public.profile_verification_state
  DROP CONSTRAINT IF EXISTS profile_verification_state_request_id_key;

ALTER TABLE public.profile_verification_state
  ADD CONSTRAINT profile_verification_state_request_id_key UNIQUE (request_id);

DROP INDEX IF EXISTS public.idx_profile_verification_state_request;

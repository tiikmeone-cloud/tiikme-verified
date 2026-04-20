ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS terms_version text,
  ADD COLUMN IF NOT EXISTS pending_deletion boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deletion_requested_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_profiles_pending_deletion
  ON public.profiles (deletion_requested_at)
  WHERE pending_deletion = true;
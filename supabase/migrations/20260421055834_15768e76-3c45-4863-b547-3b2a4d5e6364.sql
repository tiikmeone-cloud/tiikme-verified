-- 1. Country (Step 3 of new onboarding)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS country text DEFAULT 'India';

-- 2. Filterable years-of-experience bucket for Step 5 (role-aware)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS years_exp text;

-- 3. Make all skippable columns nullable (idempotent — most already are).
--    DROP NOT NULL is a no-op when the column is already nullable.
DO $$
DECLARE
  col text;
  cols text[] := ARRAY[
    'headline','bio','avatar_url','currently_working_at',
    'location_state','location_district','location_city',
    'display_preference','username','years_exp','country',
    'designation','sector','department','institution_name'
  ];
BEGIN
  FOREACH col IN ARRAY cols LOOP
    EXECUTE format('ALTER TABLE public.profiles ALTER COLUMN %I DROP NOT NULL', col);
  END LOOP;
EXCEPTION WHEN undefined_column THEN
  -- ignore columns that don't exist
  NULL;
END $$;

-- 4. Fast username availability check (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_profiles_username_lower
  ON public.profiles (lower(username));

-- 5. Default display_preference for existing rows that have NULL
UPDATE public.profiles
  SET display_preference = 'avatar_name_role'
  WHERE display_preference IS NULL;
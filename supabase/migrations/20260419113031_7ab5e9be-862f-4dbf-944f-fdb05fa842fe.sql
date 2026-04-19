-- Add otw_visibility column to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS otw_visibility text DEFAULT 'recruiters';

-- Add CHECK constraint via separate statement (safe re-run)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_otw_visibility_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_otw_visibility_check
      CHECK (otw_visibility IN ('all','recruiters','hidden'));
  END IF;
END $$;

-- Backfill existing OTW users who haven't picked a visibility
UPDATE public.profiles
   SET otw_visibility = 'recruiters'
 WHERE otw_visibility IS NULL;
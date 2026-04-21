-- ============================================================
-- Onboarding redesign: new 9-role taxonomy + location_district
-- ============================================================
-- 1. Add location_district to profiles for State→District→City cascade
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS location_district text;

-- 2. Replace the old role CHECK constraint with the new 9-role set.
--    Old set: student, professional, government, doctor, faculty, trade, hr, builder, aspirant
--    New set: student, professional, founder, freelancer, creator, doctor, researcher, faculty, investor
--    All 4 existing users are 'professional' (present in both sets) so no data migration needed.
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role = ANY (ARRAY[
    'student'::text,
    'professional'::text,
    'founder'::text,
    'freelancer'::text,
    'creator'::text,
    'doctor'::text,
    'researcher'::text,
    'faculty'::text,
    'investor'::text
  ]));

-- 3. Ensure created_by on organizations is indexed (it already exists per schema check).
--    Used for fast lookup of "orgs I created".
CREATE INDEX IF NOT EXISTS idx_organizations_created_by ON public.organizations(created_by);

-- 4. Auto-add the org creator as the first 'owner' admin via trigger.
--    Replaces the manual "becomes admin" step in the old institution flow.
CREATE OR REPLACE FUNCTION public.org_add_creator_as_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.created_by IS NOT NULL THEN
    INSERT INTO public.org_admins (org_id, user_id, role, invited_by)
    VALUES (NEW.id, NEW.created_by, 'owner', NEW.created_by)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_org_add_creator_as_owner ON public.organizations;
CREATE TRIGGER trg_org_add_creator_as_owner
  AFTER INSERT ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.org_add_creator_as_owner();
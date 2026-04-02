-- Fix 1: Institutions — restrict SELECT to claimant/head only
DROP POLICY IF EXISTS "Institutions readable by authenticated users" ON institutions;
DROP POLICY IF EXISTS "Institutions are publicly readable" ON institutions;

CREATE POLICY "Institution owners can read full details"
  ON institutions FOR SELECT
  TO authenticated
  USING (
    auth.uid() = claimed_by
    OR auth.uid() = head_profile_id
  );

-- Keep the public view accessible for general lookups (no sensitive fields)
-- institutions_public view already exists and excludes phone/email/ids

-- Fix 2: Page trackers — restrict SELECT to own records only
DROP POLICY IF EXISTS "Tracker counts readable" ON page_trackers;

CREATE POLICY "Users view own tracking"
  ON page_trackers FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Add a safe function to get tracker count without exposing user_ids
CREATE OR REPLACE FUNCTION public.get_page_tracker_count(p_page_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer FROM page_trackers WHERE page_id = p_page_id;
$$;

-- Fix 3: Admin dashboard view — ensure no access for non-service-role
REVOKE ALL ON admin_dashboard FROM public;
REVOKE ALL ON admin_dashboard FROM authenticated;
REVOKE ALL ON admin_dashboard FROM anon;
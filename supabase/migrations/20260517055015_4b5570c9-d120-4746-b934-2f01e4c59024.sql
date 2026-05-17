-- 1. Lock down explore_impressions: drop the over-permissive policy, replace with service-role-only.
DROP POLICY IF EXISTS "ei_service_all" ON public.explore_impressions;

CREATE POLICY "ei_service_role_all"
  ON public.explore_impressions
  AS PERMISSIVE
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 2. Require authentication to view org_contacts (contains email/phone/address).
DROP POLICY IF EXISTS "Anyone can view contacts" ON public.org_contacts;

CREATE POLICY "Authenticated users can view org contacts"
  ON public.org_contacts
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (true);

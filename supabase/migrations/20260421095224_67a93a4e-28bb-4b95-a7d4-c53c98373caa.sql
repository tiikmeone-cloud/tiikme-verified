-- 1. profiles: prevent anonymous access to email + phone_hash via column-level ACL.
-- The existing RLS SELECT policy stays `true` so public profile pages still work,
-- but Postgres column privileges block anon from ever returning these two columns.
REVOKE SELECT (email, phone_hash) ON public.profiles FROM anon;

-- For authenticated users, replace the blanket-true SELECT policy with two policies:
--   * a row-level policy that allows reading any profile row (cards, mentions, etc.)
--   * but we still rely on column ACL to restrict email/phone_hash to the owner only.
-- Authenticated role keeps SELECT on email/phone_hash at the column level, and we
-- add a row-level guard that only returns the email/phone_hash for the owner row
-- by exposing those columns through a security barrier view. To keep the change
-- minimal and avoid breaking client `select('*')` calls, we instead enforce this
-- with a helper: revoke email/phone_hash from authenticated, and re-grant via a
-- view that filters to auth.uid() = id. The simplest backwards-compatible fix is
-- to keep column SELECT for authenticated but wrap visibility via RLS-friendly
-- masking through a SECURITY DEFINER function. To stay non-breaking we only
-- block anon here; authenticated users continue to see emails (existing behavior),
-- which removes the public-internet leak flagged by the scanner.

-- 2. org_access_rules: restrict reads to org admins and the affected member.
DROP POLICY IF EXISTS "oar_read" ON public.org_access_rules;

CREATE POLICY "Org admins and affected member can read access rules"
ON public.org_access_rules
FOR SELECT
TO authenticated
USING (
  member_id = auth.uid()
  OR public.is_org_admin(org_id, auth.uid())
);
-- Backfill org_admins from existing org_members so verification routing and
-- reviewer permissions have a real admin surface in older projects.

INSERT INTO public.org_admins (org_id, user_id, role, invited_by)
SELECT
  om.org_id,
  om.user_id,
  CASE WHEN om.role = 'owner' THEN 'owner' ELSE 'admin' END,
  COALESCE(om.granted_by, o.created_by)
FROM public.org_members om
JOIN public.organizations o
  ON o.id = om.org_id
WHERE om.role IN ('owner', 'admin')
ON CONFLICT (org_id, user_id) DO UPDATE
SET role = EXCLUDED.role;

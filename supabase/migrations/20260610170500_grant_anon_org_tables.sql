-- The orgs RLS policy was 'true' but anon/authenticated had NO table-level GRANT,
-- so getOrgIdBySlug and any live org/jobs read silently returned nothing ("Could
-- not resolve this organization").
--
-- SELECT grants on orgs/org_jobs/org_posts are legitimate (public surfaces).
-- INSERT grants are the TEMPORARY demo concession (pair with the DEMO_* insert
-- policies in 20260610170000) and must be revoked when auth + org-admin RLS land.

grant select on public.orgs     to anon, authenticated;
grant select on public.org_jobs to anon, authenticated;
grant select on public.org_posts to anon, authenticated;

grant insert on public.org_jobs  to anon, authenticated;  -- TEMP demo
grant insert on public.org_posts to anon, authenticated;  -- TEMP demo

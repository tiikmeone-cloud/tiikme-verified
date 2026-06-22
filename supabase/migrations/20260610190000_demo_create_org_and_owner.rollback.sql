-- Rollback for 20260610190000_demo_create_org_and_owner.sql
drop policy if exists "DEMO_orgs_insert_open" on public.orgs;
drop policy if exists "DEMO_org_memberships_insert_open" on public.org_memberships;
revoke insert on public.orgs from anon, authenticated;
revoke insert on public.org_memberships from anon, authenticated;
-- (leaves the seeded creative-labs owner membership in place)

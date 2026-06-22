-- TEMPORARY DEMO POLICY — remove when auth lands.
-- Lets the anonymous demo persist a posted role so post -> save -> show in Jobs
-- works without sign-in. INSECURE (anyone with the anon key can insert): MUST be
-- replaced by an org-admin (auth.uid() member of org) insert policy at auth.
-- Tracked alongside the seeded stub orgs (creative-labs, tech-genius, …) which
-- were inserted into public.orgs so getOrgIdBySlug resolves the stub org pages.

create policy "DEMO_org_jobs_insert_open" on public.org_jobs
  for insert to anon, authenticated with check (true);
create policy "DEMO_org_posts_insert_open" on public.org_posts
  for insert to anon, authenticated with check (true);

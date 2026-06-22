-- TEMP demo: let the anon demo create organizations + owner memberships so the
-- "create an organization → become owner → post jobs" flow is demonstrable without
-- auth. Replace with auth (auth.uid() = creator/owner) + real RLS when auth lands.
grant insert on public.orgs to anon, authenticated;
grant select, insert on public.org_memberships to anon, authenticated;

create policy "DEMO_orgs_insert_open" on public.orgs
  for insert to anon, authenticated with check (true);
create policy "DEMO_org_memberships_insert_open" on public.org_memberships
  for insert to anon, authenticated with check (true);

-- Seed: make the demo user (naadhn) the owner of creative-labs for demo continuity
-- so owner-gated posting keeps working on that org.
insert into public.org_memberships (user_id, org_id, role, is_current)
select '0a61f509-2fc6-4d45-8985-bfc1dbb4eade', '24e55077-8106-4c78-bae8-c4e46b73fc80', 'owner', true
where not exists (
  select 1 from public.org_memberships
  where user_id = '0a61f509-2fc6-4d45-8985-bfc1dbb4eade'
    and org_id  = '24e55077-8106-4c78-bae8-c4e46b73fc80'
);

-- SELECT was missing for anon on learn_items/brand_campaigns. After list_learn_items
-- / list_brand_campaigns became SECURITY INVOKER (20260610090200) they read as anon,
-- which had no grant — so Level Up and brand campaigns returned nothing. These are
-- public surfaces, so the SELECT grant is correct.
grant select on public.learn_items     to anon, authenticated;
grant select on public.brand_campaigns to anon, authenticated;

-- TEMPORARY demo inserts (pair with the DEMO_* policies) so the Level Up + brand
-- post forms persist without auth. Replace with provider/org auth + RLS at auth.
grant insert on public.learn_items     to anon, authenticated;
grant insert on public.brand_campaigns to anon, authenticated;

create policy "DEMO_learn_items_insert_open" on public.learn_items
  for insert to anon, authenticated with check (true);
create policy "DEMO_brand_campaigns_insert_open" on public.brand_campaigns
  for insert to anon, authenticated with check (true);

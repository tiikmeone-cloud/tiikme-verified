-- Rollback for 20260610180000_grant_learn_brand_and_demo_insert.sql
drop policy if exists "DEMO_learn_items_insert_open" on public.learn_items;
drop policy if exists "DEMO_brand_campaigns_insert_open" on public.brand_campaigns;
revoke insert on public.learn_items     from anon, authenticated;
revoke insert on public.brand_campaigns from anon, authenticated;
-- keep SELECT grants (public surfaces); uncomment to remove:
-- revoke select on public.learn_items     from anon, authenticated;
-- revoke select on public.brand_campaigns from anon, authenticated;

-- Rollback for 20260610200000_learn_items_brochure_details.sql
alter table public.learn_items drop constraint if exists learn_items_details_is_object;
alter table public.learn_items drop column if exists details;

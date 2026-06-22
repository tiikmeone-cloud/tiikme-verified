-- Rollback for 20260610090200_public_read_rpcs_to_invoker.sql
alter function public.list_learn_items(text, integer)      security definer;
alter function public.list_brand_campaigns(integer)         security definer;
alter function public.popular_custom_values(text, integer, integer) security definer;

-- Convert the 3 intentional public-read RPCs from SECURITY DEFINER to
-- SECURITY INVOKER. Their underlying tables already have anon SELECT RLS
-- (learn_public_read, campaigns_public_read, custom_tax_public_read), so anon
-- reads keep working through RLS instead of definer privilege escalation.
-- Clears the remaining `anon_security_definer_function_executable` advisors.

alter function public.list_learn_items(text, integer)      security invoker;
alter function public.list_brand_campaigns(integer)         security invoker;
alter function public.popular_custom_values(text, integer, integer) security invoker;

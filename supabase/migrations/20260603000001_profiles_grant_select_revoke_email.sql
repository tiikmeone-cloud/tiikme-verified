-- Grant table-level SELECT to anon/authenticated so RLS policies can run.
-- Then revoke email column so neither role can ever read it —
-- any query including email in the column list will get 403.
--
-- Precondition: profiles_anon_public_read policy must exist first.
-- Safe to run multiple times (GRANT/REVOKE are idempotent).

GRANT SELECT ON public.profiles TO anon, authenticated;
REVOKE SELECT (email) ON public.profiles FROM anon, authenticated;

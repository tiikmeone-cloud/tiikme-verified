-- Auth foundation (Phase 1). Authenticated users create/update their own profile
-- row (id = auth.uid()) on first login via ensureProfile(). profiles already has
-- the profiles_self_write RLS policy (auth.uid() = id); this adds the table grant.
grant insert, update on public.profiles to authenticated;

-- NOTE: a confirmed demo auth user (demo@tiikme.com / tiikme1234) was seeded
-- directly into auth.users + auth.identities for verifiable password login in dev
-- (not included here — environment-specific). When inserting auth.users by hand,
-- the GoTrue string token columns (confirmation_token, recovery_token,
-- email_change*, reauthentication_token, phone_change*) must be '' not NULL, or
-- sign-in fails with "Database error querying schema".

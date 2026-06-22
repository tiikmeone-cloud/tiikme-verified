-- Migration: Allow anonymous users to read public profiles
-- Project: fpyprwenlqpuspskewgq  |  tiikme-verified
--
-- Context:
--   The existing profiles_select_public policy requires auth.uid() IS NOT NULL,
--   which blocks unauthenticated visitors from seeing any profile at all.
--   This migration adds a targeted anon policy limited to is_public=true rows.
--
-- Security notes:
--   • email column SELECT is already revoked for anon and authenticated roles
--     at the column-privilege level — no additional action needed here.
--   • All application queries must use an explicit column list (PROFILE_COLUMNS
--     in src/lib/types.ts) that excludes email. This policy does NOT override
--     column-level privileges.
--
-- Safe to run multiple times (idempotent via DROP IF EXISTS).

DROP POLICY IF EXISTS profiles_anon_public_read ON public.profiles;

CREATE POLICY profiles_anon_public_read
  ON public.profiles
  FOR SELECT
  TO anon
  USING (is_public = true);

-- Rollback:
-- DROP POLICY IF EXISTS profiles_anon_public_read ON public.profiles;

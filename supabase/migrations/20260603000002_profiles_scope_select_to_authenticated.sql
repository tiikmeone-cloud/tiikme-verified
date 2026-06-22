-- The previous profiles_select_public policy applied to ALL roles including anon.
-- It calls are_users_connected() which anon cannot execute → permission denied.
-- Scope it to authenticated only; anon read is handled by profiles_anon_public_read.
--
-- Safe to run multiple times (DROP IF EXISTS + CREATE).

DROP POLICY IF EXISTS profiles_select_public ON public.profiles;

CREATE POLICY profiles_select_public
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) = id
    OR (
      (SELECT auth.uid()) IS NOT NULL
      AND COALESCE(((privacy ->> 'show_in_explore')::boolean), true) = true
    )
    OR are_users_connected((SELECT auth.uid()), id)
  );

-- Rollback:
-- DROP POLICY IF EXISTS profiles_select_public ON public.profiles;
-- CREATE POLICY profiles_select_public ON public.profiles FOR SELECT
--   USING ((auth.uid() = id) OR ((auth.uid() IS NOT NULL) AND (COALESCE(((privacy->>'show_in_explore')::boolean), true) = true)) OR are_users_connected(auth.uid(), id));

DROP POLICY IF EXISTS "profiles_read" ON public.profiles;

DROP POLICY IF EXISTS "profiles_select_public" ON public.profiles;

CREATE POLICY "profiles_select_public"
ON public.profiles
FOR SELECT
TO public
USING (
  auth.uid() = id
  OR (
    auth.uid() IS NOT NULL
    AND COALESCE((privacy ->> 'show_in_explore')::boolean, true) = true
  )
  OR are_users_connected(auth.uid(), id)
);
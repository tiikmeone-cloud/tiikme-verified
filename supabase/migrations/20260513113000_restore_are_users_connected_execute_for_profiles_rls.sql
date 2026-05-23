-- Restore authenticated execution on the profiles RLS helper that is still
-- used by active client profile reads during auth bootstrap.
DO $$
BEGIN
  IF to_regprocedure('public.are_users_connected(uuid,uuid)') IS NOT NULL THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.are_users_connected(uuid, uuid) FROM PUBLIC, anon';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.are_users_connected(uuid, uuid) TO authenticated';
  END IF;
END;
$$;

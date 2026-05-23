-- Allow authenticated sessions to invoke the guard helper from triggers.
-- The helper itself only returns true for service-role/internal contexts, so
-- granting EXECUTE does not widen trust-write privileges; it only lets
-- authenticated inserts/updates reach the guard logic safely.
GRANT EXECUTE ON FUNCTION public.verification_internal_write_allowed() TO authenticated;

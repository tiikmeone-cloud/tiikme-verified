
-- 1. Restrict profiles.email and profiles.phone to the owner only.
-- Revoke column-level SELECT for anon/authenticated; owners read via RPC below.
REVOKE SELECT (email, phone) ON public.profiles FROM anon, authenticated;

-- Owner-only helper to read own contact details.
CREATE OR REPLACE FUNCTION public.get_my_contact()
RETURNS TABLE (email text, phone text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.email, p.phone
  FROM public.profiles p
  WHERE p.id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.get_my_contact() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_contact() TO authenticated;

-- 2. open_to_work_profiles: require auth to read
DROP POLICY IF EXISTS "Anyone can view active OTW profiles" ON public.open_to_work_profiles;
CREATE POLICY "Authenticated users can view OTW profiles"
ON public.open_to_work_profiles
FOR SELECT
TO authenticated
USING (true);

-- 3. org_admins: require auth to read
DROP POLICY IF EXISTS "admins visible" ON public.org_admins;
CREATE POLICY "Authenticated users can view org admins"
ON public.org_admins
FOR SELECT
TO authenticated
USING (true);

-- 4. cover-images: allow owner DELETE
CREATE POLICY "Users delete own covers"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'cover-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

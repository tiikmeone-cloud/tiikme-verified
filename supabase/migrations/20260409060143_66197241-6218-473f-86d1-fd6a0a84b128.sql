
-- 1. PROFILES: Enable RLS (it's currently OFF despite policies existing)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Attach the existing prevent_role_escalation function as a trigger
DROP TRIGGER IF EXISTS block_role_change ON public.profiles;
CREATE TRIGGER block_role_change
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_escalation();

-- Remove duplicate INSERT policy
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- 2. POWER TRANSACTIONS: Remove user INSERT policy to prevent self-crediting
DROP POLICY IF EXISTS "Users insert own transactions" ON public.power_transactions;

-- 3. PAGE ADMINS: Replace open SELECT with scoped policy
DROP POLICY IF EXISTS "Page admins viewable by members" ON public.page_admins;

CREATE POLICY "Page admins visible to involved users"
  ON public.page_admins FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.page_trackers pt
      WHERE pt.page_id = page_admins.page_id
        AND pt.user_id = auth.uid()
    )
  );

-- 4. WORK-ASSETS STORAGE: Drop overly broad read policies
DROP POLICY IF EXISTS "Public read work assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users read work assets" ON storage.objects;

-- Add scoped read policy: users can read their own files or public work item files
CREATE POLICY "Read own work assets"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'work-assets'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Remove sensitive per-user/private tables from the shared Supabase Realtime publication.
-- This prevents users from subscribing to broad realtime row-change streams for private data.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'pings') THEN
      ALTER PUBLICATION supabase_realtime DROP TABLE public.pings;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications') THEN
      ALTER PUBLICATION supabase_realtime DROP TABLE public.notifications;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'opportunity_applications') THEN
      ALTER PUBLICATION supabase_realtime DROP TABLE public.opportunity_applications;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'verifications') THEN
      ALTER PUBLICATION supabase_realtime DROP TABLE public.verifications;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'verification_requests') THEN
      ALTER PUBLICATION supabase_realtime DROP TABLE public.verification_requests;
    END IF;
  END IF;
END $$;

-- Keep public institution discovery on a non-sensitive projection only.
CREATE OR REPLACE VIEW public.institutions_public
WITH (security_invoker = true)
AS
SELECT
  id,
  name,
  type,
  city,
  district,
  state,
  pincode,
  founded_year,
  is_verified,
  member_count,
  official_website,
  parent_institution_id,
  head_profile_id,
  created_at
FROM public.institutions;

REVOKE ALL ON public.institutions FROM anon, authenticated;
GRANT SELECT ON public.institutions_public TO anon, authenticated;
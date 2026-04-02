
-- ═══ SECTION 1: Security fixes ═══

-- FIX 1: Prevent self-role-escalation via trigger
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND auth.uid() = NEW.id THEN
    NEW.role := OLD.role;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS check_role_escalation ON profiles;
CREATE TRIGGER check_role_escalation
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_role_escalation();

-- FIX 2: Ensure work-assets bucket is private (already private per config)
-- Storage RLS for work-assets authenticated read
DROP POLICY IF EXISTS "Authenticated users read work assets" ON storage.objects;
CREATE POLICY "Authenticated users read work assets"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'work-assets');

-- FIX 3: Scope ping PDFs to sender/conversation participants
DROP POLICY IF EXISTS "Users can access their own ping PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Ping PDF access for participants" ON storage.objects;
CREATE POLICY "Ping PDF access for participants"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'pings-pdfs' AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM conversations c
      WHERE (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
        AND c.id::text = (storage.foldername(name))[2]
    )
  )
);

-- ═══ SECTION 3: post_reactions table ═══
CREATE TABLE IF NOT EXISTS public.post_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type text NOT NULL CHECK (reaction_type IN ('insightful', 'useful', 'inspiring')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own reactions"
ON post_reactions FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Reactions are publicly readable"
ON post_reactions FOR SELECT
TO public
USING (true);

-- ═══ SECTION 4: post_comments table ═══
CREATE TABLE IF NOT EXISTS public.post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  parent_id uuid REFERENCES post_comments(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments are publicly readable"
ON post_comments FOR SELECT
TO public
USING (true);

CREATE POLICY "Users manage own comments"
ON post_comments FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ═══ SECTION 9: opportunity_applications table ═══
CREATE TABLE IF NOT EXISTS public.opportunity_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  applicant_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cover_note text,
  work_items_attached uuid[] DEFAULT '{}',
  status text DEFAULT 'applied',
  created_at timestamptz DEFAULT now(),
  UNIQUE(opportunity_id, applicant_id)
);

ALTER TABLE public.opportunity_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Applicants manage own applications"
ON opportunity_applications FOR ALL
TO authenticated
USING (auth.uid() = applicant_id)
WITH CHECK (auth.uid() = applicant_id);

CREATE POLICY "Posters see applications"
ON opportunity_applications FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM opportunities
    WHERE opportunities.id = opportunity_applications.opportunity_id
    AND opportunities.poster_id = auth.uid()
  )
);

-- ═══ Add post images column ═══
ALTER TABLE posts ADD COLUMN IF NOT EXISTS image_urls text[] DEFAULT '{}';

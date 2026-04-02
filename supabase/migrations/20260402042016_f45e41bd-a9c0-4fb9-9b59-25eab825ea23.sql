
-- 1. Admin dashboard: enable RLS (no policies = service_role only)
ALTER VIEW admin_dashboard SET (security_invoker = true);

-- 2. Posts: replace permissive SELECT with visibility-aware policy
DROP POLICY IF EXISTS "Posts are publicly readable" ON posts;

CREATE POLICY "Posts visible by visibility"
  ON posts FOR SELECT
  USING (
    visibility = 'everyone'
    OR auth.uid() = author_id
  );

-- 3. Institutions: replace open INSERT with authenticated-only
DROP POLICY IF EXISTS "Authenticated users can insert institutions" ON institutions;

CREATE POLICY "Authenticated users can insert institutions"
  ON institutions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- 4. Institutions: create a safe public view excluding sensitive fields
CREATE OR REPLACE VIEW public.institutions_public AS
SELECT id, name, type, city, district, state, pincode, founded_year, 
       is_verified, member_count, official_website, parent_institution_id, 
       head_profile_id, created_at
FROM institutions;

-- 5. Pings-pdfs: allow recipients to read PDFs sent to them
CREATE POLICY "Recipients can read ping PDFs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'pings-pdfs'
    AND EXISTS (
      SELECT 1 FROM pings p
      JOIN conversations c ON c.id = p.conversation_id
      WHERE p.pdf_url LIKE '%' || name || '%'
        AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
    )
  );

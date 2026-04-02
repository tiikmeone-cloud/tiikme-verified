-- Fix 1: Restrict institutions SELECT to authenticated users only
-- The institutions_public view already provides safe public access
DROP POLICY IF EXISTS "Institutions are publicly readable" ON institutions;

CREATE POLICY "Institutions readable by authenticated users"
  ON institutions FOR SELECT
  TO authenticated
  USING (true);

-- Fix 2: Replace loose LIKE pattern in pings-pdfs storage policy with exact match
DROP POLICY IF EXISTS "Recipients can read ping PDFs" ON storage.objects;

CREATE POLICY "Recipients can read ping PDFs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'pings-pdfs'
    AND EXISTS (
      SELECT 1 FROM pings p
      JOIN conversations c ON c.id = p.conversation_id
      WHERE p.pdf_url = bucket_id || '/' || name
        AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
    )
  );
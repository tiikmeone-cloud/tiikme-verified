-- Create private storage bucket for verification documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('verification-docs', 'verification-docs', false)
ON CONFLICT (id) DO NOTHING;

-- RLS for verification-docs bucket
DROP POLICY IF EXISTS "vd_owner_read" ON storage.objects;
DROP POLICY IF EXISTS "vd_owner_upload" ON storage.objects;
DROP POLICY IF EXISTS "vd_admin_read" ON storage.objects;

CREATE POLICY "vd_owner_upload" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'verification-docs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "vd_owner_read" ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'verification-docs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Org admins / assigned reviewers can read all verification docs
CREATE POLICY "vd_admin_read" ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'verification-docs'
  AND EXISTS (
    SELECT 1 FROM public.verification_requests vr
    WHERE vr.document_url LIKE '%' || storage.objects.name
      AND (
        vr.assigned_to = auth.uid()
        OR public.is_org_admin(vr.org_id, auth.uid())
        OR public.is_org_admin(vr.entity_id, auth.uid())
      )
  )
);
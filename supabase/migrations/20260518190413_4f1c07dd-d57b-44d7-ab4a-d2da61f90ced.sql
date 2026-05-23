
DROP POLICY IF EXISTS "owner adds admin" ON public.org_admins;
CREATE POLICY "owner adds admin" ON public.org_admins
  FOR INSERT TO authenticated
  WITH CHECK (is_org_admin(org_id, auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can view org contacts" ON public.org_contacts;

DROP POLICY IF EXISTS "Authenticated users can insert institutions" ON public.institutions;
CREATE POLICY "Authenticated users can insert institutions" ON public.institutions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL AND claimed_by = auth.uid());

DROP POLICY IF EXISTS "admin reads invites" ON public.org_admin_invites;
CREATE POLICY "admin reads invites" ON public.org_admin_invites
  FOR SELECT TO authenticated
  USING (
    is_org_admin(org_id, auth.uid())
    OR lower(invited_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

DROP POLICY IF EXISTS "invitee or admin updates invite" ON public.org_admin_invites;
CREATE POLICY "invitee or admin updates invite" ON public.org_admin_invites
  FOR UPDATE TO authenticated
  USING (
    is_org_admin(org_id, auth.uid())
    OR lower(invited_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
  WITH CHECK (
    is_org_admin(org_id, auth.uid())
    OR lower(invited_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

DROP POLICY IF EXISTS "ha_read" ON public.hiring_assessments;
CREATE POLICY "ha_read" ON public.hiring_assessments
  FOR SELECT TO authenticated
  USING (
    is_org_admin_m5(org_id, auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.org_access_rules r
      WHERE r.org_id = hiring_assessments.org_id
        AND r.member_id = auth.uid()
        AND r.access_type IN ('post_jobs','issue_certificates')
    )
    OR EXISTS (
      SELECT 1 FROM public.opportunity_applications oa
      JOIN public.opportunities o ON o.id = oa.opportunity_id
      WHERE oa.applicant_id = auth.uid()
        AND o.assessment_id = hiring_assessments.id
    )
  );

DROP POLICY IF EXISTS "Auth upload org assets" ON storage.objects;
CREATE POLICY "Auth upload org assets" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'org-assets'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "ol_upload" ON storage.objects;
CREATE POLICY "ol_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'org-logos'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "pa_upload" ON storage.objects;
CREATE POLICY "pa_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'profile-avatars'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "cert_storage_write" ON storage.objects;
CREATE POLICY "cert_storage_write" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'certificates'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "obs_frontend_errors_insert_own" ON public.obs_frontend_errors;
CREATE POLICY "obs_frontend_errors_insert_own" ON public.obs_frontend_errors
  FOR INSERT TO authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

DROP POLICY IF EXISTS "obs_rpc_logs_insert_own" ON public.obs_rpc_logs;
CREATE POLICY "obs_rpc_logs_insert_own" ON public.obs_rpc_logs
  FOR INSERT TO authenticated
  WITH CHECK (caller_id IS NULL OR caller_id = auth.uid());

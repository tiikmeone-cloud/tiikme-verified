-- Harden Tiikme's trust-critical surfaces:
-- 1. New organizations must not become verified without review.
-- 2. Trigger-only helper functions should not be executable directly by clients.
-- 3. Message and verification attachments should use private storage controls.
-- 4. Organization update RLS should reference the target organization correctly.

CREATE OR REPLACE FUNCTION public.auto_verify_new_org()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.is_verified := false;
  NEW.verification_type := COALESCE(NEW.verification_type, 'pending_review');
  RETURN NEW;
END;
$function$;

COMMENT ON FUNCTION public.auto_verify_new_org() IS
  'Initializes new organization claims as pending review; does not verify them automatically.';

REVOKE EXECUTE ON FUNCTION public.auto_verify_new_org() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.block_reserved_usernames() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.circle_posts_bump_upvotes() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.circles_bump_member_count() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.circles_member_count_sync() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.circles_post_count_sync() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.limit_upvote_manipulation() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.on_verification_approved() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.org_add_creator_as_owner() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_role_escalation() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_circle_post_comment_count() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_email_from_auth() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_all_activity_scores() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_all_activity_scores_v2() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_user_level() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_expire_opportunities() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.refresh_circle_post_hot() FROM anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.are_users_connected(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.award_power(uuid, integer, text, uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.calculate_activity_score(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.calculate_activity_score_v2(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.calculate_circle_post_hot_score(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.can_message_user(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.detect_duplicate_post() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_page_tracker_count(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_list(integer, integer, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_days_active(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.increment_score(uuid, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_moderator(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_org_admin(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.match_opportunities_for_user(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.rank_explore_pages(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.resolve_verification_assignee(uuid, text) FROM anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM anon, authenticated;

UPDATE storage.buckets
SET public = false,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY[
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ]::text[]
WHERE id = 'message-attachments';

UPDATE storage.buckets
SET public = false,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY[
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp'
    ]::text[]
WHERE id = 'verification-docs';

UPDATE storage.buckets
SET allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
WHERE id IN ('org-assets', 'org-logos');

UPDATE public.organizations o
SET is_verified = false,
    verification_type = 'pending_review'
WHERE o.is_verified = true
  AND COALESCE(o.verification_type, 'auto') = 'auto'
  AND NOT EXISTS (
    SELECT 1
    FROM public.verification_requests vr
    WHERE vr.entity_type = 'organization'
      AND vr.entity_id = o.id
      AND vr.status = 'approved'
  );

DROP POLICY IF EXISTS "Auth users create orgs" ON public.organizations;
DROP POLICY IF EXISTS "Anyone can view orgs" ON public.organizations;
DROP POLICY IF EXISTS "Org admins can update" ON public.organizations;
DROP POLICY IF EXISTS "org_insert" ON public.organizations;
DROP POLICY IF EXISTS "org_read" ON public.organizations;
DROP POLICY IF EXISTS "org_update" ON public.organizations;

CREATE POLICY "org_read"
ON public.organizations
FOR SELECT
USING (true);

CREATE POLICY "org_insert"
ON public.organizations
FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "org_update"
ON public.organizations
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.org_members
    WHERE org_members.org_id = organizations.id
      AND org_members.user_id = auth.uid()
      AND org_members.role = ANY (ARRAY['owner'::text, 'admin'::text])
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.org_members
    WHERE org_members.org_id = organizations.id
      AND org_members.user_id = auth.uid()
      AND org_members.role = ANY (ARRAY['owner'::text, 'admin'::text])
  )
);

DROP POLICY IF EXISTS "Anyone can view members" ON public.org_members;
DROP POLICY IF EXISTS "Users or admins insert members" ON public.org_members;
DROP POLICY IF EXISTS "Admins update members" ON public.org_members;
DROP POLICY IF EXISTS "Admins delete members" ON public.org_members;
DROP POLICY IF EXISTS "om_read" ON public.org_members;
DROP POLICY IF EXISTS "om_insert" ON public.org_members;

CREATE POLICY "om_read"
ON public.org_members
FOR SELECT
USING (true);

CREATE POLICY "om_insert_admin_or_creator"
ON public.org_members
FOR INSERT
WITH CHECK (
  (
    auth.uid() = user_id
    AND role = 'owner'
    AND COALESCE(is_verified, false) = true
    AND EXISTS (
      SELECT 1
      FROM public.organizations o
      WHERE o.id = org_members.org_id
        AND o.created_by = auth.uid()
    )
  )
  OR EXISTS (
    SELECT 1
    FROM public.org_members m
    WHERE m.org_id = org_members.org_id
      AND m.user_id = auth.uid()
      AND m.role = ANY (ARRAY['owner'::text, 'admin'::text])
  )
);

CREATE POLICY "om_update_admins"
ON public.org_members
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.org_members m
    WHERE m.org_id = org_members.org_id
      AND m.user_id = auth.uid()
      AND m.role = ANY (ARRAY['owner'::text, 'admin'::text])
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.org_members m
    WHERE m.org_id = org_members.org_id
      AND m.user_id = auth.uid()
      AND m.role = ANY (ARRAY['owner'::text, 'admin'::text])
  )
);

CREATE POLICY "om_delete_admins_or_self"
ON public.org_members
FOR DELETE
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1
    FROM public.org_members m
    WHERE m.org_id = org_members.org_id
      AND m.user_id = auth.uid()
      AND m.role = ANY (ARRAY['owner'::text, 'admin'::text])
  )
);

DROP POLICY IF EXISTS "Org admins update verification requests" ON public.verification_requests;
DROP POLICY IF EXISTS "Org admins view org verification requests" ON public.verification_requests;
DROP POLICY IF EXISTS "Requesters view own verification requests" ON public.verification_requests;
DROP POLICY IF EXISTS "Users create own verification requests" ON public.verification_requests;
DROP POLICY IF EXISTS "admins resolve" ON public.verification_requests;
DROP POLICY IF EXISTS "requester creates" ON public.verification_requests;
DROP POLICY IF EXISTS "requester or admin reads" ON public.verification_requests;
DROP POLICY IF EXISTS "requester updates own" ON public.verification_requests;
DROP POLICY IF EXISTS "verif_req_insert_self" ON public.verification_requests;
DROP POLICY IF EXISTS "verif_req_select_involved" ON public.verification_requests;
DROP POLICY IF EXISTS "verif_req_update_assignee_or_admin" ON public.verification_requests;
DROP POLICY IF EXISTS "vr_assigned_read" ON public.verification_requests;
DROP POLICY IF EXISTS "vr_assigned_update" ON public.verification_requests;

CREATE POLICY "verif_req_insert_self"
ON public.verification_requests
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = requester_id
  AND COALESCE(status, 'pending') = 'pending'
  AND reviewed_by IS NULL
  AND resolved_at IS NULL
);

CREATE POLICY "verif_req_select_involved"
ON public.verification_requests
FOR SELECT
TO authenticated
USING (
  auth.uid() = requester_id
  OR auth.uid() = assigned_to
  OR auth.uid() = reviewed_by
  OR (
    org_id IS NOT NULL
    AND public.is_org_admin(org_id, auth.uid())
  )
);

CREATE POLICY "verif_req_update_reviewers"
ON public.verification_requests
FOR UPDATE
TO authenticated
USING (
  auth.uid() = assigned_to
  OR (
    org_id IS NOT NULL
    AND public.is_org_admin(org_id, auth.uid())
  )
)
WITH CHECK (
  auth.uid() = assigned_to
  OR (
    org_id IS NOT NULL
    AND public.is_org_admin(org_id, auth.uid())
  )
);

DROP POLICY IF EXISTS "Auth upload message attachments" ON storage.objects;
DROP POLICY IF EXISTS "resume_storage_read" ON storage.objects;
DROP POLICY IF EXISTS "resume_storage_write" ON storage.objects;

CREATE POLICY "message_attachments_owner_upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'message-attachments'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);

CREATE POLICY "message_attachments_owner_read"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'message-attachments'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);

CREATE POLICY "message_attachments_ping_participants_read"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'message-attachments'
  AND EXISTS (
    SELECT 1
    FROM public.pings p
    JOIN public.conversations c ON c.id = p.conversation_id
    WHERE p.attachment_url = objects.name
      AND (
        c.participant_1 = auth.uid()
        OR c.participant_2 = auth.uid()
      )
  )
);

CREATE POLICY "message_attachments_workspace_members_read"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'message-attachments'
  AND EXISTS (
    SELECT 1
    FROM public.workspace_messages wm
    JOIN public.workspace_channels wc ON wc.id = wm.channel_id
    JOIN public.workspace_members mem ON mem.workspace_id = wc.workspace_id
    WHERE wm.attachment_url = objects.name
      AND mem.user_id = auth.uid()
      AND COALESCE(mem.status, 'active') = 'active'
      AND COALESCE(mem.invitation_status, 'accepted') = 'accepted'
  )
);

CREATE POLICY "resume_owner_upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'resumes'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);

CREATE POLICY "resume_owner_read"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'resumes'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);

CREATE POLICY "resume_hiring_team_read"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'resumes'
  AND EXISTS (
    SELECT 1
    FROM public.opportunity_applications oa
    JOIN public.opportunities o ON o.id = oa.opportunity_id
    LEFT JOIN public.org_members om
      ON om.org_id = o.org_id
      AND om.user_id = auth.uid()
      AND om.role = ANY (ARRAY['owner'::text, 'admin'::text])
    WHERE oa.resume_url = objects.name
      AND (
        oa.applicant_id = auth.uid()
        OR o.poster_id = auth.uid()
        OR om.user_id IS NOT NULL
      )
  )
);

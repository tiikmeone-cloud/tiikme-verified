-- Add a safe platform-review fallback and move review actions behind server-
-- controlled RPCs. Requests remain in pending status; review_queue indicates
-- whether the next reviewer is an org admin or a platform reviewer.

ALTER TABLE public.verification_requests
  ADD COLUMN IF NOT EXISTS review_queue text NOT NULL DEFAULT 'org_admin';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'verification_requests_review_queue_check'
  ) THEN
    ALTER TABLE public.verification_requests
      ADD CONSTRAINT verification_requests_review_queue_check
      CHECK (review_queue IN ('org_admin', 'platform'));
  END IF;
END;
$$;

-- Existing unresolved requests with no assignee are effectively waiting for
-- platform review now that self-assignment is blocked.
UPDATE public.verification_requests
SET review_queue = CASE
  WHEN assigned_to IS NULL THEN 'platform'
  ELSE 'org_admin'
END
WHERE review_queue IS NULL
   OR (
     COALESCE(status, 'pending') IN ('pending', 'more_info_requested')
     AND assigned_to IS NULL
   );

-- Internal helper: platform reviewers are moderators today.
CREATE OR REPLACE FUNCTION public.is_platform_verification_reviewer(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT COALESCE((
    SELECT p.is_moderator
    FROM public.profiles p
    WHERE p.id = _user_id
  ), false);
$function$;

-- Review permission becomes queue-aware:
-- - org_admin queue uses the existing org routing model
-- - platform queue is handled by moderators only
CREATE OR REPLACE FUNCTION public.user_can_review_verification_request(_request_id uuid, _actor uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_org_id uuid;
  v_role_category text;
  v_requester_id uuid;
  v_assigned_to uuid;
  v_review_queue text;
  v_exact_route uuid;
  v_default_route uuid;
  v_route_count integer := 0;
BEGIN
  IF _actor IS NULL THEN
    RETURN false;
  END IF;

  SELECT org_id, role_category, requester_id, assigned_to, review_queue
  INTO v_org_id, v_role_category, v_requester_id, v_assigned_to, v_review_queue
  FROM public.verification_requests
  WHERE id = _request_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF v_requester_id = _actor THEN
    RETURN false;
  END IF;

  IF COALESCE(v_review_queue, 'org_admin') = 'platform' THEN
    RETURN public.is_platform_verification_reviewer(_actor);
  END IF;

  IF v_assigned_to = _actor THEN
    RETURN true;
  END IF;

  IF v_org_id IS NULL OR NOT public.is_org_admin(v_org_id, _actor) THEN
    RETURN false;
  END IF;

  SELECT COUNT(*)
  INTO v_route_count
  FROM public.org_verif_routes
  WHERE org_id = v_org_id;

  IF v_route_count = 0 THEN
    RETURN true;
  END IF;

  SELECT assigned_to_user_id
  INTO v_exact_route
  FROM public.org_verif_routes
  WHERE org_id = v_org_id
    AND role_category = COALESCE(v_role_category, 'default')
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_exact_route IS NOT NULL THEN
    RETURN v_exact_route = _actor;
  END IF;

  SELECT assigned_to_user_id
  INTO v_default_route
  FROM public.org_verif_routes
  WHERE org_id = v_org_id
    AND role_category = 'default'
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_default_route IS NOT NULL THEN
    RETURN v_default_route = _actor;
  END IF;

  RETURN true;
END;
$function$;

-- Keep the queue server-managed. Request creation decides the initial queue;
-- later changes should happen only through trusted backend flows.
CREATE OR REPLACE FUNCTION public.guard_verification_request_transition()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_actor uuid := auth.uid();
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF v_actor IS NULL OR NEW.requester_id <> v_actor THEN
      RAISE EXCEPTION 'Only the requester can create a verification request';
    END IF;

    NEW.requested_verification_type := COALESCE(
      NEW.requested_verification_type,
      public.derive_requested_verification_type(NEW.entity_type, NEW.org_id)
    );
    NEW.status := COALESCE(NEW.status, 'pending');
    NEW.review_queue := COALESCE(
      NULLIF(NEW.review_queue, ''),
      CASE WHEN NEW.assigned_to IS NULL THEN 'platform' ELSE 'org_admin' END
    );

    IF NEW.status <> 'pending' THEN
      RAISE EXCEPTION 'New verification requests must start in pending status';
    END IF;

    IF NEW.review_queue = 'platform' THEN
      NEW.assigned_to := NULL;
    END IF;

    NEW.reviewed_by := NULL;
    NEW.resolved_at := NULL;
    RETURN NEW;
  END IF;

  NEW.requested_verification_type := COALESCE(
    NEW.requested_verification_type,
    OLD.requested_verification_type,
    public.derive_requested_verification_type(OLD.entity_type, OLD.org_id)
  );
  NEW.review_queue := COALESCE(NULLIF(NEW.review_queue, ''), OLD.review_queue, 'org_admin');

  IF NEW.requester_id IS DISTINCT FROM OLD.requester_id
    OR NEW.org_id IS DISTINCT FROM OLD.org_id
    OR NEW.entity_type IS DISTINCT FROM OLD.entity_type
    OR NEW.entity_id IS DISTINCT FROM OLD.entity_id
    OR NEW.item_id IS DISTINCT FROM OLD.item_id
    OR NEW.item_type IS DISTINCT FROM OLD.item_type
    OR (
      OLD.requested_verification_type IS NOT NULL
      AND NEW.requested_verification_type IS DISTINCT FROM OLD.requested_verification_type
    )
  THEN
    RAISE EXCEPTION 'Verification request identity fields are immutable';
  END IF;

  IF NEW.review_queue IS DISTINCT FROM OLD.review_queue THEN
    IF NOT public.verification_internal_write_allowed() THEN
      RAISE EXCEPTION 'Review queue is system-managed';
    END IF;
  END IF;

  IF NEW.assigned_to IS DISTINCT FROM OLD.assigned_to THEN
    IF v_actor IS NULL OR OLD.org_id IS NULL OR NOT public.is_org_admin(OLD.org_id, v_actor) THEN
      RAISE EXCEPTION 'Only organization admins can reassign verification requests';
    END IF;
  END IF;

  IF NEW.document_url IS DISTINCT FROM OLD.document_url
    OR NEW.document_type IS DISTINCT FROM OLD.document_type
    OR NEW.context_note IS DISTINCT FROM OLD.context_note
  THEN
    IF v_actor IS NULL OR v_actor <> OLD.requester_id THEN
      RAISE EXCEPTION 'Only the requester can edit submitted verification evidence or notes';
    END IF;

    IF COALESCE(OLD.status, 'pending') NOT IN ('pending', 'more_info_requested') THEN
      RAISE EXCEPTION 'Submitted evidence can only be edited while a request is pending or awaiting more information';
    END IF;
  END IF;

  IF NEW.requested_doc_message IS DISTINCT FROM OLD.requested_doc_message
    OR NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason
    OR NEW.review_note IS DISTINCT FROM OLD.review_note
  THEN
    IF v_actor IS NULL OR NOT public.user_can_review_verification_request(OLD.id, v_actor) THEN
      RAISE EXCEPTION 'Only the active reviewer can change review notes or decisions';
    END IF;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status IN ('approved', 'rejected', 'more_info_requested', 'expired') THEN
      IF v_actor IS NULL OR NOT public.user_can_review_verification_request(OLD.id, v_actor) THEN
        RAISE EXCEPTION 'You do not have permission to review this verification request';
      END IF;

      IF v_actor = OLD.requester_id THEN
        RAISE EXCEPTION 'Requesters cannot review their own verification requests';
      END IF;
    ELSIF NEW.status = 'pending' AND OLD.status = 'more_info_requested' THEN
      IF v_actor IS NULL OR v_actor <> OLD.requester_id THEN
        RAISE EXCEPTION 'Only the requester can resubmit after more info is requested';
      END IF;
      NEW.reviewed_by := OLD.reviewed_by;
      NEW.resolved_at := NULL;
    ELSE
      RAISE EXCEPTION 'Unsupported verification status transition from % to %', OLD.status, NEW.status;
    END IF;
  END IF;

  IF NEW.status = 'approved' THEN
    NEW.reviewed_by := v_actor;
    NEW.resolved_at := COALESCE(NEW.resolved_at, now());
    NEW.rejection_reason := NULL;
  ELSIF NEW.status = 'rejected' THEN
    IF COALESCE(trim(NEW.rejection_reason), '') = '' THEN
      RAISE EXCEPTION 'Rejection reason is required';
    END IF;
    NEW.reviewed_by := v_actor;
    NEW.resolved_at := COALESCE(NEW.resolved_at, now());
  ELSIF NEW.status = 'more_info_requested' THEN
    IF COALESCE(trim(NEW.requested_doc_message), '') = '' THEN
      RAISE EXCEPTION 'A message is required when requesting more info';
    END IF;
    NEW.reviewed_by := COALESCE(NEW.reviewed_by, v_actor);
    NEW.resolved_at := NULL;
  ELSIF NEW.status = 'expired' THEN
    NEW.reviewed_by := COALESCE(NEW.reviewed_by, v_actor);
    NEW.resolved_at := COALESCE(NEW.resolved_at, now());
  END IF;

  RETURN NEW;
END;
$function$;

-- Record the queueing decision so platform-routed requests are auditable too.
CREATE OR REPLACE FUNCTION public.audit_verification_request_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_actor uuid := auth.uid();
  v_actor_role text;
  v_evidence_id uuid;
BEGIN
  v_actor_role := CASE WHEN v_actor = NEW.requester_id THEN 'requester' ELSE 'reviewer' END;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.verification_events (
      request_id, actor_user_id, actor_role, event_type, note, payload
    )
    VALUES (
      NEW.id,
      NEW.requester_id,
      'requester',
      'submitted',
      'Verification request submitted',
      jsonb_build_object(
        'requested_role', NEW.requested_role,
        'role_category', NEW.role_category,
        'requested_verification_type', NEW.requested_verification_type,
        'review_queue', NEW.review_queue
      )
    );

    v_evidence_id := public.sync_legacy_verification_evidence(NEW.id);
    IF v_evidence_id IS NOT NULL THEN
      INSERT INTO public.verification_events (
        request_id, actor_user_id, actor_role, event_type, note, payload
      )
      VALUES (
        NEW.id,
        NEW.requester_id,
        'requester',
        'evidence_added',
        'Initial evidence attached',
        jsonb_build_object('evidence_id', v_evidence_id, 'storage_path', NEW.document_url)
      );
    END IF;

    IF NEW.assigned_to IS NOT NULL THEN
      INSERT INTO public.verification_events (
        request_id, actor_user_id, actor_role, event_type, note, payload
      )
      VALUES (
        NEW.id,
        NEW.assigned_to,
        'reviewer',
        'assigned',
        'Verification request assigned',
        jsonb_build_object('assigned_to', NEW.assigned_to, 'review_queue', NEW.review_queue)
      );
    ELSIF NEW.review_queue = 'platform' THEN
      INSERT INTO public.verification_events (
        request_id, actor_user_id, actor_role, event_type, note, payload
      )
      VALUES (
        NEW.id,
        NULL,
        'system',
        'assigned',
        'Queued for platform review',
        jsonb_build_object('review_queue', NEW.review_queue)
      );
    END IF;

    RETURN NEW;
  END IF;

  IF NEW.document_url IS DISTINCT FROM OLD.document_url OR NEW.document_type IS DISTINCT FROM OLD.document_type THEN
    v_evidence_id := public.sync_legacy_verification_evidence(NEW.id);
    IF v_evidence_id IS NOT NULL THEN
      INSERT INTO public.verification_events (
        request_id, actor_user_id, actor_role, event_type, note, payload
      )
      VALUES (
        NEW.id,
        COALESCE(v_actor, NEW.requester_id),
        CASE WHEN COALESCE(v_actor, NEW.requester_id) = NEW.requester_id THEN 'requester' ELSE 'reviewer' END,
        'evidence_added',
        'Evidence updated',
        jsonb_build_object('evidence_id', v_evidence_id, 'storage_path', NEW.document_url)
      );
    END IF;
  END IF;

  IF NEW.assigned_to IS DISTINCT FROM OLD.assigned_to AND NEW.assigned_to IS NOT NULL THEN
    INSERT INTO public.verification_events (
      request_id, actor_user_id, actor_role, event_type, note, payload
    )
    VALUES (
      NEW.id,
      COALESCE(v_actor, NEW.assigned_to),
      'reviewer',
      'assigned',
      'Verification request reassigned',
      jsonb_build_object('assigned_to', NEW.assigned_to, 'review_queue', NEW.review_queue)
    );
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'approved' THEN
      PERFORM public.materialize_verification_from_request(NEW.id);
      INSERT INTO public.verification_events (
        request_id, actor_user_id, actor_role, event_type, note, payload
      )
      VALUES (
        NEW.id,
        NEW.reviewed_by,
        'reviewer',
        'approved',
        COALESCE(NEW.review_note, 'Verification approved'),
        jsonb_build_object(
          'requested_verification_type', NEW.requested_verification_type,
          'review_queue', NEW.review_queue
        )
      );
    ELSIF NEW.status = 'rejected' THEN
      IF NEW.requested_verification_type = 'work_item_verified' AND NEW.entity_id IS NOT NULL THEN
        PERFORM set_config('tiikme.verification_internal', 'on', true);
        UPDATE public.work_items
        SET verification_status = 'rejected',
            verified_at = NULL,
            verified_by_user = NULL
        WHERE id = NEW.entity_id
          AND owner_id = NEW.requester_id;
      END IF;

      INSERT INTO public.verification_events (
        request_id, actor_user_id, actor_role, event_type, note, payload
      )
      VALUES (
        NEW.id,
        NEW.reviewed_by,
        'reviewer',
        'rejected',
        COALESCE(NEW.rejection_reason, 'Verification rejected'),
        jsonb_build_object('rejection_reason', NEW.rejection_reason, 'review_queue', NEW.review_queue)
      );
    ELSIF NEW.status = 'more_info_requested' THEN
      INSERT INTO public.verification_events (
        request_id, actor_user_id, actor_role, event_type, note, payload
      )
      VALUES (
        NEW.id,
        COALESCE(v_actor, NEW.reviewed_by),
        'reviewer',
        'more_info_requested',
        COALESCE(NEW.requested_doc_message, 'More information requested'),
        jsonb_build_object('message', NEW.requested_doc_message, 'review_queue', NEW.review_queue)
      );
    ELSIF NEW.status = 'expired' THEN
      INSERT INTO public.verification_events (
        request_id, actor_user_id, actor_role, event_type, note, payload
      )
      VALUES (
        NEW.id,
        COALESCE(v_actor, NEW.reviewed_by),
        v_actor_role,
        'expired',
        'Verification request expired',
        jsonb_build_object('review_queue', NEW.review_queue)
      );
    ELSIF NEW.status = 'pending' AND OLD.status = 'more_info_requested' THEN
      INSERT INTO public.verification_events (
        request_id, actor_user_id, actor_role, event_type, note, payload
      )
      VALUES (
        NEW.id,
        NEW.requester_id,
        'requester',
        'reopened',
        'Requester resubmitted after more info request',
        jsonb_build_object('review_queue', NEW.review_queue)
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- Queue-aware request visibility. Platform reviewers only see platform-routed
-- requests; org reviewers keep the existing org-based visibility model.
DROP POLICY IF EXISTS "verif_req_select_involved" ON public.verification_requests;
CREATE POLICY "verif_req_select_involved"
ON public.verification_requests
FOR SELECT
TO authenticated
USING (
  auth.uid() = requester_id
  OR auth.uid() = assigned_to
  OR auth.uid() = reviewed_by
  OR public.user_can_review_verification_request(id, auth.uid())
);

DROP POLICY IF EXISTS "verif_req_update_reviewers" ON public.verification_requests;
CREATE POLICY "verif_req_update_reviewers"
ON public.verification_requests
FOR UPDATE
TO authenticated
USING (
  public.user_can_review_verification_request(id, auth.uid())
)
WITH CHECK (
  public.user_can_review_verification_request(id, auth.uid())
);

-- Platform reviewers need document access for platform-routed requests too.
DROP POLICY IF EXISTS "vd_admin_read" ON storage.objects;
CREATE POLICY "vd_admin_read"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'verification-docs'
  AND EXISTS (
    SELECT 1
    FROM public.verification_requests vr
    WHERE (
      vr.document_url = objects.name
      OR vr.document_url LIKE '%/' || objects.name
    )
      AND public.user_can_review_verification_request(vr.id, auth.uid())
  )
);

-- Server-owned review action RPCs. They perform permission checks up front,
-- then update the request row so the existing triggers emit audit events and
-- materialize canonical trust state on valid approvals.
CREATE OR REPLACE FUNCTION public.approve_verification_request(p_request_id uuid, p_review_note text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_actor uuid := auth.uid();
  v_request public.verification_requests%ROWTYPE;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT *
  INTO v_request
  FROM public.verification_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Verification request not found';
  END IF;

  IF NOT public.user_can_review_verification_request(p_request_id, v_actor) THEN
    RAISE EXCEPTION 'You do not have permission to review this verification request';
  END IF;

  IF v_request.requester_id = v_actor THEN
    RAISE EXCEPTION 'Requesters cannot review their own verification requests';
  END IF;

  IF COALESCE(v_request.status, 'pending') NOT IN ('pending', 'more_info_requested') THEN
    RAISE EXCEPTION 'Only pending verification requests can be approved';
  END IF;

  UPDATE public.verification_requests
  SET status = 'approved',
      review_note = NULLIF(trim(p_review_note), '')
  WHERE id = p_request_id
  RETURNING * INTO v_request;

  RETURN jsonb_build_object(
    'request_id', v_request.id,
    'status', v_request.status,
    'review_queue', v_request.review_queue,
    'reviewed_by', v_request.reviewed_by
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.reject_verification_request(p_request_id uuid, p_rejection_reason text, p_review_note text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_actor uuid := auth.uid();
  v_request public.verification_requests%ROWTYPE;
  v_reason text := NULLIF(trim(p_rejection_reason), '');
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF v_reason IS NULL THEN
    RAISE EXCEPTION 'Rejection reason is required';
  END IF;

  SELECT *
  INTO v_request
  FROM public.verification_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Verification request not found';
  END IF;

  IF NOT public.user_can_review_verification_request(p_request_id, v_actor) THEN
    RAISE EXCEPTION 'You do not have permission to review this verification request';
  END IF;

  IF v_request.requester_id = v_actor THEN
    RAISE EXCEPTION 'Requesters cannot review their own verification requests';
  END IF;

  IF COALESCE(v_request.status, 'pending') NOT IN ('pending', 'more_info_requested') THEN
    RAISE EXCEPTION 'Only pending verification requests can be rejected';
  END IF;

  UPDATE public.verification_requests
  SET status = 'rejected',
      rejection_reason = v_reason,
      review_note = NULLIF(trim(p_review_note), '')
  WHERE id = p_request_id
  RETURNING * INTO v_request;

  RETURN jsonb_build_object(
    'request_id', v_request.id,
    'status', v_request.status,
    'review_queue', v_request.review_queue,
    'reviewed_by', v_request.reviewed_by
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.request_verification_more_info(p_request_id uuid, p_message text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_actor uuid := auth.uid();
  v_request public.verification_requests%ROWTYPE;
  v_message text := NULLIF(trim(p_message), '');
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF v_message IS NULL THEN
    RAISE EXCEPTION 'A message is required';
  END IF;

  SELECT *
  INTO v_request
  FROM public.verification_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Verification request not found';
  END IF;

  IF NOT public.user_can_review_verification_request(p_request_id, v_actor) THEN
    RAISE EXCEPTION 'You do not have permission to review this verification request';
  END IF;

  IF v_request.requester_id = v_actor THEN
    RAISE EXCEPTION 'Requesters cannot review their own verification requests';
  END IF;

  IF COALESCE(v_request.status, 'pending') NOT IN ('pending', 'more_info_requested') THEN
    RAISE EXCEPTION 'Only pending verification requests can be updated';
  END IF;

  UPDATE public.verification_requests
  SET status = 'more_info_requested',
      requested_doc_message = v_message,
      review_thread = COALESCE(review_thread, '[]'::jsonb) || jsonb_build_array(
        jsonb_build_object(
          'by', v_actor,
          'role', 'reviewer',
          'message', v_message,
          'at', now()
        )
      )
  WHERE id = p_request_id
  RETURNING * INTO v_request;

  RETURN jsonb_build_object(
    'request_id', v_request.id,
    'status', v_request.status,
    'review_queue', v_request.review_queue,
    'reviewed_by', v_request.reviewed_by
  );
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.is_platform_verification_reviewer(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.user_can_review_verification_request(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_verification_request_transition() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.audit_verification_request_change() FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.approve_verification_request(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approve_verification_request(uuid, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.reject_verification_request(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reject_verification_request(uuid, text, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.request_verification_more_info(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_verification_more_info(uuid, text) TO authenticated;

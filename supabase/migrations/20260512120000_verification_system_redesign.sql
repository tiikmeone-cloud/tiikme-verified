-- Phase 2: verification system redesign.
-- Keep verification_requests as the workflow header, and move evidence, audit,
-- and issued trust state into dedicated tables so Tiikme can operate as a
-- real trust platform instead of a badge toggle on profiles.

-- 1) Request header: make the requested trust type explicit without breaking old rows.
ALTER TABLE public.verification_requests
  ADD COLUMN IF NOT EXISTS requested_verification_type text;

ALTER TABLE public.verification_requests
  DROP CONSTRAINT IF EXISTS verification_requests_status_check;

ALTER TABLE public.verification_requests
  ADD CONSTRAINT verification_requests_status_check
  CHECK (
    status IS NULL
    OR status IN ('pending', 'more_info_requested', 'approved', 'rejected', 'expired')
  );

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'verification_requests_requested_verification_type_check'
  ) THEN
    ALTER TABLE public.verification_requests
      ADD CONSTRAINT verification_requests_requested_verification_type_check
      CHECK (
        requested_verification_type IS NULL
        OR requested_verification_type IN (
          'identity_verified',
          'institution_verified',
          'workplace_verified',
          'work_item_verified'
        )
      );
  END IF;
END;
$$;

-- 2) Canonical evidence ledger.
CREATE TABLE IF NOT EXISTS public.verification_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.verification_requests(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  storage_bucket text NOT NULL DEFAULT 'verification-docs',
  storage_path text NOT NULL,
  evidence_type text,
  file_name text,
  mime_type text,
  file_size_bytes bigint,
  notes text,
  is_primary boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'superseded', 'removed')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_verification_evidence_request
  ON public.verification_evidence(request_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_verification_evidence_uploader
  ON public.verification_evidence(uploaded_by, created_at DESC);

-- 3) Reviewer and workflow audit trail.
CREATE TABLE IF NOT EXISTS public.verification_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.verification_requests(id) ON DELETE CASCADE,
  actor_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_role text,
  event_type text NOT NULL CHECK (
    event_type IN (
      'submitted',
      'assigned',
      'evidence_added',
      'more_info_requested',
      'approved',
      'rejected',
      'expired',
      'reopened',
      'state_issued',
      'legacy_backfill'
    )
  ),
  note text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_verification_events_request
  ON public.verification_events(request_id, created_at DESC);

-- 4) Canonical issued trust state.
CREATE TABLE IF NOT EXISTS public.profile_verification_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  verification_type text NOT NULL CHECK (
    verification_type IN (
      'identity_verified',
      'institution_verified',
      'workplace_verified',
      'work_item_verified'
    )
  ),
  status text NOT NULL CHECK (status IN ('active', 'expired', 'revoked')),
  issuer_org_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  verifier_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  request_id uuid REFERENCES public.verification_requests(id) ON DELETE SET NULL,
  evidence_id uuid REFERENCES public.verification_evidence(id) ON DELETE SET NULL,
  target_item_id uuid,
  evidence_type text,
  issued_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  revoked_at timestamptz,
  revoked_reason text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_profile_verification_state_request
  ON public.profile_verification_state(request_id)
  WHERE request_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profile_verification_state_subject
  ON public.profile_verification_state(subject_user_id, verification_type, status);

-- 5) Detailed employment / institution claim record.
CREATE TABLE IF NOT EXISTS public.verified_employment_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid UNIQUE REFERENCES public.verification_requests(id) ON DELETE SET NULL,
  subject_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  claim_kind text NOT NULL CHECK (claim_kind IN ('workplace_verified', 'institution_verified')),
  claimed_role text,
  role_category text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
  issuer_org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  verifier_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  evidence_id uuid REFERENCES public.verification_evidence(id) ON DELETE SET NULL,
  org_member_id uuid REFERENCES public.org_members(id) ON DELETE SET NULL,
  verified_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  revoked_at timestamptz,
  revoked_reason text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_verified_employment_claims_subject
  ON public.verified_employment_claims(subject_user_id, claim_kind, status);

CREATE INDEX IF NOT EXISTS idx_verified_employment_claims_org
  ON public.verified_employment_claims(org_id, claim_kind, status);

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
  v_exact_route uuid;
  v_default_route uuid;
  v_route_count integer := 0;
BEGIN
  IF _actor IS NULL THEN
    RETURN false;
  END IF;

  SELECT org_id, role_category, requester_id, assigned_to
  INTO v_org_id, v_role_category, v_requester_id, v_assigned_to
  FROM public.verification_requests
  WHERE id = _request_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF v_requester_id = _actor THEN
    RETURN false;
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

  RETURN false;
END;
$function$;

ALTER TABLE public.verification_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_verification_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verified_employment_claims ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "verification_evidence_select_involved" ON public.verification_evidence;
CREATE POLICY "verification_evidence_select_involved"
ON public.verification_evidence
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.verification_requests vr
    WHERE vr.id = verification_evidence.request_id
      AND (
        vr.requester_id = auth.uid()
        OR verification_evidence.uploaded_by = auth.uid()
        OR vr.assigned_to = auth.uid()
        OR vr.reviewed_by = auth.uid()
        OR public.user_can_review_verification_request(vr.id, auth.uid())
      )
  )
);

DROP POLICY IF EXISTS "verification_evidence_insert_requester" ON public.verification_evidence;
CREATE POLICY "verification_evidence_insert_requester"
ON public.verification_evidence
FOR INSERT
TO authenticated
WITH CHECK (
  uploaded_by = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.verification_requests vr
    WHERE vr.id = verification_evidence.request_id
      AND vr.requester_id = auth.uid()
      AND COALESCE(vr.status, 'pending') IN ('pending', 'more_info_requested')
  )
);

DROP POLICY IF EXISTS "verification_events_select_involved" ON public.verification_events;
CREATE POLICY "verification_events_select_involved"
ON public.verification_events
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.verification_requests vr
    WHERE vr.id = verification_events.request_id
      AND (
        vr.requester_id = auth.uid()
        OR vr.assigned_to = auth.uid()
        OR vr.reviewed_by = auth.uid()
        OR public.user_can_review_verification_request(vr.id, auth.uid())
      )
  )
);

DROP POLICY IF EXISTS "profile_verification_state_select_involved" ON public.profile_verification_state;
CREATE POLICY "profile_verification_state_select_involved"
ON public.profile_verification_state
FOR SELECT
TO authenticated
USING (
  subject_user_id = auth.uid()
  OR verifier_user_id = auth.uid()
  OR (
    issuer_org_id IS NOT NULL
    AND public.is_org_admin(issuer_org_id, auth.uid())
  )
);

DROP POLICY IF EXISTS "verified_employment_claims_select_involved" ON public.verified_employment_claims;
CREATE POLICY "verified_employment_claims_select_involved"
ON public.verified_employment_claims
FOR SELECT
TO authenticated
USING (
  subject_user_id = auth.uid()
  OR verifier_user_id = auth.uid()
  OR public.is_org_admin(org_id, auth.uid())
);

-- Helper used by guards and internal materialization.
CREATE OR REPLACE FUNCTION public.verification_internal_write_allowed()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $function$
  SELECT
    COALESCE(current_setting('tiikme.verification_internal', true), '') = 'on'
    OR COALESCE(current_setting('request.jwt.claim.role', true), '') = 'service_role';
$function$;

CREATE OR REPLACE FUNCTION public.derive_requested_verification_type(_entity_type text, _org_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_org_type text;
BEGIN
  IF lower(COALESCE(_entity_type, '')) IN ('identity', 'profile_identity') THEN
    RETURN 'identity_verified';
  END IF;

  IF lower(COALESCE(_entity_type, '')) = 'work_item' THEN
    RETURN 'work_item_verified';
  END IF;

  IF _org_id IS NOT NULL THEN
    SELECT lower(COALESCE(type, ''))
    INTO v_org_type
    FROM public.organizations
    WHERE id = _org_id;

    IF v_org_type LIKE '%school%'
      OR v_org_type LIKE '%college%'
      OR v_org_type LIKE '%university%'
      OR v_org_type LIKE '%institution%'
      OR v_org_type LIKE '%campus%'
      OR v_org_type LIKE '%academy%'
    THEN
      RETURN 'institution_verified';
    END IF;
  END IF;

  RETURN 'workplace_verified';
END;
$function$;

-- Guard legacy trust fields so users cannot self-issue badges.
CREATE OR REPLACE FUNCTION public.guard_profile_verification_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  IF NOT public.verification_internal_write_allowed()
    AND (
      NEW.is_verified IS DISTINCT FROM OLD.is_verified
      OR NEW.verification_type IS DISTINCT FROM OLD.verification_type
      OR NEW.verified_at IS DISTINCT FROM OLD.verified_at
      OR NEW.verified_by IS DISTINCT FROM OLD.verified_by
      OR NEW.verification_badge_text IS DISTINCT FROM OLD.verification_badge_text
    )
  THEN
    RAISE EXCEPTION 'Verification fields are system-managed';
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_guard_profile_verification_fields ON public.profiles;
CREATE TRIGGER trg_guard_profile_verification_fields
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.guard_profile_verification_fields();

CREATE OR REPLACE FUNCTION public.guard_organization_verification_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  IF NOT public.verification_internal_write_allowed()
    AND (
      NEW.is_verified IS DISTINCT FROM OLD.is_verified
      OR NEW.verification_type IS DISTINCT FROM OLD.verification_type
    )
  THEN
    RAISE EXCEPTION 'Organization verification fields are system-managed';
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_guard_organization_verification_fields ON public.organizations;
CREATE TRIGGER trg_guard_organization_verification_fields
BEFORE UPDATE ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.guard_organization_verification_fields();

CREATE OR REPLACE FUNCTION public.guard_work_item_verification_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  IF NOT public.verification_internal_write_allowed()
    AND (
      NEW.verification_status IS DISTINCT FROM OLD.verification_status
      OR NEW.verified_at IS DISTINCT FROM OLD.verified_at
      OR NEW.verified_by_user IS DISTINCT FROM OLD.verified_by_user
    )
  THEN
    RAISE EXCEPTION 'Work item verification fields are system-managed';
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_guard_work_item_verification_fields ON public.work_items;
CREATE TRIGGER trg_guard_work_item_verification_fields
BEFORE UPDATE ON public.work_items
FOR EACH ROW
EXECUTE FUNCTION public.guard_work_item_verification_fields();

CREATE OR REPLACE FUNCTION public.sync_legacy_verification_evidence(_request_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_request public.verification_requests%ROWTYPE;
  v_evidence_id uuid;
BEGIN
  SELECT *
  INTO v_request
  FROM public.verification_requests
  WHERE id = _request_id;

  IF NOT FOUND OR v_request.document_url IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT id
  INTO v_evidence_id
  FROM public.verification_evidence
  WHERE request_id = _request_id
    AND storage_bucket = 'verification-docs'
    AND storage_path = v_request.document_url
    AND status = 'active'
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_evidence_id IS NOT NULL THEN
    RETURN v_evidence_id;
  END IF;

  INSERT INTO public.verification_evidence (
    request_id,
    uploaded_by,
    storage_bucket,
    storage_path,
    evidence_type,
    file_name,
    is_primary,
    metadata
  )
  VALUES (
    _request_id,
    v_request.requester_id,
    'verification-docs',
    v_request.document_url,
    COALESCE(v_request.document_type, 'supporting_document'),
    regexp_replace(v_request.document_url, '^.*/', ''),
    true,
    jsonb_build_object('legacy_header_sync', true)
  )
  RETURNING id INTO v_evidence_id;

  RETURN v_evidence_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.materialize_verification_from_request(_request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_request public.verification_requests%ROWTYPE;
  v_evidence_id uuid;
  v_evidence_type text;
  v_expires_at timestamptz;
  v_state_id uuid;
BEGIN
  SELECT *
  INTO v_request
  FROM public.verification_requests
  WHERE id = _request_id;

  IF NOT FOUND OR COALESCE(v_request.status, 'pending') <> 'approved' THEN
    RETURN;
  END IF;

  SELECT id, evidence_type
  INTO v_evidence_id, v_evidence_type
  FROM public.verification_evidence
  WHERE request_id = _request_id
    AND status = 'active'
  ORDER BY is_primary DESC, created_at DESC
  LIMIT 1;

  v_expires_at := CASE
    WHEN v_request.requested_verification_type = 'work_item_verified' THEN NULL
    ELSE COALESCE(v_request.resolved_at, now()) + interval '365 days'
  END;

  IF v_request.requested_verification_type IN ('workplace_verified', 'institution_verified') AND v_request.org_id IS NOT NULL THEN
    INSERT INTO public.verified_employment_claims (
      request_id,
      subject_user_id,
      org_id,
      claim_kind,
      claimed_role,
      role_category,
      status,
      issuer_org_id,
      verifier_user_id,
      evidence_id,
      org_member_id,
      verified_at,
      expires_at,
      metadata
    )
    VALUES (
      _request_id,
      v_request.requester_id,
      v_request.org_id,
      v_request.requested_verification_type,
      v_request.requested_role,
      v_request.role_category,
      'active',
      v_request.org_id,
      v_request.reviewed_by,
      v_evidence_id,
      (
        SELECT id
        FROM public.org_members
        WHERE org_id = v_request.org_id
          AND user_id = v_request.requester_id
        ORDER BY joined_at DESC NULLS LAST
        LIMIT 1
      ),
      COALESCE(v_request.resolved_at, now()),
      v_expires_at,
      jsonb_build_object('source', 'verification_request')
    )
    ON CONFLICT (request_id) DO UPDATE
      SET claim_kind = EXCLUDED.claim_kind,
          claimed_role = EXCLUDED.claimed_role,
          role_category = EXCLUDED.role_category,
          status = 'active',
          issuer_org_id = EXCLUDED.issuer_org_id,
          verifier_user_id = EXCLUDED.verifier_user_id,
          evidence_id = EXCLUDED.evidence_id,
          org_member_id = EXCLUDED.org_member_id,
          verified_at = EXCLUDED.verified_at,
          expires_at = EXCLUDED.expires_at,
          revoked_at = NULL,
          revoked_reason = NULL,
          metadata = EXCLUDED.metadata,
          updated_at = now();
  END IF;

  UPDATE public.profile_verification_state
  SET status = 'revoked',
      revoked_at = now(),
      revoked_reason = 'Superseded by a newer verification approval',
      updated_at = now()
  WHERE subject_user_id = v_request.requester_id
    AND verification_type = v_request.requested_verification_type
    AND status = 'active'
    AND request_id IS DISTINCT FROM _request_id
    AND issuer_org_id IS NOT DISTINCT FROM v_request.org_id
    AND target_item_id IS NOT DISTINCT FROM CASE WHEN v_request.requested_verification_type = 'work_item_verified' THEN v_request.entity_id ELSE NULL END;

  INSERT INTO public.profile_verification_state (
    subject_user_id,
    verification_type,
    status,
    issuer_org_id,
    verifier_user_id,
    request_id,
    evidence_id,
    target_item_id,
    evidence_type,
    issued_at,
    expires_at,
    metadata
  )
  VALUES (
    v_request.requester_id,
    v_request.requested_verification_type,
    'active',
    v_request.org_id,
    v_request.reviewed_by,
    _request_id,
    v_evidence_id,
    CASE WHEN v_request.requested_verification_type = 'work_item_verified' THEN v_request.entity_id ELSE NULL END,
    v_evidence_type,
    COALESCE(v_request.resolved_at, now()),
    v_expires_at,
    jsonb_build_object('source', 'verification_request')
  )
  ON CONFLICT (request_id) DO UPDATE
    SET status = 'active',
        issuer_org_id = EXCLUDED.issuer_org_id,
        verifier_user_id = EXCLUDED.verifier_user_id,
        evidence_id = EXCLUDED.evidence_id,
        target_item_id = EXCLUDED.target_item_id,
        evidence_type = EXCLUDED.evidence_type,
        issued_at = EXCLUDED.issued_at,
        expires_at = EXCLUDED.expires_at,
        revoked_at = NULL,
        revoked_reason = NULL,
        metadata = EXCLUDED.metadata,
        updated_at = now()
  RETURNING id INTO v_state_id;

  PERFORM set_config('tiikme.verification_internal', 'on', true);

  UPDATE public.profiles
  SET is_verified = true,
      verification_type = v_request.requested_verification_type,
      verified_by = v_request.reviewed_by,
      verified_at = COALESCE(v_request.resolved_at, now()),
      verification_badge_text = CASE v_request.requested_verification_type
        WHEN 'institution_verified' THEN 'Institution verified'
        WHEN 'workplace_verified' THEN 'Workplace verified'
        WHEN 'work_item_verified' THEN 'Work proof verified'
        WHEN 'identity_verified' THEN 'Identity verified'
        ELSE verification_badge_text
      END
  WHERE id = v_request.requester_id;

  IF v_request.requested_verification_type = 'work_item_verified' AND v_request.entity_id IS NOT NULL THEN
    UPDATE public.work_items
    SET verification_status = 'verified',
        verified_at = COALESCE(v_request.resolved_at, now()),
        verified_by_user = v_request.reviewed_by
    WHERE id = v_request.entity_id
      AND owner_id = v_request.requester_id;
  ELSIF v_request.org_id IS NOT NULL THEN
    UPDATE public.org_members
    SET is_verified = true,
        verified_at = COALESCE(v_request.resolved_at, now()),
        approved_by = v_request.reviewed_by,
        approval_status = 'approved',
        title = COALESCE(title, v_request.requested_role),
        department = COALESCE(department, v_request.role_category)
    WHERE org_id = v_request.org_id
      AND user_id = v_request.requester_id;
  END IF;

  INSERT INTO public.verification_events (
    request_id,
    actor_user_id,
    actor_role,
    event_type,
    note,
    payload
  )
  VALUES (
    _request_id,
    v_request.reviewed_by,
    'reviewer',
    'state_issued',
    'Canonical verification state issued',
    jsonb_build_object(
      'state_id', v_state_id,
      'verification_type', v_request.requested_verification_type,
      'expires_at', v_expires_at
    )
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.guard_verification_request_transition()
RETURNS trigger
LANGUAGE plpgsql
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

    IF NEW.status <> 'pending' THEN
      RAISE EXCEPTION 'New verification requests must start in pending status';
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
        'requested_verification_type', NEW.requested_verification_type
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
        jsonb_build_object('assigned_to', NEW.assigned_to)
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
      jsonb_build_object('assigned_to', NEW.assigned_to)
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
        jsonb_build_object('requested_verification_type', NEW.requested_verification_type)
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
        jsonb_build_object('rejection_reason', NEW.rejection_reason)
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
        jsonb_build_object('message', NEW.requested_doc_message)
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
        '{}'::jsonb
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
        '{}'::jsonb
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_on_verification_approved ON public.verification_requests;
DROP TRIGGER IF EXISTS trg_guard_verification_request_transition ON public.verification_requests;
DROP TRIGGER IF EXISTS trg_audit_verification_request_change ON public.verification_requests;

CREATE TRIGGER trg_guard_verification_request_transition
BEFORE INSERT OR UPDATE ON public.verification_requests
FOR EACH ROW
EXECUTE FUNCTION public.guard_verification_request_transition();

CREATE TRIGGER trg_audit_verification_request_change
AFTER INSERT OR UPDATE ON public.verification_requests
FOR EACH ROW
EXECUTE FUNCTION public.audit_verification_request_change();

-- Backfill requested verification type from old request shapes.
UPDATE public.verification_requests vr
SET requested_verification_type = public.derive_requested_verification_type(vr.entity_type, vr.org_id)
WHERE requested_verification_type IS NULL;

-- Backfill evidence rows from legacy header columns.
DO $$
DECLARE
  v_request_id uuid;
BEGIN
  FOR v_request_id IN
    SELECT id
    FROM public.verification_requests
    WHERE document_url IS NOT NULL
  LOOP
    PERFORM public.sync_legacy_verification_evidence(v_request_id);
  END LOOP;
END;
$$;

-- Backfill baseline workflow events where absent.
INSERT INTO public.verification_events (request_id, actor_user_id, actor_role, event_type, note, payload)
SELECT
  vr.id,
  vr.requester_id,
  'requester',
  'submitted',
  'Legacy verification request backfill',
  jsonb_build_object(
    'requested_role', vr.requested_role,
    'role_category', vr.role_category,
    'requested_verification_type', vr.requested_verification_type,
    'legacy_backfill', true
  )
FROM public.verification_requests vr
WHERE NOT EXISTS (
  SELECT 1
  FROM public.verification_events ve
  WHERE ve.request_id = vr.id
    AND ve.event_type = 'submitted'
);

INSERT INTO public.verification_events (request_id, actor_user_id, actor_role, event_type, note, payload)
SELECT
  vr.id,
  vr.reviewed_by,
  'reviewer',
  vr.status,
  CASE vr.status
    WHEN 'approved' THEN 'Legacy approval backfill'
    WHEN 'rejected' THEN COALESCE(vr.rejection_reason, 'Legacy rejection backfill')
    WHEN 'more_info_requested' THEN COALESCE(vr.requested_doc_message, 'Legacy more-info backfill')
    ELSE 'Legacy status backfill'
  END,
  jsonb_build_object('legacy_backfill', true)
FROM public.verification_requests vr
WHERE vr.status IN ('approved', 'rejected', 'more_info_requested')
  AND NOT EXISTS (
    SELECT 1
    FROM public.verification_events ve
    WHERE ve.request_id = vr.id
      AND ve.event_type = vr.status
  );

-- Materialize active canonical state from approved requests.
DO $$
DECLARE
  v_request_id uuid;
BEGIN
  FOR v_request_id IN
    SELECT id
    FROM public.verification_requests
    WHERE status = 'approved'
  LOOP
    PERFORM public.materialize_verification_from_request(v_request_id);
  END LOOP;
END;
$$;

-- Backfill legacy profile-level verification if no canonical state exists yet.
INSERT INTO public.profile_verification_state (
  subject_user_id,
  verification_type,
  status,
  issuer_org_id,
  verifier_user_id,
  evidence_type,
  issued_at,
  expires_at,
  metadata
)
SELECT
  p.id,
  CASE
    WHEN COALESCE(p.verification_type, '') = 'identity_verified' THEN 'identity_verified'
    WHEN COALESCE(p.verification_type, '') = 'institution_verified' THEN 'institution_verified'
    WHEN COALESCE(p.verification_type, '') = 'work_item_verified' THEN 'work_item_verified'
    WHEN COALESCE(p.verification_type, '') = 'peer' THEN 'identity_verified'
    WHEN COALESCE(p.verification_type, '') = 'email' THEN 'identity_verified'
    WHEN p.org_id IS NOT NULL AND (
      lower(COALESCE((SELECT type FROM public.organizations o WHERE o.id = p.org_id), '')) LIKE '%school%'
      OR lower(COALESCE((SELECT type FROM public.organizations o WHERE o.id = p.org_id), '')) LIKE '%college%'
      OR lower(COALESCE((SELECT type FROM public.organizations o WHERE o.id = p.org_id), '')) LIKE '%university%'
      OR lower(COALESCE((SELECT type FROM public.organizations o WHERE o.id = p.org_id), '')) LIKE '%institution%'
      OR lower(COALESCE((SELECT type FROM public.organizations o WHERE o.id = p.org_id), '')) LIKE '%campus%'
      OR lower(COALESCE((SELECT type FROM public.organizations o WHERE o.id = p.org_id), '')) LIKE '%academy%'
    ) THEN 'institution_verified'
    ELSE 'workplace_verified'
  END,
  'active',
  p.org_id,
  p.verified_by,
  COALESCE(p.verification_type, 'legacy_profile_flag'),
  COALESCE(p.verified_at, now()),
  CASE WHEN p.verified_at IS NULL THEN NULL ELSE p.verified_at + interval '365 days' END,
  jsonb_build_object('legacy_profile_backfill', true)
FROM public.profiles p
WHERE COALESCE(p.is_verified, false) = true
  AND NOT EXISTS (
    SELECT 1
    FROM public.profile_verification_state pvs
    WHERE pvs.subject_user_id = p.id
      AND pvs.status = 'active'
  );

-- Keep helper and trigger functions off the API surface.
REVOKE EXECUTE ON FUNCTION public.verification_internal_write_allowed() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.derive_requested_verification_type(text, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.user_can_review_verification_request(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_profile_verification_fields() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_organization_verification_fields() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_work_item_verification_fields() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_legacy_verification_evidence(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.materialize_verification_from_request(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_verification_request_transition() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.audit_verification_request_change() FROM PUBLIC, anon, authenticated;

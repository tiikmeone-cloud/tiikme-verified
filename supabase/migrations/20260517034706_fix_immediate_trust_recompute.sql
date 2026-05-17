-- Blocker 2: Immediately recompute trust score after verification approval.
-- materialize_verification_from_request() now calls internal_recompute_trust_score()
-- inline after setting profiles.is_verified = true, removing the cron-only delay.
-- Blocker 3: Insert notification to requester on verification approval (DB-side).
-- Moved from client-side VerificationInbox handling into the DB function so it
-- fires regardless of which surface performs the approval.

CREATE OR REPLACE FUNCTION public.materialize_verification_from_request(_request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_request public.verification_requests%ROWTYPE;
  v_evidence_id   uuid;
  v_evidence_type text;
  v_expires_at    timestamptz;
  v_state_id      uuid;
BEGIN
  SELECT * INTO v_request FROM public.verification_requests WHERE id = _request_id;
  IF NOT FOUND OR COALESCE(v_request.status,'pending') <> 'approved' THEN RETURN; END IF;

  SELECT id, evidence_type INTO v_evidence_id, v_evidence_type
  FROM public.verification_evidence
  WHERE request_id = _request_id AND status = 'active'
  ORDER BY is_primary DESC, created_at DESC LIMIT 1;

  v_expires_at := CASE
    WHEN v_request.requested_verification_type = 'work_item_verified' THEN NULL
    ELSE COALESCE(v_request.resolved_at, now()) + interval '365 days'
  END;

  IF v_request.requested_verification_type IN ('workplace_verified','institution_verified')
     AND v_request.org_id IS NOT NULL THEN
    INSERT INTO public.verified_employment_claims (
      request_id, subject_user_id, org_id, claim_kind, claimed_role,
      role_category, status, issuer_org_id, verifier_user_id,
      evidence_id, org_member_id, verified_at, expires_at, metadata
    ) VALUES (
      _request_id, v_request.requester_id, v_request.org_id,
      v_request.requested_verification_type, v_request.requested_role,
      v_request.role_category, 'active', v_request.org_id, v_request.reviewed_by,
      v_evidence_id,
      (SELECT id FROM public.org_members
       WHERE org_id = v_request.org_id AND user_id = v_request.requester_id
       ORDER BY joined_at DESC NULLS LAST LIMIT 1),
      COALESCE(v_request.resolved_at, now()), v_expires_at,
      jsonb_build_object('source','verification_request')
    )
    ON CONFLICT (request_id) DO UPDATE SET
      claim_kind = EXCLUDED.claim_kind, claimed_role = EXCLUDED.claimed_kind,
      role_category = EXCLUDED.role_category, status = 'active',
      issuer_org_id = EXCLUDED.issuer_org_id, verifier_user_id = EXCLUDED.verifier_user_id,
      evidence_id = EXCLUDED.evidence_id, org_member_id = EXCLUDED.org_member_id,
      verified_at = EXCLUDED.verified_at, expires_at = EXCLUDED.expires_at,
      revoked_at = NULL, revoked_reason = NULL,
      metadata = EXCLUDED.metadata, updated_at = now();
  END IF;

  UPDATE public.profile_verification_state
  SET status = 'revoked', revoked_at = now(),
      revoked_reason = 'Superseded by a newer verification approval', updated_at = now()
  WHERE subject_user_id = v_request.requester_id
    AND verification_type = v_request.requested_verification_type
    AND status = 'active'
    AND request_id IS DISTINCT FROM _request_id
    AND issuer_org_id IS NOT DISTINCT FROM v_request.org_id
    AND target_item_id IS NOT DISTINCT FROM CASE
          WHEN v_request.requested_verification_type = 'work_item_verified'
          THEN v_request.entity_id ELSE NULL END;

  INSERT INTO public.profile_verification_state (
    subject_user_id, verification_type, status, issuer_org_id, verifier_user_id,
    request_id, evidence_id, target_item_id, evidence_type,
    issued_at, expires_at, metadata
  ) VALUES (
    v_request.requester_id, v_request.requested_verification_type, 'active',
    v_request.org_id, v_request.reviewed_by, _request_id, v_evidence_id,
    CASE WHEN v_request.requested_verification_type = 'work_item_verified'
         THEN v_request.entity_id ELSE NULL END,
    v_evidence_type, COALESCE(v_request.resolved_at, now()), v_expires_at,
    jsonb_build_object('source','verification_request')
  )
  ON CONFLICT (request_id) DO UPDATE SET
    status = 'active', issuer_org_id = EXCLUDED.issuer_org_id,
    verifier_user_id = EXCLUDED.verifier_user_id, evidence_id = EXCLUDED.evidence_id,
    target_item_id = EXCLUDED.target_item_id, evidence_type = EXCLUDED.evidence_type,
    issued_at = EXCLUDED.issued_at, expires_at = EXCLUDED.expires_at,
    revoked_at = NULL, revoked_reason = NULL,
    metadata = EXCLUDED.metadata, updated_at = now()
  RETURNING id INTO v_state_id;

  PERFORM set_config('tiikme.verification_internal', 'on', true);

  UPDATE public.profiles
  SET is_verified = true,
      verification_type = v_request.requested_verification_type,
      verified_by = v_request.reviewed_by,
      verified_at = COALESCE(v_request.resolved_at, now()),
      verification_badge_text = CASE v_request.requested_verification_type
        WHEN 'institution_verified' THEN 'Institution verified'
        WHEN 'workplace_verified'   THEN 'Workplace verified'
        WHEN 'work_item_verified'   THEN 'Work proof verified'
        WHEN 'identity_verified'    THEN 'Identity verified'
        ELSE verification_badge_text END
  WHERE id = v_request.requester_id;

  IF v_request.requested_verification_type = 'work_item_verified'
     AND v_request.entity_id IS NOT NULL THEN
    UPDATE public.work_items
    SET verification_status = 'verified',
        verified_at = COALESCE(v_request.resolved_at, now()),
        verified_by_user = v_request.reviewed_by
    WHERE id = v_request.entity_id AND owner_id = v_request.requester_id;

  ELSIF v_request.org_id IS NOT NULL THEN
    UPDATE public.org_members
    SET is_verified = true,
        verified_at = COALESCE(v_request.resolved_at, now()),
        approved_by = v_request.reviewed_by,
        approval_status = 'approved',
        title = COALESCE(title, v_request.requested_role),
        department = COALESCE(department, v_request.role_category)
    WHERE org_id = v_request.org_id AND user_id = v_request.requester_id;

    INSERT INTO public.org_memberships (org_id, user_id, membership_type, role, status, joined_at)
    VALUES (v_request.org_id, v_request.requester_id, 'employee', 'member', 'active',
            COALESCE(v_request.resolved_at, now()))
    ON CONFLICT (org_id, user_id) DO UPDATE
      SET status = 'active', updated_at = now();
  END IF;

  INSERT INTO public.verification_events (
    request_id, actor_user_id, actor_role, event_type, note, payload
  ) VALUES (
    _request_id, v_request.reviewed_by, 'reviewer', 'state_issued',
    'Canonical verification state issued',
    jsonb_build_object('state_id', v_state_id,
                       'verification_type', v_request.requested_verification_type,
                       'expires_at', v_expires_at)
  );

  -- Immediate trust score recompute — no cron delay (Blocker 2)
  PERFORM public.internal_recompute_trust_score(
    _subject_profile_id := v_request.requester_id,
    _subject_org_id     := NULL,
    _subject_page_id    := NULL,
    _subject_category   := NULL,
    _note               := 'verification approved — immediate recompute',
    _actor_user_id      := v_request.reviewed_by,
    _actor_role         := 'platform_reviewer'
  );

  -- DB-side notification to requester (Blocker 3)
  INSERT INTO public.notifications (
    user_id, type, title, body, data, is_read, action_url, actor_id, category, priority
  ) VALUES (
    v_request.requester_id,
    'verification_approved',
    'Your verification was approved!',
    CASE v_request.requested_verification_type
      WHEN 'workplace_verified'   THEN 'Your workplace identity has been verified.'
      WHEN 'institution_verified' THEN 'Your institution identity has been verified.'
      WHEN 'work_item_verified'   THEN 'Your work item has been verified.'
      WHEN 'identity_verified'    THEN 'Your identity has been verified.'
      ELSE 'Your verification request has been approved.'
    END,
    jsonb_build_object(
      'request_id',        _request_id,
      'verification_type', v_request.requested_verification_type,
      'reviewed_by',       v_request.reviewed_by,
      'org_id',            v_request.org_id
    ),
    false,
    '/app/profile',
    v_request.reviewed_by,
    'verification',
    'high'
  );

END;
$$;

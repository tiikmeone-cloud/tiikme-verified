-- Phase 4A operability helpers:
-- 1) moderator-only cleanup for domain verification test artifacts
-- 2) moderator-only temporary Domain Verified badge helper for public-read validation
--
-- Rollback notes:
-- - Drop the two functions added here if they are no longer needed.
-- - These helpers are intentionally scoped to moderator access and explicit IDs.
-- - The cleanup helper is conservative about trust_scores and only deletes scores
--   that are explicitly tagged as test artifacts for the given challenge.

CREATE OR REPLACE FUNCTION public.cleanup_domain_verification_test_artifacts(
  _challenge_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_actor uuid := auth.uid();
  v_challenge public.domain_verification_challenges%ROWTYPE;
  v_check_ids uuid[] := '{}'::uuid[];
  v_badge_ids uuid[] := '{}'::uuid[];
  v_score_ids uuid[] := '{}'::uuid[];
  v_deleted_events integer := 0;
  v_deleted_badges integer := 0;
  v_deleted_checks integer := 0;
  v_deleted_challenges integer := 0;
  v_deleted_scores integer := 0;
  v_deleted_evidence integer := 0;
BEGIN
  IF NOT public.current_user_is_moderator() THEN
    RAISE EXCEPTION 'Only Tiikme moderators can clean up domain verification test artifacts';
  END IF;

  IF _challenge_id IS NULL THEN
    RAISE EXCEPTION 'challenge_id is required';
  END IF;

  SELECT *
  INTO v_challenge
  FROM public.domain_verification_challenges
  WHERE id = _challenge_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Domain verification challenge not found';
  END IF;

  SELECT coalesce(array_agg(tc.id), '{}'::uuid[])
  INTO v_check_ids
  FROM public.trust_checks tc
  WHERE tc.evidence_id = v_challenge.trust_evidence_id;

  SELECT coalesce(array_agg(tb.id), '{}'::uuid[])
  INTO v_badge_ids
  FROM public.trust_badges tb
  WHERE
    tb.evidence_id = v_challenge.trust_evidence_id
    OR (
      coalesce(tb.metadata->>'test_artifact', 'false') = 'true'
      AND tb.subject_profile_id IS NOT DISTINCT FROM v_challenge.subject_profile_id
      AND tb.subject_org_id IS NOT DISTINCT FROM v_challenge.subject_org_id
      AND tb.subject_page_id IS NOT DISTINCT FROM v_challenge.subject_page_id
      AND coalesce(tb.metadata->>'linked_challenge_id', '') = _challenge_id::text
    );

  SELECT coalesce(array_agg(ts.id), '{}'::uuid[])
  INTO v_score_ids
  FROM public.trust_scores ts
  WHERE
    coalesce(ts.metadata->>'test_artifact', 'false') = 'true'
    AND ts.subject_profile_id IS NOT DISTINCT FROM v_challenge.subject_profile_id
    AND ts.subject_org_id IS NOT DISTINCT FROM v_challenge.subject_org_id
    AND ts.subject_page_id IS NOT DISTINCT FROM v_challenge.subject_page_id
    AND coalesce(ts.metadata->>'linked_challenge_id', '') = _challenge_id::text;

  DELETE FROM public.trust_events te
  WHERE
    te.evidence_id = v_challenge.trust_evidence_id
    OR te.check_id = ANY(v_check_ids)
    OR te.badge_id = ANY(v_badge_ids)
    OR te.score_id = ANY(v_score_ids);
  GET DIAGNOSTICS v_deleted_events = ROW_COUNT;

  DELETE FROM public.trust_badges tb
  WHERE tb.id = ANY(v_badge_ids);
  GET DIAGNOSTICS v_deleted_badges = ROW_COUNT;

  DELETE FROM public.trust_checks tc
  WHERE tc.evidence_id = v_challenge.trust_evidence_id;
  GET DIAGNOSTICS v_deleted_checks = ROW_COUNT;

  DELETE FROM public.domain_verification_challenges dvc
  WHERE dvc.trust_evidence_id = v_challenge.trust_evidence_id;
  GET DIAGNOSTICS v_deleted_challenges = ROW_COUNT;

  DELETE FROM public.trust_scores ts
  WHERE ts.id = ANY(v_score_ids);
  GET DIAGNOSTICS v_deleted_scores = ROW_COUNT;

  DELETE FROM public.trust_evidence te
  WHERE te.id = v_challenge.trust_evidence_id;
  GET DIAGNOSTICS v_deleted_evidence = ROW_COUNT;

  INSERT INTO public.trust_events (
    subject_profile_id,
    subject_org_id,
    subject_page_id,
    subject_category,
    event_type,
    actor_user_id,
    actor_role,
    note,
    payload
  ) VALUES (
    v_challenge.subject_profile_id,
    v_challenge.subject_org_id,
    v_challenge.subject_page_id,
    v_challenge.subject_category,
    'manual_review_completed',
    v_actor,
    'platform_reviewer',
    'Domain verification test artifacts cleaned up',
    jsonb_build_object(
      'challenge_id', _challenge_id,
      'deleted_events', v_deleted_events,
      'deleted_badges', v_deleted_badges,
      'deleted_checks', v_deleted_checks,
      'deleted_challenges', v_deleted_challenges,
      'deleted_scores', v_deleted_scores,
      'deleted_evidence', v_deleted_evidence
    )
  );

  RETURN jsonb_build_object(
    'challenge_id', _challenge_id,
    'trust_evidence_id', v_challenge.trust_evidence_id,
    'deleted_events', v_deleted_events,
    'deleted_badges', v_deleted_badges,
    'deleted_checks', v_deleted_checks,
    'deleted_challenges', v_deleted_challenges,
    'deleted_scores', v_deleted_scores,
    'deleted_evidence', v_deleted_evidence
  );
END;
$function$;

COMMENT ON FUNCTION public.cleanup_domain_verification_test_artifacts(uuid) IS
'Moderator-only cleanup helper for explicit domain verification test artifacts. Deletes the specified challenge chain and only removes trust_scores that are tagged as test artifacts for that challenge.';

REVOKE ALL ON FUNCTION public.cleanup_domain_verification_test_artifacts(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_domain_verification_test_artifacts(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.create_temporary_domain_verified_badge_for_test(
  _subject_profile_id uuid DEFAULT NULL,
  _subject_org_id uuid DEFAULT NULL,
  _subject_page_id uuid DEFAULT NULL,
  _domain_or_email text DEFAULT NULL,
  _evidence_type text DEFAULT 'domain_email'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_actor uuid := auth.uid();
  v_domain text;
  v_subject_category text;
  v_evidence_id uuid;
  v_score_result jsonb;
  v_score_id uuid;
  v_badge_id uuid;
BEGIN
  IF NOT public.current_user_is_moderator() THEN
    RAISE EXCEPTION 'Only Tiikme moderators can create temporary Domain Verified badge test artifacts';
  END IF;

  IF ((_subject_profile_id IS NOT NULL)::int +
      (_subject_org_id IS NOT NULL)::int +
      (_subject_page_id IS NOT NULL)::int) <> 1 THEN
    RAISE EXCEPTION 'Exactly one trust subject must be provided';
  END IF;

  IF _evidence_type NOT IN ('domain_email', 'website') THEN
    RAISE EXCEPTION 'Temporary Domain Verified badge helper only supports domain_email or website evidence';
  END IF;

  v_domain := public.normalize_trust_domain_input(_domain_or_email, _evidence_type);
  v_subject_category := public.derive_trust_subject_category(
    _subject_profile_id,
    _subject_org_id,
    _subject_page_id
  );

  INSERT INTO public.trust_evidence (
    subject_profile_id,
    subject_org_id,
    subject_page_id,
    subject_category,
    evidence_type,
    status,
    confidence_score,
    source_type,
    source_label,
    source_url,
    source_reference,
    evidence_value,
    evidence_hash,
    collected_by_user_id,
    observed_at,
    verified_at,
    expires_at,
    metadata
  ) VALUES (
    _subject_profile_id,
    _subject_org_id,
    _subject_page_id,
    v_subject_category,
    _evidence_type,
    'valid',
    85,
    'reviewer_added',
    'temporary_domain_badge_test',
    CASE WHEN _evidence_type = 'website' THEN 'https://' || v_domain ELSE NULL END,
    'moderator_test_helper',
    v_domain,
    md5(v_domain),
    v_actor,
    now(),
    now(),
    now() + interval '1 day',
    jsonb_build_object(
      'test_artifact', true,
      'test_artifact_kind', 'temporary_domain_verified_badge',
      'created_by_helper', 'create_temporary_domain_verified_badge_for_test'
    )
  )
  RETURNING id INTO v_evidence_id;

  INSERT INTO public.trust_events (
    subject_profile_id,
    subject_org_id,
    subject_page_id,
    subject_category,
    event_type,
    actor_user_id,
    actor_role,
    evidence_id,
    note,
    payload
  ) VALUES (
    _subject_profile_id,
    _subject_org_id,
    _subject_page_id,
    v_subject_category,
    'evidence_added',
    v_actor,
    'platform_reviewer',
    v_evidence_id,
    'Temporary domain verification evidence created for public badge visibility test',
    jsonb_build_object(
      'test_artifact', true,
      'evidence_type', _evidence_type,
      'domain', v_domain
    )
  );

  v_score_result := public.internal_recompute_trust_score(
    _subject_profile_id,
    _subject_org_id,
    _subject_page_id,
    v_subject_category,
    'temporary domain verified badge test',
    v_actor,
    'platform_reviewer'
  );
  v_score_id := (v_score_result->>'score_id')::uuid;

  UPDATE public.trust_scores
  SET metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
    'test_artifact', true,
    'test_artifact_kind', 'temporary_domain_verified_badge'
  ),
      updated_at = now()
  WHERE id = v_score_id;

  INSERT INTO public.trust_badges (
    subject_profile_id,
    subject_org_id,
    subject_page_id,
    subject_category,
    badge_type,
    status,
    confidence_score,
    evidence_id,
    score_id,
    issued_reason,
    expires_at,
    metadata
  ) VALUES (
    _subject_profile_id,
    _subject_org_id,
    _subject_page_id,
    v_subject_category,
    'Domain Verified',
    'active',
    85,
    v_evidence_id,
    v_score_id,
    'Temporary Domain Verified badge visibility test',
    now() + interval '1 day',
    jsonb_build_object(
      'test_artifact', true,
      'test_artifact_kind', 'temporary_domain_verified_badge',
      'created_by_helper', 'create_temporary_domain_verified_badge_for_test'
    )
  )
  RETURNING id INTO v_badge_id;

  INSERT INTO public.trust_events (
    subject_profile_id,
    subject_org_id,
    subject_page_id,
    subject_category,
    event_type,
    actor_user_id,
    actor_role,
    evidence_id,
    score_id,
    badge_id,
    note,
    payload
  ) VALUES (
    _subject_profile_id,
    _subject_org_id,
    _subject_page_id,
    v_subject_category,
    'badge_issued',
    v_actor,
    'platform_reviewer',
    v_evidence_id,
    v_score_id,
    v_badge_id,
    'Temporary Domain Verified badge created for public-read verification',
    jsonb_build_object(
      'test_artifact', true,
      'badge_type', 'Domain Verified'
    )
  );

  RETURN jsonb_build_object(
    'trust_evidence_id', v_evidence_id,
    'trust_score_id', v_score_id,
    'trust_badge_id', v_badge_id,
    'domain', v_domain,
    'evidence_type', _evidence_type
  );
END;
$function$;

COMMENT ON FUNCTION public.create_temporary_domain_verified_badge_for_test(uuid, uuid, uuid, text, text) IS
'Moderator-only helper that creates a temporary valid domain evidence record, recomputes a tagged test trust score, and inserts a temporary active Domain Verified badge for anon-read validation.';

REVOKE ALL ON FUNCTION public.create_temporary_domain_verified_badge_for_test(uuid, uuid, uuid, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_temporary_domain_verified_badge_for_test(uuid, uuid, uuid, text, text) TO authenticated;

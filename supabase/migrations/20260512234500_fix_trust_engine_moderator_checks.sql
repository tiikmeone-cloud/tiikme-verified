-- Phase 3 follow-up: trust-engine moderator checks should not depend on
-- profiles RLS helper chains. Use a dedicated SECURITY DEFINER helper instead.

CREATE OR REPLACE FUNCTION public.current_user_is_moderator()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.is_moderator = true
  );
$function$;

COMMENT ON FUNCTION public.current_user_is_moderator() IS
'Returns whether the authenticated user is a Tiikme platform moderator. SECURITY DEFINER avoids depending on profiles RLS helper chains.';

REVOKE ALL ON FUNCTION public.current_user_is_moderator() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_is_moderator() TO authenticated;

CREATE OR REPLACE FUNCTION public.guard_trust_evidence_submission()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  v_is_moderator boolean := false;
BEGIN
  v_is_moderator := public.current_user_is_moderator();

  IF NOT v_is_moderator THEN
    IF NEW.evidence_type = 'platform_review' THEN
      RAISE EXCEPTION 'platform_review evidence is system-managed';
    END IF;

    NEW.status := 'pending';
    NEW.verified_at := NULL;
    NEW.expires_at := COALESCE(NEW.expires_at, now() + interval '90 days');
    NEW.source_type := 'owner_submitted';
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.recompute_trust_score(
  _subject_profile_id uuid DEFAULT NULL,
  _subject_org_id uuid DEFAULT NULL,
  _subject_page_id uuid DEFAULT NULL,
  _subject_category text DEFAULT NULL,
  _note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  v_actor uuid := auth.uid();
  v_is_moderator boolean := false;
  v_category text := _subject_category;
  v_valid_signal_count integer := 0;
  v_failed_signal_count integer := 0;
  v_critical_fail_count integer := 0;
  v_high_fail_count integer := 0;
  v_legal integer := 0;
  v_control integer := 0;
  v_presence integer := 0;
  v_relationship integer := 0;
  v_consistency integer := 0;
  v_risk integer := 0;
  v_overall integer := 0;
  v_verdict text := 'needs_review';
  v_score_id uuid;
BEGIN
  IF v_actor IS NOT NULL THEN
    v_is_moderator := public.current_user_is_moderator();

    IF NOT v_is_moderator THEN
      RAISE EXCEPTION 'Only Tiikme moderators can recompute trust scores';
    END IF;
  END IF;

  IF ((_subject_profile_id IS NOT NULL)::int +
      (_subject_org_id IS NOT NULL)::int +
      (_subject_page_id IS NOT NULL)::int) <> 1 THEN
    RAISE EXCEPTION 'Exactly one trust subject must be provided';
  END IF;

  IF v_category IS NULL THEN
    IF _subject_org_id IS NOT NULL THEN
      SELECT CASE
        WHEN type = 'hospital' THEN 'hospital'
        WHEN type = 'college' THEN 'college'
        WHEN type = 'startup' THEN 'startup'
        ELSE 'organization'
      END
      INTO v_category
      FROM public.organizations
      WHERE id = _subject_org_id;
    ELSIF _subject_page_id IS NOT NULL THEN
      SELECT CASE
        WHEN page_type = 'creator' THEN 'youtube_creator'
        WHEN page_type = 'institution' THEN 'institution'
        ELSE 'digital_professional'
      END
      INTO v_category
      FROM public.pages
      WHERE id = _subject_page_id;
    ELSE
      SELECT CASE
        WHEN role = 'student' THEN 'independent_professional'
        WHEN role = 'freelancer' THEN 'freelancer'
        ELSE 'digital_professional'
      END
      INTO v_category
      FROM public.profiles
      WHERE id = _subject_profile_id;
    END IF;
  END IF;

  SELECT
    COUNT(DISTINCT CASE WHEN status = 'valid' THEN evidence_type END),
    COUNT(DISTINCT CASE WHEN status IN ('invalid', 'rejected') THEN evidence_type END),
    LEAST(100, COALESCE(SUM(CASE
      WHEN status = 'valid' AND evidence_type = 'gstin' THEN 20
      WHEN status = 'valid' AND evidence_type = 'mca_cin' THEN 25
      WHEN status = 'valid' AND evidence_type = 'udyam' THEN 20
      WHEN status = 'valid' AND evidence_type = 'official_document' THEN 15
      ELSE 0
    END), 0)),
    LEAST(100, COALESCE(SUM(CASE
      WHEN status = 'valid' AND evidence_type = 'domain_email' THEN 30
      WHEN status = 'valid' AND evidence_type = 'website' THEN 10
      WHEN status = 'valid' AND evidence_type = 'youtube_channel_ownership' THEN 35
      WHEN status = 'valid' AND evidence_type = 'creator_cross_links' THEN 15
      ELSE 0
    END), 0)),
    LEAST(100, COALESCE(SUM(CASE
      WHEN status = 'valid' AND evidence_type = 'public_web_presence' THEN 10
      WHEN status = 'valid' AND evidence_type = 'google_maps_presence' THEN 15
      WHEN status = 'valid' AND evidence_type = 'address_match' THEN 20
      WHEN status = 'valid' AND evidence_type = 'geo_location' THEN 10
      WHEN status = 'valid' AND evidence_type = 'portfolio_url' THEN 10
      WHEN status = 'valid' AND evidence_type = 'youtube_channel_age' THEN 10
      ELSE 0
    END), 0)),
    LEAST(100, COALESCE(SUM(CASE
      WHEN status = 'valid' AND evidence_type = 'institution_relationship' THEN 40
      WHEN status = 'valid' AND evidence_type = 'platform_review' THEN 30
      ELSE 0
    END), 0)),
    LEAST(100, COALESCE(SUM(CASE
      WHEN status = 'valid' AND evidence_type = 'youtube_consistency' THEN 25
      ELSE 0
    END), 0))
  INTO
    v_valid_signal_count,
    v_failed_signal_count,
    v_legal,
    v_control,
    v_presence,
    v_relationship,
    v_consistency
  FROM public.trust_evidence te
  WHERE te.subject_profile_id IS NOT DISTINCT FROM _subject_profile_id
    AND te.subject_org_id IS NOT DISTINCT FROM _subject_org_id
    AND te.subject_page_id IS NOT DISTINCT FROM _subject_page_id;

  SELECT
    COUNT(*) FILTER (WHERE outcome = 'failed' AND risk_level = 'critical'),
    COUNT(*) FILTER (WHERE outcome = 'failed' AND risk_level = 'high')
  INTO v_critical_fail_count, v_high_fail_count
  FROM public.trust_checks tc
  WHERE tc.subject_profile_id IS NOT DISTINCT FROM _subject_profile_id
    AND tc.subject_org_id IS NOT DISTINCT FROM _subject_org_id
    AND tc.subject_page_id IS NOT DISTINCT FROM _subject_page_id;

  v_risk := LEAST(100, v_critical_fail_count * 60 + v_high_fail_count * 30 + v_failed_signal_count * 10);
  v_overall := GREATEST(
    0,
    LEAST(
      100,
      ((v_legal * 30) + (v_control * 25) + (v_presence * 15) + (v_relationship * 15) + (v_consistency * 15)) / 100
      - (v_risk / 2)
    )
  );

  IF v_critical_fail_count > 0 THEN
    v_verdict := 'rejected';
  ELSIF v_high_fail_count > 0 OR v_overall < 25 THEN
    v_verdict := 'high_risk';
  ELSIF v_valid_signal_count < 2 OR v_overall < 50 THEN
    v_verdict := 'needs_review';
  ELSIF v_valid_signal_count >= 3
    AND v_overall >= 75
    AND EXISTS (
      SELECT 1
      FROM public.trust_evidence te
      WHERE te.status = 'valid'
        AND te.evidence_type IN (
          'gstin', 'mca_cin', 'udyam', 'official_document',
          'institution_relationship', 'platform_review', 'youtube_channel_ownership'
        )
        AND te.subject_profile_id IS NOT DISTINCT FROM _subject_profile_id
        AND te.subject_org_id IS NOT DISTINCT FROM _subject_org_id
        AND te.subject_page_id IS NOT DISTINCT FROM _subject_page_id
    )
  THEN
    v_verdict := 'trusted';
  ELSE
    v_verdict := 'likely_real';
  END IF;

  INSERT INTO public.trust_scores (
    subject_profile_id,
    subject_org_id,
    subject_page_id,
    subject_category,
    legal_existence_score,
    ownership_control_score,
    public_presence_score,
    relationship_score,
    consistency_score,
    risk_score,
    overall_score,
    valid_signal_count,
    failed_signal_count,
    verdict,
    computed_by,
    computed_by_user_id,
    explanation,
    internal_notes,
    last_recomputed_at,
    next_review_at,
    expires_at,
    metadata
  ) VALUES (
    _subject_profile_id,
    _subject_org_id,
    _subject_page_id,
    v_category,
    v_legal,
    v_control,
    v_presence,
    v_relationship,
    v_consistency,
    v_risk,
    v_overall,
    v_valid_signal_count,
    v_failed_signal_count,
    v_verdict,
    CASE WHEN v_actor IS NULL THEN 'system' ELSE 'platform_reviewer' END,
    v_actor,
    format('Computed from %s valid signals and %s failed signals', v_valid_signal_count, v_failed_signal_count),
    _note,
    now(),
    now() + interval '90 days',
    now() + interval '180 days',
    jsonb_build_object(
      'critical_fail_count', v_critical_fail_count,
      'high_fail_count', v_high_fail_count
    )
  )
  ON CONFLICT (subject_profile_id, subject_org_id, subject_page_id)
  DO UPDATE SET
    subject_category = EXCLUDED.subject_category,
    legal_existence_score = EXCLUDED.legal_existence_score,
    ownership_control_score = EXCLUDED.ownership_control_score,
    public_presence_score = EXCLUDED.public_presence_score,
    relationship_score = EXCLUDED.relationship_score,
    consistency_score = EXCLUDED.consistency_score,
    risk_score = EXCLUDED.risk_score,
    overall_score = EXCLUDED.overall_score,
    valid_signal_count = EXCLUDED.valid_signal_count,
    failed_signal_count = EXCLUDED.failed_signal_count,
    verdict = EXCLUDED.verdict,
    computed_by = EXCLUDED.computed_by,
    computed_by_user_id = EXCLUDED.computed_by_user_id,
    explanation = EXCLUDED.explanation,
    internal_notes = EXCLUDED.internal_notes,
    last_recomputed_at = EXCLUDED.last_recomputed_at,
    next_review_at = EXCLUDED.next_review_at,
    expires_at = EXCLUDED.expires_at,
    metadata = EXCLUDED.metadata,
    updated_at = now()
  RETURNING id INTO v_score_id;

  INSERT INTO public.trust_events (
    subject_profile_id,
    subject_org_id,
    subject_page_id,
    subject_category,
    event_type,
    actor_user_id,
    actor_role,
    score_id,
    note,
    payload
  ) VALUES (
    _subject_profile_id,
    _subject_org_id,
    _subject_page_id,
    v_category,
    'score_recomputed',
    v_actor,
    CASE WHEN v_actor IS NULL THEN 'system' ELSE 'platform_reviewer' END,
    v_score_id,
    _note,
    jsonb_build_object(
      'verdict', v_verdict,
      'overall_score', v_overall,
      'valid_signal_count', v_valid_signal_count,
      'failed_signal_count', v_failed_signal_count
    )
  );

  RETURN jsonb_build_object(
    'score_id', v_score_id,
    'subject_category', v_category,
    'overall_score', v_overall,
    'valid_signal_count', v_valid_signal_count,
    'failed_signal_count', v_failed_signal_count,
    'verdict', v_verdict
  );
END;
$function$;

DROP POLICY IF EXISTS "trust_evidence_select_involved" ON public.trust_evidence;
CREATE POLICY "trust_evidence_select_involved"
ON public.trust_evidence
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND (
    subject_profile_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.organizations o
      WHERE o.id = trust_evidence.subject_org_id
        AND (
          o.created_by = auth.uid()
          OR EXISTS (
            SELECT 1
            FROM public.org_admins oa
            WHERE oa.org_id = o.id
              AND oa.user_id = auth.uid()
          )
        )
    )
    OR EXISTS (
      SELECT 1
      FROM public.pages pg
      WHERE pg.id = trust_evidence.subject_page_id
        AND pg.created_by = auth.uid()
    )
    OR public.current_user_is_moderator()
  )
);

DROP POLICY IF EXISTS "trust_evidence_insert_owner_or_moderator" ON public.trust_evidence;
CREATE POLICY "trust_evidence_insert_owner_or_moderator"
ON public.trust_evidence
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (
    subject_profile_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.organizations o
      WHERE o.id = trust_evidence.subject_org_id
        AND (
          o.created_by = auth.uid()
          OR EXISTS (
            SELECT 1
            FROM public.org_admins oa
            WHERE oa.org_id = o.id
              AND oa.user_id = auth.uid()
          )
        )
    )
    OR EXISTS (
      SELECT 1
      FROM public.pages pg
      WHERE pg.id = trust_evidence.subject_page_id
        AND pg.created_by = auth.uid()
    )
    OR public.current_user_is_moderator()
  )
);

DROP POLICY IF EXISTS "trust_evidence_update_moderator_only" ON public.trust_evidence;
CREATE POLICY "trust_evidence_update_moderator_only"
ON public.trust_evidence
FOR UPDATE
TO authenticated
USING (public.current_user_is_moderator())
WITH CHECK (public.current_user_is_moderator());

DROP POLICY IF EXISTS "trust_checks_select_involved" ON public.trust_checks;
CREATE POLICY "trust_checks_select_involved"
ON public.trust_checks
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND (
    subject_profile_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.organizations o
      WHERE o.id = trust_checks.subject_org_id
        AND (
          o.created_by = auth.uid()
          OR EXISTS (
            SELECT 1
            FROM public.org_admins oa
            WHERE oa.org_id = o.id
              AND oa.user_id = auth.uid()
          )
        )
    )
    OR EXISTS (
      SELECT 1
      FROM public.pages pg
      WHERE pg.id = trust_checks.subject_page_id
        AND pg.created_by = auth.uid()
    )
    OR public.current_user_is_moderator()
  )
);

DROP POLICY IF EXISTS "trust_checks_write_moderator_only" ON public.trust_checks;
CREATE POLICY "trust_checks_write_moderator_only"
ON public.trust_checks
FOR ALL
TO authenticated
USING (public.current_user_is_moderator())
WITH CHECK (public.current_user_is_moderator());

DROP POLICY IF EXISTS "trust_scores_select_involved" ON public.trust_scores;
CREATE POLICY "trust_scores_select_involved"
ON public.trust_scores
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND (
    subject_profile_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.organizations o
      WHERE o.id = trust_scores.subject_org_id
        AND (
          o.created_by = auth.uid()
          OR EXISTS (
            SELECT 1
            FROM public.org_admins oa
            WHERE oa.org_id = o.id
              AND oa.user_id = auth.uid()
          )
        )
    )
    OR EXISTS (
      SELECT 1
      FROM public.pages pg
      WHERE pg.id = trust_scores.subject_page_id
        AND pg.created_by = auth.uid()
    )
    OR public.current_user_is_moderator()
  )
);

DROP POLICY IF EXISTS "trust_scores_write_moderator_only" ON public.trust_scores;
CREATE POLICY "trust_scores_write_moderator_only"
ON public.trust_scores
FOR ALL
TO authenticated
USING (public.current_user_is_moderator())
WITH CHECK (public.current_user_is_moderator());

DROP POLICY IF EXISTS "trust_badges_write_moderator_only" ON public.trust_badges;
CREATE POLICY "trust_badges_write_moderator_only"
ON public.trust_badges
FOR ALL
TO authenticated
USING (public.current_user_is_moderator())
WITH CHECK (public.current_user_is_moderator());

DROP POLICY IF EXISTS "trust_events_select_involved" ON public.trust_events;
CREATE POLICY "trust_events_select_involved"
ON public.trust_events
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND (
    subject_profile_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.organizations o
      WHERE o.id = trust_events.subject_org_id
        AND (
          o.created_by = auth.uid()
          OR EXISTS (
            SELECT 1
            FROM public.org_admins oa
            WHERE oa.org_id = o.id
              AND oa.user_id = auth.uid()
          )
        )
    )
    OR EXISTS (
      SELECT 1
      FROM public.pages pg
      WHERE pg.id = trust_events.subject_page_id
        AND pg.created_by = auth.uid()
    )
    OR public.current_user_is_moderator()
  )
);

DROP POLICY IF EXISTS "trust_events_insert_moderator_only" ON public.trust_events;
CREATE POLICY "trust_events_insert_moderator_only"
ON public.trust_events
FOR INSERT
TO authenticated
WITH CHECK (public.current_user_is_moderator());

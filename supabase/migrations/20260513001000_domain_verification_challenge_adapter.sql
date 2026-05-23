-- Phase 4A: domain ownership + domain email evidence adapter.
-- This extends the trust engine with auditable domain verification challenges
-- without pretending that DNS/website verification has succeeded when no
-- external checker exists yet.

CREATE TABLE IF NOT EXISTS public.domain_verification_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trust_evidence_id uuid NOT NULL REFERENCES public.trust_evidence(id) ON DELETE CASCADE,
  subject_profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject_org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  subject_page_id uuid REFERENCES public.pages(id) ON DELETE CASCADE,
  subject_category text NOT NULL CHECK (
    subject_category IN (
      'organization',
      'institution',
      'startup',
      'hospital',
      'college',
      'youtube_creator',
      'digital_professional',
      'freelancer',
      'independent_professional'
    )
  ),
  evidence_type text NOT NULL CHECK (evidence_type IN ('domain_email', 'website')),
  domain text NOT NULL,
  method text NOT NULL CHECK (method IN ('dns_txt', 'email_link', 'website_file', 'website_meta')),
  token_hash text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'expired', 'failed')),
  expires_at timestamptz NOT NULL,
  verified_at timestamptz,
  last_attempt_at timestamptz,
  attempts_count integer NOT NULL DEFAULT 0 CHECK (attempts_count >= 0),
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT domain_verification_challenges_single_subject_check CHECK (
    ((subject_profile_id IS NOT NULL)::int +
     (subject_org_id IS NOT NULL)::int +
     (subject_page_id IS NOT NULL)::int) = 1
  )
);

COMMENT ON TABLE public.domain_verification_challenges IS
'Challenge ledger for domain ownership and official domain-email verification. Raw tokens are returned only at challenge creation time and are never stored in plaintext.';

CREATE INDEX IF NOT EXISTS idx_domain_verification_challenges_subject
  ON public.domain_verification_challenges(subject_profile_id, subject_org_id, subject_page_id, status);
CREATE INDEX IF NOT EXISTS idx_domain_verification_challenges_domain
  ON public.domain_verification_challenges(domain, method, status);
CREATE INDEX IF NOT EXISTS idx_domain_verification_challenges_evidence
  ON public.domain_verification_challenges(trust_evidence_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_domain_verification_challenges_active_method
  ON public.domain_verification_challenges(
    domain,
    method,
    coalesce(subject_profile_id::text, ''),
    coalesce(subject_org_id::text, ''),
    coalesce(subject_page_id::text, '')
  )
  WHERE status = 'pending';

ALTER TABLE public.domain_verification_challenges ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.domain_verification_challenges TO authenticated;

CREATE OR REPLACE FUNCTION public.normalize_trust_domain_input(
  _input text,
  _evidence_type text
)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $function$
DECLARE
  v_value text := lower(trim(coalesce(_input, '')));
  v_domain text;
BEGIN
  IF v_value = '' THEN
    RAISE EXCEPTION 'Domain input is required';
  END IF;

  IF _evidence_type = 'domain_email' THEN
    IF position('@' in v_value) = 0 THEN
      RAISE EXCEPTION 'Official email verification requires an email address';
    END IF;
    v_domain := split_part(v_value, '@', 2);
  ELSIF _evidence_type = 'website' THEN
    v_domain := regexp_replace(v_value, '^https?://', '');
    v_domain := split_part(v_domain, '/', 1);
    v_domain := split_part(v_domain, '?', 1);
    v_domain := split_part(v_domain, '#', 1);
  ELSE
    RAISE EXCEPTION 'Unsupported trust evidence type for domain normalization: %', _evidence_type;
  END IF;

  v_domain := regexp_replace(trim(both '.' from v_domain), '^www\.', '');

  IF v_domain !~ '^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid domain format';
  END IF;

  RETURN v_domain;
END;
$function$;

COMMENT ON FUNCTION public.normalize_trust_domain_input(text, text) IS
'Normalizes a domain or domain-bearing email input into a lowercase registrable-style host string.';

CREATE OR REPLACE FUNCTION public.current_user_can_manage_trust_subject(
  _subject_profile_id uuid DEFAULT NULL,
  _subject_org_id uuid DEFAULT NULL,
  _subject_page_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT
    auth.uid() IS NOT NULL
    AND (
      _subject_profile_id = auth.uid()
      OR EXISTS (
        SELECT 1
        FROM public.organizations o
        WHERE o.id = _subject_org_id
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
        WHERE pg.id = _subject_page_id
          AND pg.created_by = auth.uid()
      )
      OR public.current_user_is_moderator()
    );
$function$;

COMMENT ON FUNCTION public.current_user_can_manage_trust_subject(uuid, uuid, uuid) IS
'Returns whether the authenticated user is allowed to manage trust evidence for the given subject.';

REVOKE ALL ON FUNCTION public.current_user_can_manage_trust_subject(uuid, uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_can_manage_trust_subject(uuid, uuid, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.derive_trust_subject_category(
  _subject_profile_id uuid DEFAULT NULL,
  _subject_org_id uuid DEFAULT NULL,
  _subject_page_id uuid DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_category text;
BEGIN
  IF ((_subject_profile_id IS NOT NULL)::int +
      (_subject_org_id IS NOT NULL)::int +
      (_subject_page_id IS NOT NULL)::int) <> 1 THEN
    RAISE EXCEPTION 'Exactly one trust subject must be provided';
  END IF;

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

  IF v_category IS NULL THEN
    RAISE EXCEPTION 'Unable to derive trust subject category';
  END IF;

  RETURN v_category;
END;
$function$;

COMMENT ON FUNCTION public.derive_trust_subject_category(uuid, uuid, uuid) IS
'Derives the trust subject category from the current profile, organization, or page record.';

REVOKE ALL ON FUNCTION public.derive_trust_subject_category(uuid, uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.derive_trust_subject_category(uuid, uuid, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.build_domain_verification_instructions(
  _method text,
  _domain text,
  _raw_token text
)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
AS $function$
BEGIN
  CASE _method
    WHEN 'dns_txt' THEN
      RETURN jsonb_build_object(
        'method', _method,
        'dns_record_name', '_tiikme-challenge.' || _domain,
        'dns_record_type', 'TXT',
        'dns_record_value', 'tiikme-domain-verification=' || _raw_token
      );
    WHEN 'website_meta' THEN
      RETURN jsonb_build_object(
        'method', _method,
        'meta_tag', '<meta name="tiikme-domain-verification" content="' || _raw_token || '" />'
      );
    WHEN 'website_file' THEN
      RETURN jsonb_build_object(
        'method', _method,
        'file_path', '/.well-known/tiikme-domain-verification.txt',
        'file_contents', _raw_token
      );
    WHEN 'email_link' THEN
      RETURN jsonb_build_object(
        'method', _method,
        'delivery_status', 'pending_external_delivery',
        'note', 'Email delivery integration is not configured yet. Token is intentionally not returned in plaintext.'
      );
    ELSE
      RAISE EXCEPTION 'Unsupported domain verification method: %', _method;
  END CASE;
END;
$function$;

COMMENT ON FUNCTION public.build_domain_verification_instructions(text, text, text) IS
'Builds one-time instructions for DNS, website, or email-link domain verification methods.';

CREATE OR REPLACE FUNCTION public.issue_domain_verified_badge_if_eligible(
  _trust_evidence_id uuid,
  _reason text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_evidence public.trust_evidence%ROWTYPE;
  v_score_id uuid;
  v_badge_id uuid;
BEGIN
  SELECT *
  INTO v_evidence
  FROM public.trust_evidence
  WHERE id = _trust_evidence_id;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  IF v_evidence.status <> 'valid' OR v_evidence.evidence_type NOT IN ('domain_email', 'website') THEN
    RETURN NULL;
  END IF;

  SELECT ts.id
  INTO v_score_id
  FROM public.trust_scores ts
  WHERE ts.subject_profile_id IS NOT DISTINCT FROM v_evidence.subject_profile_id
    AND ts.subject_org_id IS NOT DISTINCT FROM v_evidence.subject_org_id
    AND ts.subject_page_id IS NOT DISTINCT FROM v_evidence.subject_page_id;

  IF EXISTS (
    SELECT 1
    FROM public.trust_badges tb
    WHERE tb.status = 'active'
      AND tb.badge_type = 'Domain Verified'
      AND tb.subject_profile_id IS NOT DISTINCT FROM v_evidence.subject_profile_id
      AND tb.subject_org_id IS NOT DISTINCT FROM v_evidence.subject_org_id
      AND tb.subject_page_id IS NOT DISTINCT FROM v_evidence.subject_page_id
  ) THEN
    RETURN NULL;
  END IF;

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
    v_evidence.subject_profile_id,
    v_evidence.subject_org_id,
    v_evidence.subject_page_id,
    v_evidence.subject_category,
    'Domain Verified',
    'active',
    GREATEST(70, v_evidence.confidence_score),
    v_evidence.id,
    v_score_id,
    coalesce(_reason, 'Domain ownership or official email-domain challenge verified'),
    now() + interval '180 days',
    jsonb_build_object(
      'issued_via', 'domain_verification_adapter',
      'evidence_type', v_evidence.evidence_type
    )
  )
  RETURNING id INTO v_badge_id;

  INSERT INTO public.trust_events (
    subject_profile_id,
    subject_org_id,
    subject_page_id,
    subject_category,
    event_type,
    actor_role,
    evidence_id,
    badge_id,
    note,
    payload
  ) VALUES (
    v_evidence.subject_profile_id,
    v_evidence.subject_org_id,
    v_evidence.subject_page_id,
    v_evidence.subject_category,
    'badge_issued',
    'system',
    v_evidence.id,
    v_badge_id,
    coalesce(_reason, 'Domain Verified badge issued'),
    jsonb_build_object(
      'badge_type', 'Domain Verified',
      'evidence_type', v_evidence.evidence_type
    )
  );

  RETURN v_badge_id;
END;
$function$;

COMMENT ON FUNCTION public.issue_domain_verified_badge_if_eligible(uuid, text) IS
'Issues a Domain Verified badge when a valid website or domain-email evidence record exists and the badge is not already active.';

REVOKE ALL ON FUNCTION public.issue_domain_verified_badge_if_eligible(uuid, text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.internal_recompute_trust_score(
  _subject_profile_id uuid DEFAULT NULL,
  _subject_org_id uuid DEFAULT NULL,
  _subject_page_id uuid DEFAULT NULL,
  _subject_category text DEFAULT NULL,
  _note text DEFAULT NULL,
  _actor_user_id uuid DEFAULT NULL,
  _actor_role text DEFAULT 'system'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
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
  IF ((_subject_profile_id IS NOT NULL)::int +
      (_subject_org_id IS NOT NULL)::int +
      (_subject_page_id IS NOT NULL)::int) <> 1 THEN
    RAISE EXCEPTION 'Exactly one trust subject must be provided';
  END IF;

  IF v_category IS NULL THEN
    v_category := public.derive_trust_subject_category(_subject_profile_id, _subject_org_id, _subject_page_id);
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
      WHEN status = 'valid' AND evidence_type = 'website' THEN 25
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
          'institution_relationship', 'platform_review', 'youtube_channel_ownership',
          'domain_email', 'website'
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
    CASE
      WHEN _actor_role IN ('platform_reviewer', 'org_reviewer') THEN _actor_role
      ELSE 'system'
    END,
    _actor_user_id,
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
    _actor_user_id,
    CASE
      WHEN _actor_role IN ('platform_reviewer', 'org_reviewer', 'subject_owner') THEN _actor_role
      ELSE 'system'
    END,
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

COMMENT ON FUNCTION public.internal_recompute_trust_score(uuid, uuid, uuid, text, text, uuid, text) IS
'Internal trust-score recompute helper used by verified system flows and moderator-triggered RPCs.';

REVOKE ALL ON FUNCTION public.internal_recompute_trust_score(uuid, uuid, uuid, text, text, uuid, text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.recompute_trust_score(
  _subject_profile_id uuid DEFAULT NULL,
  _subject_org_id uuid DEFAULT NULL,
  _subject_page_id uuid DEFAULT NULL,
  _subject_category text DEFAULT NULL,
  _note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NOT public.current_user_is_moderator() THEN
    RAISE EXCEPTION 'Only Tiikme moderators can recompute trust scores';
  END IF;

  RETURN public.internal_recompute_trust_score(
    _subject_profile_id,
    _subject_org_id,
    _subject_page_id,
    _subject_category,
    _note,
    auth.uid(),
    'platform_reviewer'
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.guard_trust_badge_issue()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  v_valid_signal_count integer := 0;
  v_platform_review_count integer := 0;
  v_self_issued boolean := false;
BEGIN
  SELECT COUNT(DISTINCT evidence_type)
  INTO v_valid_signal_count
  FROM public.trust_evidence te
  WHERE te.status = 'valid'
    AND (
      te.subject_profile_id IS NOT DISTINCT FROM NEW.subject_profile_id
      AND te.subject_org_id IS NOT DISTINCT FROM NEW.subject_org_id
      AND te.subject_page_id IS NOT DISTINCT FROM NEW.subject_page_id
    );

  SELECT COUNT(*)
  INTO v_platform_review_count
  FROM public.trust_evidence te
  WHERE te.status = 'valid'
    AND te.evidence_type = 'platform_review'
    AND (
      te.subject_profile_id IS NOT DISTINCT FROM NEW.subject_profile_id
      AND te.subject_org_id IS NOT DISTINCT FROM NEW.subject_org_id
      AND te.subject_page_id IS NOT DISTINCT FROM NEW.subject_page_id
    );

  IF NEW.issued_by_user_id IS NOT NULL THEN
    v_self_issued := (
      NEW.issued_by_user_id IS NOT DISTINCT FROM NEW.subject_profile_id
      OR EXISTS (
        SELECT 1
        FROM public.organizations o
        WHERE o.id = NEW.subject_org_id
          AND o.created_by = NEW.issued_by_user_id
      )
      OR EXISTS (
        SELECT 1
        FROM public.pages pg
        WHERE pg.id = NEW.subject_page_id
          AND pg.created_by = NEW.issued_by_user_id
      )
    );
  END IF;

  IF v_self_issued THEN
    RAISE EXCEPTION 'Trust badges cannot be self-issued';
  END IF;

  IF NEW.badge_type = 'Domain Verified' AND NOT EXISTS (
    SELECT 1
    FROM public.trust_evidence te
    WHERE te.status = 'valid'
      AND te.evidence_type IN ('domain_email', 'website')
      AND te.subject_profile_id IS NOT DISTINCT FROM NEW.subject_profile_id
      AND te.subject_org_id IS NOT DISTINCT FROM NEW.subject_org_id
      AND te.subject_page_id IS NOT DISTINCT FROM NEW.subject_page_id
  ) THEN
    RAISE EXCEPTION 'Domain Verified requires valid domain_email or website evidence';
  END IF;

  IF NEW.badge_type = 'GST Verified' AND NOT EXISTS (
    SELECT 1
    FROM public.trust_evidence te
    WHERE te.status = 'valid'
      AND te.evidence_type = 'gstin'
      AND te.subject_profile_id IS NOT DISTINCT FROM NEW.subject_profile_id
      AND te.subject_org_id IS NOT DISTINCT FROM NEW.subject_org_id
      AND te.subject_page_id IS NOT DISTINCT FROM NEW.subject_page_id
  ) THEN
    RAISE EXCEPTION 'GST Verified requires valid gstin evidence';
  END IF;

  IF NEW.badge_type = 'MCA Verified' AND NOT EXISTS (
    SELECT 1
    FROM public.trust_evidence te
    WHERE te.status = 'valid'
      AND te.evidence_type = 'mca_cin'
      AND te.subject_profile_id IS NOT DISTINCT FROM NEW.subject_profile_id
      AND te.subject_org_id IS NOT DISTINCT FROM NEW.subject_org_id
      AND te.subject_page_id IS NOT DISTINCT FROM NEW.subject_page_id
  ) THEN
    RAISE EXCEPTION 'MCA Verified requires valid mca_cin evidence';
  END IF;

  IF NEW.badge_type = 'Udyam Verified' AND NOT EXISTS (
    SELECT 1
    FROM public.trust_evidence te
    WHERE te.status = 'valid'
      AND te.evidence_type = 'udyam'
      AND te.subject_profile_id IS NOT DISTINCT FROM NEW.subject_profile_id
      AND te.subject_org_id IS NOT DISTINCT FROM NEW.subject_org_id
      AND te.subject_page_id IS NOT DISTINCT FROM NEW.subject_page_id
  ) THEN
    RAISE EXCEPTION 'Udyam Verified requires valid udyam evidence';
  END IF;

  IF NEW.badge_type = 'Address Verified' AND NOT EXISTS (
    SELECT 1
    FROM public.trust_evidence te
    WHERE te.status = 'valid'
      AND te.evidence_type = 'address_match'
      AND te.subject_profile_id IS NOT DISTINCT FROM NEW.subject_profile_id
      AND te.subject_org_id IS NOT DISTINCT FROM NEW.subject_org_id
      AND te.subject_page_id IS NOT DISTINCT FROM NEW.subject_page_id
  ) THEN
    RAISE EXCEPTION 'Address Verified requires valid address_match evidence';
  END IF;

  IF NEW.badge_type = 'YouTube Channel Verified' AND NOT EXISTS (
    SELECT 1
    FROM public.trust_evidence te
    WHERE te.status = 'valid'
      AND te.evidence_type = 'youtube_channel_ownership'
      AND te.subject_profile_id IS NOT DISTINCT FROM NEW.subject_profile_id
      AND te.subject_org_id IS NOT DISTINCT FROM NEW.subject_org_id
      AND te.subject_page_id IS NOT DISTINCT FROM NEW.subject_page_id
  ) THEN
    RAISE EXCEPTION 'YouTube Channel Verified requires valid youtube_channel_ownership evidence';
  END IF;

  IF NEW.badge_type = 'Platform Reviewed' AND v_platform_review_count < 1 THEN
    RAISE EXCEPTION 'Platform Reviewed requires valid platform_review evidence';
  END IF;

  IF NEW.badge_type = 'Creator Verified' AND (
    v_valid_signal_count < 2
    OR NOT EXISTS (
      SELECT 1
      FROM public.trust_evidence te
      WHERE te.status = 'valid'
        AND te.evidence_type = 'youtube_channel_ownership'
        AND te.subject_profile_id IS NOT DISTINCT FROM NEW.subject_profile_id
        AND te.subject_org_id IS NOT DISTINCT FROM NEW.subject_org_id
        AND te.subject_page_id IS NOT DISTINCT FROM NEW.subject_page_id
    )
  ) THEN
    RAISE EXCEPTION 'Creator Verified requires channel ownership plus at least one additional valid signal';
  END IF;

  IF NEW.badge_type = 'Institution Verified' AND (
    v_valid_signal_count < 2
    OR NOT EXISTS (
      SELECT 1
      FROM public.trust_evidence te
      WHERE te.status = 'valid'
        AND te.evidence_type IN ('institution_relationship', 'domain_email', 'official_document', 'platform_review')
        AND te.subject_profile_id IS NOT DISTINCT FROM NEW.subject_profile_id
        AND te.subject_org_id IS NOT DISTINCT FROM NEW.subject_org_id
        AND te.subject_page_id IS NOT DISTINCT FROM NEW.subject_page_id
    )
  ) THEN
    RAISE EXCEPTION 'Institution Verified requires at least two valid signals including a strong institutional proof';
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_domain_verification_challenge(
  _subject_profile_id uuid DEFAULT NULL,
  _subject_org_id uuid DEFAULT NULL,
  _subject_page_id uuid DEFAULT NULL,
  _domain_or_email text DEFAULT NULL,
  _evidence_type text DEFAULT 'domain_email',
  _method text DEFAULT 'dns_txt'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_domain text;
  v_subject_category text;
  v_evidence_id uuid;
  v_existing_evidence_id uuid;
  v_existing_status text;
  v_challenge_id uuid;
  v_raw_token text;
  v_token_hash text;
  v_expires_at timestamptz;
  v_actor uuid := auth.uid();
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Authentication is required';
  END IF;

  IF ((_subject_profile_id IS NOT NULL)::int +
      (_subject_org_id IS NOT NULL)::int +
      (_subject_page_id IS NOT NULL)::int) <> 1 THEN
    RAISE EXCEPTION 'Exactly one trust subject must be provided';
  END IF;

  IF _evidence_type NOT IN ('domain_email', 'website') THEN
    RAISE EXCEPTION 'Only domain_email or website evidence can use the domain verification adapter';
  END IF;

  IF _method NOT IN ('dns_txt', 'email_link', 'website_file', 'website_meta') THEN
    RAISE EXCEPTION 'Unsupported domain verification method';
  END IF;

  IF _method = 'email_link' AND _evidence_type <> 'domain_email' THEN
    RAISE EXCEPTION 'email_link challenges are only valid for domain_email evidence';
  END IF;

  IF _method IN ('website_file', 'website_meta') AND _evidence_type <> 'website' THEN
    RAISE EXCEPTION 'website_file and website_meta challenges are only valid for website evidence';
  END IF;

  IF NOT public.current_user_can_manage_trust_subject(_subject_profile_id, _subject_org_id, _subject_page_id) THEN
    RAISE EXCEPTION 'You do not have permission to manage domain verification for this subject';
  END IF;

  v_domain := public.normalize_trust_domain_input(_domain_or_email, _evidence_type);
  v_subject_category := public.derive_trust_subject_category(_subject_profile_id, _subject_org_id, _subject_page_id);
  v_raw_token := md5(gen_random_uuid()::text || ':' || gen_random_uuid()::text || ':' || clock_timestamp()::text);
  v_token_hash := md5(v_raw_token);
  v_expires_at := now() + CASE
    WHEN _method = 'email_link' THEN interval '2 days'
    ELSE interval '7 days'
  END;

  UPDATE public.domain_verification_challenges
  SET status = 'expired',
      updated_at = now()
  WHERE status = 'pending'
    AND method = _method
    AND domain = v_domain
    AND subject_profile_id IS NOT DISTINCT FROM _subject_profile_id
    AND subject_org_id IS NOT DISTINCT FROM _subject_org_id
    AND subject_page_id IS NOT DISTINCT FROM _subject_page_id;

  SELECT id, status
  INTO v_existing_evidence_id, v_existing_status
  FROM public.trust_evidence
  WHERE subject_profile_id IS NOT DISTINCT FROM _subject_profile_id
    AND subject_org_id IS NOT DISTINCT FROM _subject_org_id
    AND subject_page_id IS NOT DISTINCT FROM _subject_page_id
    AND evidence_type = _evidence_type
    AND evidence_value = v_domain
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_existing_evidence_id IS NULL THEN
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
      expires_at,
      metadata
    ) VALUES (
      _subject_profile_id,
      _subject_org_id,
      _subject_page_id,
      v_subject_category,
      _evidence_type,
      'pending',
      0,
      'owner_submitted',
      'domain_verification_challenge',
      CASE WHEN _evidence_type = 'website' THEN 'https://' || v_domain ELSE NULL END,
      _method,
      v_domain,
      md5(v_domain),
      v_actor,
      now(),
      v_expires_at,
      jsonb_build_object(
        'domain', v_domain,
        'challenge_method', _method,
        'created_via', 'create_domain_verification_challenge'
      )
    )
    RETURNING id INTO v_evidence_id;
  ELSE
    v_evidence_id := v_existing_evidence_id;

    UPDATE public.trust_evidence
    SET status = CASE WHEN status = 'valid' THEN status ELSE 'pending' END,
        source_type = CASE WHEN status = 'valid' THEN source_type ELSE 'owner_submitted' END,
        source_label = 'domain_verification_challenge',
        source_url = CASE WHEN _evidence_type = 'website' THEN 'https://' || v_domain ELSE source_url END,
        source_reference = _method,
        evidence_hash = md5(v_domain),
        collected_by_user_id = v_actor,
        last_checked_at = now(),
        expires_at = CASE WHEN status = 'valid' THEN expires_at ELSE v_expires_at END,
        metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
          'domain', v_domain,
          'challenge_method', _method,
          'updated_via', 'create_domain_verification_challenge'
        ),
        updated_at = now()
    WHERE id = v_evidence_id;
  END IF;

  INSERT INTO public.domain_verification_challenges (
    trust_evidence_id,
    subject_profile_id,
    subject_org_id,
    subject_page_id,
    subject_category,
    evidence_type,
    domain,
    method,
    token_hash,
    status,
    expires_at,
    created_by,
    metadata
  ) VALUES (
    v_evidence_id,
    _subject_profile_id,
    _subject_org_id,
    _subject_page_id,
    v_subject_category,
    _evidence_type,
    v_domain,
    _method,
    v_token_hash,
    'pending',
    v_expires_at,
    v_actor,
    jsonb_build_object(
      'created_via', 'create_domain_verification_challenge'
    )
  )
  RETURNING id INTO v_challenge_id;

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
    CASE WHEN v_existing_evidence_id IS NULL THEN 'evidence_added' ELSE 'evidence_updated' END,
    v_actor,
    'subject_owner',
    v_evidence_id,
    'Domain verification challenge created',
    jsonb_build_object(
      'challenge_id', v_challenge_id,
      'method', _method,
      'domain', v_domain,
      'evidence_type', _evidence_type
    )
  );

  RETURN jsonb_build_object(
    'challenge_id', v_challenge_id,
    'trust_evidence_id', v_evidence_id,
    'domain', v_domain,
    'method', _method,
    'evidence_type', _evidence_type,
    'status', 'pending',
    'expires_at', v_expires_at,
    'instructions', public.build_domain_verification_instructions(
      _method,
      v_domain,
      CASE WHEN _method = 'email_link' THEN NULL ELSE v_raw_token END
    )
  );
END;
$function$;

COMMENT ON FUNCTION public.create_domain_verification_challenge(uuid, uuid, uuid, text, text, text) IS
'Creates a domain verification challenge for a profile, organization, or page subject and returns one-time setup instructions.';

CREATE OR REPLACE FUNCTION public.confirm_domain_verification_challenge(
  _challenge_id uuid,
  _provided_token text DEFAULT NULL,
  _observed_payload jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_challenge public.domain_verification_challenges%ROWTYPE;
  v_evidence public.trust_evidence%ROWTYPE;
  v_expected_hash text;
  v_check_id uuid;
  v_score_result jsonb;
  v_badge_id uuid;
  v_now timestamptz := now();
  v_actor uuid := auth.uid();
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Authentication is required';
  END IF;

  SELECT *
  INTO v_challenge
  FROM public.domain_verification_challenges
  WHERE id = _challenge_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Domain verification challenge not found';
  END IF;

  IF NOT public.current_user_can_manage_trust_subject(
    v_challenge.subject_profile_id,
    v_challenge.subject_org_id,
    v_challenge.subject_page_id
  ) THEN
    RAISE EXCEPTION 'You do not have permission to confirm this domain verification challenge';
  END IF;

  SELECT *
  INTO v_evidence
  FROM public.trust_evidence
  WHERE id = v_challenge.trust_evidence_id;

  IF v_challenge.status <> 'pending' THEN
    RETURN jsonb_build_object(
      'challenge_id', v_challenge.id,
      'status', v_challenge.status,
      'message', 'Challenge is no longer pending'
    );
  END IF;

  IF v_challenge.expires_at <= v_now THEN
    UPDATE public.domain_verification_challenges
    SET status = 'expired',
        updated_at = v_now
    WHERE id = v_challenge.id;

    UPDATE public.trust_evidence
    SET status = CASE WHEN status = 'pending' THEN 'expired' ELSE status END,
        last_checked_at = v_now,
        updated_at = v_now
    WHERE id = v_challenge.trust_evidence_id;

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
      v_challenge.subject_profile_id,
      v_challenge.subject_org_id,
      v_challenge.subject_page_id,
      v_challenge.subject_category,
      'evidence_expired',
      v_actor,
      'subject_owner',
      v_challenge.trust_evidence_id,
      'Domain verification challenge expired before confirmation',
      jsonb_build_object('challenge_id', v_challenge.id, 'method', v_challenge.method)
    );

    RETURN jsonb_build_object(
      'challenge_id', v_challenge.id,
      'status', 'expired',
      'message', 'Challenge expired before confirmation'
    );
  END IF;

  UPDATE public.domain_verification_challenges
  SET attempts_count = attempts_count + 1,
      last_attempt_at = v_now,
      updated_at = v_now
  WHERE id = v_challenge.id
  RETURNING * INTO v_challenge;

  IF v_challenge.method = 'email_link' THEN
    IF coalesce(_provided_token, '') = '' THEN
      RETURN jsonb_build_object(
        'challenge_id', v_challenge.id,
        'status', 'pending',
        'message', 'Email-link confirmation requires the one-time verification token from the email link'
      );
    END IF;

    v_expected_hash := md5(_provided_token);

    IF v_expected_hash <> v_challenge.token_hash THEN
      UPDATE public.domain_verification_challenges
      SET status = CASE WHEN attempts_count >= 5 THEN 'failed' ELSE status END,
          updated_at = now()
      WHERE id = v_challenge.id
      RETURNING * INTO v_challenge;

      RETURN jsonb_build_object(
        'challenge_id', v_challenge.id,
        'status', v_challenge.status,
        'message', 'Invalid verification token'
      );
    END IF;

    UPDATE public.domain_verification_challenges
    SET status = 'verified',
        verified_at = v_now,
        updated_at = v_now
    WHERE id = v_challenge.id
    RETURNING * INTO v_challenge;

    UPDATE public.trust_evidence
    SET status = 'valid',
        confidence_score = GREATEST(confidence_score, 85),
        source_type = 'system_observed',
        source_label = 'email_link_verified_domain',
        verified_at = v_now,
        last_checked_at = v_now,
        expires_at = v_now + interval '180 days',
        updated_at = v_now
    WHERE id = v_challenge.trust_evidence_id
    RETURNING * INTO v_evidence;

    INSERT INTO public.trust_checks (
      evidence_id,
      subject_profile_id,
      subject_org_id,
      subject_page_id,
      subject_category,
      check_type,
      outcome,
      risk_level,
      confidence_score,
      performed_by,
      actor_user_id,
      checked_at,
      next_check_at,
      notes,
      result_payload
    ) VALUES (
      v_evidence.id,
      v_evidence.subject_profile_id,
      v_evidence.subject_org_id,
      v_evidence.subject_page_id,
      v_evidence.subject_category,
      v_evidence.evidence_type,
      'passed',
      'low',
      85,
      'system',
      NULL,
      v_now,
      v_now + interval '180 days',
      'Email-link domain verification challenge confirmed',
      jsonb_build_object('challenge_id', v_challenge.id, 'method', v_challenge.method)
    )
    RETURNING id INTO v_check_id;

    INSERT INTO public.trust_events (
      subject_profile_id,
      subject_org_id,
      subject_page_id,
      subject_category,
      event_type,
      actor_user_id,
      actor_role,
      evidence_id,
      check_id,
      note,
      payload
    ) VALUES (
      v_evidence.subject_profile_id,
      v_evidence.subject_org_id,
      v_evidence.subject_page_id,
      v_evidence.subject_category,
      'check_recorded',
      v_actor,
      'subject_owner',
      v_evidence.id,
      v_check_id,
      'Email-link domain verification completed',
      jsonb_build_object(
        'challenge_id', v_challenge.id,
        'method', v_challenge.method,
        'outcome', 'passed'
      )
    );

    v_score_result := public.internal_recompute_trust_score(
      v_evidence.subject_profile_id,
      v_evidence.subject_org_id,
      v_evidence.subject_page_id,
      v_evidence.subject_category,
      'Domain verification challenge confirmed',
      v_actor,
      'subject_owner'
    );

    v_badge_id := public.issue_domain_verified_badge_if_eligible(
      v_evidence.id,
      'Domain verification challenge confirmed'
    );

    RETURN jsonb_build_object(
      'challenge_id', v_challenge.id,
      'status', 'verified',
      'trust_evidence_id', v_evidence.id,
      'trust_check_id', v_check_id,
      'trust_score', v_score_result,
      'badge_id', v_badge_id
    );
  END IF;

  INSERT INTO public.trust_checks (
    evidence_id,
    subject_profile_id,
    subject_org_id,
    subject_page_id,
    subject_category,
    check_type,
    outcome,
    risk_level,
    confidence_score,
    performed_by,
    actor_user_id,
    checked_at,
    notes,
    result_payload
  ) VALUES (
    v_evidence.id,
    v_evidence.subject_profile_id,
    v_evidence.subject_org_id,
    v_evidence.subject_page_id,
    v_evidence.subject_category,
    v_evidence.evidence_type,
    'manual_review_required',
    'medium',
    0,
    'system',
    NULL,
    v_now,
    'External domain verification adapter is not configured yet for this method',
    jsonb_build_object(
      'challenge_id', v_challenge.id,
      'method', v_challenge.method,
      'observed_payload', coalesce(_observed_payload, '{}'::jsonb),
      'auto_verified', false
    )
  )
  RETURNING id INTO v_check_id;

  INSERT INTO public.trust_events (
    subject_profile_id,
    subject_org_id,
    subject_page_id,
    subject_category,
    event_type,
    actor_user_id,
    actor_role,
    evidence_id,
    check_id,
    note,
    payload
  ) VALUES (
    v_evidence.subject_profile_id,
    v_evidence.subject_org_id,
    v_evidence.subject_page_id,
    v_evidence.subject_category,
    'manual_review_requested',
    v_actor,
    'subject_owner',
    v_evidence.id,
    v_check_id,
    'Manual or external verification still required for domain challenge method',
    jsonb_build_object(
      'challenge_id', v_challenge.id,
      'method', v_challenge.method
    )
  );

  RETURN jsonb_build_object(
    'challenge_id', v_challenge.id,
    'status', 'pending_external_check',
    'trust_evidence_id', v_evidence.id,
    'trust_check_id', v_check_id,
    'message', 'External verification is not configured yet for this method. Challenge remains pending.'
  );
END;
$function$;

COMMENT ON FUNCTION public.confirm_domain_verification_challenge(uuid, text, jsonb) IS
'Confirms a domain verification challenge. Email-link challenges can complete immediately when the one-time token is supplied. DNS and website methods remain pending until an external checker is wired.';

CREATE OR REPLACE FUNCTION public.expire_domain_verification_challenges()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_expired_count integer := 0;
  v_evidence_expired_count integer := 0;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.current_user_is_moderator() THEN
    RAISE EXCEPTION 'Only Tiikme moderators can force-expire domain verification challenges';
  END IF;

  WITH expired_rows AS (
    UPDATE public.domain_verification_challenges
    SET status = 'expired',
        updated_at = now()
    WHERE status = 'pending'
      AND expires_at <= now()
    RETURNING *
  ),
  expired_evidence AS (
    UPDATE public.trust_evidence te
    SET status = CASE WHEN te.status = 'pending' THEN 'expired' ELSE te.status END,
        last_checked_at = now(),
        updated_at = now()
    WHERE te.id IN (SELECT trust_evidence_id FROM expired_rows)
      AND NOT EXISTS (
        SELECT 1
        FROM public.domain_verification_challenges dvc
        WHERE dvc.trust_evidence_id = te.id
          AND dvc.status IN ('pending', 'verified')
      )
    RETURNING te.*
  )
  SELECT
    (SELECT count(*) FROM expired_rows),
    (SELECT count(*) FROM expired_evidence)
  INTO v_expired_count, v_evidence_expired_count;

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
  )
  SELECT
    dvc.subject_profile_id,
    dvc.subject_org_id,
    dvc.subject_page_id,
    dvc.subject_category,
    'evidence_expired',
    auth.uid(),
    CASE WHEN auth.uid() IS NULL THEN 'system' ELSE 'platform_reviewer' END,
    dvc.trust_evidence_id,
    'Domain verification challenge expired',
    jsonb_build_object(
      'challenge_id', dvc.id,
      'method', dvc.method,
      'domain', dvc.domain
    )
  FROM public.domain_verification_challenges dvc
  WHERE dvc.status = 'expired'
    AND dvc.updated_at >= now() - interval '1 minute';

  RETURN jsonb_build_object(
    'expired_challenges', v_expired_count,
    'expired_evidence_records', v_evidence_expired_count
  );
END;
$function$;

COMMENT ON FUNCTION public.expire_domain_verification_challenges() IS
'Expires pending domain verification challenges that have passed their expiry and rolls pending trust evidence forward to expired when no active challenge remains.';

DROP POLICY IF EXISTS "domain_verification_challenges_select_involved" ON public.domain_verification_challenges;
CREATE POLICY "domain_verification_challenges_select_involved"
ON public.domain_verification_challenges
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND public.current_user_can_manage_trust_subject(
    subject_profile_id,
    subject_org_id,
    subject_page_id
  )
);

REVOKE ALL ON FUNCTION public.create_domain_verification_challenge(uuid, uuid, uuid, text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.confirm_domain_verification_challenge(uuid, text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.expire_domain_verification_challenges() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.create_domain_verification_challenge(uuid, uuid, uuid, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_domain_verification_challenge(uuid, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.expire_domain_verification_challenges() TO authenticated;

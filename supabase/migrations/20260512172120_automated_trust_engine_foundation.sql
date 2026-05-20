-- Phase 3 foundation: automated trust evidence, checks, scores, badges, and audit.
-- This extends the canonical verification system without replacing it.
-- Public surfaces should show badges, while raw scores stay internal by default.

CREATE TABLE IF NOT EXISTS public.trust_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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
  evidence_type text NOT NULL CHECK (
    evidence_type IN (
      'domain_email',
      'website',
      'gstin',
      'mca_cin',
      'udyam',
      'official_document',
      'address_match',
      'geo_location',
      'google_maps_presence',
      'youtube_channel_ownership',
      'youtube_channel_age',
      'youtube_consistency',
      'creator_cross_links',
      'portfolio_url',
      'public_web_presence',
      'institution_relationship',
      'platform_review'
    )
  ),
  status text NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'valid', 'invalid', 'expired', 'rejected')
  ),
  confidence_score integer NOT NULL DEFAULT 0 CHECK (confidence_score BETWEEN 0 AND 100),
  source_type text NOT NULL DEFAULT 'owner_submitted' CHECK (
    source_type IN ('owner_submitted', 'system_observed', 'reviewer_added', 'imported')
  ),
  source_label text,
  source_url text,
  source_reference text,
  document_path text,
  evidence_value text,
  evidence_hash text,
  collected_by_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  verification_request_id uuid REFERENCES public.verification_requests(id) ON DELETE SET NULL,
  verification_state_id uuid REFERENCES public.profile_verification_state(id) ON DELETE SET NULL,
  observed_at timestamptz NOT NULL DEFAULT now(),
  verified_at timestamptz,
  expires_at timestamptz,
  last_checked_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT trust_evidence_single_subject_check CHECK (
    ((subject_profile_id IS NOT NULL)::int +
     (subject_org_id IS NOT NULL)::int +
     (subject_page_id IS NOT NULL)::int) = 1
  )
);

CREATE TABLE IF NOT EXISTS public.trust_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_id uuid REFERENCES public.trust_evidence(id) ON DELETE CASCADE,
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
  check_type text NOT NULL CHECK (
    check_type IN (
      'domain_email',
      'website',
      'gstin',
      'mca_cin',
      'udyam',
      'official_document',
      'address_match',
      'geo_location',
      'google_maps_presence',
      'youtube_channel_ownership',
      'youtube_channel_age',
      'youtube_consistency',
      'creator_cross_links',
      'portfolio_url',
      'public_web_presence',
      'institution_relationship',
      'platform_review'
    )
  ),
  outcome text NOT NULL CHECK (outcome IN ('passed', 'failed', 'inconclusive', 'manual_review_required')),
  risk_level text NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  confidence_score integer NOT NULL DEFAULT 0 CHECK (confidence_score BETWEEN 0 AND 100),
  performed_by text NOT NULL DEFAULT 'system' CHECK (
    performed_by IN ('system', 'platform_reviewer', 'org_reviewer')
  ),
  actor_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  checked_at timestamptz NOT NULL DEFAULT now(),
  next_check_at timestamptz,
  notes text,
  result_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT trust_checks_single_subject_check CHECK (
    ((subject_profile_id IS NOT NULL)::int +
     (subject_org_id IS NOT NULL)::int +
     (subject_page_id IS NOT NULL)::int) = 1
  )
);

CREATE TABLE IF NOT EXISTS public.trust_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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
  legal_existence_score integer NOT NULL DEFAULT 0 CHECK (legal_existence_score BETWEEN 0 AND 100),
  ownership_control_score integer NOT NULL DEFAULT 0 CHECK (ownership_control_score BETWEEN 0 AND 100),
  public_presence_score integer NOT NULL DEFAULT 0 CHECK (public_presence_score BETWEEN 0 AND 100),
  relationship_score integer NOT NULL DEFAULT 0 CHECK (relationship_score BETWEEN 0 AND 100),
  consistency_score integer NOT NULL DEFAULT 0 CHECK (consistency_score BETWEEN 0 AND 100),
  risk_score integer NOT NULL DEFAULT 0 CHECK (risk_score BETWEEN 0 AND 100),
  overall_score integer NOT NULL DEFAULT 0 CHECK (overall_score BETWEEN 0 AND 100),
  valid_signal_count integer NOT NULL DEFAULT 0 CHECK (valid_signal_count >= 0),
  failed_signal_count integer NOT NULL DEFAULT 0 CHECK (failed_signal_count >= 0),
  verdict text NOT NULL CHECK (
    verdict IN ('trusted', 'likely_real', 'needs_review', 'high_risk', 'rejected')
  ),
  computed_by text NOT NULL DEFAULT 'system' CHECK (
    computed_by IN ('system', 'platform_reviewer', 'org_reviewer')
  ),
  computed_by_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  model_version text NOT NULL DEFAULT 'trust-v1',
  explanation text,
  internal_notes text,
  last_recomputed_at timestamptz NOT NULL DEFAULT now(),
  next_review_at timestamptz,
  expires_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT trust_scores_single_subject_check CHECK (
    ((subject_profile_id IS NOT NULL)::int +
     (subject_org_id IS NOT NULL)::int +
     (subject_page_id IS NOT NULL)::int) = 1
  ),
  CONSTRAINT trust_scores_unique_subject UNIQUE NULLS NOT DISTINCT (
    subject_profile_id, subject_org_id, subject_page_id
  )
);

CREATE TABLE IF NOT EXISTS public.trust_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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
  badge_type text NOT NULL CHECK (
    badge_type IN (
      'Domain Verified',
      'GST Verified',
      'MCA Verified',
      'Udyam Verified',
      'Address Verified',
      'YouTube Channel Verified',
      'Creator Verified',
      'Institution Verified',
      'Platform Reviewed'
    )
  ),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
  confidence_score integer NOT NULL DEFAULT 0 CHECK (confidence_score BETWEEN 0 AND 100),
  evidence_id uuid REFERENCES public.trust_evidence(id) ON DELETE SET NULL,
  score_id uuid REFERENCES public.trust_scores(id) ON DELETE SET NULL,
  verification_state_id uuid REFERENCES public.profile_verification_state(id) ON DELETE SET NULL,
  issued_by_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  issued_by_org_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  issued_reason text,
  issued_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  revoked_at timestamptz,
  revoked_reason text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT trust_badges_single_subject_check CHECK (
    ((subject_profile_id IS NOT NULL)::int +
     (subject_org_id IS NOT NULL)::int +
     (subject_page_id IS NOT NULL)::int) = 1
  )
);

CREATE TABLE IF NOT EXISTS public.trust_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject_org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  subject_page_id uuid REFERENCES public.pages(id) ON DELETE CASCADE,
  subject_category text CHECK (
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
  event_type text NOT NULL CHECK (
    event_type IN (
      'evidence_added',
      'evidence_updated',
      'evidence_expired',
      'check_recorded',
      'score_recomputed',
      'badge_issued',
      'badge_revoked',
      'manual_review_requested',
      'manual_review_completed'
    )
  ),
  actor_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_role text NOT NULL DEFAULT 'system' CHECK (
    actor_role IN ('system', 'subject_owner', 'platform_reviewer', 'org_reviewer')
  ),
  evidence_id uuid REFERENCES public.trust_evidence(id) ON DELETE SET NULL,
  check_id uuid REFERENCES public.trust_checks(id) ON DELETE SET NULL,
  score_id uuid REFERENCES public.trust_scores(id) ON DELETE SET NULL,
  badge_id uuid REFERENCES public.trust_badges(id) ON DELETE SET NULL,
  verification_request_id uuid REFERENCES public.verification_requests(id) ON DELETE SET NULL,
  verification_state_id uuid REFERENCES public.profile_verification_state(id) ON DELETE SET NULL,
  note text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT trust_events_subject_presence_check CHECK (
    subject_profile_id IS NOT NULL OR
    subject_org_id IS NOT NULL OR
    subject_page_id IS NOT NULL OR
    verification_request_id IS NOT NULL OR
    verification_state_id IS NOT NULL
  )
);

COMMENT ON TABLE public.trust_evidence IS
'Internal evidence ledger for automated and manual trust proofs. Evidence may inform verification but does not itself grant full trust.';
COMMENT ON TABLE public.trust_checks IS
'Results of automated or reviewer-run checks against trust evidence. Used to support scoring and auditability.';
COMMENT ON TABLE public.trust_scores IS
'Internal trust scoring snapshots. Raw scores stay internal; public surfaces should rely on trust_badges and canonical verification state.';
COMMENT ON TABLE public.trust_badges IS
'Public-facing evidence badges. These are specific proof badges, not a generic verified badge.';
COMMENT ON TABLE public.trust_events IS
'Append-only trust audit trail across evidence, checks, scores, badges, and review handoffs.';

CREATE INDEX IF NOT EXISTS idx_trust_evidence_profile
  ON public.trust_evidence(subject_profile_id, evidence_type, status);
CREATE INDEX IF NOT EXISTS idx_trust_evidence_org
  ON public.trust_evidence(subject_org_id, evidence_type, status);
CREATE INDEX IF NOT EXISTS idx_trust_evidence_page
  ON public.trust_evidence(subject_page_id, evidence_type, status);
CREATE INDEX IF NOT EXISTS idx_trust_evidence_request
  ON public.trust_evidence(verification_request_id);

CREATE INDEX IF NOT EXISTS idx_trust_checks_evidence
  ON public.trust_checks(evidence_id, checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_trust_checks_profile
  ON public.trust_checks(subject_profile_id, check_type, outcome);
CREATE INDEX IF NOT EXISTS idx_trust_checks_org
  ON public.trust_checks(subject_org_id, check_type, outcome);
CREATE INDEX IF NOT EXISTS idx_trust_checks_page
  ON public.trust_checks(subject_page_id, check_type, outcome);

CREATE INDEX IF NOT EXISTS idx_trust_scores_verdict
  ON public.trust_scores(verdict, overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_trust_scores_profile
  ON public.trust_scores(subject_profile_id);
CREATE INDEX IF NOT EXISTS idx_trust_scores_org
  ON public.trust_scores(subject_org_id);
CREATE INDEX IF NOT EXISTS idx_trust_scores_page
  ON public.trust_scores(subject_page_id);

CREATE INDEX IF NOT EXISTS idx_trust_badges_profile
  ON public.trust_badges(subject_profile_id, badge_type, status);
CREATE INDEX IF NOT EXISTS idx_trust_badges_org
  ON public.trust_badges(subject_org_id, badge_type, status);
CREATE INDEX IF NOT EXISTS idx_trust_badges_page
  ON public.trust_badges(subject_page_id, badge_type, status);

CREATE INDEX IF NOT EXISTS idx_trust_events_subject_time
  ON public.trust_events(subject_profile_id, subject_org_id, subject_page_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trust_events_request
  ON public.trust_events(verification_request_id, created_at DESC);

ALTER TABLE public.trust_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trust_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trust_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trust_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trust_events ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT ON public.trust_evidence TO authenticated;
GRANT SELECT ON public.trust_checks TO authenticated;
GRANT SELECT ON public.trust_scores TO authenticated;
GRANT SELECT ON public.trust_events TO authenticated;
GRANT SELECT ON public.trust_badges TO authenticated, anon;
GRANT INSERT, UPDATE ON public.trust_checks TO authenticated;
GRANT INSERT, UPDATE ON public.trust_scores TO authenticated;
GRANT INSERT, UPDATE ON public.trust_badges TO authenticated;
GRANT INSERT ON public.trust_events TO authenticated;

CREATE OR REPLACE FUNCTION public.set_trust_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.guard_trust_evidence_submission()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  v_is_moderator boolean := false;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.is_moderator = true
  )
  INTO v_is_moderator;

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
      AND te.evidence_type = 'domain_email'
      AND te.subject_profile_id IS NOT DISTINCT FROM NEW.subject_profile_id
      AND te.subject_org_id IS NOT DISTINCT FROM NEW.subject_org_id
      AND te.subject_page_id IS NOT DISTINCT FROM NEW.subject_page_id
  ) THEN
    RAISE EXCEPTION 'Domain Verified requires valid domain_email evidence';
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

CREATE OR REPLACE FUNCTION public.guard_trust_score_write()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  v_valid_signal_count integer := 0;
  v_high_fail_count integer := 0;
  v_has_strong_signal boolean := false;
BEGIN
  SELECT COUNT(DISTINCT evidence_type)
  INTO v_valid_signal_count
  FROM public.trust_evidence te
  WHERE te.status = 'valid'
    AND te.subject_profile_id IS NOT DISTINCT FROM NEW.subject_profile_id
    AND te.subject_org_id IS NOT DISTINCT FROM NEW.subject_org_id
    AND te.subject_page_id IS NOT DISTINCT FROM NEW.subject_page_id;

  SELECT COUNT(*)
  INTO v_high_fail_count
  FROM public.trust_checks tc
  WHERE tc.outcome = 'failed'
    AND tc.risk_level IN ('high', 'critical')
    AND tc.subject_profile_id IS NOT DISTINCT FROM NEW.subject_profile_id
    AND tc.subject_org_id IS NOT DISTINCT FROM NEW.subject_org_id
    AND tc.subject_page_id IS NOT DISTINCT FROM NEW.subject_page_id;

  SELECT EXISTS (
    SELECT 1
    FROM public.trust_evidence te
    WHERE te.status = 'valid'
      AND te.evidence_type IN (
        'gstin', 'mca_cin', 'udyam', 'official_document',
        'institution_relationship', 'platform_review', 'youtube_channel_ownership'
      )
      AND te.subject_profile_id IS NOT DISTINCT FROM NEW.subject_profile_id
      AND te.subject_org_id IS NOT DISTINCT FROM NEW.subject_org_id
      AND te.subject_page_id IS NOT DISTINCT FROM NEW.subject_page_id
  )
  INTO v_has_strong_signal;

  IF NEW.verdict = 'trusted' AND (
    v_valid_signal_count < 3
    OR v_high_fail_count > 0
    OR NOT v_has_strong_signal
  ) THEN
    RAISE EXCEPTION 'Trusted verdict requires at least three valid signals, no high-risk failures, and at least one strong signal';
  END IF;

  IF NEW.verdict = 'likely_real' AND v_valid_signal_count < 2 THEN
    RAISE EXCEPTION 'Likely real verdict requires at least two valid signals';
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
    SELECT EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = v_actor
        AND p.is_moderator = true
    )
    INTO v_is_moderator;

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

CREATE TRIGGER trg_trust_evidence_set_updated_at
BEFORE UPDATE ON public.trust_evidence
FOR EACH ROW
EXECUTE FUNCTION public.set_trust_updated_at();

CREATE TRIGGER trg_guard_trust_evidence_submission
BEFORE INSERT OR UPDATE ON public.trust_evidence
FOR EACH ROW
EXECUTE FUNCTION public.guard_trust_evidence_submission();

CREATE TRIGGER trg_trust_checks_set_updated_at
BEFORE UPDATE ON public.trust_checks
FOR EACH ROW
EXECUTE FUNCTION public.set_trust_updated_at();

CREATE TRIGGER trg_trust_scores_set_updated_at
BEFORE UPDATE ON public.trust_scores
FOR EACH ROW
EXECUTE FUNCTION public.set_trust_updated_at();

CREATE TRIGGER trg_trust_badges_set_updated_at
BEFORE UPDATE ON public.trust_badges
FOR EACH ROW
EXECUTE FUNCTION public.set_trust_updated_at();

CREATE TRIGGER trg_guard_trust_badge_issue
BEFORE INSERT OR UPDATE ON public.trust_badges
FOR EACH ROW
EXECUTE FUNCTION public.guard_trust_badge_issue();

CREATE TRIGGER trg_guard_trust_score_write
BEFORE INSERT OR UPDATE ON public.trust_scores
FOR EACH ROW
EXECUTE FUNCTION public.guard_trust_score_write();

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
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.is_moderator = true
    )
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
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.is_moderator = true
    )
  )
);

DROP POLICY IF EXISTS "trust_evidence_update_moderator_only" ON public.trust_evidence;
CREATE POLICY "trust_evidence_update_moderator_only"
ON public.trust_evidence
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.is_moderator = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.is_moderator = true
  )
);

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
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.is_moderator = true
    )
  )
);

DROP POLICY IF EXISTS "trust_checks_write_moderator_only" ON public.trust_checks;
CREATE POLICY "trust_checks_write_moderator_only"
ON public.trust_checks
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.is_moderator = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.is_moderator = true
  )
);

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
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.is_moderator = true
    )
  )
);

DROP POLICY IF EXISTS "trust_scores_write_moderator_only" ON public.trust_scores;
CREATE POLICY "trust_scores_write_moderator_only"
ON public.trust_scores
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.is_moderator = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.is_moderator = true
  )
);

DROP POLICY IF EXISTS "trust_badges_public_active_read" ON public.trust_badges;
CREATE POLICY "trust_badges_public_active_read"
ON public.trust_badges
FOR SELECT
TO anon, authenticated
USING (status = 'active');

DROP POLICY IF EXISTS "trust_badges_write_moderator_only" ON public.trust_badges;
CREATE POLICY "trust_badges_write_moderator_only"
ON public.trust_badges
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.is_moderator = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.is_moderator = true
  )
);

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
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.is_moderator = true
    )
  )
);

DROP POLICY IF EXISTS "trust_events_insert_moderator_only" ON public.trust_events;
CREATE POLICY "trust_events_insert_moderator_only"
ON public.trust_events
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.is_moderator = true
  )
);

REVOKE EXECUTE ON FUNCTION public.guard_trust_evidence_submission() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_trust_badge_issue() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_trust_score_write() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.recompute_trust_score(uuid, uuid, uuid, text, text) TO authenticated;

-- Phase 3 follow-up: platform_review evidence must never be self-issued,
-- even by a platform moderator.

CREATE OR REPLACE FUNCTION public.guard_trust_evidence_submission()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  v_is_moderator boolean := false;
  v_is_self_subject boolean := false;
BEGIN
  v_is_moderator := public.current_user_is_moderator();

  IF NEW.evidence_type = 'platform_review' THEN
    v_is_self_subject := (
      NEW.subject_profile_id = auth.uid()
      OR EXISTS (
        SELECT 1
        FROM public.organizations o
        WHERE o.id = NEW.subject_org_id
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
        WHERE pg.id = NEW.subject_page_id
          AND pg.created_by = auth.uid()
      )
    );

    IF v_is_self_subject THEN
      RAISE EXCEPTION 'platform_review evidence cannot be self-inserted';
    END IF;
  END IF;

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

-- Clarify org_members trust semantics without breaking institution onboarding.
-- `org_members` is membership state, not a public profile verification surface.
-- The owner bootstrap row is allowed to mark the creator's membership active,
-- while canonical verification continues to manage reviewed org confirmation.

COMMENT ON COLUMN public.org_members.is_verified IS
'Legacy organization-membership confirmation flag. This does not represent public profile verification. Owner bootstrap may set it for the initial owner membership; canonical verification later upgrades reviewed memberships.';

COMMENT ON COLUMN public.org_members.verified_at IS
'Timestamp for organization-membership confirmation events. Null for bootstrap-only owner memberships until canonical review issues a reviewed confirmation.';

COMMENT ON COLUMN public.org_members.approval_status IS
'Organization-membership workflow state. Use owner_bootstrap for initial creator membership activation and approved for reviewed organization confirmation.';

-- Backfill legacy owner bootstrap rows so they are not indistinguishable from
-- reviewed org confirmations. Keep canonical approved memberships untouched.
UPDATE public.org_members om
SET approval_status = 'owner_bootstrap'
FROM public.organizations o
WHERE om.org_id = o.id
  AND om.user_id = o.created_by
  AND COALESCE(om.role, '') = 'owner'
  AND COALESCE(om.is_verified, false) = true
  AND om.verified_at IS NULL
  AND om.approved_by IS NULL
  AND COALESCE(om.approval_status, 'approved') = 'approved';

CREATE OR REPLACE FUNCTION public.guard_org_member_trust_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  v_owner_bootstrap boolean := false;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_owner_bootstrap := (
      auth.uid() = NEW.user_id
      AND COALESCE(NEW.role, '') = 'owner'
      AND COALESCE(NEW.is_verified, false) = true
      AND NEW.verified_at IS NULL
      AND NEW.approved_by IS NULL
      AND COALESCE(NEW.approval_status, 'owner_bootstrap') = 'owner_bootstrap'
      AND EXISTS (
        SELECT 1
        FROM public.organizations o
        WHERE o.id = NEW.org_id
          AND o.created_by = auth.uid()
      )
    );

    IF NOT public.verification_internal_write_allowed()
      AND (
        COALESCE(NEW.is_verified, false) = true
        OR NEW.verified_at IS NOT NULL
        OR NEW.approved_by IS NOT NULL
        OR NEW.approval_status IS NOT NULL
      )
      AND NOT v_owner_bootstrap
    THEN
      RAISE EXCEPTION 'Organization membership trust fields are system-managed';
    END IF;

    IF v_owner_bootstrap THEN
      NEW.approval_status := 'owner_bootstrap';
      NEW.verified_at := NULL;
      NEW.approved_by := NULL;
    END IF;

    RETURN NEW;
  END IF;

  IF NOT public.verification_internal_write_allowed()
    AND (
      NEW.is_verified IS DISTINCT FROM OLD.is_verified
      OR NEW.verified_at IS DISTINCT FROM OLD.verified_at
      OR NEW.approved_by IS DISTINCT FROM OLD.approved_by
      OR NEW.approval_status IS DISTINCT FROM OLD.approval_status
    )
  THEN
    RAISE EXCEPTION 'Organization membership trust fields are system-managed';
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_guard_org_member_trust_fields ON public.org_members;
CREATE TRIGGER trg_guard_org_member_trust_fields
BEFORE INSERT OR UPDATE ON public.org_members
FOR EACH ROW
EXECUTE FUNCTION public.guard_org_member_trust_fields();

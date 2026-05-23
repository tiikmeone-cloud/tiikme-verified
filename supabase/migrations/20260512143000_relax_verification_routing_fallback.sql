-- If an org has verification routing configured but no matching/default assignee
-- for a specific request, fall back to org admins so requests do not become
-- orphaned and unreviewable.

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

  RETURN true;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.user_can_review_verification_request(uuid, uuid) FROM PUBLIC, anon, authenticated;

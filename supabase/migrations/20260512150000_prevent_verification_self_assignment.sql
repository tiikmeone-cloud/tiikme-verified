-- Prevent verification requests from auto-routing back to the authenticated
-- requester. A trust system must not self-assign reviewers, even as a fallback.
-- This keeps current UI flows working while avoiding new self-review dead-ends.

CREATE OR REPLACE FUNCTION public.resolve_verification_assignee(_org_id uuid, _role_category text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_assignee uuid;
  v_requester uuid := auth.uid();
BEGIN
  -- Try exact role_category match, but never route back to the requesting user.
  SELECT assigned_to_user_id INTO v_assignee
    FROM public.org_verif_routes
    WHERE org_id = _org_id
      AND role_category = _role_category
      AND assigned_to_user_id IS DISTINCT FROM v_requester
    ORDER BY created_at ASC
    LIMIT 1;

  IF v_assignee IS NOT NULL THEN
    RETURN v_assignee;
  END IF;

  -- Try default route, again excluding the requester.
  SELECT assigned_to_user_id INTO v_assignee
    FROM public.org_verif_routes
    WHERE org_id = _org_id
      AND role_category = 'default'
      AND assigned_to_user_id IS DISTINCT FROM v_requester
    ORDER BY created_at ASC
    LIMIT 1;

  IF v_assignee IS NOT NULL THEN
    RETURN v_assignee;
  END IF;

  -- Fallback to any owner/admin except the requester.
  SELECT user_id INTO v_assignee
    FROM public.org_admins
    WHERE org_id = _org_id
      AND role IN ('owner','admin')
      AND user_id IS DISTINCT FROM v_requester
    ORDER BY CASE role WHEN 'owner' THEN 0 ELSE 1 END, created_at ASC
    LIMIT 1;

  RETURN v_assignee;
END;
$function$;

-- Preserve the existing client-callable RPC surface.
REVOKE EXECUTE ON FUNCTION public.resolve_verification_assignee(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.resolve_verification_assignee(uuid, text) TO authenticated;

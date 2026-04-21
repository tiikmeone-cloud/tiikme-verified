
-- 1. Harden increment_score: require auth, restrict caller, cap amount
CREATE OR REPLACE FUNCTION public.increment_score(uid uuid, amount integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF amount < -50 OR amount > 50 THEN
    RAISE EXCEPTION 'Amount out of range';
  END IF;
  -- Caller may only adjust their own score, or the score of a user they share
  -- an accepted strand with (used for symmetric awards on connection accept).
  IF auth.uid() <> uid AND NOT EXISTS (
    SELECT 1 FROM public.strands
    WHERE status = 'accepted'
      AND ((requester_id = auth.uid() AND receiver_id = uid)
        OR (receiver_id = auth.uid() AND requester_id = uid))
  ) THEN
    RAISE EXCEPTION 'Not authorized to modify this user''s score';
  END IF;
  UPDATE public.profiles
    SET activity_score = GREATEST(0, COALESCE(activity_score, 0) + amount)
    WHERE id = uid;
END;
$$;

-- 2. Restrict org_subscriptions SELECT to owner profile + org admins
DROP POLICY IF EXISTS "Anyone can read subscription status" ON public.org_subscriptions;
DROP POLICY IF EXISTS "Owners and org admins can read subscription" ON public.org_subscriptions;

CREATE POLICY "Owners and org admins can read subscription"
ON public.org_subscriptions
FOR SELECT
TO authenticated
USING (
  profile_id = auth.uid()
  OR public.is_org_admin(org_id, auth.uid())
);

-- 3. Restrict workspace_access SELECT to the grantee, granter, or workspace members
DROP POLICY IF EXISTS "wa_read" ON public.workspace_access;
DROP POLICY IF EXISTS "Workspace members can read access grants" ON public.workspace_access;

CREATE POLICY "Workspace members can read access grants"
ON public.workspace_access
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR granted_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.workspace_access wa2
    WHERE wa2.workspace_id = workspace_access.workspace_id
      AND wa2.user_id = auth.uid()
  )
);

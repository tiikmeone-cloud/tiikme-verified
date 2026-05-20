-- Validation follow-up for the Phase 2 verification redesign.
-- Tighten verification request visibility and update permissions so the current
-- inbox only exposes rows to the requester, the historical reviewer, or the
-- reviewer who is currently allowed to act under routing rules.

DROP POLICY IF EXISTS "verif_req_select_involved" ON public.verification_requests;
CREATE POLICY "verif_req_select_involved"
ON public.verification_requests
FOR SELECT
TO authenticated
USING (
  auth.uid() = requester_id
  OR auth.uid() = reviewed_by
  OR public.user_can_review_verification_request(id, auth.uid())
);

DROP POLICY IF EXISTS "verif_req_update_reviewers" ON public.verification_requests;
CREATE POLICY "verif_req_update_reviewers"
ON public.verification_requests
FOR UPDATE
TO authenticated
USING (
  public.user_can_review_verification_request(id, auth.uid())
)
WITH CHECK (
  public.user_can_review_verification_request(id, auth.uid())
);

-- Allow the requester to respond later to a more-info request without opening
-- broader mutation rights; the trigger still enforces exactly what may change.
DROP POLICY IF EXISTS "verif_req_update_requester_resubmit" ON public.verification_requests;
CREATE POLICY "verif_req_update_requester_resubmit"
ON public.verification_requests
FOR UPDATE
TO authenticated
USING (auth.uid() = requester_id)
WITH CHECK (auth.uid() = requester_id);

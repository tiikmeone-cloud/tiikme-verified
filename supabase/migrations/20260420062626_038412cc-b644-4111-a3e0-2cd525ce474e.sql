-- The previous migration's CREATE TABLE IF NOT EXISTS verification_requests was skipped
-- because a table with that name already exists for work-item verification.
-- Create the employer endorsement table under a clean name.

CREATE TABLE IF NOT EXISTS public.employer_endorsement_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  requested_role text NOT NULL,
  work_email text,
  email_verified boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','expired')),
  approved_by uuid REFERENCES public.profiles(id),
  approval_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  UNIQUE(requester_id, org_id, requested_role)
);

ALTER TABLE public.employer_endorsement_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "eer requester or admin reads" ON public.employer_endorsement_requests;
CREATE POLICY "eer requester or admin reads" ON public.employer_endorsement_requests FOR SELECT
  USING (
    requester_id = auth.uid()
    OR public.is_org_admin(org_id, auth.uid())
  );

DROP POLICY IF EXISTS "eer requester creates" ON public.employer_endorsement_requests;
CREATE POLICY "eer requester creates" ON public.employer_endorsement_requests FOR INSERT
  WITH CHECK (requester_id = auth.uid());

DROP POLICY IF EXISTS "eer requester updates own" ON public.employer_endorsement_requests;
CREATE POLICY "eer requester updates own" ON public.employer_endorsement_requests FOR UPDATE
  USING (requester_id = auth.uid() AND status = 'pending');

DROP POLICY IF EXISTS "eer admins resolve" ON public.employer_endorsement_requests;
CREATE POLICY "eer admins resolve" ON public.employer_endorsement_requests FOR UPDATE
  USING (public.is_org_admin(org_id, auth.uid()));

CREATE INDEX IF NOT EXISTS idx_eer_requester ON public.employer_endorsement_requests(requester_id, status);
CREATE INDEX IF NOT EXISTS idx_eer_org ON public.employer_endorsement_requests(org_id, status);
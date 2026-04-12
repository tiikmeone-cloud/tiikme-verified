
-- 1. verification_requests table
CREATE TABLE IF NOT EXISTS public.verification_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_type text NOT NULL,
  item_id uuid NOT NULL,
  submitted_id text NOT NULL,
  supporting_doc_url text,
  context_note text,
  status text DEFAULT 'pending',
  reviewed_by uuid REFERENCES public.profiles(id),
  review_note text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Requesters view own verification requests"
  ON public.verification_requests FOR SELECT
  USING (auth.uid() = requester_id);

CREATE POLICY "Org admins view org verification requests"
  ON public.verification_requests FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.org_members
    WHERE org_members.org_id = verification_requests.org_id
      AND org_members.user_id = auth.uid()
      AND org_members.role IN ('owner', 'admin')
  ));

CREATE POLICY "Users create own verification requests"
  ON public.verification_requests FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Org admins update verification requests"
  ON public.verification_requests FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.org_members
    WHERE org_members.org_id = verification_requests.org_id
      AND org_members.user_id = auth.uid()
      AND org_members.role IN ('owner', 'admin')
  ));

-- 2. post_reposts table
CREATE TABLE IF NOT EXISTS public.post_reposts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  reposted_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reposted_by_org uuid REFERENCES public.organizations(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, reposted_by)
);

ALTER TABLE public.post_reposts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reposts"
  ON public.post_reposts FOR SELECT
  USING (true);

CREATE POLICY "Users create own reposts"
  ON public.post_reposts FOR INSERT
  WITH CHECK (auth.uid() = reposted_by);

CREATE POLICY "Users delete own reposts"
  ON public.post_reposts FOR DELETE
  USING (auth.uid() = reposted_by);

-- 3. Add columns to opportunity_applications
ALTER TABLE public.opportunity_applications
  ADD COLUMN IF NOT EXISTS why_good_fit text,
  ADD COLUMN IF NOT EXISTS portfolio_url text,
  ADD COLUMN IF NOT EXISTS cover_letter text,
  ADD COLUMN IF NOT EXISTS custom_answers jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS recruiter_notes text,
  ADD COLUMN IF NOT EXISTS selected_at timestamptz,
  ADD COLUMN IF NOT EXISTS offer_accepted boolean,
  ADD COLUMN IF NOT EXISTS joined_confirmed boolean;

-- Add unique constraint if not exists (safe with DO block)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'opportunity_applications_opportunity_id_applicant_id_key'
  ) THEN
    ALTER TABLE public.opportunity_applications
      ADD CONSTRAINT opportunity_applications_opportunity_id_applicant_id_key
      UNIQUE (opportunity_id, applicant_id);
  END IF;
END $$;

-- 4. Add columns to org_members
ALTER TABLE public.org_members
  ADD COLUMN IF NOT EXISTS permissions jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS granted_by uuid,
  ADD COLUMN IF NOT EXISTS approved_by uuid,
  ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS department text;

-- Add email_domain column to organizations (idempotent)
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS email_domain text;
CREATE INDEX IF NOT EXISTS idx_organizations_email_domain ON public.organizations(email_domain);

-- Org admins (separate from org_members for clearer admin authority on verification)
CREATE TABLE IF NOT EXISTS public.org_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'admin' CHECK (role IN ('owner','admin','recruiter')),
  invited_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(org_id, user_id)
);
ALTER TABLE public.org_admins ENABLE ROW LEVEL SECURITY;

-- Security definer helper to avoid recursive RLS when policies reference org_admins
CREATE OR REPLACE FUNCTION public.is_org_admin(_org_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.org_admins
    WHERE org_id = _org_id AND user_id = _user_id AND role IN ('owner','admin')
  );
$$;

DROP POLICY IF EXISTS "admins visible" ON public.org_admins;
CREATE POLICY "admins visible" ON public.org_admins FOR SELECT USING (true);

DROP POLICY IF EXISTS "owner adds admin" ON public.org_admins;
CREATE POLICY "owner adds admin" ON public.org_admins FOR INSERT
  WITH CHECK (public.is_org_admin(org_id, auth.uid()) OR user_id = auth.uid());

DROP POLICY IF EXISTS "owner removes admin" ON public.org_admins;
CREATE POLICY "owner removes admin" ON public.org_admins FOR DELETE
  USING (public.is_org_admin(org_id, auth.uid()));

-- Verification requests (employee → org admin endorsement)
CREATE TABLE IF NOT EXISTS public.verification_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
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
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "requester or admin reads" ON public.verification_requests;
CREATE POLICY "requester or admin reads" ON public.verification_requests FOR SELECT
  USING (requester_id = auth.uid() OR public.is_org_admin(org_id, auth.uid()));

DROP POLICY IF EXISTS "requester creates" ON public.verification_requests;
CREATE POLICY "requester creates" ON public.verification_requests FOR INSERT
  WITH CHECK (requester_id = auth.uid());

DROP POLICY IF EXISTS "requester updates own" ON public.verification_requests;
CREATE POLICY "requester updates own" ON public.verification_requests FOR UPDATE
  USING (requester_id = auth.uid());

DROP POLICY IF EXISTS "admins resolve" ON public.verification_requests;
CREATE POLICY "admins resolve" ON public.verification_requests FOR UPDATE
  USING (public.is_org_admin(org_id, auth.uid()));

-- Org admin invites
CREATE TABLE IF NOT EXISTS public.org_admin_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  invited_email text NOT NULL,
  invited_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'admin' CHECK (role IN ('admin','recruiter')),
  token text NOT NULL UNIQUE,
  consumed_at timestamptz,
  consumed_by uuid REFERENCES public.profiles(id),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.org_admin_invites ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_admin_invites_email ON public.org_admin_invites(invited_email);
CREATE INDEX IF NOT EXISTS idx_admin_invites_token ON public.org_admin_invites(token);

DROP POLICY IF EXISTS "admin reads invites" ON public.org_admin_invites;
CREATE POLICY "admin reads invites" ON public.org_admin_invites FOR SELECT
  USING (public.is_org_admin(org_id, auth.uid()) OR invited_email = (SELECT email FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "admin creates invites" ON public.org_admin_invites;
CREATE POLICY "admin creates invites" ON public.org_admin_invites FOR INSERT
  WITH CHECK (public.is_org_admin(org_id, auth.uid()) AND invited_by = auth.uid());

DROP POLICY IF EXISTS "invitee or admin updates invite" ON public.org_admin_invites;
CREATE POLICY "invitee or admin updates invite" ON public.org_admin_invites FOR UPDATE
  USING (public.is_org_admin(org_id, auth.uid()) OR invited_email = (SELECT email FROM public.profiles WHERE id = auth.uid()));

-- Disposable domain blocklist
CREATE TABLE IF NOT EXISTS public.disposable_domains (
  domain text PRIMARY KEY
);
ALTER TABLE public.disposable_domains ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone reads disposable" ON public.disposable_domains;
CREATE POLICY "anyone reads disposable" ON public.disposable_domains FOR SELECT USING (true);

INSERT INTO public.disposable_domains (domain) VALUES
  ('mailinator.com'),('tempmail.com'),('10minutemail.com'),('guerrillamail.com'),
  ('throwaway.email'),('yopmail.com'),('temp-mail.org'),('getnada.com'),
  ('maildrop.cc'),('sharklasers.com'),('trashmail.com')
ON CONFLICT DO NOTHING;

-- Backfill org_admins from existing org_members owners (so existing institution accounts get admin power immediately)
INSERT INTO public.org_admins (org_id, user_id, role)
SELECT om.org_id, om.user_id, CASE WHEN om.role = 'owner' THEN 'owner' ELSE 'admin' END
FROM public.org_members om
WHERE om.role IN ('owner','admin')
ON CONFLICT (org_id, user_id) DO NOTHING;

-- Backfill organizations.email_domain from existing email column
UPDATE public.organizations
SET email_domain = lower(split_part(email, '@', 2))
WHERE email_domain IS NULL AND email IS NOT NULL AND email LIKE '%@%';
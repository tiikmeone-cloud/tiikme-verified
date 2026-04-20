-- ============================================================
-- Verification System Redesign
-- ============================================================

-- 1. Extend verification_requests with entity tracking + thread + auto flag
ALTER TABLE public.verification_requests
  ADD COLUMN IF NOT EXISTS entity_type text DEFAULT 'user_org' CHECK (entity_type IN ('user_org','organization','page','work_item')),
  ADD COLUMN IF NOT EXISTS entity_id uuid,
  ADD COLUMN IF NOT EXISTS role_category text,
  ADD COLUMN IF NOT EXISTS requested_role text,
  ADD COLUMN IF NOT EXISTS review_thread jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS auto_triggered boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS resolved_at timestamptz;

-- Make org_id nullable (entity-based requests don't always need an org)
ALTER TABLE public.verification_requests ALTER COLUMN org_id DROP NOT NULL;

-- 2. Extend org_verif_routes for role-category routing
ALTER TABLE public.org_verif_routes
  ADD COLUMN IF NOT EXISTS role_category text;

CREATE INDEX IF NOT EXISTS idx_org_verif_routes_org_role ON public.org_verif_routes(org_id, role_category);
CREATE INDEX IF NOT EXISTS idx_verif_requests_assigned ON public.verification_requests(assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_verif_requests_entity ON public.verification_requests(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_verif_requests_requester ON public.verification_requests(requester_id, status);

-- 3. RLS policies
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_verif_routes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "verif_req_insert_self" ON public.verification_requests;
DROP POLICY IF EXISTS "verif_req_select_involved" ON public.verification_requests;
DROP POLICY IF EXISTS "verif_req_update_assignee_or_admin" ON public.verification_requests;
DROP POLICY IF EXISTS "verif_req_update_requester_thread" ON public.verification_requests;

CREATE POLICY "verif_req_insert_self" ON public.verification_requests
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "verif_req_select_involved" ON public.verification_requests
  FOR SELECT TO authenticated
  USING (
    auth.uid() = requester_id
    OR auth.uid() = assigned_to
    OR auth.uid() = reviewed_by
    OR (org_id IS NOT NULL AND public.is_org_admin(org_id, auth.uid()))
  );

CREATE POLICY "verif_req_update_assignee_or_admin" ON public.verification_requests
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = assigned_to
    OR (org_id IS NOT NULL AND public.is_org_admin(org_id, auth.uid()))
    OR auth.uid() = requester_id
  );

DROP POLICY IF EXISTS "org_verif_routes_admin_all" ON public.org_verif_routes;
CREATE POLICY "org_verif_routes_admin_all" ON public.org_verif_routes
  FOR ALL TO authenticated
  USING (public.is_org_admin(org_id, auth.uid()))
  WITH CHECK (public.is_org_admin(org_id, auth.uid()));

-- 4. Trigger: auto-verify org on create + auto-create a verification_request audit row
CREATE OR REPLACE FUNCTION public.auto_verify_new_org()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Auto-mark new orgs as verified (per product decision: trust on create)
  NEW.is_verified := true;
  NEW.verification_type := COALESCE(NEW.verification_type, 'auto');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_verify_new_org ON public.organizations;
CREATE TRIGGER trg_auto_verify_new_org
  BEFORE INSERT ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.auto_verify_new_org();

-- 5. Trigger: when a request is approved, mark requester as verified
CREATE OR REPLACE FUNCTION public.on_verification_approved()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    UPDATE public.profiles
      SET is_verified = true,
          verification_type = COALESCE(verification_type, 'org'),
          verified_by = NEW.reviewed_by,
          verified_at = now()
      WHERE id = NEW.requester_id;
    NEW.resolved_at := now();
  ELSIF NEW.status IN ('rejected') AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    NEW.resolved_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_on_verification_approved ON public.verification_requests;
CREATE TRIGGER trg_on_verification_approved
  BEFORE UPDATE ON public.verification_requests
  FOR EACH ROW EXECUTE FUNCTION public.on_verification_approved();

-- 6. Helper: resolve assignee for a request based on org_verif_routes
CREATE OR REPLACE FUNCTION public.resolve_verification_assignee(_org_id uuid, _role_category text)
RETURNS uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_assignee uuid;
BEGIN
  -- Try exact role_category match
  SELECT assigned_to_user_id INTO v_assignee
    FROM public.org_verif_routes
    WHERE org_id = _org_id AND role_category = _role_category
    LIMIT 1;

  IF v_assignee IS NOT NULL THEN RETURN v_assignee; END IF;

  -- Try default route
  SELECT assigned_to_user_id INTO v_assignee
    FROM public.org_verif_routes
    WHERE org_id = _org_id AND role_category = 'default'
    LIMIT 1;

  IF v_assignee IS NOT NULL THEN RETURN v_assignee; END IF;

  -- Fallback: any owner/admin of the org
  SELECT user_id INTO v_assignee
    FROM public.org_admins
    WHERE org_id = _org_id AND role IN ('owner','admin')
    ORDER BY CASE role WHEN 'owner' THEN 0 ELSE 1 END, created_at ASC
    LIMIT 1;

  RETURN v_assignee;
END;
$$;

-- Add missing columns to verification_requests
ALTER TABLE public.verification_requests
  ADD COLUMN IF NOT EXISTS assigned_to uuid,
  ADD COLUMN IF NOT EXISTS document_url text,
  ADD COLUMN IF NOT EXISTS document_type text,
  ADD COLUMN IF NOT EXISTS requested_doc_message text;

-- Update RLS to include assigned_to
DO $$ BEGIN
  DROP POLICY IF EXISTS "vr_assigned_read" ON public.verification_requests;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "vr_assigned_read" ON public.verification_requests FOR SELECT
  USING (auth.uid() = assigned_to);

DO $$ BEGIN
  DROP POLICY IF EXISTS "vr_assigned_update" ON public.verification_requests;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "vr_assigned_update" ON public.verification_requests FOR UPDATE
  USING (auth.uid() = assigned_to);

-- Workspace access grants table
CREATE TABLE IF NOT EXISTS public.workspace_access (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid,
  user_id uuid NOT NULL,
  access_type text NOT NULL,
  granted_by uuid,
  granted_at timestamptz DEFAULT now(),
  UNIQUE(workspace_id, user_id, access_type)
);
ALTER TABLE public.workspace_access ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "wa_read" ON public.workspace_access;
  DROP POLICY IF EXISTS "wa_manage" ON public.workspace_access;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "wa_read" ON public.workspace_access FOR SELECT USING (true);
CREATE POLICY "wa_manage" ON public.workspace_access FOR ALL
  USING (auth.uid() = granted_by);

-- Add missing columns to opportunities table
ALTER TABLE public.opportunities
  ADD COLUMN IF NOT EXISTS screening_questions jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS activity_score_min integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS require_resume boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS ask_portfolio boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS custom_attachment_label text,
  ADD COLUMN IF NOT EXISTS hr_contact_id uuid,
  ADD COLUMN IF NOT EXISTS applications_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';

-- Enable realtime
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.verification_requests; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.opportunity_applications; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

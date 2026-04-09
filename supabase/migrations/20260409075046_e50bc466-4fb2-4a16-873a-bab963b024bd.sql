
CREATE TABLE public.verifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_user_id UUID NOT NULL,
  verifier_user_id UUID,
  verification_type TEXT,
  scope TEXT DEFAULT 'profile',
  work_item_id UUID,
  status TEXT DEFAULT 'pending',
  verified_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own verifications" ON public.verifications
  FOR SELECT TO authenticated
  USING (auth.uid() = subject_user_id OR auth.uid() = verifier_user_id);

CREATE POLICY "Users create verification requests" ON public.verifications
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = subject_user_id);

CREATE POLICY "Verifiers update verifications" ON public.verifications
  FOR UPDATE TO authenticated
  USING (auth.uid() = verifier_user_id);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS verification_type TEXT,
  ADD COLUMN IF NOT EXISTS verification_badge_text TEXT,
  ADD COLUMN IF NOT EXISTS about_qa JSONB DEFAULT '{}';

ALTER TABLE public.work_items
  ADD COLUMN IF NOT EXISTS is_tiiked BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS tiiked_by UUID,
  ADD COLUMN IF NOT EXISTS project_type TEXT;

ALTER PUBLICATION supabase_realtime ADD TABLE public.verifications;


-- Fix post_reactions unique constraint (like button duplicate prevention)
ALTER TABLE post_reactions DROP CONSTRAINT IF EXISTS post_reactions_post_id_user_id_key;
ALTER TABLE post_reactions ADD CONSTRAINT post_reactions_post_id_user_id_key UNIQUE (post_id, user_id);

-- New: org_access_rules for granular permissions
CREATE TABLE IF NOT EXISTS public.org_access_rules (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  member_id uuid REFERENCES profiles(id),
  access_type text NOT NULL,
  department_scope text,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE org_access_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "oar_read" ON org_access_rules FOR SELECT USING (true);
CREATE POLICY "oar_manage" ON org_access_rules FOR ALL USING (
  EXISTS(SELECT 1 FROM org_members WHERE org_id=org_access_rules.org_id AND user_id=auth.uid() AND role IN('owner','admin'))
);

-- New: certificates issued by orgs to users
CREATE TABLE IF NOT EXISTS public.certificates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  issued_to uuid REFERENCES profiles(id) ON DELETE CASCADE,
  issued_by uuid REFERENCES profiles(id),
  title text NOT NULL,
  description text,
  issued_date date DEFAULT CURRENT_DATE,
  expiry_date date,
  certificate_url text,
  is_verified boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cert_read" ON certificates FOR SELECT USING (true);
CREATE POLICY "cert_create" ON certificates FOR INSERT WITH CHECK (
  EXISTS(SELECT 1 FROM org_access_rules WHERE org_id=certificates.org_id AND member_id=auth.uid() AND access_type='issue_certificates')
  OR EXISTS(SELECT 1 FROM org_members WHERE org_id=certificates.org_id AND user_id=auth.uid() AND role IN('owner','admin'))
);

-- New: hiring assessments
CREATE TABLE IF NOT EXISTS public.hiring_assessments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  job_id uuid,
  title text NOT NULL,
  description text,
  pass_score integer DEFAULT 70,
  questions jsonb DEFAULT '[]',
  created_by uuid REFERENCES profiles(id),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE hiring_assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ha_read" ON hiring_assessments FOR SELECT USING (true);
CREATE POLICY "ha_create" ON hiring_assessments FOR INSERT WITH CHECK (
  EXISTS(SELECT 1 FROM org_members WHERE org_id=hiring_assessments.org_id AND user_id=auth.uid() AND role IN('owner','admin'))
  OR EXISTS(SELECT 1 FROM org_access_rules WHERE org_id=hiring_assessments.org_id AND member_id=auth.uid() AND access_type='post_jobs')
);

-- New: assessment attempts
CREATE TABLE IF NOT EXISTS public.assessment_attempts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id uuid REFERENCES hiring_assessments(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  answers jsonb DEFAULT '{}',
  score integer,
  passed boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(assessment_id, user_id)
);
ALTER TABLE assessment_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "aa_own" ON assessment_attempts FOR ALL USING (auth.uid()=user_id);

-- Add new columns to opportunities
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES organizations(id);
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS is_remote boolean DEFAULT false;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS salary_min integer;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS salary_max integer;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS salary_currency text DEFAULT 'INR';
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS skills_required text[] DEFAULT '{}';
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS experience_min integer DEFAULT 0;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS assessment_id uuid REFERENCES hiring_assessments(id);

-- Add new columns to opportunity_applications
ALTER TABLE opportunity_applications ADD COLUMN IF NOT EXISTS resume_url text;
ALTER TABLE opportunity_applications ADD COLUMN IF NOT EXISTS assessment_score integer;
ALTER TABLE opportunity_applications ADD COLUMN IF NOT EXISTS assessment_passed boolean;
ALTER TABLE opportunity_applications ADD COLUMN IF NOT EXISTS message text;

-- Storage bucket for certificates
INSERT INTO storage.buckets(id, name, public) VALUES('certificates', 'certificates', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets(id, name, public) VALUES('resumes', 'resumes', false) ON CONFLICT DO NOTHING;

-- Storage policies for new buckets
DO $$ BEGIN
  CREATE POLICY "cert_storage_read" ON storage.objects FOR SELECT USING (bucket_id='certificates');
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "cert_storage_write" ON storage.objects FOR INSERT WITH CHECK (bucket_id='certificates' AND auth.uid() IS NOT NULL);
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "resume_storage_read" ON storage.objects FOR SELECT USING (bucket_id='resumes' AND auth.uid() IS NOT NULL);
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "resume_storage_write" ON storage.objects FOR INSERT WITH CHECK (bucket_id='resumes' AND auth.uid() IS NOT NULL);
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

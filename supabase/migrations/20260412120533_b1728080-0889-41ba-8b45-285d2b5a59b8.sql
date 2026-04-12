-- Phase 2 & 3 schema changes

-- Add qualification criteria to opportunities
ALTER TABLE public.opportunities
ADD COLUMN IF NOT EXISTS qualification_criteria jsonb DEFAULT '{}'::jsonb;

-- Add is_qualified flag to applications
ALTER TABLE public.opportunity_applications
ADD COLUMN IF NOT EXISTS is_qualified boolean DEFAULT NULL;

-- Add delegation and scope columns to org_access_rules
ALTER TABLE public.org_access_rules
ADD COLUMN IF NOT EXISTS access_scope text DEFAULT 'general',
ADD COLUMN IF NOT EXISTS delegated_by uuid DEFAULT NULL,
ADD COLUMN IF NOT EXISTS delegation_approved boolean DEFAULT NULL;

-- Add is_current to org_members
ALTER TABLE public.org_members
ADD COLUMN IF NOT EXISTS is_current boolean DEFAULT true;
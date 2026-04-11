-- Fix reaction_type check constraint to allow 'like'
ALTER TABLE post_reactions DROP CONSTRAINT IF EXISTS post_reactions_reaction_type_check;
ALTER TABLE post_reactions ADD CONSTRAINT post_reactions_reaction_type_check 
  CHECK (reaction_type = ANY (ARRAY['insightful'::text, 'useful'::text, 'inspiring'::text, 'like'::text]));

-- Create org_verif_routes table if not exists
CREATE TABLE IF NOT EXISTS public.org_verif_routes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  condition_type text DEFAULT 'department',
  condition_value text,
  assigned_to_user_id uuid,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE org_verif_routes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_verif_routes_admin" ON org_verif_routes FOR ALL 
  USING (EXISTS(SELECT 1 FROM org_members WHERE org_id=org_verif_routes.org_id AND user_id=auth.uid() AND role IN('owner','admin')));

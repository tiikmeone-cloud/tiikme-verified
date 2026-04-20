-- Add linked organization to circles so orgs can create community circles
ALTER TABLE public.circles
  ADD COLUMN IF NOT EXISTS linked_org_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_circles_linked_org_id ON public.circles(linked_org_id);
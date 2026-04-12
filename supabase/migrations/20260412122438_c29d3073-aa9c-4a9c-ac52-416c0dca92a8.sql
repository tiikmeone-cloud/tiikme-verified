-- Allow org admins/HR to also update applications for org opportunities
CREATE POLICY "Org admins update applications"
ON public.opportunity_applications
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM opportunities o
    JOIN org_members om ON om.org_id = o.org_id
    WHERE o.id = opportunity_applications.opportunity_id
    AND om.user_id = auth.uid()
    AND om.role IN ('owner', 'admin')
  )
);

-- Allow org admins to also view applications
CREATE POLICY "Org admins see applications"
ON public.opportunity_applications
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM opportunities o
    JOIN org_members om ON om.org_id = o.org_id
    WHERE o.id = opportunity_applications.opportunity_id
    AND om.user_id = auth.uid()
    AND om.role IN ('owner', 'admin')
  )
);
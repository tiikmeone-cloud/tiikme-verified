DROP POLICY IF EXISTS "users insert own work_items" ON public.work_items;
CREATE POLICY "users insert own work_items" ON public.work_items FOR INSERT WITH CHECK (owner_id = auth.uid());
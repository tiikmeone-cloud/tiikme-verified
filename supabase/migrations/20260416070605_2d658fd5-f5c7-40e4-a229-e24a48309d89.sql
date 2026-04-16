
-- Fix notifications table: allow any authenticated user to INSERT (notifications are created FOR other users)
DROP POLICY IF EXISTS "notif_own" ON public.notifications;

CREATE POLICY "Users can read own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Fix alerts table: allow any authenticated user to INSERT (alerts are created FOR other users)
DROP POLICY IF EXISTS "alerts_own_user" ON public.alerts;

CREATE POLICY "Users can read own alerts"
  ON public.alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own alerts"
  ON public.alerts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own alerts"
  ON public.alerts FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create alerts"
  ON public.alerts FOR INSERT
  TO authenticated
  WITH CHECK (true);

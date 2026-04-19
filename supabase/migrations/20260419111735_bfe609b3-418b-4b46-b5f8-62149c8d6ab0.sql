CREATE TABLE IF NOT EXISTS public.user_mutes (
  muter_id uuid NOT NULL,
  muted_id uuid NOT NULL,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (muter_id, muted_id)
);

ALTER TABLE public.user_mutes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage their own mutes" ON public.user_mutes;
CREATE POLICY "Users manage their own mutes"
  ON public.user_mutes
  FOR ALL
  USING (muter_id = auth.uid())
  WITH CHECK (muter_id = auth.uid());
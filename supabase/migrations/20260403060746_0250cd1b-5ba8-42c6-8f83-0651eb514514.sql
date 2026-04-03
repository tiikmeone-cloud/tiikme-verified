
-- ═══ Power System Tables ═══
CREATE TABLE IF NOT EXISTS public.user_power (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  current_power integer DEFAULT 0,
  total_power_earned integer DEFAULT 0,
  level text DEFAULT 'builder',
  level_num integer DEFAULT 1,
  diamond_count integer DEFAULT 0,
  last_updated timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.power_transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount integer NOT NULL,
  reason text NOT NULL,
  reference_id uuid,
  reference_type text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.user_power ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.power_transactions ENABLE ROW LEVEL SECURITY;

-- Users can read their own power
CREATE POLICY "Users see own power" ON user_power FOR SELECT TO authenticated USING (user_id = auth.uid());
-- Users can read anyone's power (for profile display)
CREATE POLICY "Power publicly readable" ON user_power FOR SELECT TO public USING (true);
-- Users can upsert own power
CREATE POLICY "Users manage own power" ON user_power FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users see own transactions" ON power_transactions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert own transactions" ON power_transactions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Auto-update level when power changes
CREATE OR REPLACE FUNCTION public.update_user_level()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.level := CASE
    WHEN NEW.total_power_earned >= 1000 THEN 'diamond'
    WHEN NEW.total_power_earned >= 500  THEN 'pioneer'
    WHEN NEW.total_power_earned >= 250  THEN 'top_voice'
    WHEN NEW.total_power_earned >= 100  THEN 'verified_pro'
    ELSE 'builder'
  END;
  NEW.level_num := CASE
    WHEN NEW.total_power_earned >= 1000 THEN 5
    WHEN NEW.total_power_earned >= 500  THEN 4
    WHEN NEW.total_power_earned >= 250  THEN 3
    WHEN NEW.total_power_earned >= 100  THEN 2
    ELSE 1
  END;
  NEW.diamond_count := FLOOR(NEW.total_power_earned / 100);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_level ON user_power;
CREATE TRIGGER trigger_update_level
  BEFORE INSERT OR UPDATE ON user_power
  FOR EACH ROW EXECUTE FUNCTION public.update_user_level();

-- ═══ Academy progress ═══
CREATE TABLE IF NOT EXISTS public.academy_progress (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  module_id text NOT NULL,
  completed boolean DEFAULT false,
  score integer DEFAULT 0,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, module_id)
);

ALTER TABLE public.academy_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own progress" ON academy_progress FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ═══ Security: Storage bucket limits ═══
UPDATE storage.buckets SET
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp']
WHERE name = 'avatars';

UPDATE storage.buckets SET
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp','application/pdf']
WHERE name = 'work-assets';

UPDATE storage.buckets SET
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['application/pdf'],
  public = false
WHERE name = 'pings-pdfs';

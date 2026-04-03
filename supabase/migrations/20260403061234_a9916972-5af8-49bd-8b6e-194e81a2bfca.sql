
CREATE OR REPLACE FUNCTION public.update_user_level()
RETURNS TRIGGER LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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


-- Create a SECURITY DEFINER function for awarding power (server-side only)
CREATE OR REPLACE FUNCTION public.award_power(
  p_user_id uuid,
  p_amount integer,
  p_reason text,
  p_reference_id uuid DEFAULT NULL,
  p_reference_type text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_power integer;
  v_total_earned integer;
BEGIN
  -- Only allow the user themselves to call this (or service role)
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Not authorized to award power for another user';
  END IF;

  -- Enforce max amount per transaction to prevent abuse
  IF p_amount < 1 OR p_amount > 50 THEN
    RAISE EXCEPTION 'Power amount must be between 1 and 50';
  END IF;

  -- Insert transaction
  INSERT INTO power_transactions (user_id, amount, reason, reference_id, reference_type)
  VALUES (p_user_id, p_amount, p_reason, p_reference_id, p_reference_type);

  -- Get current totals
  SELECT COALESCE(current_power, 0), COALESCE(total_power_earned, 0)
  INTO v_current_power, v_total_earned
  FROM user_power
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    v_current_power := 0;
    v_total_earned := 0;
  END IF;

  v_current_power := v_current_power + p_amount;
  v_total_earned := v_total_earned + p_amount;

  -- Upsert power
  INSERT INTO user_power (user_id, current_power, total_power_earned, last_updated)
  VALUES (p_user_id, v_current_power, v_total_earned, NOW())
  ON CONFLICT (user_id) DO UPDATE SET
    current_power = EXCLUDED.current_power,
    total_power_earned = EXCLUDED.total_power_earned,
    last_updated = NOW();

  RETURN jsonb_build_object('current_power', v_current_power, 'total_earned', v_total_earned);
END;
$$;

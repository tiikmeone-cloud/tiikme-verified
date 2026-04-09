
-- Fix: Users can directly manipulate their own power/level/diamond data
-- Remove the ALL policy that lets users UPDATE their own power records
-- Keep SELECT-only access; all mutations go through award_power RPC (SECURITY DEFINER)

DROP POLICY IF EXISTS "Users manage own power" ON user_power;

-- Users can only READ their own power data (plus the existing public readable policy)
CREATE POLICY "Users read own power"
  ON user_power FOR SELECT TO authenticated
  USING (user_id = auth.uid());

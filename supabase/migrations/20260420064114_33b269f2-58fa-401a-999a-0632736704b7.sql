
-- 1. Tighten alerts INSERT (was: with_check = true → anyone could spam anyone)
DROP POLICY IF EXISTS "Authenticated users can create alerts" ON public.alerts;
CREATE POLICY "Service role only inserts alerts"
  ON public.alerts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 2. Tighten notifications INSERT (was: with_check = true → anyone could spam anyone)
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON public.notifications;
CREATE POLICY "Users can create notifications addressed to self only"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 3. Add WITH CHECK to UPDATE policies missing it (prevent ownership transfer)
DROP POLICY IF EXISTS "Users can update own alerts" ON public.alerts;
CREATE POLICY "Users can update own alerts"
  ON public.alerts FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authors can update their posts" ON public.circle_posts;
CREATE POLICY "Authors can update their posts"
  ON public.circle_posts FOR UPDATE TO authenticated
  USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Creators can update their circles" ON public.circles;
CREATE POLICY "Creators can update their circles"
  ON public.circles FOR UPDATE TO authenticated
  USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Participants can update own conversations" ON public.conversations;
CREATE POLICY "Participants can update own conversations"
  ON public.conversations FOR UPDATE TO authenticated
  USING (auth.uid() = participant_1 OR auth.uid() = participant_2)
  WITH CHECK (auth.uid() = participant_1 OR auth.uid() = participant_2);

DROP POLICY IF EXISTS "eer admins resolve" ON public.employer_endorsement_requests;
CREATE POLICY "eer admins resolve"
  ON public.employer_endorsement_requests FOR UPDATE TO authenticated
  USING (is_org_admin(org_id, auth.uid()))
  WITH CHECK (is_org_admin(org_id, auth.uid()));

DROP POLICY IF EXISTS "eer requester updates own" ON public.employer_endorsement_requests;
CREATE POLICY "eer requester updates own"
  ON public.employer_endorsement_requests FOR UPDATE TO authenticated
  USING (requester_id = auth.uid() AND status = 'pending')
  WITH CHECK (requester_id = auth.uid() AND status = 'pending');

-- 4. Add verified_at column for badge expiry (6-month auto-lapse)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verified_at timestamptz;

-- Backfill verified_at to created_at for existing verified users (one-time)
UPDATE public.profiles SET verified_at = COALESCE(updated_at, created_at, now())
WHERE is_verified = true AND verified_at IS NULL;

-- 5. Reserved usernames - block creation/update of impersonating handles
CREATE OR REPLACE FUNCTION public.block_reserved_usernames()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.username IS NOT NULL AND lower(NEW.username) IN (
    'admin','administrator','tiikme','tiik','support','moderator','mod',
    'official','team','help','root','system','api','staff','owner',
    'verify','verification','security','abuse','contact','info'
  ) THEN
    RAISE EXCEPTION 'Username "%" is reserved and cannot be used.', NEW.username;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_block_reserved_usernames ON public.profiles;
CREATE TRIGGER trg_block_reserved_usernames
  BEFORE INSERT OR UPDATE OF username ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.block_reserved_usernames();

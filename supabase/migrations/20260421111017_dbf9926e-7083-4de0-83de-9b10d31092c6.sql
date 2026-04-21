-- 1. Add privacy column with sensible defaults
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS privacy jsonb NOT NULL DEFAULT jsonb_build_object(
    'show_location', true,
    'show_company', true,
    'show_in_explore', true,
    'show_connections', 'everyone',
    'who_can_message', 'everyone',
    'who_can_see_posts', 'everyone',
    'show_email', false,
    'show_phone', false,
    'show_education', true,
    'show_experience', true,
    'searchable_by_email', false,
    'show_online_status', true,
    'show_activity', true
  );

-- Backfill any existing nulls (defensive)
UPDATE public.profiles
SET privacy = jsonb_build_object(
    'show_location', true,
    'show_company', true,
    'show_in_explore', true,
    'show_connections', 'everyone',
    'who_can_message', 'everyone',
    'who_can_see_posts', 'everyone',
    'show_email', false,
    'show_phone', false,
    'show_education', true,
    'show_experience', true,
    'searchable_by_email', false,
    'show_online_status', true,
    'show_activity', true
  )
WHERE privacy IS NULL;

-- 2. Helper: are two users connected via accepted strands?
CREATE OR REPLACE FUNCTION public.are_users_connected(_a uuid, _b uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.strands s
    WHERE s.status = 'accepted'
      AND ((s.requester_id = _a AND s.receiver_id = _b)
        OR (s.requester_id = _b AND s.receiver_id = _a))
  );
$$;

-- 3. Replace the public select policy on profiles to honour show_in_explore
DROP POLICY IF EXISTS profiles_select_public ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable" ON public.profiles;

CREATE POLICY profiles_select_public ON public.profiles
  FOR SELECT
  USING (
    -- Owner always sees their own row
    auth.uid() = id
    -- Profile is discoverable
    OR COALESCE((privacy->>'show_in_explore')::boolean, true) = true
    -- Or viewer is a connection
    OR public.are_users_connected(auth.uid(), id)
  );

-- 4. RPC: can the current user message _target?
CREATE OR REPLACE FUNCTION public.can_message_user(_target uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rule text;
  v_is_connection boolean;
  v_is_verified boolean;
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;
  IF auth.uid() = _target THEN RETURN true; END IF;

  SELECT COALESCE(privacy->>'who_can_message','everyone')
    INTO rule
    FROM public.profiles WHERE id = _target;

  IF rule IS NULL OR rule = 'everyone' THEN RETURN true; END IF;
  IF rule = 'no_one' THEN RETURN false; END IF;

  v_is_connection := public.are_users_connected(auth.uid(), _target);
  IF rule = 'connections' THEN RETURN v_is_connection; END IF;

  IF rule = 'verified_only' THEN
    SELECT COALESCE(is_verified,false) INTO v_is_verified
      FROM public.profiles WHERE id = auth.uid();
    RETURN COALESCE(v_is_verified,false);
  END IF;

  RETURN true;
END;
$$;
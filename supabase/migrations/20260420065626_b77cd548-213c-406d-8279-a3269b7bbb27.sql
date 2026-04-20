-- Activity Score V2: role-weighted formula with anti-gaming

-- 1. Role weights table
CREATE TABLE IF NOT EXISTS public.activity_role_weights (
  role text PRIMARY KEY,
  w_content float DEFAULT 1.0,
  w_engagement float DEFAULT 1.0,
  w_connections float DEFAULT 1.0,
  w_profile float DEFAULT 1.0
);

ALTER TABLE public.activity_role_weights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone reads role weights" ON public.activity_role_weights;
CREATE POLICY "anyone reads role weights" ON public.activity_role_weights FOR SELECT USING (true);

INSERT INTO public.activity_role_weights (role, w_content, w_engagement, w_connections, w_profile) VALUES
  ('student',       1.0, 1.2, 0.9, 1.1),
  ('professional',  1.1, 1.0, 1.3, 1.0),
  ('doctor',        0.8, 0.9, 1.4, 1.3),
  ('faculty',       1.2, 1.1, 1.2, 1.2),
  ('hr',            1.0, 1.3, 1.5, 1.1),
  ('founder',       1.3, 1.4, 1.0, 1.2),
  ('institution',   0.5, 0.8, 1.0, 1.5)
ON CONFLICT (role) DO UPDATE SET
  w_content = EXCLUDED.w_content,
  w_engagement = EXCLUDED.w_engagement,
  w_connections = EXCLUDED.w_connections,
  w_profile = EXCLUDED.w_profile;

-- 2. Anti-gaming columns on profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS score_penalty int DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS spam_flag_count int DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS days_active int DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_active_date date;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS activity_score_v2_live boolean DEFAULT true;

-- Add flag_reason to circle_posts (referenced by duplicate detector)
ALTER TABLE public.circle_posts ADD COLUMN IF NOT EXISTS flag_reason text;

-- 3. Duplicate post detection support
CREATE TABLE IF NOT EXISTS public.post_content_hashes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid,
  content_hash text,
  content_preview text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_post_hashes_author_hash ON public.post_content_hashes(author_id, content_hash);

ALTER TABLE public.post_content_hashes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "author reads own hashes" ON public.post_content_hashes;
CREATE POLICY "author reads own hashes" ON public.post_content_hashes FOR SELECT USING (author_id = auth.uid());

-- 4. V2 activity score function (adapted to real schema:
--    no circle_post_comments/circle_post_votes; uses post_comments + circle_post_upvotes)
CREATE OR REPLACE FUNCTION public.calculate_activity_score_v2(uid uuid)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  u_role text;
  w_c float; w_e float; w_n float; w_p float;
  s_content float := 0;
  s_engagement float := 0;
  s_connections float := 0;
  s_profile float := 0;
  bonus_verified int := 0;
  bonus_active int := 0;
  penalty_reports int := 0;
  penalty_spam int := 0;
  final_score int;
  v_is_verified boolean;
  v_days_active int;
  v_spam int;
  v_penalty int;
  posts_score float := 0;
  comments_score float := 0;
BEGIN
  SELECT role, COALESCE(is_verified, false), COALESCE(days_active, 0), COALESCE(spam_flag_count, 0), COALESCE(score_penalty, 0)
    INTO u_role, v_is_verified, v_days_active, v_spam, v_penalty
    FROM public.profiles WHERE id = uid;

  SELECT COALESCE(w_content, 1.0), COALESCE(w_engagement, 1.0), COALESCE(w_connections, 1.0), COALESCE(w_profile, 1.0)
    INTO w_c, w_e, w_n, w_p
    FROM public.activity_role_weights WHERE role = u_role;
  IF w_c IS NULL THEN w_c := 1.0; w_e := 1.0; w_n := 1.0; w_p := 1.0; END IF;

  -- Content: circle posts (last 90d, not flagged) + post comments
  SELECT LEAST(COUNT(*) * 2.0, 30) INTO posts_score
    FROM public.circle_posts
    WHERE author_id = uid AND created_at > now() - interval '90 days' AND is_flagged = false;

  SELECT LEAST(COUNT(*) * 0.5, 10) INTO comments_score
    FROM public.post_comments
    WHERE user_id = uid AND created_at > now() - interval '90 days';

  s_content := COALESCE(posts_score, 0) + COALESCE(comments_score, 0);

  -- Engagement: total upvotes received on own circle posts
  SELECT COALESCE(SUM(upvote_count), 0) INTO s_engagement
    FROM public.circle_posts WHERE author_id = uid;
  s_engagement := LEAST(s_engagement * 0.2, 25);

  -- Connections: accepted strands (capped 50, *0.5)
  SELECT LEAST(COUNT(*), 50) INTO s_connections
    FROM public.strands
    WHERE (requester_id = uid OR receiver_id = uid) AND status = 'accepted';
  s_connections := s_connections * 0.5;

  -- Profile completeness (cap 20)
  SELECT
    (CASE WHEN avatar_url IS NOT NULL THEN 3 ELSE 0 END) +
    (CASE WHEN bio IS NOT NULL AND length(bio) > 50 THEN 3 ELSE 0 END) +
    (CASE WHEN role IS NOT NULL THEN 2 ELSE 0 END) +
    (CASE WHEN role_subtype IS NOT NULL THEN 2 ELSE 0 END) +
    (CASE WHEN headline IS NOT NULL THEN 2 ELSE 0 END) +
    (CASE WHEN (SELECT COUNT(*) FROM public.work_items WHERE owner_id = uid AND item_type = 'experience') > 0 THEN 4 ELSE 0 END) +
    (CASE WHEN (SELECT COUNT(*) FROM public.work_items WHERE owner_id = uid AND item_type = 'education') > 0 THEN 4 ELSE 0 END)
    INTO s_profile
    FROM public.profiles WHERE id = uid;
  s_profile := LEAST(COALESCE(s_profile, 0), 20);

  -- Apply role weights
  s_content := s_content * w_c;
  s_engagement := s_engagement * w_e;
  s_connections := s_connections * w_n;
  s_profile := s_profile * w_p;

  -- Bonuses
  bonus_verified := CASE WHEN v_is_verified THEN 15 ELSE 0 END;
  bonus_active := LEAST(v_days_active / 3, 10);

  -- Penalties
  penalty_reports := LEAST(v_penalty * 5, 25);
  penalty_spam := LEAST(v_spam * 3, 15);

  final_score := GREATEST(0, LEAST(100,
    ROUND(s_content + s_engagement + s_connections + s_profile + bonus_verified + bonus_active - penalty_reports - penalty_spam)::int
  ));

  RETURN final_score;
END;
$$;

-- 5. Bulk refresh function (V2)
CREATE OR REPLACE FUNCTION public.update_all_activity_scores_v2()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles p
    SET activity_score = public.calculate_activity_score_v2(p.id);
END;
$$;

-- 6. Days-active counter (idempotent per calendar day)
CREATE OR REPLACE FUNCTION public.increment_days_active(uid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles SET
    days_active = days_active + CASE WHEN last_active_date IS NULL OR last_active_date < CURRENT_DATE THEN 1 ELSE 0 END,
    last_active_date = CURRENT_DATE
  WHERE id = uid AND (id = auth.uid());
END;
$$;

-- 7. Duplicate post detector (24h window, same author, same content hash)
CREATE OR REPLACE FUNCTION public.detect_duplicate_post()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  h text;
  body_text text;
  dup int;
BEGIN
  body_text := lower(coalesce(NEW.body, NEW.content, ''));
  IF length(body_text) < 10 THEN
    RETURN NEW;
  END IF;
  h := md5(body_text);
  SELECT COUNT(*) INTO dup
    FROM public.post_content_hashes
    WHERE author_id = NEW.author_id AND content_hash = h AND created_at > now() - interval '24 hours';
  IF dup > 0 THEN
    NEW.is_flagged := true;
    NEW.flag_reason := 'duplicate';
    UPDATE public.profiles SET spam_flag_count = COALESCE(spam_flag_count, 0) + 1 WHERE id = NEW.author_id;
  END IF;
  INSERT INTO public.post_content_hashes (author_id, content_hash, content_preview)
    VALUES (NEW.author_id, h, LEFT(body_text, 100));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_dup_post ON public.circle_posts;
CREATE TRIGGER trg_dup_post BEFORE INSERT ON public.circle_posts
  FOR EACH ROW EXECUTE FUNCTION public.detect_duplicate_post();

-- 8. Upvote manipulation limit: same voter can't upvote same author >5x in 24h
CREATE OR REPLACE FUNCTION public.limit_upvote_manipulation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  same_author_votes int;
  v_author uuid;
BEGIN
  SELECT cp.author_id INTO v_author FROM public.circle_posts cp WHERE cp.id = NEW.post_id;
  IF v_author IS NULL OR v_author = NEW.user_id THEN
    RETURN NEW;
  END IF;
  SELECT COUNT(*) INTO same_author_votes
    FROM public.circle_post_upvotes cpu
    JOIN public.circle_posts cp ON cp.id = cpu.post_id
    WHERE cpu.user_id = NEW.user_id AND cp.author_id = v_author AND cpu.created_at > now() - interval '24 hours';
  IF same_author_votes >= 5 THEN
    RAISE EXCEPTION 'Upvote limit: too many upvotes to the same author in 24h';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_upvote_limit ON public.circle_post_upvotes;
CREATE TRIGGER trg_upvote_limit BEFORE INSERT ON public.circle_post_upvotes
  FOR EACH ROW EXECUTE FUNCTION public.limit_upvote_manipulation();

-- 9. One-shot backfill so all existing profiles get their V2 score immediately.
SELECT public.update_all_activity_scores_v2();
-- 1. Moderation flags (fresh table)
CREATE TABLE IF NOT EXISTS public.moderation_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL CHECK (content_type IN ('post','comment','bio','circle_name','circle_post','review')),
  content_id uuid,
  author_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  text_preview text,
  severity float,
  category text,
  status text NOT NULL DEFAULT 'flagged' CHECK (status IN ('flagged','reviewed','dismissed','escalated')),
  source text NOT NULL DEFAULT 'auto' CHECK (source IN ('auto','user_report')),
  reporter_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.moderation_flags ENABLE ROW LEVEL SECURITY;

-- 2. is_moderator flag + helper
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_moderator boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.is_moderator(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT is_moderator FROM public.profiles WHERE id = _user_id), false);
$$;

DROP POLICY IF EXISTS "mods read flags" ON public.moderation_flags;
CREATE POLICY "mods read flags" ON public.moderation_flags FOR SELECT
  USING (public.is_moderator(auth.uid()));

DROP POLICY IF EXISTS "anyone reports flags" ON public.moderation_flags;
CREATE POLICY "anyone reports flags" ON public.moderation_flags FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      (source = 'user_report' AND reporter_id = auth.uid())
      OR (source = 'auto' AND author_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "mods update flags" ON public.moderation_flags;
CREATE POLICY "mods update flags" ON public.moderation_flags FOR UPDATE
  USING (public.is_moderator(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_modflags_status ON public.moderation_flags(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_modflags_content ON public.moderation_flags(content_type, content_id);

-- 3. Circle settings columns (no inline CHECK to avoid existing-row failures)
ALTER TABLE public.circles ADD COLUMN IF NOT EXISTS rules text;
ALTER TABLE public.circles ADD COLUMN IF NOT EXISTS who_can_post text NOT NULL DEFAULT 'members';
ALTER TABLE public.circles ADD COLUMN IF NOT EXISTS who_can_join text NOT NULL DEFAULT 'anyone';

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'circles_who_can_post_chk') THEN
    ALTER TABLE public.circles ADD CONSTRAINT circles_who_can_post_chk CHECK (who_can_post IN ('members','verified','mods'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'circles_who_can_join_chk') THEN
    ALTER TABLE public.circles ADD CONSTRAINT circles_who_can_join_chk CHECK (who_can_join IN ('anyone','invite','verified'));
  END IF;
END $$;

ALTER TABLE public.circle_posts ADD COLUMN IF NOT EXISTS downvote_count integer NOT NULL DEFAULT 0;

-- 4. Hot score function + trigger
CREATE OR REPLACE FUNCTION public.calculate_circle_post_hot_score(p_id uuid)
RETURNS double precision
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  s integer;
  age_hours double precision;
  hot double precision;
  created timestamptz;
BEGIN
  SELECT GREATEST(upvote_count - downvote_count, 1), created_at
    INTO s, created
    FROM public.circle_posts WHERE id = p_id;
  IF s IS NULL THEN RETURN 0; END IF;
  age_hours := EXTRACT(EPOCH FROM (now() - created)) / 3600.0;
  hot := log(GREATEST(s::double precision, 1.0)) + EXTRACT(EPOCH FROM created) / 45000.0;
  IF age_hours > 48 THEN
    hot := hot - (age_hours - 48) * 0.01;
  END IF;
  RETURN hot;
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_circle_post_hot()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pid uuid;
BEGIN
  pid := COALESCE(NEW.post_id, OLD.post_id);
  UPDATE public.circle_posts
    SET hot_score = public.calculate_circle_post_hot_score(pid)
    WHERE id = pid;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_circle_post_hot_upvote ON public.circle_post_upvotes;
CREATE TRIGGER trg_circle_post_hot_upvote
  AFTER INSERT OR DELETE ON public.circle_post_upvotes
  FOR EACH ROW EXECUTE FUNCTION public.refresh_circle_post_hot();

-- 5. Extend existing post_reports table (it already has id, post_id, reporter_id, reason, created_at)
ALTER TABLE public.post_reports ADD COLUMN IF NOT EXISTS content_type text;
ALTER TABLE public.post_reports ADD COLUMN IF NOT EXISTS content_id uuid;
ALTER TABLE public.post_reports ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.post_reports ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'open';

-- Backfill content_id from legacy post_id
UPDATE public.post_reports SET content_id = post_id, content_type = 'post' WHERE content_id IS NULL AND post_id IS NOT NULL;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'post_reports_status_chk') THEN
    ALTER TABLE public.post_reports ADD CONSTRAINT post_reports_status_chk CHECK (status IN ('open','reviewed','dismissed','escalated'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'post_reports_content_type_chk') THEN
    ALTER TABLE public.post_reports ADD CONSTRAINT post_reports_content_type_chk CHECK (content_type IN ('post','circle_post','comment'));
  END IF;
END $$;

ALTER TABLE public.post_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reporter creates report" ON public.post_reports;
CREATE POLICY "reporter creates report" ON public.post_reports FOR INSERT
  WITH CHECK (reporter_id = auth.uid());

DROP POLICY IF EXISTS "reporter reads own report" ON public.post_reports;
CREATE POLICY "reporter reads own report" ON public.post_reports FOR SELECT
  USING (reporter_id = auth.uid() OR public.is_moderator(auth.uid()));

DROP POLICY IF EXISTS "mods update reports" ON public.post_reports;
CREATE POLICY "mods update reports" ON public.post_reports FOR UPDATE
  USING (public.is_moderator(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_postreports_status ON public.post_reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_postreports_content ON public.post_reports(content_type, content_id);
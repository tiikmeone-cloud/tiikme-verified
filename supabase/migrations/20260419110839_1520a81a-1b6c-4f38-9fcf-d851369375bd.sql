-- Add missing columns to circles
ALTER TABLE public.circles
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS post_count integer NOT NULL DEFAULT 0;

-- Add missing columns to circle_posts
ALTER TABLE public.circle_posts
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS body text,
  ADD COLUMN IF NOT EXISTS comment_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS hot_score double precision NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_flagged boolean NOT NULL DEFAULT false;

-- Backfill body from existing content where body is null
UPDATE public.circle_posts SET body = content WHERE body IS NULL AND content IS NOT NULL;

-- Make body the primary text source going forward; keep content nullable for back-compat
ALTER TABLE public.circle_posts ALTER COLUMN content DROP NOT NULL;

-- Add FK so PostgREST embed circle_posts_author_id_fkey works
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'circle_posts_author_id_fkey'
  ) THEN
    ALTER TABLE public.circle_posts
      ADD CONSTRAINT circle_posts_author_id_fkey
      FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Trigger: keep circles.member_count in sync
CREATE OR REPLACE FUNCTION public.circles_member_count_sync()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.circles SET member_count = member_count + 1 WHERE id = NEW.circle_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.circles SET member_count = GREATEST(member_count - 1, 0) WHERE id = OLD.circle_id;
  END IF;
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS trg_circle_members_count ON public.circle_members;
CREATE TRIGGER trg_circle_members_count
AFTER INSERT OR DELETE ON public.circle_members
FOR EACH ROW EXECUTE FUNCTION public.circles_member_count_sync();

-- Trigger: keep circles.post_count in sync
CREATE OR REPLACE FUNCTION public.circles_post_count_sync()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.circles SET post_count = post_count + 1 WHERE id = NEW.circle_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.circles SET post_count = GREATEST(post_count - 1, 0) WHERE id = OLD.circle_id;
  END IF;
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS trg_circle_posts_count ON public.circle_posts;
CREATE TRIGGER trg_circle_posts_count
AFTER INSERT OR DELETE ON public.circle_posts
FOR EACH ROW EXECUTE FUNCTION public.circles_post_count_sync();

-- Backfill counts
UPDATE public.circles c SET
  member_count = COALESCE((SELECT COUNT(*) FROM public.circle_members WHERE circle_id = c.id), 0),
  post_count   = COALESCE((SELECT COUNT(*) FROM public.circle_posts WHERE circle_id = c.id), 0);

-- Index for sort=hot
CREATE INDEX IF NOT EXISTS idx_circle_posts_hot ON public.circle_posts (circle_id, hot_score DESC) WHERE is_flagged = false;
CREATE INDEX IF NOT EXISTS idx_circle_posts_new ON public.circle_posts (circle_id, created_at DESC) WHERE is_flagged = false;
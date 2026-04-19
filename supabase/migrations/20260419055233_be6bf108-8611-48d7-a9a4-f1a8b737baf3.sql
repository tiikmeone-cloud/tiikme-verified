ALTER TABLE public.circle_posts
  ADD COLUMN IF NOT EXISTS poll_options jsonb,
  ADD COLUMN IF NOT EXISTS poll_votes jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS poll_ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS link_url text;
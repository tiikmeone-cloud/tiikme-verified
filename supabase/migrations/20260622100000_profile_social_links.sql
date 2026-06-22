-- Migration: Add social_links + website to profiles
-- Enables talent to show GitHub, LinkedIn, X, Dribbble, Behance, YouTube,
-- Instagram, and portfolio URLs on their public profile and in the Flex.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS website      text,
  ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '{}'::jsonb;

-- Rollback:
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS website;
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS social_links;

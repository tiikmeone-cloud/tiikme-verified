-- Set the first Tiikme platform moderator.
-- Scope is intentionally narrow: update exactly one known internal profile ID,
-- and leave every other account unchanged.

UPDATE public.profiles
SET is_moderator = true
WHERE id = '26c8e8df-81cf-496b-9b1b-f78e3cc9d546';

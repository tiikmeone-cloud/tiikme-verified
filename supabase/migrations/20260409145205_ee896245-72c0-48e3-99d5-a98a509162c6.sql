-- Fix: Allow users to always read their OWN profile (even if is_public = false)
CREATE POLICY "Users read own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_work_items_owner ON work_items(owner_id);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_profiles_fullname_trgm ON profiles USING gin(full_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_profiles_username_trgm ON profiles USING gin(username gin_trgm_ops);
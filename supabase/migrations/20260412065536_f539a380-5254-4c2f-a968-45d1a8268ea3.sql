
-- Add account_type and org_id to profiles for institution accounts
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_type text DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES organizations(id);

-- Add posted_by_org and posted_by_user_id to posts for institution posting
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS posted_by_org uuid REFERENCES organizations(id),
  ADD COLUMN IF NOT EXISTS posted_by_user_id uuid REFERENCES profiles(id);

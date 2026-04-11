
-- Step 2: Replace handle_new_user with a safe version
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    username,
    role,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      'user-' || substr(NEW.id::text, 1, 8)
    ),
    COALESCE(NEW.raw_user_meta_data->>'role', 'professional'),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NEW;
END;
$$;

-- Step 5: Username unique index (partial, where not null)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'profiles_username_key_partial'
  ) THEN
    CREATE UNIQUE INDEX profiles_username_key_partial ON profiles(username)
    WHERE username IS NOT NULL;
  END IF;
END $$;

-- Step 6: Replace profiles RLS policies
DROP POLICY IF EXISTS "Public profiles viewable" ON profiles;
DROP POLICY IF EXISTS "Users insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users read own profile" ON profiles;
DROP POLICY IF EXISTS "Users update own profile" ON profiles;
DROP POLICY IF EXISTS "profiles_read" ON profiles;
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;

CREATE POLICY "profiles_read"   ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Step 7: Ensure organizations and org_members exist (idempotent)
CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'company',
  subtype text, description text, tagline text,
  website_url text, email text, phone text,
  country text DEFAULT 'India',
  state text, district text, city text, village text, pincode text,
  full_address text, logo_url text, cover_url text,
  founded_year integer, employee_count text,
  is_verified boolean DEFAULT false,
  allow_member_requests boolean DEFAULT true,
  allow_messages boolean DEFAULT true,
  metadata jsonb DEFAULT '{}',
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.org_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  role text DEFAULT 'member',
  title text, department text,
  is_verified boolean DEFAULT false,
  can_verify_members boolean DEFAULT false,
  can_post_jobs boolean DEFAULT false,
  can_issue_certificates boolean DEFAULT false,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(org_id, user_id)
);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_read" ON organizations;
DROP POLICY IF EXISTS "org_insert" ON organizations;
DROP POLICY IF EXISTS "org_update" ON organizations;
CREATE POLICY "org_read"   ON organizations FOR SELECT USING (true);
CREATE POLICY "org_insert" ON organizations FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "org_update" ON organizations FOR UPDATE USING (
  EXISTS(SELECT 1 FROM org_members WHERE org_id=id AND user_id=auth.uid() AND role IN('owner','admin'))
);

DROP POLICY IF EXISTS "om_read" ON org_members;
DROP POLICY IF EXISTS "om_insert" ON org_members;
CREATE POLICY "om_read"   ON org_members FOR SELECT USING (true);
CREATE POLICY "om_insert" ON org_members FOR INSERT WITH CHECK (
  auth.uid() = user_id
  OR EXISTS(SELECT 1 FROM org_members m WHERE m.org_id=org_members.org_id AND m.user_id=auth.uid() AND m.role IN('owner','admin'))
);

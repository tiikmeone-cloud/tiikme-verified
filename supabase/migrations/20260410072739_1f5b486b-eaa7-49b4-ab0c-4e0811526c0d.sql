
-- Organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  subtype TEXT,
  description TEXT,
  tagline TEXT,
  website_url TEXT,
  email TEXT,
  phone TEXT,
  country TEXT DEFAULT 'India',
  state TEXT,
  district TEXT,
  city TEXT,
  village TEXT,
  pincode TEXT,
  full_address TEXT,
  maps_url TEXT,
  logo_url TEXT,
  cover_url TEXT,
  founded_year INTEGER,
  employee_count TEXT,
  is_verified BOOLEAN DEFAULT false,
  verification_type TEXT,
  followers_count INTEGER DEFAULT 0,
  allow_employee_requests BOOLEAN DEFAULT true,
  allow_messages BOOLEAN DEFAULT true,
  email_domain TEXT,
  social_links JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Organization contacts (multiple locations/phones)
CREATE TABLE IF NOT EXISTS public.org_contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  label TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  is_primary BOOLEAN DEFAULT false
);

-- Type-specific metadata (key-value)
CREATE TABLE IF NOT EXISTS public.org_metadata (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL
);

-- Organization members
CREATE TABLE IF NOT EXISTS public.org_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member',
  title TEXT,
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, user_id)
);

-- Followers
CREATE TABLE IF NOT EXISTS public.org_followers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  followed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, user_id)
);

-- Verification requests
CREATE TABLE IF NOT EXISTS public.org_verif_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title_at_org TEXT,
  member_type TEXT,
  message TEXT,
  status TEXT DEFAULT 'pending',
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_verif_requests ENABLE ROW LEVEL SECURITY;

-- Organizations policies
CREATE POLICY "Anyone can view orgs" ON public.organizations FOR SELECT USING (true);
CREATE POLICY "Auth users create orgs" ON public.organizations FOR INSERT
  WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Org admins can update" ON public.organizations FOR UPDATE
  USING (EXISTS(
    SELECT 1 FROM public.org_members
    WHERE org_id = organizations.id AND user_id = auth.uid() AND role IN ('owner','admin')
  ));

-- Org contacts policies
CREATE POLICY "Anyone can view contacts" ON public.org_contacts FOR SELECT USING (true);
CREATE POLICY "Org admins manage contacts" ON public.org_contacts FOR ALL
  USING (EXISTS(
    SELECT 1 FROM public.org_members
    WHERE org_id = org_contacts.org_id AND user_id = auth.uid() AND role IN ('owner','admin')
  ));

-- Org metadata policies
CREATE POLICY "Anyone can view metadata" ON public.org_metadata FOR SELECT USING (true);
CREATE POLICY "Org admins manage metadata" ON public.org_metadata FOR ALL
  USING (EXISTS(
    SELECT 1 FROM public.org_members
    WHERE org_id = org_metadata.org_id AND user_id = auth.uid() AND role IN ('owner','admin')
  ));

-- Org members policies
CREATE POLICY "Anyone can view members" ON public.org_members FOR SELECT USING (true);
CREATE POLICY "Users or admins insert members" ON public.org_members FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS(
      SELECT 1 FROM public.org_members m
      WHERE m.org_id = org_members.org_id AND m.user_id = auth.uid() AND m.role IN ('owner','admin')
    )
  );
CREATE POLICY "Admins update members" ON public.org_members FOR UPDATE
  USING (EXISTS(
    SELECT 1 FROM public.org_members m
    WHERE m.org_id = org_members.org_id AND m.user_id = auth.uid() AND m.role IN ('owner','admin')
  ));
CREATE POLICY "Admins delete members" ON public.org_members FOR DELETE
  USING (
    auth.uid() = user_id
    OR EXISTS(
      SELECT 1 FROM public.org_members m
      WHERE m.org_id = org_members.org_id AND m.user_id = auth.uid() AND m.role IN ('owner','admin')
    )
  );

-- Org followers policies
CREATE POLICY "Anyone can view followers" ON public.org_followers FOR SELECT USING (true);
CREATE POLICY "Users manage own follows" ON public.org_followers FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users unfollow" ON public.org_followers FOR DELETE
  USING (auth.uid() = user_id);

-- Verification requests policies
CREATE POLICY "Involved can view requests" ON public.org_verif_requests FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS(
      SELECT 1 FROM public.org_members m
      WHERE m.org_id = org_verif_requests.org_id AND m.user_id = auth.uid() AND m.role IN ('owner','admin')
    )
  );
CREATE POLICY "Users create own requests" ON public.org_verif_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins review requests" ON public.org_verif_requests FOR UPDATE
  USING (EXISTS(
    SELECT 1 FROM public.org_members m
    WHERE m.org_id = org_verif_requests.org_id AND m.user_id = auth.uid() AND m.role IN ('owner','admin')
  ));

-- Create storage bucket for org assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('org-assets', 'org-assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read org assets" ON storage.objects FOR SELECT
  USING (bucket_id = 'org-assets');
CREATE POLICY "Auth upload org assets" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'org-assets' AND auth.uid() IS NOT NULL);

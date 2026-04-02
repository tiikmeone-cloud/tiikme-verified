
-- Section 2: Add custom_links to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS custom_links jsonb DEFAULT '[]'::jsonb;

-- Section 2: Create achievements table
CREATE TABLE public.achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL DEFAULT 'award',
  title text NOT NULL,
  issued_by text,
  achievement_date date,
  description text,
  certificate_url text,
  certificate_file_url text,
  verification_url text,
  issuing_body_recognized boolean DEFAULT false,
  source_type text DEFAULT 'self',
  source_workspace_id uuid REFERENCES public.workspaces(id),
  source_workspace_name text,
  source_admin_name text,
  visibility text DEFAULT 'public',
  is_shared_to_feed boolean DEFAULT false,
  icon_emoji text DEFAULT '🏆',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own achievements" ON public.achievements
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public achievements viewable" ON public.achievements
  FOR SELECT TO public USING (visibility = 'public');

-- Section 3: Create pages table (Tiikme Pages / org profiles)
CREATE TABLE public.pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  also_known_as text,
  page_type text NOT NULL DEFAULT 'company',
  sub_type text,
  official_email text,
  official_website text,
  city text,
  state text,
  pincode text,
  founded_year integer,
  about text,
  logo_url text,
  cover_url text,
  team_size text,
  industry text,
  work_culture_tags text[] DEFAULT '{}',
  why_work_with_us text,
  affiliation text,
  naac_grade text,
  nirf_ranking integer,
  student_count integer,
  govt_level text,
  jurisdiction text,
  service_hours text,
  emergency_contact text,
  specialisations text[] DEFAULT '{}',
  bed_count integer,
  nabh_accredited boolean DEFAULT false,
  creator_specialisation_tags text[] DEFAULT '{}',
  client_types text[] DEFAULT '{}',
  notable_work text,
  custom_links jsonb DEFAULT '[]',
  awards jsonb DEFAULT '[]',
  activity_photos text[] DEFAULT '{}',
  trust_score integer DEFAULT 0,
  tracker_count integer DEFAULT 0,
  member_count integer DEFAULT 0,
  founding_number integer,
  created_by uuid REFERENCES auth.users(id),
  institution_id uuid REFERENCES public.institutions(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pages publicly readable" ON public.pages
  FOR SELECT TO public USING (true);

CREATE POLICY "Creators manage own pages" ON public.pages
  FOR ALL TO authenticated USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);

-- Page admins table
CREATE TABLE public.page_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid REFERENCES public.pages(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text DEFAULT 'admin',
  created_at timestamptz DEFAULT now(),
  UNIQUE(page_id, user_id)
);

ALTER TABLE public.page_admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Page admins viewable by members" ON public.page_admins
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Page creators manage admins" ON public.page_admins
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.pages WHERE pages.id = page_admins.page_id AND pages.created_by = auth.uid())
  );

-- Page trackers table
CREATE TABLE public.page_trackers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid REFERENCES public.pages(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(page_id, user_id)
);

ALTER TABLE public.page_trackers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own tracking" ON public.page_trackers
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Tracker counts readable" ON public.page_trackers
  FOR SELECT TO authenticated USING (true);

-- Section 4: Add workspace posts columns
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id);
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS workspace_name text;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS is_shared_to_feed boolean DEFAULT false;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS post_type text DEFAULT 'thought';

-- Add status to workspace_members
ALTER TABLE public.workspace_members ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';
ALTER TABLE public.workspace_members ADD COLUMN IF NOT EXISTS left_at timestamptz;

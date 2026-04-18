-- Helper function for updated_at if missing
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Circles tables
CREATE TABLE public.circles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL DEFAULT 'custom',
  icon_url TEXT,
  description TEXT,
  member_count INTEGER NOT NULL DEFAULT 0,
  active_7d INTEGER NOT NULL DEFAULT 0,
  is_unlocked BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_circles_type ON public.circles(type);
CREATE INDEX idx_circles_member_count ON public.circles(member_count DESC);

CREATE TABLE public.circle_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  circle_id UUID NOT NULL REFERENCES public.circles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (circle_id, user_id)
);

CREATE INDEX idx_circle_members_user ON public.circle_members(user_id);
CREATE INDEX idx_circle_members_circle ON public.circle_members(circle_id);

CREATE TABLE public.circle_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  circle_id UUID NOT NULL REFERENCES public.circles(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  content TEXT NOT NULL,
  post_type TEXT NOT NULL DEFAULT 'discussion',
  signtype TEXT NOT NULL DEFAULT 'full_profile',
  upvote_count INTEGER NOT NULL DEFAULT 0,
  reply_count INTEGER NOT NULL DEFAULT 0,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_circle_posts_circle ON public.circle_posts(circle_id, created_at DESC);
CREATE INDEX idx_circle_posts_author ON public.circle_posts(author_id);

CREATE TABLE public.circle_post_upvotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.circle_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);

CREATE INDEX idx_circle_post_upvotes_post ON public.circle_post_upvotes(post_id);

-- Enable RLS
ALTER TABLE public.circles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circle_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circle_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circle_post_upvotes ENABLE ROW LEVEL SECURITY;

-- circles policies
CREATE POLICY "Circles viewable by authenticated"
  ON public.circles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can create circles"
  ON public.circles FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Creators can update their circles"
  ON public.circles FOR UPDATE TO authenticated USING (auth.uid() = created_by);
CREATE POLICY "Creators can delete their circles"
  ON public.circles FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- circle_members policies
CREATE POLICY "Members viewable by authenticated"
  ON public.circle_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can join circles"
  ON public.circle_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave circles"
  ON public.circle_members FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- circle_posts policies
CREATE POLICY "Posts viewable by authenticated"
  ON public.circle_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Members can post in their circles"
  ON public.circle_posts FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = author_id
    AND EXISTS (
      SELECT 1 FROM public.circle_members m
      WHERE m.circle_id = circle_posts.circle_id AND m.user_id = auth.uid()
    )
  );
CREATE POLICY "Authors can update their posts"
  ON public.circle_posts FOR UPDATE TO authenticated USING (auth.uid() = author_id);
CREATE POLICY "Authors can delete their posts"
  ON public.circle_posts FOR DELETE TO authenticated USING (auth.uid() = author_id);

-- circle_post_upvotes policies
CREATE POLICY "Upvotes viewable by authenticated"
  ON public.circle_post_upvotes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can upvote"
  ON public.circle_post_upvotes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove their upvote"
  ON public.circle_post_upvotes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Maintain member_count
CREATE OR REPLACE FUNCTION public.circles_bump_member_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.circles SET member_count = member_count + 1, updated_at = now() WHERE id = NEW.circle_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.circles SET member_count = GREATEST(0, member_count - 1), updated_at = now() WHERE id = OLD.circle_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END; $$;

CREATE TRIGGER trg_circle_members_count
AFTER INSERT OR DELETE ON public.circle_members
FOR EACH ROW EXECUTE FUNCTION public.circles_bump_member_count();

-- Maintain upvote_count
CREATE OR REPLACE FUNCTION public.circle_posts_bump_upvotes()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.circle_posts SET upvote_count = upvote_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.circle_posts SET upvote_count = GREATEST(0, upvote_count - 1) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END; $$;

CREATE TRIGGER trg_circle_post_upvotes_count
AFTER INSERT OR DELETE ON public.circle_post_upvotes
FOR EACH ROW EXECUTE FUNCTION public.circle_posts_bump_upvotes();

-- updated_at triggers
CREATE TRIGGER trg_circles_updated_at
BEFORE UPDATE ON public.circles
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER trg_circle_posts_updated_at
BEFORE UPDATE ON public.circle_posts
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Seed starter circles
INSERT INTO public.circles (name, slug, type, description, is_unlocked) VALUES
  ('Technology', 'sector-technology', 'sector', 'Builders, engineers, and product folks', true),
  ('Healthcare', 'sector-healthcare', 'sector', 'Doctors, nurses, and medical professionals', true),
  ('Finance', 'sector-finance', 'sector', 'Banking, fintech, and investment professionals', true),
  ('Education', 'sector-education', 'sector', 'Teachers, educators, and edtech', true),
  ('Design', 'sector-design', 'sector', 'Designers across product, brand, and UX', true),
  ('Marketing', 'sector-marketing', 'sector', 'Growth, brand, and content marketers', true),
  ('Bengaluru', 'city-bengaluru', 'city', 'Professionals in Bengaluru', true),
  ('Mumbai', 'city-mumbai', 'city', 'Professionals in Mumbai', true),
  ('Delhi NCR', 'city-delhi-ncr', 'city', 'Professionals in Delhi NCR', true),
  ('Hyderabad', 'city-hyderabad', 'city', 'Professionals in Hyderabad', true),
  ('Pune', 'city-pune', 'city', 'Professionals in Pune', true),
  ('Chennai', 'city-chennai', 'city', 'Professionals in Chennai', true),
  ('Founders', 'role-founders', 'role', 'Startup founders and operators', true),
  ('Engineers', 'role-engineers', 'role', 'Software and hardware engineers', true),
  ('Product Managers', 'role-product-managers', 'role', 'PMs across stages and sectors', true),
  ('Designers', 'role-designers', 'role', 'Designers across disciplines', true),
  ('Investors', 'role-investors', 'role', 'Angels, VCs, and analysts', true),
  ('Students', 'role-students', 'role', 'College students and early-career', true);
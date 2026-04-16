
-- Open to Work profiles
CREATE TABLE public.open_to_work_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_types TEXT[] NOT NULL DEFAULT '{}',
  preferred_location TEXT,
  location_type TEXT DEFAULT 'onsite',
  desired_title TEXT,
  pitch TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE public.open_to_work_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active OTW profiles"
  ON public.open_to_work_profiles FOR SELECT
  USING (true);

CREATE POLICY "Users manage own OTW profile"
  ON public.open_to_work_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own OTW profile"
  ON public.open_to_work_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own OTW profile"
  ON public.open_to_work_profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_otw_active ON public.open_to_work_profiles(is_active) WHERE is_active = true;

-- Opportunity likes
CREATE TABLE public.opportunity_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (opportunity_id, user_id)
);

ALTER TABLE public.opportunity_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view opportunity likes"
  ON public.opportunity_likes FOR SELECT
  USING (true);

CREATE POLICY "Users create own opportunity likes"
  ON public.opportunity_likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own opportunity likes"
  ON public.opportunity_likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_opp_likes_opp ON public.opportunity_likes(opportunity_id);

-- Opportunity comments
CREATE TABLE public.opportunity_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  parent_id UUID REFERENCES public.opportunity_comments(id) ON DELETE CASCADE
);

ALTER TABLE public.opportunity_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view opportunity comments"
  ON public.opportunity_comments FOR SELECT
  USING (true);

CREATE POLICY "Users create own opportunity comments"
  ON public.opportunity_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own opportunity comments"
  ON public.opportunity_comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_opp_comments_opp ON public.opportunity_comments(opportunity_id);

-- Opportunity referrals
CREATE TABLE public.opportunity_referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (opportunity_id, referrer_id, referred_user_id)
);

ALTER TABLE public.opportunity_referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Involved can view referrals"
  ON public.opportunity_referrals FOR SELECT
  TO authenticated
  USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id);

CREATE POLICY "Referrers create referrals"
  ON public.opportunity_referrals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = referrer_id);

CREATE INDEX idx_opp_referrals_opp ON public.opportunity_referrals(opportunity_id);

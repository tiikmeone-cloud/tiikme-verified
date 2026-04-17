-- 1. Fix org subscription for existing org owner
INSERT INTO public.org_subscriptions (profile_id, plan, status, trial_started_at, trial_ends_at, amount, currency, discount_months_remaining)
SELECT id, 'trial', 'active', now(), now() + interval '90 days', 0, 'INR', 3
FROM public.profiles WHERE email = 'tiikmeone@gmail.com'
ON CONFLICT DO NOTHING;

-- 2. Create referrals table (separate from opportunity_referrals)
CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  opportunity_id uuid REFERENCES public.opportunities(id) ON DELETE CASCADE,
  message text,
  status text DEFAULT 'sent' CHECK (status IN ('sent','viewed','applied','dismissed')),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own referrals" ON public.referrals;
CREATE POLICY "Users see own referrals" ON public.referrals
  FOR SELECT USING (referrer_id = auth.uid() OR referred_user_id = auth.uid());

DROP POLICY IF EXISTS "Users create referrals" ON public.referrals;
CREATE POLICY "Users create referrals" ON public.referrals
  FOR INSERT WITH CHECK (referrer_id = auth.uid());

-- 3. Create opportunity_reactions (opportunity_comments already exists)
CREATE TABLE IF NOT EXISTS public.opportunity_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid REFERENCES public.opportunities(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  reaction_type text DEFAULT 'like',
  created_at timestamptz DEFAULT now(),
  UNIQUE(opportunity_id, user_id, reaction_type)
);
ALTER TABLE public.opportunity_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone reads opp reactions" ON public.opportunity_reactions;
CREATE POLICY "Anyone reads opp reactions" ON public.opportunity_reactions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users manage own opp reactions" ON public.opportunity_reactions;
CREATE POLICY "Users manage own opp reactions" ON public.opportunity_reactions
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 4. Add open_to_work_preferences to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS open_to_work_preferences jsonb DEFAULT '{}'::jsonb;
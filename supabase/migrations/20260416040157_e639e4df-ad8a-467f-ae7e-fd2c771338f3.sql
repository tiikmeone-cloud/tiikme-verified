CREATE TABLE IF NOT EXISTS public.org_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'trial' CHECK (plan IN ('trial','basic','premium')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','past_due','cancelled','expired')),
  trial_started_at timestamptz DEFAULT now(),
  trial_ends_at timestamptz DEFAULT (now() + interval '90 days'),
  current_period_start timestamptz,
  current_period_end timestamptz,
  amount integer DEFAULT 0,
  currency text DEFAULT 'INR',
  discount_months_remaining integer DEFAULT 3,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(org_id),
  UNIQUE(profile_id)
);

ALTER TABLE public.org_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org admins manage own subscription"
ON public.org_subscriptions FOR ALL
USING (profile_id = auth.uid())
WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Anyone can read subscription status"
ON public.org_subscriptions FOR SELECT
USING (true);
-- Insert trial subscription for existing org account that's missing one
INSERT INTO public.org_subscriptions (profile_id, org_id, plan, status, trial_started_at, trial_ends_at, amount, currency, discount_months_remaining)
SELECT p.id, p.org_id, 'trial', 'active', now(), now() + interval '90 days', 0, 'INR', 3
FROM public.profiles p
WHERE p.id = 'ced4f16c-54b2-4312-a100-035cc0e5018d'
AND NOT EXISTS (SELECT 1 FROM public.org_subscriptions os WHERE os.profile_id = p.id);
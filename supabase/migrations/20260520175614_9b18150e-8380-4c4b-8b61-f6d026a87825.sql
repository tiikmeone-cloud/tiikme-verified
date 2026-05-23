
-- Restrict column access on profiles.email and profiles.phone
REVOKE SELECT (email, phone) ON public.profiles FROM anon, authenticated, PUBLIC;

-- Restrict column access on organizations.email and organizations.phone (keep row policy public for org browsing)
REVOKE SELECT (email, phone) ON public.organizations FROM anon, authenticated, PUBLIC;

-- Lock down mutable search_path on remaining functions
ALTER FUNCTION public.check_opportunity_reapply() SET search_path = public;
ALTER FUNCTION public.normalize_trust_domain_input(text, text) SET search_path = public;
ALTER FUNCTION public.build_domain_verification_instructions(text, text, text) SET search_path = public;

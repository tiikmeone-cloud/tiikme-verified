ALTER FUNCTION public.auto_generate_username() SET search_path = public;
ALTER FUNCTION public.calculate_activity_score(uuid) SET search_path = public;
ALTER FUNCTION public.check_strand_uniqueness() SET search_path = public;
ALTER FUNCTION public.generate_clean_username(text, uuid) SET search_path = public;
ALTER FUNCTION public.sync_email_from_auth() SET search_path = public;
ALTER FUNCTION public.update_all_activity_scores() SET search_path = public;
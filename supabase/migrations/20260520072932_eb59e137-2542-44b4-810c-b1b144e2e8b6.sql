
-- Remove strands from the realtime publication (app does not subscribe to it).
ALTER PUBLICATION supabase_realtime DROP TABLE public.strands;

-- Fix mutable search_path on the only public SECURITY DEFINER function missing it.
ALTER FUNCTION public.get_application_status(p_opportunity_id uuid, p_user_id uuid)
  SET search_path = public;

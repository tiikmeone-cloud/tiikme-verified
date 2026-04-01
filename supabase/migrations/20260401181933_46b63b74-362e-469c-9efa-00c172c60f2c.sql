-- Create admin stats view
CREATE OR REPLACE VIEW public.admin_dashboard AS
SELECT
  (SELECT COUNT(*) FROM auth.users) as total_users,
  (SELECT COUNT(*) FROM auth.users 
   WHERE created_at > NOW() - INTERVAL '7 days') as new_users_7d,
  (SELECT COUNT(*) FROM auth.users 
   WHERE created_at > NOW() - INTERVAL '24 hours') as new_users_24h,
  (SELECT COUNT(*) FROM profiles WHERE role = 'student') as student_count,
  (SELECT COUNT(*) FROM profiles WHERE role = 'professional') as professional_count,
  (SELECT COUNT(*) FROM profiles WHERE role = 'government') as government_count,
  (SELECT COUNT(*) FROM profiles WHERE role = 'doctor') as doctor_count,
  (SELECT COUNT(*) FROM profiles WHERE role = 'skilled_trade') as trade_count,
  (SELECT COUNT(*) FROM posts) as total_posts,
  (SELECT COUNT(*) FROM posts 
   WHERE created_at > NOW() - INTERVAL '24 hours') as posts_today,
  (SELECT COUNT(*) FROM work_items WHERE is_tiik_approved = true) as tiik_approved_works,
  (SELECT COUNT(*) FROM strands WHERE status = 'accepted') as total_strands;

-- Create admin function to list users with details
CREATE OR REPLACE FUNCTION public.get_user_list(
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0,
  p_role TEXT DEFAULT NULL
)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  full_name TEXT,
  role TEXT,
  institution TEXT,
  city TEXT,
  created_at TIMESTAMPTZ,
  has_tiik_approved BOOLEAN,
  post_count BIGINT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id as user_id,
    u.email,
    p.full_name,
    p.role,
    p.institution_name as institution,
    p.location_city as city,
    p.created_at,
    EXISTS(SELECT 1 FROM work_items w WHERE w.owner_id = p.id AND w.is_tiik_approved = true) as has_tiik_approved,
    (SELECT COUNT(*) FROM posts WHERE author_id = p.id) as post_count
  FROM profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE (p_role IS NULL OR p.role = p_role)
  ORDER BY p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
$$;

-- Restrict access to service_role only
REVOKE ALL ON public.admin_dashboard FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.get_user_list FROM anon, authenticated;
GRANT SELECT ON public.admin_dashboard TO service_role;
GRANT EXECUTE ON FUNCTION public.get_user_list TO service_role;
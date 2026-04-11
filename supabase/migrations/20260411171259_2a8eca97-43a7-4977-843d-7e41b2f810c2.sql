
-- Add referred_by column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referred_by text;

-- Add cover_url column to profiles (if not exists)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cover_url text;

-- Create cover-images storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('cover-images', 'cover-images', true)
ON CONFLICT (id) DO NOTHING;

-- RLS for cover-images bucket
CREATE POLICY "Public read cover images" ON storage.objects FOR SELECT USING (bucket_id = 'cover-images');
CREATE POLICY "Users upload own covers" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'cover-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users update own covers" ON storage.objects FOR UPDATE USING (bucket_id = 'cover-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create increment_score RPC function
CREATE OR REPLACE FUNCTION public.increment_score(uid uuid, amount integer)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE profiles SET activity_score = COALESCE(activity_score, 0) + amount WHERE id = uid;
$$;

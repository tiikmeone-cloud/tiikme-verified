-- Add RLS policies to storage.objects for per-user file scoping

-- avatars: each user owns their own folder
CREATE POLICY "Users manage own avatar" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- work-assets: owner scoped
CREATE POLICY "Users manage own work assets" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'work-assets' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'work-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

-- pings-pdfs: sender scoped
CREATE POLICY "Ping PDF access for senders" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'pings-pdfs' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'pings-pdfs' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow public read on public buckets (avatars, work-assets)
CREATE POLICY "Public read avatars" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'avatars');

CREATE POLICY "Public read work assets" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'work-assets');
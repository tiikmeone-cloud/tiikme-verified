
-- Enable realtime on critical tables
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.posts; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.post_comments; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.post_reactions; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.strands; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.pings; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Full replica identity for realtime DELETE/UPDATE events
ALTER TABLE post_reactions REPLICA IDENTITY FULL;
ALTER TABLE post_comments REPLICA IDENTITY FULL;
ALTER TABLE posts REPLICA IDENTITY FULL;
ALTER TABLE pings REPLICA IDENTITY FULL;

-- Storage buckets
INSERT INTO storage.buckets(id, name, public) VALUES ('profile-avatars', 'profile-avatars', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets(id, name, public) VALUES ('org-logos', 'org-logos', true) ON CONFLICT DO NOTHING;

-- Storage policies (safe drop + create)
DROP POLICY IF EXISTS "pa_read" ON storage.objects;
DROP POLICY IF EXISTS "pa_upload" ON storage.objects;
DROP POLICY IF EXISTS "ol_read" ON storage.objects;
DROP POLICY IF EXISTS "ol_upload" ON storage.objects;
CREATE POLICY "pa_read" ON storage.objects FOR SELECT USING (bucket_id = 'profile-avatars');
CREATE POLICY "pa_upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'profile-avatars' AND auth.uid() IS NOT NULL);
CREATE POLICY "ol_read" ON storage.objects FOR SELECT USING (bucket_id = 'org-logos');
CREATE POLICY "ol_upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'org-logos' AND auth.uid() IS NOT NULL);

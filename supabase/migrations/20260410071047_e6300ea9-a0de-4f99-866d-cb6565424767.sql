
-- Create post-images bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-images', 'post-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create message-attachments bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('message-attachments', 'message-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for post-images
CREATE POLICY "Public read post images"
ON storage.objects FOR SELECT USING (bucket_id = 'post-images');

CREATE POLICY "Auth upload post images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'post-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for message-attachments
CREATE POLICY "Auth read message attachments"
ON storage.objects FOR SELECT USING (bucket_id = 'message-attachments' AND auth.uid() IS NOT NULL);

CREATE POLICY "Auth upload message attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'message-attachments' AND auth.uid() IS NOT NULL);

-- Add missing columns to pings for file attachments
ALTER TABLE public.pings
  ADD COLUMN IF NOT EXISTS attachment_url TEXT,
  ADD COLUMN IF NOT EXISTS attachment_type TEXT,
  ADD COLUMN IF NOT EXISTS attachment_name TEXT,
  ADD COLUMN IF NOT EXISTS attachment_size BIGINT;

-- Add display_order and employment_type to work_items
ALTER TABLE public.work_items
  ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS employment_type TEXT;

-- Add display_order to achievements
ALTER TABLE public.achievements
  ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Add section_order to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS section_order JSONB DEFAULT '["experience","education","projects","achievements","skills","posts"]';

-- Fix workspace_members: allow admins to insert members
DROP POLICY IF EXISTS "auth_insert_workspace_members" ON public.workspace_members;
CREATE POLICY "auth_insert_workspace_members" ON public.workspace_members
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.workspace_members wm2
      WHERE wm2.workspace_id = workspace_members.workspace_id
      AND wm2.user_id = auth.uid()
      AND wm2.role = 'admin'
    )
  );

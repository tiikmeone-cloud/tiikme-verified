-- Add missing columns to work_items
ALTER TABLE work_items
  ADD COLUMN IF NOT EXISTS company_name text,
  ADD COLUMN IF NOT EXISTS job_title text,
  ADD COLUMN IF NOT EXISTS start_month text,
  ADD COLUMN IF NOT EXISTS start_year integer,
  ADD COLUMN IF NOT EXISTS end_month text,
  ADD COLUMN IF NOT EXISTS end_year integer,
  ADD COLUMN IF NOT EXISTS work_location text,
  ADD COLUMN IF NOT EXISTS skills_used text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS verified_by_user uuid,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS degree_type text,
  ADD COLUMN IF NOT EXISTS field_of_study text,
  ADD COLUMN IF NOT EXISTS institution_name_edu text,
  ADD COLUMN IF NOT EXISTS grade_score text;

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL,
  title text,
  body text,
  data jsonb DEFAULT '{}',
  is_read boolean DEFAULT false,
  action_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notif_own" ON notifications;
CREATE POLICY "notif_own" ON notifications FOR ALL USING (auth.uid() = user_id);

-- Item verification requests
CREATE TABLE IF NOT EXISTS public.item_verification_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  work_item_id uuid REFERENCES work_items(id) ON DELETE CASCADE NOT NULL,
  verifier_id uuid REFERENCES profiles(id),
  verifier_email text,
  org_id uuid,
  status text DEFAULT 'pending',
  message text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE item_verification_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ivr_own" ON item_verification_requests;
CREATE POLICY "ivr_own" ON item_verification_requests FOR ALL
  USING (auth.uid() = requester_id OR auth.uid() = verifier_id);

-- Replica identity for realtime DELETE/UPDATE events
ALTER TABLE post_reactions REPLICA IDENTITY FULL;
ALTER TABLE post_comments REPLICA IDENTITY FULL;
ALTER TABLE posts REPLICA IDENTITY FULL;

-- Add notifications to realtime
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
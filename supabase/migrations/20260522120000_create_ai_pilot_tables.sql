-- TiikmePilot AI tables
-- ai_threads: one thread per conversation
CREATE TABLE IF NOT EXISTS public.ai_threads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title text,
  mode text DEFAULT 'discover' NOT NULL,
  last_mode text,
  is_archived boolean DEFAULT false NOT NULL,
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.ai_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own threads" ON public.ai_threads FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_ai_threads_user_archived ON public.ai_threads(user_id, is_archived, last_message_at DESC);

-- ai_messages: individual turns within a thread
CREATE TABLE IF NOT EXISTS public.ai_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id uuid REFERENCES public.ai_threads(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own messages" ON public.ai_messages FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_thread ON public.ai_messages(thread_id, created_at ASC);

-- ai_audit_logs: cost + usage tracking (service role only)
CREATE TABLE IF NOT EXISTS public.ai_audit_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  org_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  thread_id uuid REFERENCES public.ai_threads(id) ON DELETE SET NULL,
  mode text,
  action text,
  query_text text,
  result_summary jsonb,
  decision text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.ai_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No direct reads" ON public.ai_audit_logs FOR SELECT USING (false);
CREATE INDEX IF NOT EXISTS idx_ai_audit_user_date ON public.ai_audit_logs(actor_user_id, created_at DESC);

-- ai_message_feedback: thumbs up/down per answer
CREATE TABLE IF NOT EXISTS public.ai_message_feedback (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id uuid REFERENCES public.ai_messages(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  rating text NOT NULL CHECK (rating IN ('up', 'down')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(message_id, user_id)
);
ALTER TABLE public.ai_message_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own feedback" ON public.ai_message_feedback FOR ALL USING (auth.uid() = user_id);

-- AI chat + pg_vector embeddings for tiikme.
-- Run AFTER Supabase Auth is enabled and profiles.id maps to auth.users.
--
-- Architecture:
--   * ai_chats / ai_messages   = persistent chat sessions per user
--   * flex_embeddings          = each user's Flex vectorized (composite + per-kind)
--   * ai_job_corpus            = unified job vectors (1st-party org posts + ingested)
--   * match_jobs_for_user()    = SECURITY DEFINER RPC; returns top-N jobs by cosine
--
-- All vectors use OpenAI text-embedding-3-small (1536 dims) — swap if needed.
-- HNSW indexes for fast ANN. Keep dim consistent across all rows.

CREATE EXTENSION IF NOT EXISTS vector;

-- ─── Chat sessions ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_chats (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       text NOT NULL,
  persona     text NOT NULL DEFAULT 'professional'
                CHECK (persona IN ('professional','student','org')),
  pinned      boolean DEFAULT false,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ai_chats_user_idx ON public.ai_chats(user_id, updated_at DESC);
ALTER TABLE public.ai_chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY ai_chats_owner ON public.ai_chats
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── Messages ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id     uuid NOT NULL REFERENCES public.ai_chats(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        text NOT NULL CHECK (role IN ('user','assistant','system')),
  content     text NOT NULL,
  citations   jsonb,
  followups   text[],
  trace       text[],
  tokens_in   int,
  tokens_out  int,
  model       text,
  created_at  timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ai_messages_chat_idx ON public.ai_messages(chat_id, created_at);
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY ai_messages_owner ON public.ai_messages
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── Flex embeddings (the user's verified resume vectorized) ─────
-- kind: 'composite' (headline + about + skills + experience joined)
--       'headline'  (just headline, for title-matching)
--       'experience'(per-entry — multiple rows allowed if we add an entry_id later)
CREATE TABLE IF NOT EXISTS public.flex_embeddings (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id   uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind         text NOT NULL,
  source_text  text NOT NULL,
  embedding    vector(1536),
  updated_at   timestamptz DEFAULT now(),
  UNIQUE (profile_id, kind)
);
ALTER TABLE public.flex_embeddings ENABLE ROW LEVEL SECURITY;

-- Owners can read their own embeddings (mostly for debugging).
-- Writes are restricted to service_role (your edge function backfills these).
CREATE POLICY flex_emb_read_own ON public.flex_embeddings
  FOR SELECT TO authenticated
  USING (profile_id = auth.uid());

-- ─── Job corpus (1st-party org posts + ingested external) ────────
CREATE TABLE IF NOT EXISTS public.ai_job_corpus (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_ref text UNIQUE,                     -- dedupe for ingested jobs
  org_slug     text,
  title        text NOT NULL,
  org_name     text,
  location     text,
  url          text,
  metadata     jsonb,                            -- type, mode, salary, skills, etc.
  source_text  text NOT NULL,
  embedding    vector(1536),
  posted_at    timestamptz,
  ingested_at  timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ai_job_corpus_posted_idx ON public.ai_job_corpus(posted_at DESC);
ALTER TABLE public.ai_job_corpus ENABLE ROW LEVEL SECURITY;

-- Public reads: jobs are meant to be discoverable.
CREATE POLICY job_corpus_read_all ON public.ai_job_corpus
  FOR SELECT TO anon, authenticated USING (true);

-- ─── HNSW indexes for fast cosine search ────────────────────────
CREATE INDEX IF NOT EXISTS flex_emb_hnsw_idx
  ON public.flex_embeddings USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS job_corpus_hnsw_idx
  ON public.ai_job_corpus USING hnsw (embedding vector_cosine_ops);

-- ─── Match RPC: top-N jobs for the user, by cosine similarity ────
-- SECURITY DEFINER so the auth user can't read other users' embeddings.
CREATE OR REPLACE FUNCTION public.match_jobs_for_user(
  p_user uuid,
  p_top  int DEFAULT 10
) RETURNS TABLE (
  job_id      uuid,
  title       text,
  org_name    text,
  similarity  float
) LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public' AS $$
  WITH me AS (
    SELECT embedding
    FROM public.flex_embeddings
    WHERE profile_id = p_user AND kind = 'composite'
    LIMIT 1
  )
  SELECT
    j.id          AS job_id,
    j.title,
    j.org_name,
    1 - (j.embedding <=> (SELECT embedding FROM me)) AS similarity
  FROM public.ai_job_corpus j, me
  WHERE me.embedding IS NOT NULL
    AND j.embedding IS NOT NULL
  ORDER BY j.embedding <=> (SELECT embedding FROM me)
  LIMIT p_top;
$$;
GRANT EXECUTE ON FUNCTION public.match_jobs_for_user(uuid, int) TO authenticated;

-- ─── Trigger: bump updated_at on ai_chats when a message is added ─
CREATE OR REPLACE FUNCTION public.tg_ai_chats_bump_updated()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.ai_chats SET updated_at = now() WHERE id = NEW.chat_id;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS ai_messages_bump_chat ON public.ai_messages;
CREATE TRIGGER ai_messages_bump_chat AFTER INSERT ON public.ai_messages
FOR EACH ROW EXECUTE FUNCTION public.tg_ai_chats_bump_updated();

-- Rollback:
-- DROP FUNCTION IF EXISTS public.match_jobs_for_user(uuid, int);
-- DROP TABLE IF EXISTS public.ai_job_corpus, public.flex_embeddings, public.ai_messages, public.ai_chats;
-- DROP FUNCTION IF EXISTS public.tg_ai_chats_bump_updated;

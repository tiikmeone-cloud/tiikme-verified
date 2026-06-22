-- Fixes three gaps in the Tiik engine:
--   1. enqueue_embedding — was called in client code but never defined
--   2. ai_messages.rating  — needed for thumbs feedback + self-training JSONL
--   3. embedding_queue     — backing table for enqueue_embedding

-- ── 1. Embedding queue table ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.embedding_queue (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  kind         text        NOT NULL,
  ref_id       uuid        NOT NULL,
  source_text  text        NOT NULL,
  ref_user_id  uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);
CREATE INDEX embedding_queue_unprocessed ON public.embedding_queue(created_at)
  WHERE processed_at IS NULL;
ALTER TABLE public.embedding_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY emb_queue_owner ON public.embedding_queue
  FOR ALL TO authenticated
  USING (auth.uid() = ref_user_id)
  WITH CHECK (auth.uid() = ref_user_id);

-- ── 2. enqueue_embedding RPC ─────────────────────────────────────────────────
-- Called from client lib after any Flex save. Writes to queue for async processing.
-- The composite embed (/api/tiik/embed) is the critical path; this queue handles
-- per-kind embeddings (headline, about, skills, experience individually).
CREATE OR REPLACE FUNCTION public.enqueue_embedding(
  p_kind         text,
  p_ref_id       uuid,
  p_source_text  text,
  p_ref_user_id  uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.embedding_queue (kind, ref_id, source_text, ref_user_id)
  VALUES (p_kind, p_ref_id, p_source_text, COALESCE(p_ref_user_id, auth.uid()));
END;
$$;
GRANT EXECUTE ON FUNCTION public.enqueue_embedding(text, uuid, text, uuid) TO authenticated;

-- ── 3. ai_messages.rating — for 👍/👎 training feedback ────────────────────
ALTER TABLE public.ai_messages
  ADD COLUMN IF NOT EXISTS rating smallint CHECK (rating IN (-1, 1));

-- Index to efficiently export high-rated session pairs for fine-tuning
CREATE INDEX IF NOT EXISTS ai_messages_rated_idx
  ON public.ai_messages(chat_id, rating)
  WHERE rating IS NOT NULL;

-- ── 4. tiik_nudges indexes for the proactive coach ───────────────────────────
CREATE INDEX IF NOT EXISTS tiik_nudges_unseen_idx
  ON public.tiik_nudges(user_id, shown_at DESC)
  WHERE acted_at IS NULL AND dismissed_at IS NULL;

-- Rollback:
-- DROP TABLE IF EXISTS public.embedding_queue;
-- DROP FUNCTION IF EXISTS public.enqueue_embedding(text, uuid, text, uuid);
-- ALTER TABLE public.ai_messages DROP COLUMN IF EXISTS rating;

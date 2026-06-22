-- Tiik AI engine tables
-- tiik_nudges      = every suggestion Tiik generates, with outcome tracking
-- tiik_user_model  = what each user responds to (learned per-user)
-- tiik_response_cache = semantic cache (same question ≈ same answer, skip API call)
-- match_tiik_cache = RPC: cosine search on cached responses

-- ─── Nudge history + outcome tracking ───────────────────────────
CREATE TABLE IF NOT EXISTS public.tiik_nudges (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type         text NOT NULL CHECK (type IN ('squad','vouch','cert','job','salary','peer_move','trust_score')),
  content      text NOT NULL,
  context      jsonb,        -- snapshot: trust_score, matched_job, etc.
  shown_at     timestamptz DEFAULT now(),
  acted_at     timestamptz,  -- user clicked / followed through
  dismissed_at timestamptz   -- user explicitly dismissed
);
CREATE INDEX tiik_nudges_user_idx ON public.tiik_nudges(user_id, shown_at DESC);
ALTER TABLE public.tiik_nudges ENABLE ROW LEVEL SECURITY;
CREATE POLICY tiik_nudges_owner ON public.tiik_nudges
  FOR ALL TO authenticated
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── Per-user learned model ──────────────────────────────────────
-- Updated by a cron after each nudge interaction
CREATE TABLE IF NOT EXISTS public.tiik_user_model (
  user_id              uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  squad_response_rate  numeric DEFAULT 0,   -- 0–1
  cert_response_rate   numeric DEFAULT 0,
  job_response_rate    numeric DEFAULT 0,
  vouch_response_rate  numeric DEFAULT 0,
  preferred_type       text DEFAULT 'balanced',
  total_shown          int DEFAULT 0,
  total_acted          int DEFAULT 0,
  updated_at           timestamptz DEFAULT now()
);
ALTER TABLE public.tiik_user_model ENABLE ROW LEVEL SECURITY;
CREATE POLICY tiik_model_owner ON public.tiik_user_model
  FOR ALL TO authenticated
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── Semantic response cache ─────────────────────────────────────
-- Before calling OpenAI: embed the query, find a near-identical cached response.
-- Same question from 1000 users → paid once.
CREATE TABLE IF NOT EXISTS public.tiik_response_cache (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query_embedding vector(1536) NOT NULL,
  context_hash    text NOT NULL,   -- md5 of user context (trust_score + squad_count etc)
  response        text NOT NULL,
  used_count      int DEFAULT 1,
  created_at      timestamptz DEFAULT now()
);
CREATE INDEX tiik_cache_hnsw ON public.tiik_response_cache
  USING hnsw (query_embedding vector_cosine_ops);

-- ─── Cache lookup RPC ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.match_tiik_cache(
  p_embedding    vector(1536),
  p_context_hash text,
  p_threshold    float DEFAULT 0.95   -- cosine similarity threshold (0.95 = very similar)
) RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public' AS $$
  SELECT response
  FROM   tiik_response_cache
  WHERE  context_hash = p_context_hash
    AND  1 - (query_embedding <=> p_embedding) >= p_threshold
  ORDER  BY query_embedding <=> p_embedding
  LIMIT  1;
$$;
GRANT EXECUTE ON FUNCTION public.match_tiik_cache(vector, text, float) TO authenticated, service_role;

-- ─── Update tiik_user_model after a nudge interaction ───────────
CREATE OR REPLACE FUNCTION public.tg_update_tiik_model()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_squad_rate  numeric;
  v_cert_rate   numeric;
  v_job_rate    numeric;
  v_vouch_rate  numeric;
  v_preferred   text;
BEGIN
  -- Recalculate response rates per type
  SELECT
    COALESCE(SUM(CASE WHEN type='squad'  AND acted_at IS NOT NULL THEN 1 ELSE 0 END)::numeric
           / NULLIF(SUM(CASE WHEN type='squad'  THEN 1 ELSE 0 END), 0), 0),
    COALESCE(SUM(CASE WHEN type='cert'   AND acted_at IS NOT NULL THEN 1 ELSE 0 END)::numeric
           / NULLIF(SUM(CASE WHEN type='cert'   THEN 1 ELSE 0 END), 0), 0),
    COALESCE(SUM(CASE WHEN type='job'    AND acted_at IS NOT NULL THEN 1 ELSE 0 END)::numeric
           / NULLIF(SUM(CASE WHEN type='job'    THEN 1 ELSE 0 END), 0), 0),
    COALESCE(SUM(CASE WHEN type='vouch'  AND acted_at IS NOT NULL THEN 1 ELSE 0 END)::numeric
           / NULLIF(SUM(CASE WHEN type='vouch'  THEN 1 ELSE 0 END), 0), 0)
  INTO v_squad_rate, v_cert_rate, v_job_rate, v_vouch_rate
  FROM public.tiik_nudges
  WHERE user_id = NEW.user_id;

  -- Preferred type = whichever has highest response rate
  SELECT type INTO v_preferred FROM (
    VALUES ('squad', v_squad_rate), ('cert', v_cert_rate),
           ('job', v_job_rate),    ('vouch', v_vouch_rate)
  ) AS t(type, rate) ORDER BY rate DESC LIMIT 1;

  INSERT INTO public.tiik_user_model
    (user_id, squad_response_rate, cert_response_rate, job_response_rate,
     vouch_response_rate, preferred_type, total_shown, total_acted, updated_at)
  VALUES
    (NEW.user_id, v_squad_rate, v_cert_rate, v_job_rate, v_vouch_rate,
     COALESCE(v_preferred, 'balanced'),
     (SELECT COUNT(*) FROM public.tiik_nudges WHERE user_id = NEW.user_id),
     (SELECT COUNT(*) FROM public.tiik_nudges WHERE user_id = NEW.user_id AND acted_at IS NOT NULL),
     now())
  ON CONFLICT (user_id) DO UPDATE SET
    squad_response_rate = EXCLUDED.squad_response_rate,
    cert_response_rate  = EXCLUDED.cert_response_rate,
    job_response_rate   = EXCLUDED.job_response_rate,
    vouch_response_rate = EXCLUDED.vouch_response_rate,
    preferred_type      = EXCLUDED.preferred_type,
    total_shown         = EXCLUDED.total_shown,
    total_acted         = EXCLUDED.total_acted,
    updated_at          = now();

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS tiik_nudge_acted ON public.tiik_nudges;
CREATE TRIGGER tiik_nudge_acted
  AFTER UPDATE OF acted_at, dismissed_at ON public.tiik_nudges
  FOR EACH ROW EXECUTE FUNCTION public.tg_update_tiik_model();

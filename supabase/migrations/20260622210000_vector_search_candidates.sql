-- search_candidates_by_vector: semantic candidate discovery for org outbound sourcing
-- Takes an embedding vector (from the org's natural-language search query),
-- finds open-to-work candidates whose composite Flex embedding is closest.
-- Returns anonymized rows — no email, no phone.

CREATE OR REPLACE FUNCTION public.search_candidates_by_vector(
  p_embedding  vector(1536),
  p_limit      int DEFAULT 50
)
RETURNS TABLE (
  id             uuid,
  username       text,
  headline       text,
  location_city  text,
  skills         text[],
  similarity     float
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.username,
    p.headline,
    p.location_city,
    p.skills,
    1 - (fe.embedding <=> p_embedding) AS similarity
  FROM public.flex_embeddings fe
  JOIN public.profiles p ON p.id = fe.profile_id
  WHERE
    fe.kind = 'composite'
    AND fe.embedding IS NOT NULL
    AND p.open_to_work = true
    AND p.is_public    = true
    AND p.account_type = 'user'
  ORDER BY fe.embedding <=> p_embedding
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION public.search_candidates_by_vector(vector, int) TO authenticated;

-- get_trust_scores_bulk: batch trust lookup for the reranker (avoids N+1 queries)
CREATE OR REPLACE FUNCTION public.get_trust_scores_bulk(p_user_ids uuid[])
RETURNS TABLE (
  user_id     uuid,
  score       int,
  squad_count int
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id                                      AS user_id,
    COALESCE(
      (SELECT score FROM public.trust_scores ts WHERE ts.user_id = p.id LIMIT 1), 0
    )                                         AS score,
    COALESCE(
      (SELECT COUNT(*)::int FROM public.squad_members sm
       WHERE sm.target_user_id = p.id AND sm.status = 'verified'), 0
    )                                         AS squad_count
  FROM public.profiles p
  WHERE p.id = ANY(p_user_ids);
$$;

GRANT EXECUTE ON FUNCTION public.get_trust_scores_bulk(uuid[]) TO authenticated;

-- Rollback:
-- DROP FUNCTION IF EXISTS public.search_candidates_by_vector(vector, int);
-- DROP FUNCTION IF EXISTS public.get_trust_scores_bulk(uuid[]);

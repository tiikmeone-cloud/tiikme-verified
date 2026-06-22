-- Squads: bilateral peer verification between users.
-- A squad is live only when BOTH parties confirm.

-- ── Table ──────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.squads (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  initiator_id    uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id     uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status          text        NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending','active','revoked','expired')),
  context_org_id  uuid        REFERENCES public.orgs(id) ON DELETE SET NULL,
  context_proj    text,
  initiated_at    timestamptz NOT NULL DEFAULT now(),
  confirmed_at    timestamptz,
  UNIQUE (initiator_id, receiver_id),
  CHECK (initiator_id <> receiver_id)
);

ALTER TABLE public.squads ENABLE ROW LEVEL SECURITY;

CREATE POLICY squads_both_parties ON public.squads
  FOR ALL TO authenticated
  USING (initiator_id = auth.uid() OR receiver_id = auth.uid())
  WITH CHECK (initiator_id = auth.uid() OR receiver_id = auth.uid());

-- ── request_squad ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.request_squad(
  p_from        uuid,
  p_to          uuid,
  p_context_org uuid DEFAULT NULL,
  p_context_proj text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF p_from = p_to THEN RAISE EXCEPTION 'Cannot squad yourself'; END IF;
  -- Upsert: if already exists in either direction, return existing id
  SELECT id INTO v_id
  FROM public.squads
  WHERE (initiator_id = p_from AND receiver_id = p_to)
     OR (initiator_id = p_to   AND receiver_id = p_from)
  LIMIT 1;

  IF v_id IS NOT NULL THEN RETURN v_id; END IF;

  INSERT INTO public.squads (initiator_id, receiver_id, context_org_id, context_proj)
  VALUES (p_from, p_to, p_context_org, p_context_proj)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.request_squad(uuid, uuid, uuid, text) TO authenticated;

-- ── confirm_squad ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.confirm_squad(p_squad uuid, p_confirmer uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.squads
  SET status = 'active', confirmed_at = now()
  WHERE id = p_squad
    AND receiver_id = p_confirmer
    AND status = 'pending';
END;
$$;
GRANT EXECUTE ON FUNCTION public.confirm_squad(uuid, uuid) TO authenticated;

-- ── revoke_squad ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.revoke_squad(p_squad uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.squads
  SET status = 'revoked'
  WHERE id = p_squad
    AND (initiator_id = auth.uid() OR receiver_id = auth.uid());
END;
$$;
GRANT EXECUTE ON FUNCTION public.revoke_squad(uuid) TO authenticated;

-- ── list_my_squads ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.list_my_squads(p_user uuid)
RETURNS TABLE (
  squad_id       uuid,
  status         text,
  is_initiator   boolean,
  is_incoming    boolean,
  other_id       uuid,
  other_name     text,
  other_username text,
  other_headline text,
  other_avatar   text,
  context_org    uuid,
  context_org_slug text,
  context_org_name text,
  context_proj   text,
  created_at     timestamptz,
  confirmed_at   timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    s.id                          AS squad_id,
    s.status,
    (s.initiator_id = p_user)     AS is_initiator,
    (s.receiver_id = p_user AND s.status = 'pending') AS is_incoming,
    CASE WHEN s.initiator_id = p_user THEN s.receiver_id ELSE s.initiator_id END AS other_id,
    CASE WHEN s.initiator_id = p_user THEN p2.full_name  ELSE p1.full_name  END AS other_name,
    CASE WHEN s.initiator_id = p_user THEN p2.username   ELSE p1.username   END AS other_username,
    CASE WHEN s.initiator_id = p_user THEN p2.headline   ELSE p1.headline   END AS other_headline,
    CASE WHEN s.initiator_id = p_user THEN p2.avatar_url ELSE p1.avatar_url END AS other_avatar,
    s.context_org_id              AS context_org,
    o.slug                        AS context_org_slug,
    o.name                        AS context_org_name,
    s.context_proj,
    s.initiated_at                AS created_at,
    s.confirmed_at
  FROM public.squads s
  LEFT JOIN public.profiles p1 ON p1.id = s.initiator_id
  LEFT JOIN public.profiles p2 ON p2.id = s.receiver_id
  LEFT JOIN public.orgs     o  ON o.id  = s.context_org_id
  WHERE (s.initiator_id = p_user OR s.receiver_id = p_user)
    AND s.status <> 'revoked'
  ORDER BY s.initiated_at DESC;
$$;
GRANT EXECUTE ON FUNCTION public.list_my_squads(uuid) TO authenticated;

-- ── suggest_squad_mates ───────────────────────────────────────────────────────
-- Returns co-workers (same org) who aren't already in a squad with p_user.
CREATE OR REPLACE FUNCTION public.suggest_squad_mates(p_user uuid, p_limit int DEFAULT 30)
RETURNS TABLE (
  user_id          uuid,
  username         text,
  full_name        text,
  headline         text,
  avatar_url       text,
  shared_org_id    uuid,
  shared_org_slug  text,
  shared_org_name  text,
  shared_role      text,
  overlap_months   int
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT ON (p.id)
    p.id                          AS user_id,
    p.username,
    p.full_name,
    p.headline,
    p.avatar_url,
    o.id                          AS shared_org_id,
    o.slug                        AS shared_org_slug,
    o.name                        AS shared_org_name,
    om2.role                      AS shared_role,
    0                             AS overlap_months
  FROM public.org_memberships om1
  JOIN public.org_memberships om2 ON om2.org_id = om1.org_id AND om2.user_id <> p_user
  JOIN public.profiles p  ON p.id = om2.user_id
  JOIN public.orgs     o  ON o.id = om1.org_id
  WHERE om1.user_id = p_user
    AND p.id NOT IN (
      SELECT CASE WHEN s.initiator_id = p_user THEN s.receiver_id ELSE s.initiator_id END
      FROM public.squads s
      WHERE (s.initiator_id = p_user OR s.receiver_id = p_user)
        AND s.status <> 'revoked'
    )
  ORDER BY p.id, o.id
  LIMIT p_limit;
$$;
GRANT EXECUTE ON FUNCTION public.suggest_squad_mates(uuid, int) TO authenticated;

-- ── get_org_squad_density ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_org_squad_density(p_org uuid)
RETURNS TABLE (
  total_members       int,
  members_with_squad  int,
  density_pct         numeric,
  active_edges        int
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH members AS (
    SELECT user_id FROM public.org_memberships WHERE org_id = p_org
  ),
  edges AS (
    SELECT s.id
    FROM public.squads s
    JOIN members m1 ON m1.user_id = s.initiator_id
    JOIN members m2 ON m2.user_id = s.receiver_id
    WHERE s.status = 'active'
  ),
  connected AS (
    SELECT DISTINCT user_id FROM (
      SELECT s.initiator_id AS user_id FROM public.squads s JOIN members m ON m.user_id = s.initiator_id WHERE s.status='active'
      UNION
      SELECT s.receiver_id  AS user_id FROM public.squads s JOIN members m ON m.user_id = s.receiver_id  WHERE s.status='active'
    ) t
  )
  SELECT
    (SELECT COUNT(*)::int FROM members)          AS total_members,
    (SELECT COUNT(*)::int FROM connected)        AS members_with_squad,
    CASE WHEN (SELECT COUNT(*) FROM members) = 0 THEN 0
         ELSE ROUND(100.0 * (SELECT COUNT(*) FROM connected) / (SELECT COUNT(*) FROM members), 1)
    END                                          AS density_pct,
    (SELECT COUNT(*)::int FROM edges)            AS active_edges;
$$;
GRANT EXECUTE ON FUNCTION public.get_org_squad_density(uuid) TO authenticated;

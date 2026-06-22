-- flex_requests: org → candidate Flex access requests
-- search_open_candidates: RPC for talent discovery
-- get_approved_candidate_flex: RPC to fetch full Flex after approval

-- ── flex_requests ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.flex_requests (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         uuid        NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  candidate_id   uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  org_name       text        NOT NULL,
  org_slug       text        NOT NULL,
  org_logo_url   text,
  status         text        NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending', 'approved', 'declined')),
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, candidate_id)
);

ALTER TABLE public.flex_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY flex_requests_org_insert ON public.flex_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM public.org_memberships
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
    )
  );

CREATE POLICY flex_requests_org_select ON public.flex_requests
  FOR SELECT TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM public.org_memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY flex_requests_candidate_all ON public.flex_requests
  FOR ALL TO authenticated
  USING (candidate_id = auth.uid())
  WITH CHECK (candidate_id = auth.uid());

-- ── search_open_candidates ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.search_open_candidates(
  p_limit   int     DEFAULT 50,
  p_offset  int     DEFAULT 0,
  p_skills  text[]  DEFAULT NULL
)
RETURNS TABLE (
  id               uuid,
  username         text,
  full_name        text,
  avatar_url       text,
  headline         text,
  about            text,
  location_city    text,
  location_state   text,
  skills           text[],
  total_years_exp  int
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id, p.username, p.full_name, p.avatar_url, p.headline, p.about,
    p.location_city, p.location_state, p.skills,
    COALESCE((
      SELECT SUM(
        CASE
          WHEN e.currently_working THEN
            EXTRACT(YEAR FROM age(now(), make_date(e.start_year, COALESCE(e.start_month, 1), 1)))::int
          WHEN e.end_year IS NOT NULL THEN (e.end_year - e.start_year)
          ELSE 0
        END
      )
      FROM public.flex_experience e WHERE e.user_id = p.id
    ), 0)::int AS total_years_exp
  FROM public.profiles p
  WHERE p.open_to_work = true
    AND p.is_public = true
    AND COALESCE(p.account_type, 'user') = 'user'
    AND (p_skills IS NULL OR p.skills && p_skills)
  ORDER BY p.updated_at DESC NULLS LAST
  LIMIT p_limit OFFSET p_offset;
$$;

GRANT EXECUTE ON FUNCTION public.search_open_candidates(int, int, text[]) TO authenticated;

-- ── get_approved_candidate_flex ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_approved_candidate_flex(p_candidate_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id  uuid;
  v_result  json;
BEGIN
  SELECT fr.org_id INTO v_org_id
  FROM public.flex_requests fr
  JOIN public.org_memberships om ON om.org_id = fr.org_id AND om.user_id = auth.uid()
  WHERE fr.candidate_id = p_candidate_id AND fr.status = 'approved'
  LIMIT 1;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Not authorized: no approved flex request found';
  END IF;

  SELECT json_build_object(
    'email',        p.email,
    'experience',   COALESCE((
      SELECT json_agg(row_to_json(e) ORDER BY e.start_year DESC, COALESCE(e.start_month,1) DESC)
      FROM public.flex_experience e WHERE e.user_id = p_candidate_id
    ), '[]'::json),
    'education',    COALESCE((
      SELECT json_agg(row_to_json(edu) ORDER BY edu.end_year DESC NULLS LAST)
      FROM public.flex_education edu WHERE edu.user_id = p_candidate_id
    ), '[]'::json),
    'achievements', COALESCE((
      SELECT json_agg(row_to_json(a) ORDER BY a.display_order ASC)
      FROM public.flex_achievements a WHERE a.user_id = p_candidate_id
    ), '[]'::json)
  ) INTO v_result
  FROM public.profiles p WHERE p.id = p_candidate_id;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_approved_candidate_flex(uuid) TO authenticated;

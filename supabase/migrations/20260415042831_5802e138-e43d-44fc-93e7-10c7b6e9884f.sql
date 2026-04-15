
-- Function: match opportunities for a user with weighted scoring
CREATE OR REPLACE FUNCTION public.match_opportunities_for_user(p_user_id uuid)
RETURNS TABLE(
  opportunity_id uuid,
  match_score float
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    o.id as opportunity_id,
    (
      0.25 * COALESCE(
        (SELECT COUNT(*)::float FROM unnest(o.skills_required) sk WHERE sk = ANY(p.skills))
        / GREATEST(COALESCE(array_length(o.skills_required, 1), 1), 1)::float,
        0.5
      )
      + 0.20 * CASE
          WHEN o.experience_min IS NULL THEN 0.5
          WHEN COALESCE(
            (SELECT EXTRACT(YEAR FROM age(now(), MIN(w.start_date)))
             FROM work_items w WHERE w.owner_id = p_user_id AND w.item_type = 'experience' AND w.start_date IS NOT NULL),
            0
          ) >= o.experience_min THEN 1.0
          WHEN COALESCE(
            (SELECT EXTRACT(YEAR FROM age(now(), MIN(w.start_date)))
             FROM work_items w WHERE w.owner_id = p_user_id AND w.item_type = 'experience' AND w.start_date IS NOT NULL),
            0
          ) >= o.experience_min - 1 THEN 0.7
          ELSE 0.3
        END
      + 0.15 * CASE
          WHEN o.location IS NOT NULL AND o.location = p.location_city THEN 1.0
          WHEN o.is_remote = true THEN 0.8
          ELSE 0.3
        END
      + 0.15 * CASE WHEN p.sector IS NOT NULL AND o.domain IS NOT NULL AND p.sector = o.domain THEN 1.0 ELSE 0.0 END
      + 0.10 * CASE
          WHEN o.activity_score_min IS NULL OR o.activity_score_min = 0 THEN 0.5
          WHEN COALESCE(p.activity_score, 0) >= o.activity_score_min THEN 1.0
          ELSE COALESCE(p.activity_score, 0)::float / GREATEST(o.activity_score_min, 1)::float
        END
      + 0.10 * COALESCE(p.is_verified::int, 0)::float
      + 0.05 * EXP(-0.693 * EXTRACT(EPOCH FROM now() - o.created_at) / 3600.0 / 168.0)
    ) as match_score
  FROM opportunities o
  CROSS JOIN profiles p
  WHERE p.id = p_user_id
    AND o.is_open = true
    AND o.status = 'active'
  ORDER BY match_score DESC
  LIMIT 20;
$$;

-- Function: rank explore pages for a user
CREATE OR REPLACE FUNCTION public.rank_explore_pages(p_user_id uuid, p_page_type text DEFAULT NULL)
RETURNS TABLE(
  page_id uuid,
  explore_score float
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    pg.id as page_id,
    (
      0.30 * CASE WHEN pg.industry IS NOT NULL AND pg.industry = p.sector THEN 1.0 ELSE 0.0 END
      + 0.25 * CASE
          WHEN pg.city IS NOT NULL AND pg.city = p.location_city THEN 1.0
          WHEN pg.state IS NOT NULL AND pg.state = p.location_state THEN 0.5
          ELSE 0.0
        END
      + 0.20 * LEAST(COALESCE(pg.tracker_count, 0)::float / 1000.0, 1.0)
      + 0.15 * LEAST(COALESCE(pg.trust_score, 0)::float / 100.0, 1.0)
      + 0.10 * EXP(-0.693 * EXTRACT(EPOCH FROM now() - pg.created_at) / 3600.0 / 720.0)
    ) as explore_score
  FROM pages pg
  CROSS JOIN profiles p
  WHERE p.id = p_user_id
    AND (p_page_type IS NULL OR pg.page_type = p_page_type)
    AND pg.id NOT IN (SELECT pt.page_id FROM page_trackers pt WHERE pt.user_id = p_user_id)
  ORDER BY explore_score DESC
  LIMIT 20;
$$;

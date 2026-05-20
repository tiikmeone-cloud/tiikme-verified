-- Phase 1 production hardening for Tiikme.
-- Scope intentionally stays server-side only:
-- 1) reduce exposed RPC/function surface to the functions the frontend actually uses
-- 2) tighten trust-critical storage access without changing product behavior
-- 3) add only clearly missing FK indexes on hot comment paths
-- 4) remove duplicate indexes only when the live definitions are identical

-- Prevent future helper functions from becoming callable by default.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated;

-- Client-callable RPC allow-list.
-- These are still used by the current frontend and therefore keep authenticated access.
DO $$
BEGIN
  IF to_regprocedure('public.increment_score(uuid,integer)') IS NOT NULL THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.increment_score(uuid, integer) FROM PUBLIC, anon, authenticated';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.increment_score(uuid, integer) TO authenticated';
  END IF;

  IF to_regprocedure('public.increment_days_active(uuid)') IS NOT NULL THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.increment_days_active(uuid) FROM PUBLIC, anon, authenticated';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.increment_days_active(uuid) TO authenticated';
  END IF;

  IF to_regprocedure('public.can_message_user(uuid)') IS NOT NULL THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.can_message_user(uuid) FROM PUBLIC, anon, authenticated';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.can_message_user(uuid) TO authenticated';
  END IF;

  IF to_regprocedure('public.resolve_verification_assignee(uuid,text)') IS NOT NULL THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.resolve_verification_assignee(uuid, text) FROM PUBLIC, anon, authenticated';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.resolve_verification_assignee(uuid, text) TO authenticated';
  END IF;

  IF to_regprocedure('public.award_power(uuid,integer,text,uuid,text)') IS NOT NULL THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.award_power(uuid, integer, text, uuid, text) FROM PUBLIC, anon, authenticated';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.award_power(uuid, integer, text, uuid, text) TO authenticated';
  END IF;
END;
$$;

-- Internal helpers and trigger functions must not be API-addressable.
-- We revoke both anonymous and authenticated execution because the app does not call them directly.
DO $$
DECLARE
  fn_signature text;
BEGIN
  FOREACH fn_signature IN ARRAY (
    ARRAY[
    'public.auto_verify_new_org()',
    'public.handle_new_user()',
    'public.on_verification_approved()',
    'public.is_org_admin(uuid,uuid)',
    'public.is_moderator(uuid)',
    'public.are_users_connected(uuid,uuid)',
    'public.block_reserved_usernames()',
    'public.circle_posts_bump_upvotes()',
    'public.circles_bump_member_count()',
    'public.circles_member_count_sync()',
    'public.circles_post_count_sync()',
    'public.limit_upvote_manipulation()',
    'public.org_add_creator_as_owner()',
    'public.prevent_role_escalation()',
    'public.rls_auto_enable()',
    'public.sync_circle_post_comment_count()',
    'public.sync_email_from_auth()',
    'public.touch_updated_at()',
    'public.update_all_activity_scores()',
    'public.update_all_activity_scores_v2()',
    'public.update_user_level()',
    'public.auto_expire_opportunities()',
    'public.refresh_circle_post_hot()',
    'public.calculate_activity_score(uuid)',
    'public.calculate_activity_score_v2(uuid)',
    'public.calculate_circle_post_hot_score(uuid)',
    'public.detect_duplicate_post()',
    'public.get_page_tracker_count(uuid)',
    'public.get_user_list(integer,integer,text)',
    'public.match_opportunities_for_user(uuid)',
    'public.rank_explore_pages(uuid,text)'
  ]::text[]
  )
  LOOP
    IF to_regprocedure(fn_signature) IS NOT NULL THEN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', fn_signature);
    END IF;
  END LOOP;
END;
$$;

-- Sensitive storage remains private; this change only tightens reviewer access.
-- Old rows may still store a full URL instead of the object path, so we allow
-- exact path matches first and keep a narrow legacy suffix fallback.
DROP POLICY IF EXISTS "vd_admin_read" ON storage.objects;

CREATE POLICY "vd_admin_read"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'verification-docs'
  AND EXISTS (
    SELECT 1
    FROM public.verification_requests vr
    WHERE (
      vr.document_url = objects.name
      OR vr.document_url LIKE '%/' || objects.name
    )
      AND (
        vr.assigned_to = auth.uid()
        OR vr.reviewed_by = auth.uid()
        OR (
          vr.org_id IS NOT NULL
          AND public.is_org_admin(vr.org_id, auth.uid())
        )
      )
  )
);

-- Hot-path FK indexes for threaded comments and reviewer-facing fetches.
CREATE INDEX IF NOT EXISTS idx_circle_post_comments_post_id
  ON public.circle_post_comments(post_id);

CREATE INDEX IF NOT EXISTS idx_circle_post_comments_parent_id
  ON public.circle_post_comments(parent_id);

CREATE INDEX IF NOT EXISTS idx_circle_post_comments_user_id
  ON public.circle_post_comments(user_id);

CREATE INDEX IF NOT EXISTS idx_opportunity_comments_parent_id
  ON public.opportunity_comments(parent_id);

CREATE INDEX IF NOT EXISTS idx_opportunity_comments_user_id
  ON public.opportunity_comments(user_id);

-- Remove duplicate indexes only when the kept and dropped definitions differ by name only.
DO $$
DECLARE
  keep_def text;
  drop_def text;
BEGIN
  SELECT indexdef INTO keep_def
  FROM pg_indexes
  WHERE schemaname = 'public' AND indexname = 'idx_opportunities_org';

  SELECT indexdef INTO drop_def
  FROM pg_indexes
  WHERE schemaname = 'public' AND indexname = 'idx_opportunities_org_status';

  IF keep_def IS NOT NULL
     AND drop_def = replace(keep_def, 'idx_opportunities_org', 'idx_opportunities_org_status') THEN
    EXECUTE 'DROP INDEX public.idx_opportunities_org_status';
  END IF;

  SELECT indexdef INTO keep_def
  FROM pg_indexes
  WHERE schemaname = 'public' AND indexname = 'idx_opp_apps_applicant';

  SELECT indexdef INTO drop_def
  FROM pg_indexes
  WHERE schemaname = 'public' AND indexname = 'idx_opp_apps_user';

  IF keep_def IS NOT NULL
     AND drop_def = replace(keep_def, 'idx_opp_apps_applicant', 'idx_opp_apps_user') THEN
    EXECUTE 'DROP INDEX public.idx_opp_apps_user';
  END IF;

  SELECT indexdef INTO keep_def
  FROM pg_indexes
  WHERE schemaname = 'public' AND indexname = 'idx_opp_apps_opp';

  SELECT indexdef INTO drop_def
  FROM pg_indexes
  WHERE schemaname = 'public' AND indexname = 'idx_opp_apps_opportunity';

  IF keep_def IS NOT NULL
     AND drop_def = replace(keep_def, 'idx_opp_apps_opp', 'idx_opp_apps_opportunity') THEN
    EXECUTE 'DROP INDEX public.idx_opp_apps_opportunity';
  END IF;

  SELECT indexdef INTO keep_def
  FROM pg_indexes
  WHERE schemaname = 'public' AND indexname = 'idx_posts_by_org';

  SELECT indexdef INTO drop_def
  FROM pg_indexes
  WHERE schemaname = 'public' AND indexname = 'idx_posts_org';

  IF keep_def IS NOT NULL
     AND drop_def = replace(keep_def, 'idx_posts_by_org', 'idx_posts_org') THEN
    EXECUTE 'DROP INDEX public.idx_posts_org';
  END IF;

  SELECT indexdef INTO keep_def
  FROM pg_indexes
  WHERE schemaname = 'public' AND indexname = 'idx_work_items_company';

  SELECT indexdef INTO drop_def
  FROM pg_indexes
  WHERE schemaname = 'public' AND indexname = 'idx_work_items_company_name';

  IF keep_def IS NOT NULL
     AND drop_def = replace(keep_def, 'idx_work_items_company', 'idx_work_items_company_name') THEN
    EXECUTE 'DROP INDEX public.idx_work_items_company_name';
  END IF;

  SELECT indexdef INTO keep_def
  FROM pg_indexes
  WHERE schemaname = 'public' AND indexname = 'idx_work_items_current';

  SELECT indexdef INTO drop_def
  FROM pg_indexes
  WHERE schemaname = 'public' AND indexname = 'idx_work_items_current_user';

  IF keep_def IS NOT NULL
     AND drop_def = replace(keep_def, 'idx_work_items_current', 'idx_work_items_current_user') THEN
    EXECUTE 'DROP INDEX public.idx_work_items_current_user';
  END IF;
END;
$$;

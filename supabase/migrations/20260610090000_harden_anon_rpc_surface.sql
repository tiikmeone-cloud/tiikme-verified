-- Harden the anonymous attack surface.
--
-- Finding (2026-06-10 audit): 44 SECURITY DEFINER RPCs were executable by the
-- `anon` role and trusted a caller-supplied `p_user` / `p_org` UUID instead of
-- the session identity. Because the app currently has NO authenticated users,
-- `anon` IS the entire live attack surface. Revoking EXECUTE from anon/PUBLIC
-- closes the hole today. The auth.uid()-derivation + org-admin body rewrites
-- ship with authentication ("auth next") where they can be tested with real
-- sessions.
--
-- A tiny allowlist of genuinely public, PII-free read RPCs stays anon-callable
-- so the logged-out marketing surfaces (Level Up, brand campaigns, popular
-- dropdown values) keep working.

do $$
declare
  fn   record;
  keep text[] := array[
    'list_learn_items',      -- Level Up catalogue (public)
    'list_brand_campaigns',  -- creator briefs (public)
    'popular_custom_values'  -- aggregate dropdown values (public, no PII)
  ];
begin
  for fn in
    select p.oid::regprocedure::text as sig
    from   pg_proc p
    join   pg_namespace n on n.oid = p.pronamespace
    where  n.nspname = 'public'
      and  p.prosecdef = true
      and  p.proname <> all(keep)
  loop
    execute format('revoke execute on function %s from public',        fn.sig);
    execute format('revoke execute on function %s from anon',          fn.sig);
    execute format('grant  execute on function %s to authenticated',   fn.sig);
    execute format('grant  execute on function %s to service_role',    fn.sig);
  end loop;
end $$;

-- Pin search_path on the two flagged functions (bodies are schema-qualified
-- or schema-less, so empty search_path is safe and immutable).
do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure::text as sig
    from   pg_proc p
    join   pg_namespace n on n.oid = p.pronamespace
    where  n.nspname = 'public'
      and  p.proname in ('tg_ai_chats_bump_updated', '_canonical_pair')
  loop
    execute format('alter function %s set search_path = ''''', r.sig);
  end loop;
end $$;

-- Stop anonymous enumeration of the public `post-images` bucket. The bucket
-- stays public=true so direct CDN URLs still resolve; we only drop the broad
-- list/read policy. Authenticated API reads remain via auth_read_post_images.
drop policy if exists public_read_post_images on storage.objects;

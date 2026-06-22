-- Rollback for 20260610090000_harden_anon_rpc_surface.sql
-- Re-grants EXECUTE to anon on the previously-open SECURITY DEFINER RPCs,
-- restores the broad post-images read policy, and clears the pinned search_path.
-- NOTE: this re-opens the IDOR surface — only run to restore prior (insecure) state.

do $$
declare
  fn   record;
  keep text[] := array['list_learn_items','list_brand_campaigns','popular_custom_values'];
begin
  for fn in
    select p.oid::regprocedure::text as sig
    from   pg_proc p
    join   pg_namespace n on n.oid = p.pronamespace
    where  n.nspname = 'public'
      and  p.prosecdef = true
      and  p.proname <> all(keep)
  loop
    execute format('grant execute on function %s to anon', fn.sig);
  end loop;
end $$;

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
    execute format('alter function %s reset search_path', r.sig);
  end loop;
end $$;

create policy public_read_post_images on storage.objects
  for select to public
  using (bucket_id = 'post-images');

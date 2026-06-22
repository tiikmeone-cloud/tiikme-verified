-- "Hired via tiikme" — when a candidate has been hired via the platform before,
-- that record travels with them. Future orgs see it as verifiable proof on the
-- candidate's Flex / on the talent drawer.
create or replace function public.get_user_tiikme_hires(p_user uuid)
returns table (
  application_id uuid,
  org_id   uuid, org_slug text, org_name text,
  job_id   uuid, job_title text,
  hired_at  timestamptz
)
language sql security definer set search_path = '' as $$
  select a.id, o.id, o.slug, o.name, j.id, j.title, coalesce(a.last_stage_change, a.applied_at)
  from   public.applications a
  join   public.org_jobs j on j.id = a.job_id
  join   public.orgs o on o.id = j.org_id
  where  a.user_id = p_user and a.stage = 'hired'
  order  by coalesce(a.last_stage_change, a.applied_at) desc;
$$;
grant execute on function public.get_user_tiikme_hires(uuid) to anon, authenticated;

-- Profile skills are part of the public Flex surface.
grant select(skills) on public.profiles to anon, authenticated;

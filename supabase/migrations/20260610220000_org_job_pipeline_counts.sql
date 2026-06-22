-- Per-job stage counts for the RecruitSmart-style pipeline preview row on the
-- org page Jobs tab. One RPC call returns counts for every job at the org.
create or replace function public.org_job_pipeline_counts(p_org uuid)
returns table (
  job_id uuid,
  applied int, screening int, shortlisted int, interview int, offer int, hired int, rejected int
)
language sql security definer set search_path = '' as $$
  select j.id,
    count(*) filter (where a.stage = 'applied')::int     as applied,
    count(*) filter (where a.stage = 'screening')::int   as screening,
    count(*) filter (where a.stage in ('shortlisted','shortlisted_with_consent'))::int as shortlisted,
    count(*) filter (where a.stage = 'interview')::int  as interview,
    count(*) filter (where a.stage = 'offer')::int       as offer,
    count(*) filter (where a.stage = 'hired')::int       as hired,
    count(*) filter (where a.stage = 'rejected')::int    as rejected
  from public.org_jobs j
  left join public.applications a on a.job_id = j.id
  where j.org_id = p_org
  group by j.id;
$$;
grant execute on function public.org_job_pipeline_counts(uuid) to anon, authenticated;

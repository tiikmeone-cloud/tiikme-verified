-- LinkedIn-style apply: org sees applicant email on apply.
-- Email/phone denormalized to the application row so it's scoped to that
-- application (not exposed via profiles). Plus stage-5 scoring columns
-- the ranking engine will write to.
alter table public.applications
  add column if not exists applicant_email  text,
  add column if not exists applicant_phone  text,
  add column if not exists ai_score         numeric(5,2),
  add column if not exists match_breakdown  jsonb  not null default '{}'::jsonb,
  add column if not exists knockout_passed  boolean,
  add column if not exists source           text   not null default 'in_platform',
  add column if not exists scored_at        timestamptz;

alter table public.applications
  add constraint applications_source_chk
    check (source in ('in_platform','external','hybrid','referral')) not valid;

-- Rewrite get_org_applications to return the new columns + sort by ai_score desc.
drop function if exists public.get_org_applications(uuid);
create function public.get_org_applications(p_org uuid)
returns table (
  app_id          uuid, stage text, applied_at timestamptz, last_change timestamptz,
  user_id         uuid, user_username text, user_full_name text, user_headline text,
  user_avatar     text, user_location text,
  job_id          uuid, job_title text,
  consent_given   boolean, contact_given boolean,
  applicant_email text,  applicant_phone text,
  ai_score        numeric, knockout_passed boolean, source text,
  screening_answers jsonb, match_breakdown jsonb
)
language sql security definer set search_path = '' as $$
  select a.id, a.stage, a.applied_at, a.last_stage_change,
         p.id, p.username, p.full_name, p.headline, p.avatar_url, p.location_city,
         j.id, j.title,
         exists (select 1 from public.flex_download_consents c
                  where c.application_id = a.id and c.revoked_at is null and c.expires_at > now()) as consent_given,
         exists (select 1 from public.contact_reveal_consents r
                  where r.application_id = a.id and r.revoked_at is null) as contact_given,
         a.applicant_email, a.applicant_phone, a.ai_score, a.knockout_passed, a.source,
         a.screening_answers, a.match_breakdown
  from   public.applications a
  join   public.profiles p on p.id = a.user_id
  join   public.org_jobs  j on j.id = a.job_id
  where  j.org_id = p_org
  order  by coalesce(a.ai_score, 0) desc, a.applied_at desc;
$$;

-- Re-grant the read RPC to anon for the demo (was revoked in the hardening pass).
grant execute on function public.get_org_applications(uuid) to anon, authenticated;

-- TEMP demo policy: allow the demo to write/update applications without auth.
-- MUST be replaced with auth.uid()-based RLS when auth lands.
grant select, insert, update on public.applications to anon, authenticated;
drop policy if exists "DEMO_applications_all_open" on public.applications;
create policy "DEMO_applications_all_open" on public.applications
  for all to anon, authenticated using (true) with check (true);

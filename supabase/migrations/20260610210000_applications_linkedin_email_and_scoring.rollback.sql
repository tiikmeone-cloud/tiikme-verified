-- Rollback for 20260610210000_applications_linkedin_email_and_scoring.sql
drop policy if exists "DEMO_applications_all_open" on public.applications;
revoke select, insert, update on public.applications from anon, authenticated;
drop function if exists public.get_org_applications(uuid);
alter table public.applications drop constraint if exists applications_source_chk;
alter table public.applications
  drop column if exists applicant_email,
  drop column if exists applicant_phone,
  drop column if exists ai_score,
  drop column if exists match_breakdown,
  drop column if exists knockout_passed,
  drop column if exists source,
  drop column if exists scored_at;

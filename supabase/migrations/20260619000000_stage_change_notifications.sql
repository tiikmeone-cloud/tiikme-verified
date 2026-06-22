-- When an application stage changes to 'shortlisted' or 'hired', insert an
-- app_stage_change notification so the candidate sees it in their bell.
-- Same SECURITY DEFINER pattern as flex_request notification triggers.

-- ensure advance_application_stage exists (simple updater — notification fires
-- via trigger, not inside this function)
create or replace function public.advance_application_stage(
  p_application uuid,
  p_new_stage   text
) returns void
language sql security definer set search_path = ''
as $$
  update public.applications
  set    stage = p_new_stage, last_stage_change = now()
  where  id = p_application;
$$;

grant execute on function public.advance_application_stage(uuid, text) to anon, authenticated;

-- Trigger function: fires after every stage change on applications
create or replace function public.tg_notify_application_stage_change()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_job_title text;
  v_org_name  text;
  v_org_id    uuid;
  v_org_slug  text;
begin
  -- Only notify on meaningful milestones (not every internal stage hop)
  if new.stage not in ('shortlisted', 'hired') then
    return new;
  end if;
  -- Avoid firing if stage didn't actually change
  if new.stage = old.stage then
    return new;
  end if;

  select j.title, o.name, o.id, o.slug
    into v_job_title, v_org_name, v_org_id, v_org_slug
  from   public.org_jobs j
  join   public.orgs     o on o.id = j.org_id
  where  j.id = new.job_id;

  insert into public.notifications (user_id, kind, title, body, action_url, payload)
  values (
    new.user_id,
    'app_stage_change',
    case new.stage
      when 'shortlisted' then v_org_name || ' shortlisted you!'
      when 'hired'       then 'Offer from ' || v_org_name || '!'
    end,
    case new.stage
      when 'shortlisted' then 'Great news — you''ve been shortlisted for ' || v_job_title
      when 'hired'       then 'An offer has been extended for ' || v_job_title
    end,
    '/profile?view=applications',
    jsonb_build_object(
      'stage',     new.stage,
      'job_id',    new.job_id,
      'job_title', v_job_title,
      'org_id',    v_org_id,
      'org_name',  v_org_name,
      'org_slug',  v_org_slug
    )
  );

  return new;
end;
$$;

drop trigger if exists trg_notify_application_stage_change on public.applications;
create trigger trg_notify_application_stage_change
  after update of stage on public.applications
  for each row execute function public.tg_notify_application_stage_change();

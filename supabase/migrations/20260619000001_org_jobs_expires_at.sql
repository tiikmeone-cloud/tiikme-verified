-- Add expires_at to org_jobs so orgs can set a closing date when posting a role.
alter table public.org_jobs
  add column if not exists expires_at timestamptz default null;

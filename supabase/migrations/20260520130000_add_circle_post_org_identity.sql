alter table public.circle_posts
  add column if not exists posted_as_org_id uuid references public.organizations(id) on delete set null;

create index if not exists idx_circle_posts_posted_as_org_id
  on public.circle_posts(posted_as_org_id);

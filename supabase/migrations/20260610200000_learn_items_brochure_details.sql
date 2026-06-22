-- Brochure-style rich content for Level Up items: who_for, outcomes, live_projects,
-- syllabus, format, EMI / payment, prerequisites, instructors, FAQs, certificate.
-- Held in a single jsonb so the shape can evolve without further migrations.
alter table public.learn_items
  add column if not exists details jsonb not null default '{}'::jsonb;

alter table public.learn_items
  add constraint learn_items_details_is_object check (jsonb_typeof(details) = 'object') not valid;


-- Add internship-specific fields
ALTER TABLE public.opportunities
  ADD COLUMN IF NOT EXISTS duration_months integer,
  ADD COLUMN IF NOT EXISTS stipend text,
  ADD COLUMN IF NOT EXISTS can_convert_fulltime boolean DEFAULT false;

-- Add freelance/gig fields
ALTER TABLE public.opportunities
  ADD COLUMN IF NOT EXISTS project_duration text,
  ADD COLUMN IF NOT EXISTS budget_min integer,
  ADD COLUMN IF NOT EXISTS budget_max integer,
  ADD COLUMN IF NOT EXISTS pricing_model text DEFAULT 'fixed';

-- Add hackathon fields
ALTER TABLE public.opportunities
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS end_date date,
  ADD COLUMN IF NOT EXISTS team_size_min integer,
  ADD COLUMN IF NOT EXISTS team_size_max integer,
  ADD COLUMN IF NOT EXISTS prize_pool text,
  ADD COLUMN IF NOT EXISTS themes text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS registration_deadline date,
  ADD COLUMN IF NOT EXISTS event_mode text DEFAULT 'offline';

-- Add walk-in interview fields
ALTER TABLE public.opportunities
  ADD COLUMN IF NOT EXISTS event_date date,
  ADD COLUMN IF NOT EXISTS event_time text,
  ADD COLUMN IF NOT EXISTS venue text,
  ADD COLUMN IF NOT EXISTS documents_to_bring text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS positions_available integer;

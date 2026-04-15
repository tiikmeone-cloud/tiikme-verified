ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS is_expired BOOLEAN DEFAULT false;
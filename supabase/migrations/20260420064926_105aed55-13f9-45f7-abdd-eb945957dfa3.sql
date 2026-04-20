ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS public_key text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS key_created_at timestamptz;

ALTER TABLE public.pings ADD COLUMN IF NOT EXISTS encrypted_body text;
ALTER TABLE public.pings ADD COLUMN IF NOT EXISTS nonce text;
ALTER TABLE public.pings ADD COLUMN IF NOT EXISTS is_encrypted boolean DEFAULT false;
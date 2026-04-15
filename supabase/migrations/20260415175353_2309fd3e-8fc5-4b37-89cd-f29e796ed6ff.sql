
CREATE TABLE IF NOT EXISTS public.user_additional_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_name TEXT NOT NULL,
  designation TEXT,
  about TEXT,
  links JSONB DEFAULT '[]'::jsonb,
  achievements TEXT,
  show_on_profile BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role_name)
);

ALTER TABLE public.user_additional_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own additional roles"
ON public.user_additional_roles
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public can view visible roles"
ON public.user_additional_roles
FOR SELECT
TO public
USING (show_on_profile = true);

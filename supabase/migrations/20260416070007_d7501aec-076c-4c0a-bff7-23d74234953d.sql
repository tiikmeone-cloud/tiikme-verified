CREATE TABLE public.profile_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_type TEXT NOT NULL CHECK (role_type IN ('Side Hustle', 'Freelance', 'Dual Employment', 'Moonlighting')),
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profile_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view profile roles"
  ON public.profile_roles FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own roles"
  ON public.profile_roles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own roles"
  ON public.profile_roles FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_profile_roles_user_id ON public.profile_roles(user_id);
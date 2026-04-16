
CREATE TABLE public.comment_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES public.post_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL DEFAULT 'love',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (comment_id, user_id)
);

ALTER TABLE public.comment_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comment reactions"
  ON public.comment_reactions FOR SELECT
  USING (true);

CREATE POLICY "Users manage own comment reactions"
  ON public.comment_reactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own comment reactions"
  ON public.comment_reactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_comment_reactions_comment_id ON public.comment_reactions(comment_id);

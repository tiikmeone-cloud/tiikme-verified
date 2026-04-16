CREATE POLICY "Participants can mark messages read"
ON public.pings
FOR UPDATE
USING (
  conversation_id IN (
    SELECT id FROM public.conversations
    WHERE participant_1 = auth.uid() OR participant_2 = auth.uid()
  )
)
WITH CHECK (
  conversation_id IN (
    SELECT id FROM public.conversations
    WHERE participant_1 = auth.uid() OR participant_2 = auth.uid()
  )
);
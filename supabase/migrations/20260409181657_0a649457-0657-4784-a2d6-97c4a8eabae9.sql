
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE post_reactions;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

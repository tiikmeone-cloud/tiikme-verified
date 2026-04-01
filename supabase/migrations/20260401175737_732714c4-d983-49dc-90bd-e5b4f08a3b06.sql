
-- Fix conversations: add RLS policies so only participants can access
CREATE POLICY "Participants can view own conversations"
  ON public.conversations FOR SELECT
  TO authenticated
  USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

CREATE POLICY "Authenticated users can create conversations"
  ON public.conversations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = participant_1 OR auth.uid() = participant_2);

CREATE POLICY "Participants can update own conversations"
  ON public.conversations FOR UPDATE
  TO authenticated
  USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

-- Fix institutions: public read, only claimed_by can modify
CREATE POLICY "Institutions are publicly readable"
  ON public.institutions FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Claimants can update institutions"
  ON public.institutions FOR UPDATE
  TO authenticated
  USING (auth.uid() = claimed_by);

CREATE POLICY "Authenticated users can insert institutions"
  ON public.institutions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Fix posts: public read, author can manage
CREATE POLICY "Posts are publicly readable"
  ON public.posts FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authors manage own posts"
  ON public.posts FOR ALL
  TO authenticated
  USING (auth.uid() = author_id);

-- Fix strands: participants can access
CREATE POLICY "Users can view own strands"
  ON public.strands FOR SELECT
  TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can create strands"
  ON public.strands FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update own strands"
  ON public.strands FOR UPDATE
  TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

-- Fix team_members: members can view, owners can manage
CREATE POLICY "Team members viewable by team"
  ON public.team_members FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.work_items WHERE work_items.id = team_members.work_item_id AND work_items.owner_id = auth.uid()
  ));

CREATE POLICY "Project owners manage team members"
  ON public.team_members FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.work_items WHERE work_items.id = team_members.work_item_id AND work_items.owner_id = auth.uid()
  ));

-- Fix opportunities: public read, poster manages
CREATE POLICY "Opportunities are publicly readable"
  ON public.opportunities FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Posters manage own opportunities"
  ON public.opportunities FOR ALL
  TO authenticated
  USING (auth.uid() = poster_id);

-- Fix workspaces: members can view
CREATE POLICY "Workspace members can view"
  ON public.workspaces FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.workspace_members WHERE workspace_members.workspace_id = workspaces.id AND workspace_members.user_id = auth.uid()
  ) OR created_by = auth.uid());

CREATE POLICY "Creators manage workspaces"
  ON public.workspaces FOR ALL
  TO authenticated
  USING (auth.uid() = created_by);

-- Fix workspace_members
CREATE POLICY "Members can view workspace members"
  ON public.workspace_members FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = workspace_members.workspace_id AND wm.user_id = auth.uid()
  ));

CREATE POLICY "Workspace creators manage members"
  ON public.workspace_members FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.workspaces WHERE workspaces.id = workspace_members.workspace_id AND workspaces.created_by = auth.uid()
  ));

-- Fix handle_new_user search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, full_name, role, username, institution_name, location_city, location_state)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'role',
    COALESCE(
      NULLIF(LOWER(REGEXP_REPLACE(
        COALESCE(new.raw_user_meta_data->>'first_name', '') || COALESCE(new.raw_user_meta_data->>'last_name', ''),
        '[^a-zA-Z0-9]', '', 'g'
      )), ''),
      'user'
    ) || '_' || SUBSTR(new.id::text, 1, 8),
    new.raw_user_meta_data->>'institution',
    new.raw_user_meta_data->>'city',
    new.raw_user_meta_data->>'state'
  );
  RETURN new;
END;
$function$;


-- Add last_message_at to workspaces for sorting
ALTER TABLE public.workspaces ADD COLUMN IF NOT EXISTS last_message_at timestamptz DEFAULT now();

-- Allow workspace members to update their own invitation_status
CREATE POLICY "Members update own invitation"
ON public.workspace_members
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow workspace admins to insert channel members when creating groups
CREATE POLICY "Admins insert channel members"
ON public.workspace_channel_members
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM workspace_members wm
    JOIN workspace_channels wc ON wc.workspace_id = wm.workspace_id
    WHERE wc.id = workspace_channel_members.channel_id
    AND wm.user_id = auth.uid()
    AND wm.role = 'admin'
  )
);

-- Allow channel members to view channel_members
CREATE POLICY "Members view channel members"
ON public.workspace_channel_members
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM workspace_channel_members wcm2
    WHERE wcm2.channel_id = workspace_channel_members.channel_id
    AND wcm2.user_id = auth.uid()
  )
);

-- Allow authenticated users to create workspaces (for user groups)
CREATE POLICY "Auth users create workspaces"
ON public.workspaces
FOR INSERT
WITH CHECK (auth.uid() = created_by);

-- Allow workspace members to send messages (broader policy for group chat)
CREATE POLICY "Workspace members send messages"
ON public.workspace_messages
FOR INSERT
WITH CHECK (
  sender_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM workspace_members wm
    JOIN workspace_channels wc ON wc.workspace_id = wm.workspace_id
    WHERE wc.id = workspace_messages.channel_id
    AND wm.user_id = auth.uid()
    AND wm.invitation_status = 'accepted'
  )
);

-- Allow workspace members to view messages via workspace membership
CREATE POLICY "Workspace members view messages"
ON public.workspace_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM workspace_members wm
    JOIN workspace_channels wc ON wc.workspace_id = wm.workspace_id
    WHERE wc.id = workspace_messages.channel_id
    AND wm.user_id = auth.uid()
    AND wm.invitation_status = 'accepted'
  )
);

-- Allow workspace members to view channels via workspace membership
CREATE POLICY "Workspace members view channels"
ON public.workspace_channels
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.workspace_id = workspace_channels.workspace_id
    AND wm.user_id = auth.uid()
    AND wm.invitation_status = 'accepted'
  )
);

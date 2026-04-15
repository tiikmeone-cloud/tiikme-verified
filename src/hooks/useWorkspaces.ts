import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface WorkspaceGroup {
  id: string;
  name: string;
  description: string | null;
  workspace_type: string | null;
  avatar_url: string | null;
  created_by: string | null;
  created_at: string | null;
  last_message_at: string | null;
  is_active: boolean | null;
  org_id: string | null;
  institution_id: string | null;
  member_count: number | null;
  invitation_status?: string;
  default_channel_id?: string;
  last_message_preview?: string;
  unread?: boolean;
}

export interface GroupMember {
  id: string;
  user_id: string;
  role: string | null;
  invitation_status: string | null;
  joined_at: string | null;
  invited_by: string | null;
  profile?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    role: string | null;
    username: string | null;
  };
}

export interface GroupMessage {
  id: string;
  channel_id: string | null;
  sender_id: string | null;
  content: string;
  attachment_url: string | null;
  attachment_type: string | null;
  attachment_name: string | null;
  is_deleted: boolean | null;
  created_at: string | null;
  sender?: { id: string; full_name: string | null; avatar_url: string | null };
}

export function useWorkspaces(userId: string | undefined) {
  const [groups, setGroups] = useState<WorkspaceGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const fetchGroups = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);

    // Get workspace memberships for this user (groups they created or are members of)
    const { data: memberships } = await supabase
      .from("workspace_members")
      .select("workspace_id, invitation_status, role")
      .eq("user_id", userId);

    if (!mountedRef.current) return;

    if (!memberships || memberships.length === 0) {
      setGroups([]);
      setLoading(false);
      return;
    }

    const wsIds = [...new Set(memberships.map(m => m.workspace_id).filter(Boolean))] as string[];

    const { data: workspaces } = await supabase
      .from("workspaces")
      .select("id, name, description, avatar_url, workspace_type, created_by, is_active, last_message_at, created_at, org_id, institution_id, member_count")
      .in("id", wsIds)
      .eq("workspace_type", "group")
      .eq("is_active", true)
      .order("last_message_at", { ascending: false });

    if (!mountedRef.current) return;

    // Map invitation_status onto each workspace
    const memberMap = new Map(memberships.map(m => [m.workspace_id, m]));

    // Get default channel for each workspace
    const { data: channels } = await supabase
      .from("workspace_channels")
      .select("id, workspace_id")
      .in("workspace_id", wsIds)
      .order("created_at", { ascending: true });

    const channelMap = new Map<string, string>();
    (channels || []).forEach(ch => {
      if (!channelMap.has(ch.workspace_id!)) channelMap.set(ch.workspace_id!, ch.id);
    });

    const enriched: WorkspaceGroup[] = (workspaces || []).map(ws => ({
      ...ws,
      invitation_status: memberMap.get(ws.id)?.invitation_status || "pending",
      default_channel_id: channelMap.get(ws.id),
    }));

    setGroups(enriched);
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  const createGroup = useCallback(async (
    name: string, description: string, avatarUrl: string | null, memberIds: string[]
  ): Promise<WorkspaceGroup | null> => {
    if (!userId) return null;

    // Create workspace
    const { data: ws, error: wsErr } = await supabase
      .from("workspaces")
      .insert({
        name,
        description: description || null,
        workspace_type: "group",
        avatar_url: avatarUrl,
        created_by: userId,
        member_count: 1 + memberIds.length,
        last_message_at: new Date().toISOString(),
      } as any)
      .select("*")
      .single();

    if (wsErr || !ws) return null;

    // Add creator as admin member
    await supabase.from("workspace_members").insert({
      workspace_id: ws.id,
      user_id: userId,
      role: "admin",
      status: "active",
      invitation_status: "accepted",
    } as any);

    // Create default channel
    const { data: ch } = await supabase.from("workspace_channels").insert({
      workspace_id: ws.id,
      name: "general",
      channel_type: "group",
      created_by: userId,
    }).select("id").single();

    // Add creator to channel
    if (ch) {
      await supabase.from("workspace_channel_members").insert({
        channel_id: ch.id,
        user_id: userId,
        role: "admin",
      });
    }

    // Add invited members
    for (const memberId of memberIds) {
      await supabase.from("workspace_members").insert({
        workspace_id: ws.id,
        user_id: memberId,
        role: "member",
        status: "active",
        invitation_status: "pending",
        invited_by: userId,
      } as any);

      // Add to channel
      if (ch) {
        await supabase.from("workspace_channel_members").insert({
          channel_id: ch.id,
          user_id: memberId,
          role: "member",
        });
      }

      // Notify
      await supabase.from("alerts").insert({
        user_id: memberId,
        type: "workspace_invite",
        title: `You've been invited to "${name}"`,
        body: "Open Workspace to accept or decline.",
        action_url: "/app/workspace",
      });
    }

    await fetchGroups();
    return ws as WorkspaceGroup;
  }, [userId, fetchGroups]);

  const acceptInvite = useCallback(async (workspaceId: string) => {
    if (!userId) return;
    await supabase.from("workspace_members")
      .update({ invitation_status: "accepted", joined_at: new Date().toISOString() } as any)
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId);
    await fetchGroups();
  }, [userId, fetchGroups]);

  const declineInvite = useCallback(async (workspaceId: string) => {
    if (!userId) return;
    await supabase.from("workspace_members")
      .update({ invitation_status: "declined", status: "inactive" } as any)
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId);
    await fetchGroups();
  }, [userId, fetchGroups]);

  const leaveGroup = useCallback(async (workspaceId: string) => {
    if (!userId) return;
    await supabase.from("workspace_members")
      .update({ status: "inactive", left_at: new Date().toISOString() } as any)
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId);
    await fetchGroups();
  }, [userId, fetchGroups]);

  const fetchMembers = useCallback(async (workspaceId: string): Promise<GroupMember[]> => {
    const { data } = await supabase
      .from("workspace_members")
      .select("*, profile:profiles!user_id(id, full_name, avatar_url, role, username)")
      .eq("workspace_id", workspaceId)
      .neq("status", "inactive");
    return (data as any[]) || [];
  }, []);

  const fetchMessages = useCallback(async (channelId: string): Promise<GroupMessage[]> => {
    const { data } = await supabase
      .from("workspace_messages")
      .select("*")
      .eq("channel_id", channelId)
      .order("created_at", { ascending: true })
      .limit(200);

    if (!data || data.length === 0) return [];

    const senderIds = [...new Set(data.map(m => m.sender_id).filter(Boolean))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", senderIds as string[]);

    const profMap = new Map((profiles || []).map(p => [p.id, p]));
    return data.map(m => ({ ...m, sender: profMap.get(m.sender_id!) })) as GroupMessage[];
  }, []);

  const sendMessage = useCallback(async (
    channelId: string, content: string, attachment?: { url: string; type: string; name: string }
  ) => {
    if (!userId) return;
    const { error } = await supabase.from("workspace_messages").insert({
      channel_id: channelId,
      sender_id: userId,
      content: content || (attachment?.name ? `Attachment: ${attachment.name}` : ""),
      attachment_url: attachment?.url || null,
      attachment_type: attachment?.type || null,
      attachment_name: attachment?.name || null,
    });
    if (error) throw error;

    // Update last_message_at on workspace
    const { data: ch } = await supabase.from("workspace_channels").select("workspace_id").eq("id", channelId).single();
    if (ch) {
      await supabase.from("workspaces").update({ last_message_at: new Date().toISOString() } as any).eq("id", ch.workspace_id);
    }
  }, [userId]);

  const deleteMessage = useCallback(async (msgId: string) => {
    await supabase.from("workspace_messages").update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
      content: "This message was deleted",
      attachment_url: null,
      attachment_name: null,
    }).eq("id", msgId);
  }, []);

  return {
    groups, loading, fetchGroups, createGroup, acceptInvite, declineInvite,
    leaveGroup, fetchMembers, fetchMessages, sendMessage, deleteMessage,
  };
}

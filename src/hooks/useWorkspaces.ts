import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Workspace {
  id: string;
  name: string;
  description: string | null;
  type: string | null;
  privacy: string | null;
  member_count: number | null;
  project_count: number | null;
  created_by: string | null;
  created_at: string | null;
}

interface WorkspaceMember {
  id: string;
  user_id: string | null;
  role: string | null;
  joined_at: string | null;
  profile?: {
    id: string;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
    role: string | null;
  };
}

export function useWorkspaces(userId: string | undefined) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const fetchWorkspaces = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);

    // Single query: get workspace IDs the user belongs to
    const [{ data: memberRows }, { data: createdWs }] = await Promise.all([
      supabase.from("workspace_members").select("workspace_id").eq("user_id", userId).eq("status", "active"),
      supabase.from("workspaces").select("id").eq("created_by", userId),
    ]);

    if (!mountedRef.current) return;

    const allIds = [...new Set([
      ...(memberRows || []).map(m => m.workspace_id).filter(Boolean) as string[],
      ...(createdWs || []).map(w => w.id),
    ])];

    if (allIds.length === 0) {
      setWorkspaces([]);
      setLoading(false);
      return;
    }

    const { data: ws } = await supabase
      .from("workspaces")
      .select("*")
      .in("id", allIds)
      .order("created_at", { ascending: false });

    if (mountedRef.current) {
      setWorkspaces(ws || []);
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchWorkspaces(); }, [fetchWorkspaces]);

  const fetchMembers = useCallback(async (workspaceId: string) => {
    const { data } = await supabase
      .from("workspace_members")
      .select("*, profile:profiles!user_id(id, full_name, username, avatar_url, role)")
      .eq("workspace_id", workspaceId)
      .eq("status", "active");
    if (mountedRef.current) setMembers((data as any[]) || []);
  }, []);

  const createWorkspace = useCallback(async (name: string, description: string, type: string, privacy: string) => {
    if (!userId) return null;
    const { data, error } = await supabase
      .from("workspaces")
      .insert({ name, description, type, privacy, created_by: userId })
      .select()
      .single();

    if (error) return null;

    if (data) {
      await supabase.from("workspace_members").insert({
        workspace_id: data.id, user_id: userId, role: "admin", status: "active",
      });
      fetchWorkspaces();
    }
    return data;
  }, [userId, fetchWorkspaces]);

  return { workspaces, loading, members, fetchMembers, createWorkspace, refetch: fetchWorkspaces };
}

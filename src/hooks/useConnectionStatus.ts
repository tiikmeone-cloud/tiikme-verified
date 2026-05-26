// src/hooks/useConnectionStatus.ts
// Social graph: Connect (user↔user, approval required) | Follow (user→org, instant) | Org follows (org→user, org→org)
// NO asymmetric user→user following — Connect is the only user↔user action.

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { sendNotification } from "@/lib/notify";
import { toast } from "sonner";

export type ConnectionState =
  | "none"              // no relationship
  | "connected"         // symmetric connection accepted (strands)
  | "pending_sent"      // current user sent connect request
  | "pending_received"  // target sent request to current user
  | "self"              // viewing own profile
  | "org_following"     // following an org (user→org)
  | "blocked";

export interface ConnectionActions {
  state: ConnectionState;
  isLoading: boolean;
  strandId: string | null;
  sendRequest: () => Promise<void>;
  acceptRequest: () => Promise<void>;
  declineRequest: () => Promise<void>;
  withdrawRequest: () => Promise<void>;
  disconnect: () => Promise<void>;
  followOrg: (orgId: string) => Promise<void>;
  unfollowOrg: (orgId: string) => Promise<void>;
  followUserAsOrg: (orgId: string, userId: string) => Promise<void>;
  unfollowUserAsOrg: (orgId: string, userId: string) => Promise<void>;
}

export function useConnectionStatus(targetUserId?: string | null): ConnectionActions {
  const { user } = useAuth();
  const [state, setState] = useState<ConnectionState>("none");
  const [isLoading, setIsLoading] = useState(false);
  const [strandId, setStrandId] = useState<string | null>(null);

  const currentUserId = user?.id;

  useEffect(() => {
    if (!currentUserId || !targetUserId) return;
    if (currentUserId === targetUserId) { setState("self"); return; }

    let cancelled = false;

    async function loadState() {
      const { data: strand } = await supabase
        .from("strands")
        .select("id, status, requester_id, receiver_id")
        .or(`and(requester_id.eq.${currentUserId},receiver_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},receiver_id.eq.${currentUserId})`)
        .maybeSingle();

      if (cancelled) return;

      if (strand) {
        setStrandId(strand.id);
        if (strand.status === "accepted") { setState("connected"); return; }
        if (strand.status === "pending") {
          setState(strand.requester_id === currentUserId ? "pending_sent" : "pending_received");
          return;
        }
      }

      setState("none");
    }

    loadState();
    return () => { cancelled = true; };
  }, [currentUserId, targetUserId]);

  const sendRequest = useCallback(async () => {
    if (!currentUserId || !targetUserId) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("strands")
        .insert({ requester_id: currentUserId, receiver_id: targetUserId, status: "pending" })
        .select("id")
        .single();
      if (error) throw error;
      setStrandId(data.id);
      setState("pending_sent");
      toast.success("Connection request sent!");
      // Notify the receiver
      sendNotification({
        userId: targetUserId,
        actorId: currentUserId,
        type: "connection_request",
        title: "Sent you a connection request",
        actionUrl: `/app/profile/${currentUserId}`,
      });
    } catch {
      toast.error("Could not send request. Try again.");
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId, targetUserId]);

  const acceptRequest = useCallback(async () => {
    if (!strandId || !currentUserId || !targetUserId) return;
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("strands")
        .update({ status: "accepted" })
        .eq("id", strandId);
      if (error) throw error;
      setState("connected");
      toast.success("Connected!");
      // Notify the original requester
      sendNotification({
        userId: targetUserId,
        actorId: currentUserId,
        type: "connection_accepted",
        title: "Accepted your connection request",
        actionUrl: `/app/profile/${currentUserId}`,
      });
    } catch {
      toast.error("Could not accept. Try again.");
    } finally {
      setIsLoading(false);
    }
  }, [strandId, currentUserId, targetUserId]);

  const declineRequest = useCallback(async () => {
    if (!strandId) return;
    setIsLoading(true);
    try {
      const { error } = await supabase.from("strands").delete().eq("id", strandId);
      if (error) throw error;
      setStrandId(null);
      setState("none");
    } catch {
      toast.error("Could not decline. Try again.");
    } finally {
      setIsLoading(false);
    }
  }, [strandId]);

  const withdrawRequest = useCallback(async () => {
    if (!strandId) return;
    setIsLoading(true);
    try {
      const { error } = await supabase.from("strands").delete().eq("id", strandId);
      if (error) throw error;
      setStrandId(null);
      setState("none");
      toast.success("Request withdrawn");
    } catch {
      toast.error("Could not withdraw. Try again.");
    } finally {
      setIsLoading(false);
    }
  }, [strandId]);

  const disconnect = useCallback(async () => {
    if (!strandId) return;
    setIsLoading(true);
    try {
      const { error } = await supabase.from("strands").delete().eq("id", strandId);
      if (error) throw error;
      setStrandId(null);
      setState("none");
      toast.success("Connection removed");
    } catch {
      toast.error("Could not remove connection. Try again.");
    } finally {
      setIsLoading(false);
    }
  }, [strandId]);

  const followOrg = useCallback(async (orgId: string) => {
    if (!currentUserId) return;
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("org_followers")
        .insert({ org_id: orgId, user_id: currentUserId });
      if (error) throw error;
      setState("org_following");
      toast.success("Following organization!");
    } catch {
      toast.error("Could not follow. Try again.");
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId]);

  const unfollowOrg = useCallback(async (orgId: string) => {
    if (!currentUserId) return;
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("org_followers")
        .delete()
        .eq("org_id", orgId)
        .eq("user_id", currentUserId);
      if (error) throw error;
      setState("none");
    } catch {
      toast.error("Could not unfollow. Try again.");
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId]);

  const followUserAsOrg = useCallback(async (orgId: string, userId: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("org_user_follows" as any)
        .insert({ org_id: orgId, user_id: userId });
      if (error) throw error;
      toast.success("Now following this user on behalf of your organization.");
      sendNotification({
        userId,
        actorId: orgId,
        type: "org_follow",
        title: "Your organization is now following you",
        actionUrl: `/app/profile/${userId}`,
      });
    } catch {
      toast.error("Could not follow. Try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const unfollowUserAsOrg = useCallback(async (orgId: string, userId: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("org_user_follows" as any)
        .delete()
        .eq("org_id", orgId)
        .eq("user_id", userId);
      if (error) throw error;
      toast.success("Unfollowed");
    } catch {
      toast.error("Could not unfollow. Try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    state,
    isLoading,
    strandId,
    sendRequest,
    acceptRequest,
    declineRequest,
    withdrawRequest,
    disconnect,
    followOrg,
    unfollowOrg,
    followUserAsOrg,
    unfollowUserAsOrg,
  };
}

export async function sendConnectionRequest(
  currentUserId: string,
  targetUserId: string,
  _displayName?: string
): Promise<"pending" | "accepted" | null> {
  const { data: existing } = await supabase
    .from("strands")
    .select("id, status")
    .or(`and(requester_id.eq.${currentUserId},receiver_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},receiver_id.eq.${currentUserId})`)
    .maybeSingle();

  if (existing) return null;

  const { data: targetProfile } = await supabase
    .from("profiles")
    .select("account_type, org_id")
    .eq("id", targetUserId)
    .maybeSingle();

  const status = targetProfile?.account_type === "institution" ? "accepted" : "pending";
  const { error } = await supabase.from("strands").insert({
    requester_id: currentUserId,
    receiver_id: targetUserId,
    status,
  } as any);
  if (error) throw error;

  sendNotification({
    userId: targetUserId,
    actorId: currentUserId,
    type: "connection_request",
    title: "Sent you a connection request",
    actionUrl: `/app/profile/${currentUserId}`,
  });

  return status;
}

export function connectionButtonStyle(state: "none" | "pending_sent" | "pending_received" | "accepted") {
  switch (state) {
    case "pending_received":
      return { background: "#E8733A", color: "#fff", border: "none" };
    case "pending_sent":
      return { background: "rgba(232,115,58,0.12)", color: "#E8733A", border: "1px solid rgba(232,115,58,0.22)" };
    case "accepted":
      return { background: "rgba(52,199,89,0.10)", color: "#34C759", border: "1px solid rgba(52,199,89,0.22)" };
    default:
      return { background: "#FF5A1F", color: "#fff", border: "none" };
  }
}

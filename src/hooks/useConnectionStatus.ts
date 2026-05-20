// src/hooks/useConnectionStatus.ts
// Handles ALL social graph states: connect, follow, block
// Works for user→user, user→org, and org→user

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type ConnectionState =
  | "none"           // no relationship
  | "following"      // current user follows target (user follows)
  | "connected"      // symmetric connection accepted
  | "pending_sent"   // current user sent request
  | "pending_received" // target sent request to current user
  | "self"           // viewing own profile
  | "org_following"  // following an org
  | "blocked";

export interface ConnectionActions {
  state: ConnectionState;
  isLoading: boolean;
  strandId: string | null;
  follow: () => Promise<void>;
  unfollow: () => Promise<void>;
  sendRequest: () => Promise<void>;
  acceptRequest: () => Promise<void>;
  declineRequest: () => Promise<void>;
  withdrawRequest: () => Promise<void>;
  disconnect: () => Promise<void>;
  followOrg: (orgId: string) => Promise<void>;
  unfollowOrg: (orgId: string) => Promise<void>;
}

export function useConnectionStatus(targetUserId?: string | null): ConnectionActions {
  const { user } = useAuth();
  const [state, setState] = useState<ConnectionState>("none");
  const [isLoading, setIsLoading] = useState(false);
  const [strandId, setStrandId] = useState<string | null>(null);

  const currentUserId = user?.id;

  // Load initial state
  useEffect(() => {
    if (!currentUserId || !targetUserId) return;
    if (currentUserId === targetUserId) { setState("self"); return; }

    let cancelled = false;

    async function loadState() {
      // Check strands (connect relationship)
      const { data: strand } = await supabase
        .from("strands")
        .select("id, status, requester_id, receiver_id")
        .or(`and(requester_id.eq.${currentUserId},receiver_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},receiver_id.eq.${currentUserId})`)
        .maybeSingle();

      if (cancelled) return;

      if (strand) {
        setStrandId(strand.id);
        if (strand.status === "accepted") {
          setState("connected");
          return;
        }
        if (strand.status === "pending") {
          if (strand.requester_id === currentUserId) {
            setState("pending_sent");
          } else {
            setState("pending_received");
          }
          return;
        }
      }

      // Check user_follows
      const { data: follow } = await supabase
        .from("user_follows")
        .select("id")
        .eq("follower_id", currentUserId)
        .eq("following_id", targetUserId)
        .maybeSingle();

      if (cancelled) return;
      setState(follow ? "following" : "none");
    }

    loadState();
    return () => { cancelled = true; };
  }, [currentUserId, targetUserId]);

  const follow = useCallback(async () => {
    if (!currentUserId || !targetUserId) return;
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("user_follows")
        .insert({ follower_id: currentUserId, following_id: targetUserId });
      if (error) throw error;
      setState("following");
      toast.success("Following!");
    } catch (e: any) {
      toast.error("Could not follow. Try again.");
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId, targetUserId]);

  const unfollow = useCallback(async () => {
    if (!currentUserId || !targetUserId) return;
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("user_follows")
        .delete()
        .eq("follower_id", currentUserId)
        .eq("following_id", targetUserId);
      if (error) throw error;
      setState("none");
      toast.success("Unfollowed");
    } catch (e: any) {
      toast.error("Could not unfollow. Try again.");
    } finally {
      setIsLoading(false);
    }
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
    } catch (e: any) {
      toast.error("Could not send request. Try again.");
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId, targetUserId]);

  const acceptRequest = useCallback(async () => {
    if (!strandId) return;
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("strands")
        .update({ status: "accepted" })
        .eq("id", strandId);
      if (error) throw error;
      setState("connected");
      toast.success("Connected!");
    } catch (e: any) {
      toast.error("Could not accept. Try again.");
    } finally {
      setIsLoading(false);
    }
  }, [strandId]);

  const declineRequest = useCallback(async () => {
    if (!strandId) return;
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("strands")
        .delete()
        .eq("id", strandId);
      if (error) throw error;
      setStrandId(null);
      setState("none");
    } catch (e: any) {
      toast.error("Could not decline. Try again.");
    } finally {
      setIsLoading(false);
    }
  }, [strandId]);

  const withdrawRequest = useCallback(async () => {
    if (!strandId) return;
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("strands")
        .delete()
        .eq("id", strandId);
      if (error) throw error;
      setStrandId(null);
      setState("none");
      toast.success("Request withdrawn");
    } catch (e: any) {
      toast.error("Could not withdraw. Try again.");
    } finally {
      setIsLoading(false);
    }
  }, [strandId]);

  const disconnect = useCallback(async () => {
    if (!strandId) return;
    const confirmed = window.confirm("Remove this connection? You can reconnect anytime.");
    if (!confirmed) return;
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("strands")
        .delete()
        .eq("id", strandId);
      if (error) throw error;
      setStrandId(null);
      setState("none");
      toast.success("Connection removed");
    } catch (e: any) {
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
    } catch (e: any) {
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
      toast.success("Unfollowed");
    } catch (e: any) {
      toast.error("Could not unfollow. Try again.");
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId]);

  return {
    state,
    isLoading,
    strandId,
    follow,
    unfollow,
    sendRequest,
    acceptRequest,
    declineRequest,
    withdrawRequest,
    disconnect,
    followOrg,
    unfollowOrg,
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

  if (status === "accepted" && targetProfile?.org_id) {
    await supabase.from("org_followers").insert({ org_id: targetProfile.org_id, user_id: currentUserId } as any).then(() => {});
  }

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

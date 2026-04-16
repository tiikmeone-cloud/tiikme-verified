import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { sendNotification } from "@/lib/notify";
import { toast } from "sonner";

export type ConnectionState = "none" | "pending_sent" | "pending_received" | "accepted" | "declined";

interface ConnectionInfo {
  state: ConnectionState;
  strandId: string | null;
}

export function useConnectionStatus(targetUserId: string | null | undefined) {
  const { user, profile } = useAuth();
  const [info, setInfo] = useState<ConnectionInfo>({ state: "none", strandId: null });
  const [loading, setLoading] = useState(false);

  const check = useCallback(async () => {
    if (!user?.id || !targetUserId || user.id === targetUserId) {
      setInfo({ state: "none", strandId: null });
      return;
    }
    const { data } = await supabase
      .from("strands")
      .select("id, status, requester_id")
      .or(
        `and(requester_id.eq.${user.id},receiver_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},receiver_id.eq.${user.id})`
      )
      .in("status", ["accepted", "pending"])
      .maybeSingle();

    if (!data) {
      setInfo({ state: "none", strandId: null });
    } else if (data.status === "accepted") {
      setInfo({ state: "accepted", strandId: data.id });
    } else if (data.status === "pending" && data.requester_id === user.id) {
      setInfo({ state: "pending_sent", strandId: data.id });
    } else if (data.status === "pending") {
      setInfo({ state: "pending_received", strandId: data.id });
    }
  }, [user?.id, targetUserId]);

  useEffect(() => { check(); }, [check]);

  const connect = useCallback(async () => {
    if (!user?.id || !targetUserId || loading) return;
    setLoading(true);
    // Duplicate check
    const { data: existing } = await supabase
      .from("strands")
      .select("id")
      .or(
        `and(requester_id.eq.${user.id},receiver_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},receiver_id.eq.${user.id})`
      )
      .maybeSingle();
    if (existing) { setLoading(false); toast.info("Request already exists"); return; }

    // Check if target is an institution → instant connect
    const { data: targetProfile } = await supabase
      .from("profiles")
      .select("account_type, org_id")
      .eq("id", targetUserId)
      .maybeSingle();

    const isInstitution = targetProfile?.account_type === "institution";
    const insertStatus = isInstitution ? "accepted" : "pending";

    const { error } = await supabase.from("strands").insert({
      requester_id: user.id,
      receiver_id: targetUserId,
      status: insertStatus,
    });
    if (error) { toast.error(error.message); setLoading(false); return; }

    if (isInstitution) {
      // Also follow the org
      if (targetProfile?.org_id) {
        await supabase.from("org_followers").insert({ org_id: targetProfile.org_id, user_id: user.id }).then(() => {});
      }
      setInfo({ state: "accepted", strandId: null });
      toast.success("Connected!");
    } else {
      sendNotification({
        userId: targetUserId,
        actorId: user.id,
        type: "connection_request",
        title: `${profile?.full_name || "Someone"} wants to connect`,
        actionUrl: `/app/connections`,
        data: { actor_id: user.id },
      });
      setInfo({ state: "pending_sent", strandId: null });
      toast.success("Connection request sent");
    }
    setLoading(false);
  }, [user?.id, targetUserId, profile, loading]);

  const accept = useCallback(async () => {
    if (!info.strandId || !user?.id) return;
    await supabase.from("strands").update({ status: "accepted" }).eq("id", info.strandId);
    if (targetUserId) {
      sendNotification({
        userId: targetUserId,
        actorId: user.id,
        type: "connection_accepted",
        title: `${profile?.full_name || "Someone"} accepted your connection`,
        actionUrl: `/app/profile/${user.id}`,
      });
      try { await supabase.rpc("increment_score", { uid: user.id, amount: 3 }); } catch {}
      try { await supabase.rpc("increment_score", { uid: targetUserId, amount: 3 }); } catch {}
    }
    setInfo({ state: "accepted", strandId: info.strandId });
    toast.success("Connected!");
  }, [info.strandId, user?.id, targetUserId, profile]);

  const decline = useCallback(async () => {
    if (!info.strandId) return;
    await supabase.from("strands").update({ status: "declined" }).eq("id", info.strandId);
    setInfo({ state: "none", strandId: null });
    toast.info("Declined");
  }, [info.strandId]);

  const withdraw = useCallback(async () => {
    if (!info.strandId) return;
    await supabase.from("strands").delete().eq("id", info.strandId);
    setInfo({ state: "none", strandId: null });
    toast.info("Request withdrawn");
  }, [info.strandId]);

  return { ...info, loading, connect, accept, decline, withdraw, refresh: check };
}

/* ── Connection Button styles (global) ── */
export const connectionButtonStyle = (state: ConnectionState): React.CSSProperties => {
  switch (state) {
    case "none":
      return { background: "linear-gradient(135deg, #E8733A, #FF6B9D)", color: "#fff", border: "none" };
    case "pending_sent":
      return { background: "rgba(255,184,0,0.10)", color: "#FFB800", border: "1px solid rgba(255,184,0,0.25)" };
    case "pending_received":
      return { background: "linear-gradient(135deg, #34C759, #30B350)", color: "#fff", border: "none" };
    case "accepted":
      return { background: "rgba(52,199,89,0.10)", color: "#34C759", border: "1px solid rgba(52,199,89,0.25)" };
    default:
      return {};
  }
};

export const connectionButtonLabel = (state: ConnectionState): string => {
  switch (state) {
    case "none": return "Connect";
    case "pending_sent": return "Requested";
    case "pending_received": return "Accept";
    case "accepted": return "Connected";
    default: return "Connect";
}

/**
 * Shared helper: check if target is institution → insert as accepted, else pending.
 * Returns the status that was inserted.
 */
export async function sendConnectionRequest(
  currentUserId: string,
  targetUserId: string,
  senderName: string
): Promise<"accepted" | "pending" | null> {
  // Duplicate check
  const { data: existing } = await supabase
    .from("strands")
    .select("id")
    .or(
      `and(requester_id.eq.${currentUserId},receiver_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},receiver_id.eq.${currentUserId})`
    )
    .maybeSingle();
  if (existing) return null;

  const { data: targetProfile } = await supabase
    .from("profiles")
    .select("account_type, org_id")
    .eq("id", targetUserId)
    .maybeSingle();

  const isInstitution = targetProfile?.account_type === "institution";
  const status = isInstitution ? "accepted" : "pending";

  const { error } = await supabase.from("strands").insert({
    requester_id: currentUserId,
    receiver_id: targetUserId,
    status,
  });
  if (error) return null;

  if (isInstitution) {
    if (targetProfile?.org_id) {
      await supabase.from("org_followers").insert({ org_id: targetProfile.org_id, user_id: currentUserId }).then(() => {});
    }
  } else {
    sendNotification({
      userId: targetUserId,
      actorId: currentUserId,
      type: "connection_request",
      title: `${senderName || "Someone"} wants to connect`,
      actionUrl: `/app/connections`,
      data: { actor_id: currentUserId },
    });
  }

  return status;
}
};

/* Batch check for feed: returns Set of connected user IDs */
export async function fetchConnectedIds(userId: string): Promise<Set<string>> {
  const { data } = await supabase
    .from("strands")
    .select("requester_id, receiver_id")
    .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)
    .eq("status", "accepted");
  const ids = new Set<string>();
  (data || []).forEach((s: any) => {
    if (s.requester_id !== userId) ids.add(s.requester_id);
    if (s.receiver_id !== userId) ids.add(s.receiver_id);
  });
  return ids;
}

/* Batch check for pending sent (for feed follow buttons) */
export async function fetchPendingSentIds(userId: string): Promise<Set<string>> {
  const { data } = await supabase
    .from("strands")
    .select("receiver_id")
    .eq("requester_id", userId)
    .eq("status", "pending");
  return new Set((data || []).map((s: any) => s.receiver_id));
}

// src/components/shared/ConnectionButtons.tsx
// Shows the right buttons based on connection state
// Handles ALL cases: user→user, user→org

import React from "react";
import { Loader2, UserPlus, UserCheck, Check, X } from "lucide-react";
import { useConnectionStatus } from "@/hooks/useConnectionStatus";

interface ConnectionButtonsProps {
  targetUserId?: string | null;
  orgId?: string | null;
  targetUsername?: string | null;
  targetName?: string;
  compact?: boolean;
}

export function ConnectionButtons({
  targetUserId,
  orgId,
  targetUsername,
  targetName = "this person",
  compact = false,
}: ConnectionButtonsProps) {
  const conn = useConnectionStatus(targetUserId);

  if (conn.state === "self") return null;

  const btnBase =
    "inline-flex items-center gap-1.5 rounded-[10px] font-medium transition-all text-sm " +
    (compact ? "px-3 py-1.5" : "px-4 py-2");

  const primary = btnBase + " bg-[#E8733A] text-white hover:bg-[#d4632e] disabled:opacity-40";
  const secondary =
    btnBase +
    " border border-[#E8733A] text-[#E8733A] hover:bg-[#FFF3EC] disabled:opacity-40";
  const gray =
    btnBase +
    " border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40";

  // ── ORG MODE ──────────────────────────────────────────────
  if (orgId) {
    if (conn.state === "org_following") {
      return (
        <button
          className={gray}
          disabled={conn.isLoading}
          onClick={() => conn.unfollowOrg(orgId)}
        >
          {conn.isLoading ? <Loader2 size={14} className="animate-spin" /> : <UserCheck size={14} />}
          Following
        </button>
      );
    }
    return (
      <button
        className={primary}
        disabled={conn.isLoading}
        onClick={() => conn.followOrg(orgId)}
      >
        {conn.isLoading ? <Loader2 size={14} className="animate-spin" /> : null}
        + Follow
      </button>
    );
  }

  // ── USER MODE ─────────────────────────────────────────────
  if (!targetUserId) return null;

  // Connected
  if (conn.state === "connected") {
    return (
      <div className="flex gap-2">
        <button
          className={gray + " group relative"}
          disabled={conn.isLoading}
          onClick={conn.disconnect}
        >
          <UserCheck size={14} />
          Connected
        </button>
      </div>
    );
  }

  // Pending — I sent
  if (conn.state === "pending_sent") {
    return (
      <div className="flex gap-2">
        <button className={gray} disabled={conn.isLoading} onClick={conn.withdrawRequest}>
          {conn.isLoading ? <Loader2 size={14} className="animate-spin" /> : null}
          Request sent
        </button>
      </div>
    );
  }

  // Pending — they sent
  if (conn.state === "pending_received") {
    return (
      <div className="flex gap-2">
        <button className={primary} disabled={conn.isLoading} onClick={conn.acceptRequest}>
          {conn.isLoading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          Accept
        </button>
        <button className={gray} disabled={conn.isLoading} onClick={conn.declineRequest}>
          <X size={14} />
          Decline
        </button>
      </div>
    );
  }

  // None — default
  return (
    <div className="flex gap-2">
      <button className={primary} disabled={conn.isLoading} onClick={conn.sendRequest}>
        {conn.isLoading ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
        Connect
      </button>
    </div>
  );
}

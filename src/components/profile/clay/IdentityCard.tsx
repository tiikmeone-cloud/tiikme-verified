import React from "react";
import { Link } from "react-router-dom";
import { MapPin, Settings } from "lucide-react";
import AvatarSquare from "@/components/ui/AvatarSquare";
import VerifiedBadge from "@/components/VerifiedBadge";
import { FollowIconButton } from "@/components/FollowIconButton";

export interface IdentityCardProps {
  profileData: any;
  displayName: string;
  username: string;
  oneWordRole: string;
  roleColor: string;
  isVerified: boolean;
  showOTW: boolean;
  isOwnProfile: boolean;
  followerCount: number;
  followingCount: number;
  cosignCount: number;
  city?: string;
  state?: string;
  renderConnectButton?: () => React.ReactNode;
  targetUserId?: string;
}

export default function IdentityCard({
  profileData, displayName, username, oneWordRole, roleColor, isVerified,
  showOTW, isOwnProfile, followerCount, followingCount, cosignCount,
  city, state, renderConnectButton, targetUserId,
}: IdentityCardProps) {
  return (
    <div className="clay-card mb-4" style={{ borderRadius: 28 }}>
      {/* Gradient strip */}
      <div style={{
        height: 72, borderRadius: "28px 28px 0 0",
        background: `linear-gradient(135deg, ${roleColor}28, ${roleColor}60)`,
      }} />

      <div style={{ padding: "0 22px 22px" }}>
        {/* Avatar row + action buttons */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginTop: -38 }}>
          <div style={{
            padding: showOTW ? 3 : 0,
            borderRadius: "50%",
            background: showOTW ? "rgba(16,185,129,0.22)" : "transparent",
          }}>
            <AvatarSquare
              src={profileData.avatar_url}
              name={displayName || "U"}
              size={80}
              bgColor={roleColor}
              style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.14)" }}
            />
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center", paddingBottom: 4 }}>
            {isOwnProfile ? (
              <Link
                to="/app/settings"
                className="clay-btn"
                style={{ height: 36, padding: "0 16px", gap: 6, fontSize: 13, fontWeight: 600, color: "var(--text-1)", textDecoration: "none" }}
              >
                <Settings style={{ width: 14, height: 14, flexShrink: 0 }} strokeWidth={1.8} />
                Edit
              </Link>
            ) : (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {renderConnectButton?.()}
                <FollowIconButton targetId={targetUserId || ""} targetUsername={username} size={36} />
              </div>
            )}
          </div>
        </div>

        {/* Name + verified + OTW */}
        <div style={{ marginTop: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-1)", lineHeight: 1.2, wordBreak: "break-word" }}>
              {displayName}
            </h1>
            {isVerified && <VerifiedBadge size={20} />}
            {showOTW && (
              <span style={{
                fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 999,
                background: "rgba(16,185,129,0.11)", color: "#059669",
                border: "1px solid rgba(16,185,129,0.28)",
                display: "inline-flex", alignItems: "center", gap: 4,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981", flexShrink: 0 }} />
                Open to work
              </span>
            )}
          </div>
          {username && <p style={{ fontSize: 12, color: "#9CA3C0", marginTop: 2 }}>@{username}</p>}
        </div>

        {/* One-word role pill */}
        {oneWordRole && (
          <span
            className="clay-pill"
            style={{ marginTop: 8, padding: "5px 14px", fontSize: 12, fontWeight: 700, background: `${roleColor}18`, color: roleColor }}
          >
            {oneWordRole}
          </span>
        )}

        {/* Location */}
        {(city || state) && (
          <p style={{ fontSize: 12, color: "#9CA3C0", marginTop: 6, display: "flex", alignItems: "center", gap: 3 }}>
            <MapPin style={{ width: 11, height: 11, flexShrink: 0 }} />
            {[city, state].filter(Boolean).join(", ")}
          </p>
        )}

        {/* Stats: followers · following · cosigns */}
        <div style={{ display: "flex", gap: 26, marginTop: 14 }}>
          {[
            { label: "followers", value: followerCount },
            { label: "following", value: followingCount },
            { label: "cosigns", value: cosignCount },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontSize: 19, fontWeight: 800, color: "var(--text-1)", lineHeight: 1 }}>
                {(value || 0).toLocaleString()}
              </span>
              <span style={{ fontSize: 10, color: "#9CA3C0", fontWeight: 500, letterSpacing: "0.02em" }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

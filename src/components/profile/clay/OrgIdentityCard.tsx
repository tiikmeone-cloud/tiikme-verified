import React from "react";
import { MapPin, Globe, ExternalLink, Shield } from "lucide-react";
import AvatarSquare from "@/components/ui/AvatarSquare";
import { storageImageUrl } from "@/lib/imageTransform";

interface OrgIdentityCardProps {
  org: any;
  followerCount: number;
  memberCount: number;
  openRolesCount: number;
  isAdmin: boolean;
  isFollowing: boolean;
  onToggleFollow: () => void;
  roleColor?: string;
  oneWordType: string;
  websiteLabel?: string;
  websiteUrl?: string;
}

const AVATAR_COLORS = ["#E8733A", "#2D7A4F", "#C44A1F", "#7E22CE", "#166534", "#B7640A"];
const hashColor = (s: string) => AVATAR_COLORS[Math.abs([...s].reduce((a, c) => a + c.charCodeAt(0), 0)) % AVATAR_COLORS.length];

export default function OrgIdentityCard({
  org, followerCount, memberCount, openRolesCount,
  isAdmin, isFollowing, onToggleFollow, roleColor = "#E8733A",
  oneWordType, websiteLabel, websiteUrl,
}: OrgIdentityCardProps) {
  const avatarColor = hashColor(org.id || org.name || "");

  return (
    <div className="clay-card mb-4" style={{ borderRadius: 28 }}>
      {/* Gradient strip */}
      <div style={{
        height: 72, borderRadius: "28px 28px 0 0",
        background: `linear-gradient(135deg, ${roleColor}28, ${roleColor}60)`,
      }} />

      <div style={{ padding: "0 22px 22px" }}>
        {/* Logo + action buttons */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginTop: -38 }}>
          <AvatarSquare
            src={org.logo_url ? storageImageUrl(org.logo_url) : undefined}
            name={org.name}
            size={80}
            bgColor={avatarColor}
            style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.14)" }}
          />
          <div style={{ display: "flex", gap: 8, alignItems: "center", paddingBottom: 4 }}>
            {!isAdmin && (
              <button
                type="button"
                onClick={onToggleFollow}
                className="clay-btn"
                style={{
                  height: 36, padding: "0 16px", gap: 6, fontSize: 13, fontWeight: 600,
                  color: isFollowing ? "#0D9488" : "#E8733A",
                  background: isFollowing ? "rgba(13,148,136,0.08)" : `${roleColor}12`,
                }}
              >
                {isFollowing ? "Following ✓" : "+ Follow"}
              </button>
            )}
          </div>
        </div>

        {/* Name + verified */}
        <div style={{ marginTop: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-1)", lineHeight: 1.2, wordBreak: "break-word" }}>
              {org.name}
            </h1>
            {org.is_verified && (
              <div style={{ width: 20, height: 20, borderRadius: 10, background: "#FFB800", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Shield style={{ width: 11, height: 11, color: "#fff" }} />
              </div>
            )}
          </div>
          {org.slug && <p style={{ fontSize: 12, color: "#9CA3C0", marginTop: 2 }}>@{org.slug}</p>}
        </div>

        {/* One-word type */}
        {oneWordType && (
          <span
            className="clay-pill"
            style={{ marginTop: 8, padding: "5px 14px", fontSize: 12, fontWeight: 700, background: `${roleColor}18`, color: roleColor }}
          >
            {oneWordType}
          </span>
        )}

        {/* Location + website */}
        <div style={{ display: "flex", gap: 12, marginTop: 6, flexWrap: "wrap" }}>
          {(org.city || org.state) && (
            <p style={{ fontSize: 12, color: "#9CA3C0", display: "flex", alignItems: "center", gap: 3 }}>
              <MapPin style={{ width: 11, height: 11, flexShrink: 0 }} />
              {[org.city, org.state].filter(Boolean).join(", ")}
            </p>
          )}
          {websiteUrl && websiteLabel && (
            <a
              href={websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 12, color: "#E8733A", display: "flex", alignItems: "center", gap: 3, textDecoration: "none" }}
            >
              <Globe style={{ width: 11, height: 11, flexShrink: 0 }} />
              {websiteLabel}
              <ExternalLink style={{ width: 9, height: 9 }} />
            </a>
          )}
        </div>

        {/* Tagline */}
        {org.tagline && (
          <p style={{ fontSize: 13, color: "var(--text-2)", marginTop: 8, lineHeight: 1.5 }}>
            {org.tagline}
          </p>
        )}

        {/* Stats */}
        <div style={{ display: "flex", gap: 26, marginTop: 14 }}>
          {[
            { label: "followers", value: followerCount },
            { label: "open roles", value: openRolesCount },
            { label: "members", value: memberCount },
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

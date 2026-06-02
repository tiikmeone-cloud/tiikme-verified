import { useState } from "react";
import {
  Search, ChevronRight, FileText, FolderOpen, AlertCircle,
} from "lucide-react";
import AvatarSquare from "@/components/ui/AvatarSquare";
import { Link } from "react-router-dom";

export interface SquadPanelData {
  currentOrg: { name: string; timeline: string } | null;
  attestedItems: Array<{ id: string; company_name: string; start_year: number | null }>;
  pendingAttestorName: string | null;
}

export interface IdentityPanelProps {
  profile: any;
  displayName: string;
  oneWordRole: string;
  roleColor: string;
  skillCount: number;
  certCount: number;
  squadData: SquadPanelData;
  resumeUrl?: string | null;
  isOwner: boolean;
  activeNav: string;
  onNavChange: (nav: string) => void;
}

export default function IdentityPanel({
  profile, displayName, oneWordRole, roleColor,
  skillCount, certCount, squadData,
  resumeUrl, isOwner, activeNav, onNavChange,
}: IdentityPanelProps) {
  const [searchQ, setSearchQ] = useState("");

  return (
    <aside
      style={{
        width: 312,
        background: "#FFFFFF",
        borderRight: "1px solid #EAE8E2",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        position: "sticky",
        top: 0,
        overflowY: "auto",
        flexShrink: 0,
        scrollbarWidth: "none",
      }}
    >
      {/* ── Avatar Card ── */}
      <div style={{ padding: "16px 16px 0" }}>
        <div
          style={{
            borderRadius: 18,
            background: `linear-gradient(140deg, ${roleColor}18 0%, ${roleColor}38 100%)`,
            padding: "18px 16px 16px",
            border: `1px solid ${roleColor}20`,
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <AvatarSquare
                src={profile?.avatar_url}
                name={displayName || "U"}
                size={56}
                bgColor={roleColor}
                style={{ borderRadius: 14 }}
              />
              <span style={{
                position: "absolute", bottom: 1, right: 1,
                width: 12, height: 12, borderRadius: "50%",
                background: "#34C759", border: "2.5px solid #fff",
              }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: "#16161A", lineHeight: 1.25, wordBreak: "break-word" }}>
                {displayName}
              </p>
              <p style={{ fontSize: 12, color: "#6E6E76", marginTop: 3, lineHeight: 1.4 }}>
                {profile?.headline || oneWordRole}
              </p>
              {(profile?.location_city || profile?.location_state) && (
                <p style={{ fontSize: 11, color: "#A0A0A8", marginTop: 2 }}>
                  {[profile.location_city, profile.location_state].filter(Boolean).join(", ")}
                </p>
              )}
            </div>
            {isOwner && (
              <Link
                to="/app/settings"
                style={{ color: "#A0A0A8", display: "flex", alignItems: "center", flexShrink: 0, marginTop: 2 }}
              >
                <ChevronRight size={16} />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── Search ── */}
      <div style={{ padding: "10px 16px 4px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "#F4F3EF",
            border: "1px solid #EAE8E2",
            borderRadius: 10,
            padding: "7px 12px",
          }}
        >
          <Search size={13} style={{ color: "#A0A0A8", flexShrink: 0 }} />
          <input
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            placeholder="Search  ⌘S"
            style={{
              border: "none", outline: "none", background: "transparent",
              fontSize: 12, color: "#16161A", flex: 1, minWidth: 0,
            }}
          />
        </div>
      </div>

      {/* ── Nav Groups ── */}
      <div style={{ padding: "8px 10px 24px", flex: 1 }}>

        {/* PROFILE group */}
        <NavSection label="PROFILE">
          <NavItem
            label="About"
            active={activeNav === "about"}
            onClick={() => onNavChange("about")}
          />
          <NavItem
            label="Highlights"
            active={activeNav === "highlights"}
            onClick={() => onNavChange("highlights")}
            badge={profile?.open_to_work ? { text: "Open to Work", color: "#34C759", bg: "rgba(52,199,89,0.10)" } : undefined}
          />
          <NavItem
            label="Skills"
            active={activeNav === "skills"}
            onClick={() => onNavChange("skills")}
            count={skillCount}
          />
          <NavItem
            label="Certificates"
            active={activeNav === "certificates"}
            onClick={() => onNavChange("certificates")}
            count={certCount}
          />
        </NavSection>

        {/* SQUADS · PEER-ATTESTED group */}
        <NavSection label="SQUADS · PEER-ATTESTED">
          {squadData.currentOrg ? (
            <>
              <NavItem
                label={squadData.currentOrg.name}
                active={activeNav === "squads"}
                onClick={() => onNavChange("squads")}
                badge={{ text: "Active", color: "#FF5A1F", bg: "rgba(255,90,31,0.08)" }}
              />
              {squadData.attestedItems.map(item => (
                <NavItem
                  key={item.id}
                  label={`${item.company_name}${item.start_year ? " · " + item.start_year : ""}`}
                  active={false}
                  onClick={() => onNavChange("squads")}
                  indent
                />
              ))}
              {squadData.pendingAttestorName && (
                <div style={{
                  padding: "4px 10px 4px 26px", fontSize: 12,
                  color: "#A0A0A8", fontStyle: "italic", lineHeight: 1.4,
                }}>
                  <span style={{ color: "#FF5A1F", fontStyle: "normal" }}>
                    {squadData.pendingAttestorName}
                  </span>{" "}
                  attested you…
                </div>
              )}
            </>
          ) : (
            <p style={{ padding: "5px 10px", fontSize: 12, color: "#A0A0A8", fontStyle: "italic" }}>
              No squad data yet
            </p>
          )}
          <NavItem
            label="All Squads"
            active={false}
            onClick={() => onNavChange("squads")}
          />
        </NavSection>

        {/* FILES group */}
        <NavSection label="FILES">
          <NavItem
            label="Resume.pdf"
            active={false}
            onClick={() => resumeUrl && window.open(resumeUrl, "_blank")}
            icon={<FileText size={12} />}
            externalLink={!!resumeUrl}
          />
          <NavItem
            label="Portfolio"
            active={activeNav === "portfolio"}
            onClick={() => onNavChange("portfolio")}
            icon={<FolderOpen size={12} />}
            badge={
              // Example: show storage warning if applicable
              undefined
            }
          />
        </NavSection>

      </div>
    </aside>
  );
}

/* ── Sub-components ── */

function NavSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <p style={{
        fontSize: 10, fontWeight: 700, color: "#A0A0A8",
        letterSpacing: "0.09em", padding: "0 6px", marginBottom: 2,
      }}>
        {label}
      </p>
      {children}
    </div>
  );
}

function NavItem({
  label, active, onClick, badge, count, indent = false, icon, externalLink = false,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: { text: string; color: string; bg: string };
  count?: number;
  indent?: boolean;
  icon?: React.ReactNode;
  externalLink?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        width: "100%",
        padding: `5px 8px 5px ${indent ? 22 : 8}px`,
        borderRadius: 8,
        background: active ? "rgba(255,90,31,0.08)" : "transparent",
        border: "none",
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      {icon && (
        <span style={{ color: active ? "#FF5A1F" : "#A0A0A8", flexShrink: 0, display: "flex", alignItems: "center" }}>
          {icon}
        </span>
      )}
      <span style={{
        fontSize: 13,
        fontWeight: active ? 600 : 400,
        color: active ? "#FF5A1F" : indent ? "#6E6E76" : "#16161A",
        flex: 1,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}>
        {label}
      </span>
      {badge && (
        <span style={{
          fontSize: 10, fontWeight: 600, padding: "2px 6px",
          borderRadius: 999, background: badge.bg, color: badge.color,
          flexShrink: 0,
        }}>
          {badge.text}
        </span>
      )}
      {count != null && (
        <span style={{ fontSize: 11, color: "#A0A0A8", flexShrink: 0 }}>{count}</span>
      )}
      {externalLink && (
        <span style={{ color: "#A0A0A8", flexShrink: 0, display: "flex", alignItems: "center" }}>
          <AlertCircle size={11} />
        </span>
      )}
    </button>
  );
}

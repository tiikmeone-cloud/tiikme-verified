import { Bell, Edit2, Share2 } from "lucide-react";
import { toast } from "sonner";

export type ProfileTab = "about" | "experience" | "squads" | "activity";

interface TopNavProps {
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
  isOwner: boolean;
  username?: string;
  cleanUsername?: string;
  onEditClick?: () => void;
  renderConnectButton?: () => React.ReactNode;
}

const TABS: { id: ProfileTab; label: string }[] = [
  { id: "about",      label: "About" },
  { id: "experience", label: "Experience" },
  { id: "squads",     label: "Squads" },
  { id: "activity",   label: "Activity" },
];

export default function TopNav({
  activeTab, onTabChange, isOwner, username, cleanUsername,
  onEditClick, renderConnectButton,
}: TopNavProps) {

  const handleShare = () => {
    const handle = cleanUsername || username;
    const url = handle
      ? `${window.location.origin}/${handle}`
      : window.location.href;
    navigator.clipboard?.writeText(url).catch(() => {});
    toast.success("Profile link copied!");
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 20px",
        background: "rgba(255,255,255,0.80)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid #EAE8E2",
        position: "sticky",
        top: 0,
        zIndex: 8,
        gap: 12,
      }}
    >
      {/* Pill tabs */}
      <div style={{
        display: "flex",
        gap: 4,
        background: "#F0EFE9",
        borderRadius: 12,
        padding: 4,
      }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            style={{
              padding: "6px 14px",
              borderRadius: 9,
              fontSize: 13,
              fontWeight: activeTab === tab.id ? 600 : 400,
              color: activeTab === tab.id ? "#16161A" : "#6E6E76",
              background: activeTab === tab.id ? "#FFFFFF" : "transparent",
              border: "none",
              cursor: "pointer",
              boxShadow: activeTab === tab.id ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              transition: "background 120ms, box-shadow 120ms",
              whiteSpace: "nowrap",
            }}
          >
            {tab.label}
          </button>
        ))}
        {/* ⋯ overflow indicator */}
        <button
          type="button"
          style={{
            padding: "6px 10px", borderRadius: 9, fontSize: 13,
            color: "#A0A0A8", background: "transparent", border: "none", cursor: "default",
          }}
        >
          ⋯
        </button>
      </div>

      {/* Right actions */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {isOwner ? (
          <>
            {/* Share — orange glossy */}
            <button
              type="button"
              onClick={handleShare}
              style={{
                height: 34,
                padding: "0 16px",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                color: "#fff",
                background: "linear-gradient(135deg, #FF5A1F 0%, #FF7A45 100%)",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 2px 12px rgba(255,90,31,0.28), inset 0 1px 0 rgba(255,255,255,0.18)",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Share2 size={13} />
              Share
            </button>
            {/* Edit */}
            <button
              type="button"
              onClick={onEditClick}
              style={{
                height: 34, width: 34, borderRadius: 10,
                background: "#F0EFE9", border: "1px solid #EAE8E2",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <Edit2 size={14} style={{ color: "#6E6E76" }} />
            </button>
            {/* Bell */}
            <button
              type="button"
              style={{
                height: 34, width: 34, borderRadius: 10,
                background: "#F0EFE9", border: "1px solid #EAE8E2",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <Bell size={14} style={{ color: "#6E6E76" }} />
            </button>
          </>
        ) : (
          <>
            {renderConnectButton?.()}
            <button
              type="button"
              onClick={handleShare}
              style={{
                height: 34,
                padding: "0 16px",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                color: "#fff",
                background: "linear-gradient(135deg, #FF5A1F 0%, #FF7A45 100%)",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 2px 12px rgba(255,90,31,0.28), inset 0 1px 0 rgba(255,255,255,0.18)",
              }}
            >
              Share
            </button>
          </>
        )}
      </div>
    </div>
  );
}

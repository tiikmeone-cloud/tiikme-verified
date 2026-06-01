import React from "react";
import { Link } from "react-router-dom";
import { Edit2, BarChart2, Bookmark, Users, Link2, Settings, Share2, UserCheck } from "lucide-react";
import { toast } from "sonner";

interface ClayNavBarProps {
  isOwner: boolean;
  targetUserId?: string;
  cleanProfileUsername?: string;
  username?: string;
  onScrollToAnalytics?: () => void;
}

export default function ClayNavBar({ isOwner, cleanProfileUsername, username, onScrollToAnalytics }: ClayNavBarProps) {
  const handleShare = () => {
    const path = cleanProfileUsername || username;
    const url = path ? `${window.location.origin}/${path}` : window.location.href;
    navigator.clipboard?.writeText(url).catch(() => {});
    toast.success("Profile link copied!");
  };

  const ownerItems = [
    { icon: Edit2,    label: "Edit",      to: "/app/settings" },
    { icon: BarChart2,label: "Analytics", to: null, onClick: onScrollToAnalytics },
    { icon: Bookmark, label: "Stash",     to: "/app/stash" },
    { icon: Users,    label: "Squads",    to: "/app/squads" },
    { icon: Link2,    label: "Links",     to: "/app/settings?tab=links" },
    { icon: Settings, label: "Settings",  to: "/app/settings" },
  ];

  const visitorItems = [
    { icon: Share2,    label: "Share",  to: null, onClick: handleShare },
    { icon: UserCheck, label: "Cosign", to: null, onClick: () => toast.info("Open an experience card to co-sign.") },
  ];

  const items = isOwner ? ownerItems : visitorItems;

  return (
    <nav className="profile-clay-nav" aria-label="Profile actions">
      {items.map((item) => {
        const icon = <item.icon style={{ width: 18, height: 18, color: "var(--text-2)" }} strokeWidth={1.8} />;
        if (item.to) {
          return (
            <Link
              key={item.label}
              to={item.to}
              className="clay-btn"
              title={item.label}
              aria-label={item.label}
              style={{ width: 48, height: 48 }}
            >
              {icon}
            </Link>
          );
        }
        return (
          <button
            key={item.label}
            type="button"
            className="clay-btn"
            title={item.label}
            aria-label={item.label}
            style={{ width: 48, height: 48 }}
            onClick={item.onClick}
          >
            {icon}
          </button>
        );
      })}
    </nav>
  );
}

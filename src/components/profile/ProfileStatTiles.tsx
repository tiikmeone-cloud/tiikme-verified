/**
 * ProfileStatTiles — horizontal stat-tile row.
 * owner=true  → "how am I doing" tiles (views, completeness, connections, activity)
 * owner=false → "can I trust this person" tiles (connections, followers, squads-stub, co-signs-stub)
 */
import { TrendingUp, Users, Eye, Star, Shield, Layers } from "lucide-react";

interface Tile {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sub?: string;
  accent?: string;
  stub?: boolean;
}

interface Props {
  isOwner: boolean;
  connections: number;
  followers: number;
  activityScore: number;
  completenessPercent: number;
  profileViewsCount: number;
  coSignsCount?: number;
  squadsCount?: number;
}

const Tile = ({ icon, label, value, sub, accent = "var(--accent)", stub }: Tile) => (
  <div
    className="glass-card flex-1"
    style={{ padding: "14px 16px", borderRadius: 16, minWidth: 0 }}
  >
    <div className="flex items-center" style={{ gap: 6, marginBottom: 8 }}>
      <span style={{ color: accent }}>{icon}</span>
      <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
    </div>
    <p
      className="num"
      style={{
        fontSize: 22,
        fontWeight: 800,
        color: stub ? "var(--text-3)" : "var(--text-1)",
        lineHeight: 1,
        letterSpacing: "-0.5px",
      }}
    >
      {value}
    </p>
    {sub && (
      <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 4 }}>{sub}</p>
    )}
  </div>
);

export default function ProfileStatTiles({
  isOwner,
  connections,
  followers,
  activityScore,
  completenessPercent,
  profileViewsCount,
  coSignsCount,
  squadsCount,
}: Props) {
  if (isOwner) {
    return (
      <div className="flex" style={{ gap: 10, overflowX: "auto" }}>
        <Tile
          icon={<Eye style={{ width: 14, height: 14 }} />}
          label="Profile views"
          value={profileViewsCount > 0 ? profileViewsCount.toLocaleString() : "—"}
          sub="all time"
          accent="#E8733A"
        />
        <Tile
          icon={<TrendingUp style={{ width: 14, height: 14 }} />}
          label="Completeness"
          value={`${completenessPercent}%`}
          sub={completenessPercent >= 80 ? "Strong" : completenessPercent >= 50 ? "Good" : "Starter"}
          accent="#16A34A"
        />
        <Tile
          icon={<Users style={{ width: 14, height: 14 }} />}
          label="Connections"
          value={connections > 0 ? connections.toLocaleString() : "—"}
          accent="#6366F1"
        />
        <Tile
          icon={<Star style={{ width: 14, height: 14 }} />}
          label="Activity"
          value={activityScore > 0 ? activityScore.toLocaleString() : "—"}
          sub="activity score"
          accent="#FFB800"
        />
      </div>
    );
  }

  return (
    <div className="flex" style={{ gap: 10, overflowX: "auto" }}>
      <Tile
        icon={<Users style={{ width: 14, height: 14 }} />}
        label="Connections"
        value={connections > 0 ? connections.toLocaleString() : "—"}
        accent="#6366F1"
      />
      <Tile
        icon={<TrendingUp style={{ width: 14, height: 14 }} />}
        label="Followers"
        value={followers > 0 ? followers.toLocaleString() : "—"}
        accent="#E8733A"
      />
      <Tile
        icon={<Shield style={{ width: 14, height: 14 }} />}
        label="Co-signs"
        value={coSignsCount != null && coSignsCount > 0 ? coSignsCount.toLocaleString() : "—"}
        sub={coSignsCount != null && coSignsCount > 0 ? "peer attestations" : undefined}
        accent={coSignsCount ? "#6366F1" : "var(--text-3)"}
        stub={!coSignsCount}
      />
      <Tile
        icon={<Layers style={{ width: 14, height: 14 }} />}
        label="Squads"
        value={squadsCount != null && squadsCount > 0 ? squadsCount.toLocaleString() : "—"}
        sub={squadsCount != null && squadsCount > 0 ? "companies" : undefined}
        accent={squadsCount ? "#16A34A" : "var(--text-3)"}
        stub={!squadsCount}
      />
    </div>
  );
}

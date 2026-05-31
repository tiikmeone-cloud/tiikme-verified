import { CheckCircle2, Circle, ChevronRight } from "lucide-react";

interface ProfileData {
  avatar_url?: string | null;
  headline?: string | null;
  bio?: string | null;
  location_city?: string | null;
  skills?: string[] | null;
  resume_url?: string | null;
}

interface Props {
  profile: ProfileData;
  workItemCount: number;
  educationCount: number;
  onSectionClick: (section: "avatar" | "headline" | "bio" | "location" | "skills" | "experience" | "education" | "resume") => void;
}

interface CheckItem {
  key: "avatar" | "headline" | "bio" | "location" | "skills" | "experience" | "education" | "resume";
  label: string;
  done: boolean;
  points: number;
}

export default function ProfileCompletenessCard({ profile, workItemCount, educationCount, onSectionClick }: Props) {
  const checks: CheckItem[] = [
    { key: "avatar",     label: "Add a profile photo",       done: !!profile.avatar_url,                            points: 15 },
    { key: "headline",   label: "Write your headline",        done: !!(profile.headline && profile.headline.length > 5), points: 15 },
    { key: "bio",        label: "Add an About section",       done: !!(profile.bio && profile.bio.length > 20),      points: 15 },
    { key: "experience", label: "Add work experience",        done: workItemCount > 0,                               points: 20 },
    { key: "education",  label: "Add education",              done: educationCount > 0,                              points: 10 },
    { key: "skills",     label: "Add skills",                 done: !!(profile.skills && profile.skills.length > 0), points: 10 },
    { key: "location",   label: "Add your city",              done: !!profile.location_city,                         points: 5  },
    { key: "resume",     label: "Upload a resume PDF",        done: !!profile.resume_url,                            points: 10 },
  ];

  const earned = checks.filter(c => c.done).reduce((sum, c) => sum + c.points, 0);
  const total = checks.reduce((sum, c) => sum + c.points, 0);
  const pct = Math.round((earned / total) * 100);

  const missing = checks.filter(c => !c.done);
  if (missing.length === 0) return null; // fully complete — hide the card

  const strengthLabel = pct >= 80 ? "Strong" : pct >= 50 ? "Intermediate" : "Beginner";
  const strengthColor = pct >= 80 ? "#34C759" : pct >= 50 ? "#FF9F0A" : "#E8733A";

  return (
    <div className="glass-card" style={{ padding: 14, borderRadius: 16 }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>Profile strength</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: strengthColor }}>{strengthLabel}</span>
      </div>

      {/* Progress bar */}
      <div style={{ height: 6, borderRadius: 999, background: "var(--surface-2)", marginBottom: 12, overflow: "hidden" }}>
        <div style={{
          height: "100%", borderRadius: 999,
          width: `${pct}%`,
          background: `linear-gradient(90deg, ${strengthColor}cc, ${strengthColor})`,
          transition: "width 600ms ease",
        }} />
      </div>

      <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 10 }}>
        {pct}% complete · {missing.length} item{missing.length > 1 ? "s" : ""} left
      </p>

      {/* Top 3 missing items */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {missing.slice(0, 3).map(item => (
          <button
            key={item.key}
            type="button"
            onClick={() => onSectionClick(item.key)}
            className="flex items-center gap-2 cursor-pointer text-left"
            style={{
              padding: "7px 10px", borderRadius: 8, border: "none",
              background: "rgba(232,115,58,0.06)",
              transition: "background 150ms",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(232,115,58,0.12)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(232,115,58,0.06)")}
          >
            <Circle style={{ width: 14, height: 14, color: "#E8733A", flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-2)", flex: 1 }}>{item.label}</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: "#E8733A" }}>+{item.points}pts</span>
            <ChevronRight style={{ width: 12, height: 12, color: "var(--text-muted)", flexShrink: 0 }} />
          </button>
        ))}
        {missing.length > 3 && (
          <p style={{ fontSize: 11, color: "var(--text-muted)", paddingLeft: 10, marginTop: 2 }}>
            +{missing.length - 3} more to complete
          </p>
        )}
      </div>
    </div>
  );
}

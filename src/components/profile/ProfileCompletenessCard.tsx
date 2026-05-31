import { ChevronRight } from "lucide-react";

interface Props {
  profile: any;
  workItemCount: number;
  educationCount: number;
  onSectionClick: (section: string) => void;
}

interface SectionDef {
  key: string;
  label: string;
  points: number;
  check: (p: any, w: number, e: number) => boolean;
  cta: string;
}

const SECTIONS: SectionDef[] = [
  { key: "avatar",     label: "Profile photo",   points: 15, check: p => !!p?.avatar_url,                     cta: "Add photo" },
  { key: "headline",   label: "Headline",         points: 15, check: p => !!p?.headline?.trim(),               cta: "Add headline" },
  { key: "bio",        label: "Summary",          points: 15, check: p => !!p?.bio?.trim(),                    cta: "Write summary" },
  { key: "experience", label: "Experience",       points: 20, check: (_p, w) => w > 0,                        cta: "Add experience" },
  { key: "education",  label: "Education",        points: 10, check: (_p, _w, e) => e > 0,                    cta: "Add education" },
  { key: "skills",     label: "Skills",           points: 10, check: p => Array.isArray(p?.skills) && p.skills.length > 0, cta: "Add skills" },
  { key: "location",   label: "Location",         points:  5, check: p => !!p?.location_city || !!p?.location_state, cta: "Add location" },
  { key: "resume",     label: "Resume PDF",       points: 10, check: p => !!p?.resume_url,                    cta: "Upload resume" },
];

const TOTAL = 100;

function strengthLabel(score: number) {
  if (score >= 80) return { label: "Strong", color: "#16A34A" };
  if (score >= 50) return { label: "Good",   color: "#E8733A" };
  return { label: "Starter",  color: "#6B7280" };
}

export default function ProfileCompletenessCard({ profile, workItemCount, educationCount, onSectionClick }: Props) {
  const earned = SECTIONS.reduce(
    (sum, s) => sum + (s.check(profile, workItemCount, educationCount) ? s.points : 0),
    0
  );

  if (earned >= TOTAL) return null;

  const pct = Math.round((earned / TOTAL) * 100);
  const { label, color } = strengthLabel(earned);

  // Top 3 missing items sorted by points descending
  const missing = SECTIONS
    .filter(s => !s.check(profile, workItemCount, educationCount))
    .sort((a, b) => b.points - a.points)
    .slice(0, 3);

  return (
    <div className="glass-card" style={{ padding: 14, borderRadius: 16 }}>
      <div className="flex items-center" style={{ gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)", flex: 1 }}>Profile strength</span>
        <span style={{ fontSize: 12, fontWeight: 700, color }}>{label}</span>
        <span style={{ fontSize: 12, color: "var(--text-3)" }}>{pct}%</span>
      </div>

      {/* Progress bar */}
      <div style={{ height: 6, borderRadius: 999, background: "var(--surface-2)", overflow: "hidden", marginBottom: 12 }}>
        <div style={{ height: "100%", width: `${pct}%`, borderRadius: 999, background: color, transition: "width 0.6s ease" }} />
      </div>

      {/* Missing sections */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {missing.map(s => (
          <button
            key={s.key}
            type="button"
            onClick={() => onSectionClick(s.key)}
            className="flex items-center cursor-pointer"
            style={{ gap: 8, padding: "7px 10px", borderRadius: 10, background: "rgba(232,115,58,0.06)", border: "1px solid rgba(232,115,58,0.15)", width: "100%" }}
          >
            <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-1)", flex: 1, textAlign: "left" }}>{s.cta}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#E8733A", background: "rgba(232,115,58,0.12)", padding: "2px 6px", borderRadius: 4 }}>+{s.points}pts</span>
            <ChevronRight style={{ width: 13, height: 13, color: "var(--text-3)", flexShrink: 0 }} />
          </button>
        ))}
      </div>
    </div>
  );
}

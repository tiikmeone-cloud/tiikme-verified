import { Mail, CheckCircle, BarChart2, Eye } from "lucide-react";
import { getJobMatch } from "@/hooks/useProfile";

/* ── Profile Views — stub data ── */
const PROFILE_VIEW_STUB = [
  { month: "Jan", views: 42 },
  { month: "Feb", views: 61 },
  { month: "Mar", views: 38 },
  { month: "Apr", views: 87 },
  { month: "May", views: 54 },
  { month: "Jun", views: 73 },
];
const MAX_VIEWS = Math.max(...PROFILE_VIEW_STUB.map(d => d.views));

/* ── Messages — stub thread ── */
const MESSAGE_STUB = {
  sender: "Priya Sharma",
  preview: "Thanks for connecting! I noticed your work at…",
  time: "2h ago",
};

interface StatTilesProps {
  profileId: string;
  profile: any;
}

export default function StatTiles({ profileId, profile }: StatTilesProps) {
  // TODO: RAG-match — pass real jobId when wired
  const jobMatch = getJobMatch(profileId, "latest");

  const scoreGradient =
    jobMatch.score >= 75 ? "linear-gradient(90deg, #FFBF00, #34C759)"
    : jobMatch.score >= 50 ? "linear-gradient(90deg, #FF5A1F, #FFBF00)"
    : "linear-gradient(90deg, #EF4444, #FF5A1F)";

  const otwPrefs: any = profile?.open_to_work_preferences || {};

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 12,
        padding: "16px 20px",
      }}
    >
      {/* ── Tile 1: Messages ── */}
      <StatCard>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#6E6E76" }}>Messages</span>
          <span style={{
            width: 28, height: 28, borderRadius: 8, background: "rgba(74,144,217,0.10)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Mail size={14} style={{ color: "#4A90D9" }} />
          </span>
        </div>
        {/* Envelope art — stylised stack */}
        <div style={{ position: "relative", height: 48, marginBottom: 10 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              position: "absolute",
              left: i * 6, top: i * 4,
              width: 64, height: 40,
              borderRadius: 8,
              background: i === 0 ? "#4A90D9" : i === 1 ? "rgba(74,144,217,0.55)" : "rgba(74,144,217,0.25)",
              border: "1px solid rgba(74,144,217,0.18)",
            }}>
              {i === 0 && (
                <>
                  <div style={{
                    position: "absolute", top: 0, left: 0, right: 0,
                    borderTop: "20px solid rgba(255,255,255,0.25)",
                    borderLeft: "32px solid transparent",
                    borderRight: "32px solid transparent",
                  }} />
                </>
              )}
            </div>
          ))}
        </div>
        <p style={{ fontSize: 12, fontWeight: 600, color: "#16161A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {MESSAGE_STUB.sender}
        </p>
        <p style={{ fontSize: 11, color: "#A0A0A8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {MESSAGE_STUB.preview}
        </p>
        <p style={{ fontSize: 10, color: "#A0A0A8", marginTop: 2 }}>{MESSAGE_STUB.time}</p>
      </StatCard>

      {/* ── Tile 2: Open to Work ── */}
      <StatCard accent={profile?.open_to_work ? "#34C759" : undefined}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#6E6E76" }}>Open to Work</span>
          <CheckCircle size={14} style={{ color: profile?.open_to_work ? "#34C759" : "#A0A0A8" }} />
        </div>
        {/* Avatar stack placeholder */}
        <div style={{ display: "flex", marginBottom: 10 }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{
              width: 28, height: 28, borderRadius: "50%",
              background: `hsl(${i * 60 + 180}, 60%, 70%)`,
              border: "2px solid #fff",
              marginLeft: i === 0 ? 0 : -8,
              zIndex: 4 - i,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 10, fontWeight: 700, color: "#fff",
            }}>
              {["P", "R", "A", "M"][i]}
            </div>
          ))}
          <div style={{
            width: 28, height: 28, borderRadius: "50%",
            background: "#F0EFE9", border: "2px solid #fff",
            marginLeft: -8, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 9, color: "#6E6E76", fontWeight: 600,
          }}>
            +12
          </div>
        </div>
        {profile?.open_to_work ? (
          <>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 999,
              background: "rgba(52,199,89,0.12)", color: "#34C759", marginBottom: 6,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#34C759" }} />
              Actively Looking
            </span>
            {otwPrefs?.available_from && (
              <p style={{ fontSize: 11, color: "#6E6E76" }}>
                From {otwPrefs.available_from}
              </p>
            )}
          </>
        ) : (
          <p style={{ fontSize: 12, color: "#A0A0A8" }}>Not actively looking</p>
        )}
      </StatCard>

      {/* ── Tile 3: Job Match (AI) ── */}
      <StatCard>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#6E6E76" }}>Job Match</span>
          {/* Score pill */}
          <span style={{
            fontSize: 12, fontWeight: 800, padding: "3px 8px", borderRadius: 999,
            background: scoreGradient, color: "#fff",
            boxShadow: "0 2px 8px rgba(255,90,31,0.25)",
          }}>
            {jobMatch.score}%
          </span>
        </div>
        {/* Red→Green gradient bar */}
        <div style={{ height: 6, borderRadius: 3, background: "#EAE8E2", marginBottom: 10, overflow: "hidden" }}>
          <div style={{
            height: "100%", width: `${jobMatch.score}%`,
            background: scoreGradient,
            borderRadius: 3,
            transition: "width 600ms ease",
          }} />
        </div>
        {/* Factors — compact */}
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {jobMatch.factors.slice(0, 4).map(f => (
            <div key={f.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ height: 3, borderRadius: 2, flex: 1, background: "#EAE8E2", overflow: "hidden" }}>
                <div style={{
                  height: "100%", width: `${Math.round(f.weight * 100)}%`,
                  background: f.weight >= 0.8 ? "#34C759" : f.weight >= 0.6 ? "#FFBF00" : "#FF5A1F",
                  borderRadius: 2,
                }} />
              </div>
              <span style={{ fontSize: 10, color: "#A0A0A8", width: 70, flexShrink: 0 }}>{f.label}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 11, color: "#A0A0A8" }}>
            #{jobMatch.rank}/{jobMatch.totalApplicants}
          </span>
          <span style={{ fontSize: 11, color: "#FF5A1F", fontWeight: 600 }}>
            {jobMatch.improvements.length} to improve →
          </span>
        </div>
      </StatCard>

      {/* ── Tile 4: Profile Views ── */}
      <StatCard>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#6E6E76" }}>Profile Views</span>
          <Eye size={14} style={{ color: "#8B5CF6" }} />
        </div>
        {/* Bar chart */}
        <div style={{
          display: "flex", alignItems: "flex-end", gap: 3,
          height: 48, marginBottom: 6,
        }}>
          {PROFILE_VIEW_STUB.map(d => (
            <div key={d.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              <div style={{
                width: "100%",
                height: `${Math.round((d.views / MAX_VIEWS) * 40)}px`,
                borderRadius: "3px 3px 0 0",
                background: "#8B5CF6",
                opacity: 0.7 + (d.views / MAX_VIEWS) * 0.3,
              }} />
              <span style={{ fontSize: 8, color: "#A0A0A8" }}>{d.month[0]}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ fontSize: 18, fontWeight: 800, color: "#16161A" }}>
            {PROFILE_VIEW_STUB.reduce((s, d) => s + d.views, 0)}
          </p>
          <span style={{ fontSize: 11, color: "#34C759", fontWeight: 600 }}>+12% ↑</span>
        </div>
        <p style={{ fontSize: 10, color: "#A0A0A8" }}>Jan–Jun · Stub</p>
      </StatCard>
    </div>
  );
}

function StatCard({ children, accent }: { children: React.ReactNode; accent?: string }) {
  return (
    <div
      style={{
        background: "#FFFFFF",
        borderRadius: 16,
        padding: "14px 14px 12px",
        border: `1px solid ${accent ? accent + "28" : "#EAE8E2"}`,
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      }}
    >
      {children}
    </div>
  );
}

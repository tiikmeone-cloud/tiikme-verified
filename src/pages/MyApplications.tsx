import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Briefcase, Clock, CheckCircle, XCircle, AlertCircle, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PageSEO } from "@/hooks/usePageSEO";
import AvatarSquare from "@/components/ui/AvatarSquare";
import { storageImageUrl } from "@/lib/imageTransform";

const STATUS_META: Record<string, { label: string; bg: string; color: string; icon: React.ElementType }> = {
  applied:      { label: "Applied",      bg: "#EFF6FF", color: "#2563EB", icon: Clock },
  reviewing:    { label: "Reviewing",    bg: "#FFF7ED", color: "#EA580C", icon: Clock },
  shortlisted:  { label: "Shortlisted",  bg: "#F0FDF4", color: "#16A34A", icon: CheckCircle },
  selected:     { label: "Selected",     bg: "#ECFDF5", color: "#059669", icon: CheckCircle },
  rejected:     { label: "Not selected", bg: "#FEF2F2", color: "#DC2626", icon: XCircle },
  auto_rejected:{ label: "Not selected", bg: "#FEF2F2", color: "#9CA3AF", icon: XCircle },
};

const TABS = ["All", "Active", "Shortlisted", "Selected", "Closed"] as const;

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function MyApplications() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<typeof TABS[number]>("All");

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("opportunity_applications")
        .select(`
          id, status, created_at, cover_note, portfolio_url,
          opportunity:opportunities!opportunity_applications_opportunity_id_fkey(
            id, title, type, location, is_remote, is_open,
            org:organizations!opportunities_org_id_fkey(name, logo_url, slug)
          )
        `)
        .eq("applicant_id", user.id)
        .order("created_at", { ascending: false });
      setApps(data || []);
      setLoading(false);
    })();
  }, [user]);

  const filtered = apps.filter(a => {
    const s = a.status || "applied";
    if (tab === "All") return true;
    if (tab === "Active") return s === "applied" || s === "reviewing";
    if (tab === "Shortlisted") return s === "shortlisted";
    if (tab === "Selected") return s === "selected";
    if (tab === "Closed") return s === "rejected" || s === "auto_rejected";
    return true;
  });

  const counts = {
    All: apps.length,
    Active: apps.filter(a => a.status === "applied" || a.status === "reviewing").length,
    Shortlisted: apps.filter(a => a.status === "shortlisted").length,
    Selected: apps.filter(a => a.status === "selected").length,
    Closed: apps.filter(a => a.status === "rejected" || a.status === "auto_rejected").length,
  };

  return (
    <div className="min-h-screen pb-20 md:pb-8">
      <PageSEO
        title="My Applications — Tiikme"
        description="Track your job and opportunity applications on Tiikme."
        canonical="https://tiikme.com/app/applications"
      />
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "16px 16px 0" }}>

        {/* Header */}
        <div className="flex items-center" style={{ gap: 12, marginBottom: 20 }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="cursor-pointer flex items-center justify-center"
            style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.25)", border: "1px solid rgba(255,255,255,0.40)" }}
          >
            <ArrowLeft style={{ width: 16, height: 16, color: "#1A1A2E" }} />
          </button>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "#1A1A2E", lineHeight: "28px" }}>My Applications</h1>
            <p style={{ fontSize: 13, color: "#6B7094" }}>{apps.length} total · track your progress</p>
          </div>
        </div>

        {/* Summary stats */}
        {apps.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4" style={{ gap: 8, marginBottom: 16 }}>
            {[
              { label: "Applied", count: counts.Active, color: "#2563EB", bg: "#EFF6FF" },
              { label: "Shortlisted", count: counts.Shortlisted, color: "#16A34A", bg: "#F0FDF4" },
              { label: "Selected", count: counts.Selected, color: "#059669", bg: "#ECFDF5" },
              { label: "Not selected", count: counts.Closed, color: "#DC2626", bg: "#FEF2F2" },
            ].map(s => (
              <div key={s.label} className="glass-card text-center" style={{ padding: "12px 8px", borderRadius: 12, background: s.bg, border: "none" }}>
                <p style={{ fontSize: 22, fontWeight: 700, color: s.color, lineHeight: "28px" }}>{s.count}</p>
                <p style={{ fontSize: 11, fontWeight: 500, color: s.color, opacity: 0.8 }}>{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex overflow-x-auto" style={{ gap: 6, marginBottom: 16, scrollbarWidth: "none" }}>
          {TABS.map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className="cursor-pointer whitespace-nowrap"
              style={{
                height: 32, padding: "0 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                background: tab === t ? "#1A1A2E" : "rgba(255,255,255,0.25)",
                color: tab === t ? "#FFFFFF" : "#6B7094",
                border: tab === t ? "none" : "1px solid rgba(255,255,255,0.40)",
                transition: "all 0.15s",
              }}
            >
              {t}{counts[t] > 0 ? ` (${counts[t]})` : ""}
            </button>
          ))}
        </div>

        {/* Application list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="glass-card animate-pulse" style={{ height: 88, borderRadius: 14 }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center" style={{ padding: "60px 0", gap: 12 }}>
            <Briefcase style={{ width: 40, height: 40, color: "#9CA3C0" }} />
            <p style={{ fontSize: 15, fontWeight: 600, color: "#1A1A2E" }}>
              {tab === "All" ? "No applications yet" : `No ${tab.toLowerCase()} applications`}
            </p>
            <p style={{ fontSize: 13, color: "#9CA3C0", textAlign: "center", maxWidth: 280 }}>
              {tab === "All" ? "Browse opportunities and apply to get started." : "Check back later or explore more opportunities."}
            </p>
            <Link
              to="/app/opportunities"
              style={{ fontSize: 13, fontWeight: 600, color: "#E8733A", marginTop: 4 }}
            >
              Browse opportunities →
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map(app => {
              const opp = app.opportunity;
              const org = opp?.org;
              const meta = STATUS_META[app.status || "applied"] || STATUS_META.applied;
              const StatusIcon = meta.icon;
              return (
                <div
                  key={app.id}
                  className="glass-card"
                  style={{
                    padding: 16, borderRadius: 14,
                    background: "rgba(255,255,255,0.25)", backdropFilter: "blur(20px)",
                    border: "1px solid rgba(255,255,255,0.40)",
                    boxShadow: "0 4px 16px rgba(26,26,78,0.05), inset 0 1px 0 rgba(255,255,255,0.60)",
                  }}
                >
                  <div className="flex items-start" style={{ gap: 12 }}>
                    {/* Org logo */}
                    <div className="shrink-0">
                      {org?.logo_url ? (
                        <img
                          src={storageImageUrl(org.logo_url, "thumbnail")}
                          alt={org.name}
                          style={{ width: 44, height: 44, borderRadius: 10, objectFit: "cover" }}
                        />
                      ) : (
                        <div style={{
                          width: 44, height: 44, borderRadius: 10,
                          background: "rgba(232,115,58,0.12)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <Briefcase style={{ width: 20, height: 20, color: "#E8733A" }} />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="flex items-start justify-between" style={{ gap: 8 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p className="truncate" style={{ fontSize: 14, fontWeight: 600, color: "#1A1A2E" }}>
                            {opp?.title || "Opportunity"}
                          </p>
                          {org && (
                            <Link
                              to={`/org/${org.slug}`}
                              className="flex items-center"
                              style={{ gap: 4, fontSize: 12, color: "#6B7094", marginTop: 2 }}
                              onClick={e => e.stopPropagation()}
                            >
                              {org.name}
                              <ExternalLink style={{ width: 10, height: 10 }} />
                            </Link>
                          )}
                          <div className="flex items-center flex-wrap" style={{ gap: 6, marginTop: 4 }}>
                            {opp?.type && (
                              <span style={{ fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 4, background: "rgba(74,144,217,0.1)", color: "#4A90D9" }}>
                                {opp.type.replace(/[-_]/g, " ")}
                              </span>
                            )}
                            {opp?.is_remote && (
                              <span style={{ fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 4, background: "rgba(52,199,89,0.1)", color: "#34C759" }}>
                                Remote
                              </span>
                            )}
                            {opp?.location && (
                              <span style={{ fontSize: 11, color: "#9CA3C0" }}>{opp.location}</span>
                            )}
                          </div>
                        </div>

                        {/* Status badge */}
                        <div className="flex items-center shrink-0" style={{ gap: 4, padding: "3px 8px", borderRadius: 6, background: meta.bg }}>
                          <StatusIcon style={{ width: 11, height: 11, color: meta.color }} />
                          <span style={{ fontSize: 11, fontWeight: 600, color: meta.color }}>{meta.label}</span>
                        </div>
                      </div>

                      {/* Footer row */}
                      <div className="flex items-center justify-between" style={{ marginTop: 8 }}>
                        <span style={{ fontSize: 11, color: "#9CA3C0" }}>
                          Applied {app.created_at ? timeAgo(app.created_at) : ""}
                        </span>
                        <Link
                          to={`/app/opportunities`}
                          style={{ fontSize: 12, fontWeight: 600, color: "#E8733A" }}
                        >
                          View job →
                        </Link>
                      </div>

                      {/* Alert for shortlisted/selected */}
                      {(app.status === "shortlisted" || app.status === "selected") && (
                        <div className="flex items-center" style={{ gap: 6, marginTop: 8, padding: "6px 10px", borderRadius: 8, background: "rgba(52,199,89,0.08)", border: "1px solid rgba(52,199,89,0.15)" }}>
                          <AlertCircle style={{ width: 13, height: 13, color: "#16A34A", flexShrink: 0 }} />
                          <span style={{ fontSize: 12, color: "#16A34A" }}>
                            {app.status === "shortlisted"
                              ? "You've been shortlisted! Check your Alerts for updates."
                              : "Congratulations! Check your Alerts for next steps."}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

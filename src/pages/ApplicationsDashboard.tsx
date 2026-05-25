import { PageSEO } from "@/hooks/usePageSEO";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AvatarSquare from "@/components/ui/AvatarSquare";
import {
  ArrowLeft, Search, User, FileText, Bell, CheckCircle, XCircle,
  Clock, ChevronRight, Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import ActivityScoreRing from "@/components/ActivityScoreRing";
import GlassBox from "@/components/ui/GlassBox";
import { resolveResumeUrl } from "@/lib/privateAttachments";

const STATUS_TABS = ["All", "Reviewing", "Shortlisted", "Selected", "Rejected", "Auto-rejected"] as const;
const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  applied: { bg: "rgba(232,115,58,0.08)", text: "#E8733A" },
  reviewing: { bg: "#FFF7ED", text: "#EA580C" },
  shortlisted: { bg: "#F0FDF4", text: "#16A34A" },
  selected: { bg: "#ECFDF5", text: "#059669" },
  rejected: { bg: "#FEF2F2", text: "#DC2626" },
  auto_rejected: { bg: "#FEF2F2", text: "#9CA3AF" },
};

export default function ApplicationsDashboard() {
  const { id: oppId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [opp, setOpp] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [rejectingAppId, setRejectingAppId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    if (!oppId) return;
    (async () => {
      const [oppRes, appsRes] = await Promise.allSettled([
        supabase.from("opportunities")
          .select("*, org:organizations!opportunities_org_id_fkey(name, logo_url)")
          .eq("id", oppId).maybeSingle(),
        supabase.from("opportunity_applications")
          .select("*, applicant:profiles!opportunity_applications_applicant_id_fkey(full_name, avatar_url, role, headline, activity_score, skills, location_city)")
          .eq("opportunity_id", oppId)
          .order("created_at", { ascending: false }),
      ]);
      if (oppRes.status === "fulfilled") setOpp(oppRes.value.data);
      if (appsRes.status === "fulfilled") setApplications(appsRes.value.data || []);
      setLoading(false);
    })();
  }, [oppId]);

  const filtered = applications.filter(a => {
    if (statusFilter !== "All") {
      const filterKey = statusFilter.toLowerCase().replace("-", "_");
      if (a.status?.toLowerCase() !== filterKey) return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      return a.applicant?.full_name?.toLowerCase().includes(q) || a.applicant?.headline?.toLowerCase().includes(q);
    }
    return true;
  });

  const statCounts = {
    total: applications.length,
    reviewing: applications.filter(a => a.status === "reviewing").length,
    shortlisted: applications.filter(a => a.status === "shortlisted").length,
    selected: applications.filter(a => a.status === "selected").length,
    rejected: applications.filter(a => a.status === "rejected" || a.status === "auto_rejected").length,
  };

  const updateStatus = async (appId: string, status: string, rejectionReason?: string) => {
    const updatePayload: any = { status };
    if (rejectionReason) updatePayload.recruiter_notes = rejectionReason;
    await supabase.from("opportunity_applications").update(updatePayload).eq("id", appId);
    setApplications(prev => prev.map(a => a.id === appId ? { ...a, status, ...(rejectionReason ? { recruiter_notes: rejectionReason } : {}) } : a));
    if (selectedApp?.id === appId) setSelectedApp((p: any) => ({ ...p, status }));
    toast.success(`Status updated to ${status}`);
    const app = applications.find(a => a.id === appId);
    if (app && user) {
      const { sendNotification } = await import("@/lib/notify");
      const notifBody = status === "rejected" && rejectionReason
        ? `Your application for "${opp?.title}" was not selected. Reason: ${rejectionReason.slice(0, 180)}`
        : `Your application for "${opp?.title}" has been ${status}.`;
      sendNotification({
        userId: app.applicant_id,
        actorId: user.id,
        type: status === "selected" ? "offer" : "opportunity",
        title: status === "selected" ? `You've been selected for ${opp?.title}!` : status === "shortlisted" ? `You've been shortlisted for ${opp?.title}` : `Application update for ${opp?.title}`,
        body: notifBody,
        actionUrl: "/app/applications",
        data: { opportunity_id: opp?.id, org_id: opp?.org_id, org_name: opp?.org?.name, role_title: opp?.title },
      });
    }
  };

  const saveNotes = async () => {
    if (!selectedApp) return;
    setSavingNotes(true);
    await supabase.from("opportunity_applications").update({ recruiter_notes: notes }).eq("id", selectedApp.id);
    setApplications(prev => prev.map(a => a.id === selectedApp.id ? { ...a, recruiter_notes: notes } : a));
    setSavingNotes(false);
    toast.success("Notes saved");
  };

  const inviteToInterview = async (applicantId: string, jobTitle: string) => {
    if (!user) return;
    const { sendNotification } = await import("@/lib/notify");
    await sendNotification({
      userId: applicantId, actorId: user.id, type: "opportunity",
      title: `You've been invited to interview for: ${jobTitle}`,
      actionUrl: "/app/applications",
    });
    toast.success("Interview invite sent via Alerts");
  };

  const openResume = async (resumeUrl: string) => {
    try {
      const signedUrl = await resolveResumeUrl(resumeUrl);
      window.open(signedUrl, "_blank", "noopener,noreferrer");
    } catch (error: any) {
      toast.error(error?.message || "Could not open resume");
    }
  };

  if (loading) return (
    <div className="max-w-[1100px] mx-auto px-4 py-8">
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-1/3 rounded" style={{ background: "rgba(255,255,255,0.5)" }} />
        <div className="h-64 rounded-xl" style={{ background: "rgba(255,255,255,0.5)" }} />
      </div>
    </div>
  );

  return (
    <div className="max-w-[1100px] mx-auto px-4 md:px-6 py-6">
      <PageSEO title="Applications Dashboard | Tiikme" description="Review and manage candidate applications for your opportunities on Tiikme." noIndex />
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button type="button" onClick={() => navigate(-1)} className="p-2 rounded-xl cursor-pointer" style={{ color: "#9CA3AF" }}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-[20px] font-extrabold truncate" style={{ color: "#1A1A1A" }}>
            Applications — {opp?.title || "Opportunity"}
          </h1>
          <p className="text-[13px]" style={{ color: "#9CA3AF" }}>
            {applications.length} total · {applications.filter(a => a.status === "reviewing").length} reviewing
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        {([
          { label: "Total", count: statCounts.total, color: "#6B7280" },
          { label: "Reviewing", count: statCounts.reviewing, color: "#EA580C" },
          { label: "Shortlisted", count: statCounts.shortlisted, color: "#16A34A" },
          { label: "Selected", count: statCounts.selected, color: "#059669" },
          { label: "Rejected", count: statCounts.rejected, color: "#DC2626" },
        ] as const).map(s => (
          <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
            <p className="text-[22px] font-extrabold" style={{ color: s.color }}>{s.count}</p>
            <p className="text-[11px] font-semibold" style={{ color: "var(--text-3)" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-3)" }} />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search applicants..." className="pl-9 h-10" style={{ borderRadius: 12 }} />
        </div>
        <div className="flex gap-1 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {STATUS_TABS.map(s => {
            const filterKey = s.toLowerCase().replace("-", "_");
            const count = s === "All" ? null : applications.filter(a => a.status?.toLowerCase() === filterKey).length;
            return (
              <button key={s} type="button" onClick={() => setStatusFilter(s)}
                className="px-3 py-1.5 rounded-full text-[12px] font-bold cursor-pointer shrink-0"
                style={{
                  background: statusFilter === s ? "var(--brand)" : "var(--surface-2)",
                  color: statusFilter === s ? "#fff" : "var(--text-2)",
                  border: statusFilter === s ? "none" : "1px solid var(--border)",
                }}>
                {s} {count !== null && `(${count})`}
              </button>
            );
          })}
        </div>
      </div>

      {/* Two-panel split */}
      <div className="flex gap-4" style={{ minHeight: 500 }}>
        {/* Left — 380px fixed */}
        <div className="w-full md:w-[380px] shrink-0 space-y-2 overflow-y-auto" style={{ maxHeight: "70vh" }}>
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <User className="w-10 h-10 mx-auto mb-2" style={{ color: "#9CA3AF" }} />
              <p className="text-[13px] font-bold" style={{ color: "#1A1A1A" }}>No applications</p>
            </div>
          ) : filtered.map(app => {
            const colors = STATUS_COLORS[app.status] || STATUS_COLORS.reviewing;
            const isSelected = selectedApp?.id === app.id;
            return (
              <GlassBox key={app.id} accent={colors.text} expanded={isSelected}
                onClick={() => { setSelectedApp(app); setNotes(app.recruiter_notes || ""); }}>
                <div className="flex items-center gap-2.5">
                  <AvatarSquare src={app.applicant?.avatar_url} name={app.applicant?.full_name || "?"} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold truncate" style={{ color: "#1A1A1A" }}>{app.applicant?.full_name || "Applicant"}</p>
                    <p className="text-[11px] truncate" style={{ color: "#9CA3AF" }}>{app.applicant?.headline || app.applicant?.role || ""}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0" style={{ background: colors.bg, color: colors.text }}>
                    {app.status || "reviewing"}
                  </span>
                </div>
              </GlassBox>
            );
          })}
        </div>

        {/* Mobile detail sheet — slides up when an applicant is selected */}
        {selectedApp && (
          <div
            className="md:hidden fixed inset-0 z-50 flex items-end"
            style={{ background: "rgba(0,0,0,0.45)" }}
            onClick={() => setSelectedApp(null)}
          >
            <div
              className="w-full rounded-t-2xl overflow-y-auto"
              style={{ background: "#fff", maxHeight: "85vh", padding: 20 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <p className="text-[16px] font-extrabold" style={{ color: "#1A1A1A" }}>{selectedApp.applicant?.full_name}</p>
                <button type="button" onClick={() => setSelectedApp(null)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                  <XCircle className="w-5 h-5" style={{ color: "#9CA3AF" }} />
                </button>
              </div>
              {/* Reuse the same detail content block */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <AvatarSquare src={selectedApp.applicant?.avatar_url} name={selectedApp.applicant?.full_name || "?"} size="lg" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px]" style={{ color: "#9CA3AF" }}>{selectedApp.applicant?.headline || selectedApp.applicant?.role}</p>
                    {selectedApp.applicant?.location_city && <p className="text-[11px]" style={{ color: "#9CA3AF" }}>{selectedApp.applicant.location_city}</p>}
                  </div>
                  <ActivityScoreRing score={selectedApp.applicant?.activity_score || 0} size={40} />
                </div>
                {selectedApp.why_good_fit && <p className="text-[13px]" style={{ color: "#1A1A1A" }}>{selectedApp.why_good_fit}</p>}
                {selectedApp.cover_letter && <p className="text-[13px]" style={{ color: "#1A1A1A" }}>{selectedApp.cover_letter}</p>}
                <div className="flex gap-2 flex-wrap">
                  {selectedApp.resume_url && (
                    <button type="button" onClick={() => openResume(selectedApp.resume_url)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-bold" style={{ background: "#FEF3E8", color: "#FF5A1F", border: "1px solid #FF5A1F" }}>
                      <FileText className="w-3.5 h-3.5" /> Resume
                    </button>
                  )}
                  <Button variant="secondary" size="sm" onClick={() => inviteToInterview(selectedApp.applicant_id, opp?.title || "this role")}>
                    <Bell className="w-3.5 h-3.5 mr-1" /> Invite
                  </Button>
                  {selectedApp.status !== "shortlisted" && <Button size="sm" onClick={() => { updateStatus(selectedApp.id, "shortlisted"); setSelectedApp(null); }}><CheckCircle className="w-3.5 h-3.5 mr-1" /> Shortlist</Button>}
                  {selectedApp.status !== "selected" && <Button size="sm" onClick={() => { updateStatus(selectedApp.id, "selected"); setSelectedApp(null); }} style={{ background: "#059669" }}><Shield className="w-3.5 h-3.5 mr-1" /> Select</Button>}
                  {selectedApp.status !== "rejected" && (
                    rejectingAppId === selectedApp.id ? (
                      <div className="flex gap-1">
                        <input value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Reason (optional)…" className="h-8 rounded-lg px-2 text-[11px] flex-1" style={{ background: "var(--surface-2)", border: "1px solid #DC2626", outline: "none" }} />
                        <Button variant="destructive" size="sm" onClick={() => { updateStatus(selectedApp.id, "rejected", rejectReason); setRejectingAppId(null); setRejectReason(""); setSelectedApp(null); }}>Send</Button>
                        <Button variant="secondary" size="sm" onClick={() => { setRejectingAppId(null); setRejectReason(""); }}>×</Button>
                      </div>
                    ) : (
                      <Button variant="destructive" size="sm" onClick={() => setRejectingAppId(selectedApp.id)}><XCircle className="w-3.5 h-3.5 mr-1" /> Reject</Button>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Right — Detail panel */}
        <div className="hidden md:block flex-1">
          <GlassBox accent="identity" className="h-full">
            {!selectedApp ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-10">
                <User className="w-12 h-12 mb-3" style={{ color: "#9CA3AF" }} />
                <p className="text-[14px] font-bold" style={{ color: "#1A1A1A" }}>Select an applicant</p>
                <p className="text-[12px]" style={{ color: "#9CA3AF" }}>Click to view details</p>
              </div>
            ) : (
              <div className="space-y-5 overflow-y-auto" style={{ maxHeight: "65vh" }}>
                {/* Profile header */}
                <div className="flex items-center gap-3">
                  <AvatarSquare src={selectedApp.applicant?.avatar_url} name={selectedApp.applicant?.full_name || "?"} size="lg" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[18px] font-extrabold" style={{ color: "#1A1A1A" }}>{selectedApp.applicant?.full_name}</p>
                    <p className="text-[13px]" style={{ color: "#9CA3AF" }}>{selectedApp.applicant?.headline || selectedApp.applicant?.role}</p>
                    {selectedApp.applicant?.location_city && (
                      <p className="text-[11px]" style={{ color: "#9CA3AF" }}>{selectedApp.applicant.location_city}</p>
                    )}
                  </div>
                  <ActivityScoreRing score={selectedApp.applicant?.activity_score || 0} size={44} />
                </div>

                {/* Skills */}
                {selectedApp.applicant?.skills?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {(selectedApp.applicant.skills as string[]).slice(0, 8).map((s: string) => (
                      <span key={s} className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: "#F3F4F6", color: "#374151" }}>{s}</span>
                    ))}
                  </div>
                )}

                {/* Why good fit */}
                {selectedApp.why_good_fit && (
                  <div>
                    <p className="text-[12px] font-bold mb-1" style={{ color: "#9CA3AF" }}>Why they're a good fit</p>
                    <p className="text-[14px]" style={{ color: "#1A1A1A" }}>{selectedApp.why_good_fit}</p>
                  </div>
                )}

                {selectedApp.cover_letter && (
                  <div>
                    <p className="text-[12px] font-bold mb-1" style={{ color: "#9CA3AF" }}>Cover Letter</p>
                    <p className="text-[14px]" style={{ color: "#1A1A1A" }}>{selectedApp.cover_letter}</p>
                  </div>
                )}

                {/* Resume & Portfolio */}
                <div className="flex gap-2">
                  {selectedApp.resume_url && (
                    <button type="button" onClick={() => openResume(selectedApp.resume_url)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-bold"
                      style={{ background: "#FEF3E8", color: "#FF5A1F", border: "1px solid #FF5A1F" }}>
                      <FileText className="w-3.5 h-3.5" /> Resume
                    </button>
                  )}
                  {selectedApp.portfolio_url && (
                    <a href={selectedApp.portfolio_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-bold"
                      style={{ background: "#F3F4F6", color: "#374151", border: "1px solid #E5E7EB" }}>
                      <ChevronRight className="w-3.5 h-3.5" /> Portfolio
                    </a>
                  )}
                </div>

                {/* Screening answers */}
                {selectedApp.custom_answers && Object.keys(selectedApp.custom_answers).length > 0 && (
                  <div>
                    <p className="text-[12px] font-bold mb-2" style={{ color: "#9CA3AF" }}>Screening Answers</p>
                    {Object.entries(selectedApp.custom_answers).map(([key, val]) => (
                      <div key={key} className="mb-2">
                        <p className="text-[11px]" style={{ color: "#9CA3AF" }}>Q{parseInt(key) + 1}</p>
                        <p className="text-[13px]" style={{ color: "#1A1A1A" }}>{String(val)}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Notes */}
                <div>
                  <p className="text-[12px] font-bold mb-1" style={{ color: "#9CA3AF" }}>Private Notes</p>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Add private notes..."
                    className="w-full rounded-xl p-3 text-[13px] outline-none resize-none"
                    style={{ background: "rgba(255,255,255,0.5)", border: "1px solid #ECECEA", color: "#1A1A1A" }} />
                  <Button variant="secondary" size="sm" onClick={saveNotes} disabled={savingNotes} className="mt-1">
                    {savingNotes ? "Saving..." : "Save Notes"}
                  </Button>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3" style={{ borderTop: "1px solid #ECECEA" }}>
                  <Button variant="secondary" size="sm" onClick={() => inviteToInterview(selectedApp.applicant_id, opp?.title || "this role")}>
                    <Bell className="w-3.5 h-3.5 mr-1" /> Invite
                  </Button>
                  {selectedApp.status !== "shortlisted" && (
                    <Button size="sm" onClick={() => updateStatus(selectedApp.id, "shortlisted")}>
                      <CheckCircle className="w-3.5 h-3.5 mr-1" /> Shortlist
                    </Button>
                  )}
                  {selectedApp.status !== "selected" && (
                    <Button size="sm" onClick={() => updateStatus(selectedApp.id, "selected")} style={{ background: "#059669" }}>
                      <Shield className="w-3.5 h-3.5 mr-1" /> Select
                    </Button>
                  )}
                  {selectedApp.status !== "rejected" && (
                    rejectingAppId === selectedApp.id ? (
                      <div className="flex gap-1 flex-wrap">
                        <input value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Reason for rejection (optional)…" className="h-8 rounded-lg px-2 text-[11px] flex-1 min-w-[140px]" style={{ background: "#FEF2F2", border: "1px solid #DC2626", outline: "none" }} />
                        <Button variant="destructive" size="sm" onClick={() => { updateStatus(selectedApp.id, "rejected", rejectReason); setRejectingAppId(null); setRejectReason(""); }}>Confirm</Button>
                        <Button variant="secondary" size="sm" onClick={() => { setRejectingAppId(null); setRejectReason(""); }}>Cancel</Button>
                      </div>
                    ) : (
                      <Button variant="destructive" size="sm" onClick={() => setRejectingAppId(selectedApp.id)}>
                        <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                      </Button>
                    )
                  )}
                </div>
                <p className="text-[11px]" style={{ color: "#9CA3AF" }}>
                  Applied {selectedApp.created_at ? new Date(selectedApp.created_at).toLocaleDateString() : ""}
                </p>
              </div>
            )}
          </GlassBox>
        </div>
      </div>
    </div>
  );
}

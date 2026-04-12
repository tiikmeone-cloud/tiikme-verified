import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { storageImageUrl } from "@/lib/imageTransform";
import {
  ArrowLeft, Search, User, FileText, MessageCircle, CheckCircle, XCircle,
  Clock, Filter, ChevronRight, Building2, Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import ActivityScoreRing from "@/components/ActivityScoreRing";

const STATUS_TABS = ["All", "Reviewing", "Shortlisted", "Selected", "Rejected"] as const;
const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  applied: { bg: "#EFF6FF", text: "#2563EB" },
  reviewing: { bg: "#FFF7ED", text: "#EA580C" },
  shortlisted: { bg: "#F0FDF4", text: "#16A34A" },
  selected: { bg: "#ECFDF5", text: "#059669" },
  rejected: { bg: "#FEF2F2", text: "#DC2626" },
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

  useEffect(() => {
    if (!oppId) return;
    (async () => {
      const { data: oppData } = await supabase.from("opportunities")
        .select("*, org:organizations!opportunities_org_id_fkey(name, logo_url)")
        .eq("id", oppId).maybeSingle();
      setOpp(oppData);

      const { data: apps } = await supabase.from("opportunity_applications")
        .select("*, applicant:profiles!opportunity_applications_applicant_id_fkey(full_name, avatar_url, role, headline, activity_score, skills, location_city)")
        .eq("opportunity_id", oppId)
        .order("created_at", { ascending: false });
      setApplications(apps || []);
      setLoading(false);
    })();
  }, [oppId]);

  const filtered = applications.filter(a => {
    if (statusFilter !== "All" && a.status?.toLowerCase() !== statusFilter.toLowerCase()) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return a.applicant?.full_name?.toLowerCase().includes(q) || a.applicant?.headline?.toLowerCase().includes(q);
    }
    return true;
  });

  const updateStatus = async (appId: string, status: string) => {
    await supabase.from("opportunity_applications").update({ status }).eq("id", appId);
    setApplications(prev => prev.map(a => a.id === appId ? { ...a, status } : a));
    if (selectedApp?.id === appId) setSelectedApp((p: any) => ({ ...p, status }));
    toast.success(`Status updated to ${status}`);

    // Send alert to applicant
    const app = applications.find(a => a.id === appId);
    if (app) {
      await supabase.from("alerts").insert({
        user_id: app.applicant_id,
        type: "opportunity",
        title: status === "selected" ? `You've been selected!` : `Application update`,
        body: `Your application for "${opp?.title}" has been ${status}.`,
        action_url: "/app/opportunities",
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

  const contactViaPings = async (applicantId: string) => {
    if (!user) return;
    // Check existing conversation
    const { data: existing } = await supabase.from("conversations")
      .select("id")
      .or(`and(participant_1.eq.${user.id},participant_2.eq.${applicantId}),and(participant_1.eq.${applicantId},participant_2.eq.${user.id})`)
      .maybeSingle();
    if (existing) { navigate(`/app/pings/${existing.id}`); return; }

    const { data: conv } = await supabase.from("conversations").insert({
      participant_1: user.id, participant_2: applicantId,
    }).select().single();
    if (conv) navigate(`/app/pings/${conv.id}`);
  };

  if (loading) return (
    <div className="max-w-[1100px] mx-auto px-4 py-8">
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-1/3 rounded" style={{ background: "var(--surface)" }} />
        <div className="h-64 rounded-xl" style={{ background: "var(--surface)" }} />
      </div>
    </div>
  );

  return (
    <div className="max-w-[1100px] mx-auto px-4 md:px-6 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button type="button" onClick={() => navigate(-1)} className="p-2 rounded-xl cursor-pointer" style={{ color: "var(--text-3)" }}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-[20px] font-extrabold truncate" style={{ color: "var(--text-1)" }}>
            Applications — {opp?.title || "Opportunity"}
          </h1>
          <p className="text-[13px]" style={{ color: "var(--text-3)" }}>
            {applications.length} total · {applications.filter(a => a.status === "reviewing").length} reviewing
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-3)" }} />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search applicants..."
            className="pl-9 h-10" style={{ borderRadius: 12 }} />
        </div>
        <div className="flex gap-1">
          {STATUS_TABS.map(s => (
            <button key={s} type="button" onClick={() => setStatusFilter(s)}
              className="px-3 py-1.5 rounded-full text-[12px] font-bold cursor-pointer"
              style={{
                background: statusFilter === s ? "var(--brand)" : "var(--surface)",
                color: statusFilter === s ? "#fff" : "var(--text-2)",
                border: statusFilter === s ? "none" : "1px solid var(--border)",
              }}>
              {s} {s !== "All" && `(${applications.filter(a => a.status?.toLowerCase() === s.toLowerCase()).length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Split panel */}
      <div className="flex gap-4" style={{ minHeight: 500 }}>
        {/* Left — Applicant list */}
        <div className="w-full md:w-[340px] shrink-0 space-y-2 overflow-y-auto" style={{ maxHeight: "70vh" }}>
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <User className="w-10 h-10 mx-auto mb-2" style={{ color: "var(--text-3)" }} />
              <p className="text-[13px] font-bold" style={{ color: "var(--text-1)" }}>No applications yet</p>
            </div>
          ) : filtered.map(app => {
            const colors = STATUS_COLORS[app.status] || STATUS_COLORS.reviewing;
            const isSelected = selectedApp?.id === app.id;
            return (
              <button key={app.id} type="button" onClick={() => { setSelectedApp(app); setNotes(app.recruiter_notes || ""); }}
                className="w-full text-left p-3 rounded-xl cursor-pointer transition-all"
                style={{
                  background: isSelected ? "var(--brand-dim)" : "var(--surface)",
                  border: isSelected ? "1.5px solid var(--brand)" : "1px solid var(--border)",
                }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-bold text-white overflow-hidden shrink-0" style={{ background: "var(--brand)" }}>
                    {app.applicant?.avatar_url ? <img src={storageImageUrl(app.applicant.avatar_url, "avatar")} alt="" className="w-full h-full object-cover" /> : (app.applicant?.full_name?.[0] || "?")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold truncate" style={{ color: "var(--text-1)" }}>{app.applicant?.full_name || "Applicant"}</p>
                    <p className="text-[11px] truncate" style={{ color: "var(--text-3)" }}>{app.applicant?.headline || app.applicant?.role || ""}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0" style={{ background: colors.bg, color: colors.text }}>
                    {app.status || "reviewing"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right — Detail panel */}
        <div className="hidden md:block flex-1 rounded-xl p-5 overflow-y-auto" style={{ background: "var(--surface)", border: "1px solid var(--border)", maxHeight: "70vh" }}>
          {!selectedApp ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <User className="w-12 h-12 mb-3" style={{ color: "var(--text-3)" }} />
              <p className="text-[14px] font-bold" style={{ color: "var(--text-1)" }}>Select an applicant</p>
              <p className="text-[12px]" style={{ color: "var(--text-3)" }}>Click on an applicant to view their details</p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Profile header */}
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-[16px] font-bold text-white overflow-hidden shrink-0" style={{ background: "var(--brand)" }}>
                  {selectedApp.applicant?.avatar_url ? <img src={storageImageUrl(selectedApp.applicant.avatar_url, "avatar")} alt="" className="w-full h-full object-cover" /> : (selectedApp.applicant?.full_name?.[0] || "?")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[18px] font-extrabold" style={{ color: "var(--text-1)" }}>{selectedApp.applicant?.full_name}</p>
                  <p className="text-[13px]" style={{ color: "var(--text-3)" }}>{selectedApp.applicant?.headline || selectedApp.applicant?.role}</p>
                  {selectedApp.applicant?.location_city && (
                    <p className="text-[11px]" style={{ color: "var(--text-3)" }}>{selectedApp.applicant.location_city}</p>
                  )}
                </div>
                <ActivityScoreRing score={selectedApp.applicant?.activity_score || 0} size={44} />
              </div>

              {/* Skills */}
              {selectedApp.applicant?.skills?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {(selectedApp.applicant.skills as string[]).slice(0, 8).map((s: string) => (
                    <span key={s} className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: "var(--bg-2)", color: "var(--text-2)" }}>{s}</span>
                  ))}
                </div>
              )}

              {/* Why good fit */}
              {selectedApp.why_good_fit && (
                <div>
                  <p className="text-[12px] font-bold mb-1" style={{ color: "var(--text-3)" }}>Why they're a good fit</p>
                  <p className="text-[14px]" style={{ color: "var(--text-1)" }}>{selectedApp.why_good_fit}</p>
                </div>
              )}

              {/* Cover letter */}
              {selectedApp.cover_letter && (
                <div>
                  <p className="text-[12px] font-bold mb-1" style={{ color: "var(--text-3)" }}>Cover Letter</p>
                  <p className="text-[14px]" style={{ color: "var(--text-1)" }}>{selectedApp.cover_letter}</p>
                </div>
              )}

              {/* Resume & Portfolio */}
              <div className="flex gap-2">
                {selectedApp.resume_url && (
                  <a href={selectedApp.resume_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-bold"
                    style={{ background: "var(--brand-dim)", color: "var(--brand)", border: "1px solid var(--brand)" }}>
                    <FileText className="w-3.5 h-3.5" /> Resume
                  </a>
                )}
                {selectedApp.portfolio_url && (
                  <a href={selectedApp.portfolio_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-bold"
                    style={{ background: "var(--bg-2)", color: "var(--text-2)", border: "1px solid var(--border)" }}>
                    <ChevronRight className="w-3.5 h-3.5" /> Portfolio
                  </a>
                )}
              </div>

              {/* Screening answers */}
              {selectedApp.custom_answers && Object.keys(selectedApp.custom_answers).length > 0 && (
                <div>
                  <p className="text-[12px] font-bold mb-2" style={{ color: "var(--text-3)" }}>Screening Answers</p>
                  {Object.entries(selectedApp.custom_answers).map(([key, val]) => (
                    <div key={key} className="mb-2">
                      <p className="text-[11px]" style={{ color: "var(--text-3)" }}>Q{parseInt(key) + 1}</p>
                      <p className="text-[13px]" style={{ color: "var(--text-1)" }}>{String(val)}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Recruiter notes */}
              <div>
                <p className="text-[12px] font-bold mb-1" style={{ color: "var(--text-3)" }}>Private Notes</p>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Add private notes about this applicant..."
                  className="w-full rounded-xl p-3 text-[13px] outline-none resize-none"
                  style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text-1)" }} />
                <Button variant="secondary" size="sm" onClick={saveNotes} disabled={savingNotes} className="mt-1">
                  {savingNotes ? "Saving..." : "Save Notes"}
                </Button>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                <Button variant="secondary" size="sm" onClick={() => contactViaPings(selectedApp.applicant_id)}>
                  <MessageCircle className="w-3.5 h-3.5 mr-1" /> Contact via Pings
                </Button>
                {selectedApp.status !== "shortlisted" && (
                  <Button size="sm" onClick={() => updateStatus(selectedApp.id, "shortlisted")}>
                    <CheckCircle className="w-3.5 h-3.5 mr-1" /> Shortlist
                  </Button>
                )}
                {selectedApp.status !== "selected" && (
                  <Button size="sm" onClick={() => updateStatus(selectedApp.id, "selected")}
                    style={{ background: "#059669" }}>
                    <Shield className="w-3.5 h-3.5 mr-1" /> Select
                  </Button>
                )}
                {selectedApp.status !== "rejected" && (
                  <Button variant="destructive" size="sm" onClick={() => updateStatus(selectedApp.id, "rejected")}>
                    <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                  </Button>
                )}
              </div>

              <p className="text-[11px]" style={{ color: "var(--text-3)" }}>
                Applied {selectedApp.created_at ? new Date(selectedApp.created_at).toLocaleDateString() : ""}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

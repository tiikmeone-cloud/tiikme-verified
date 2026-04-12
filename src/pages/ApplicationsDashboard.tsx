import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrgIdentity } from "@/contexts/OrgIdentityContext";
import { storageImageUrl } from "@/lib/imageTransform";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import PageLoader from "@/components/PageLoader";
import {
  ArrowLeft, Search, MessageSquare, CheckCircle2, XCircle, Star,
  FileText, User, ExternalLink
} from "lucide-react";
import { toast } from "sonner";

const statusFilters = ["All", "reviewing", "shortlisted", "selected", "rejected"];
const statusColors: Record<string, { bg: string; text: string }> = {
  reviewing: { bg: "#EFF6FF", text: "#2563EB" },
  shortlisted: { bg: "#FFF3EC", text: "#E8580A" },
  selected: { bg: "#F0FDF4", text: "#16A34A" },
  rejected: { bg: "#FEF2F2", text: "#DC2626" },
  applied: { bg: "#F3F4F6", text: "#6B7280" },
};

export default function ApplicationsDashboard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isInstitution, org } = useOrgIdentity();

  const [opp, setOpp] = useState<any>(null);
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const fetchData = useCallback(async () => {
    if (!id || !user) return;
    setLoading(true);
    try {
      const { data: oppData } = await supabase
        .from("opportunities")
        .select("*, org:organizations!opportunities_org_id_fkey(id, name, slug)")
        .eq("id", id)
        .single();

      if (!oppData) { navigate("/app/opportunities"); return; }

      // Verify user is admin
      if (oppData.poster_id !== user.id && !(isInstitution && org && oppData.org_id === org.id)) {
        navigate("/app/opportunities");
        return;
      }

      setOpp(oppData);

      // Fetch applications
      const { data: appsData } = await supabase
        .from("opportunity_applications")
        .select("*")
        .eq("opportunity_id", id)
        .order("created_at", { ascending: false });

      // Fetch profiles for applicants separately
      const appsList = appsData || [];
      const applicantIds = appsList.map(a => a.applicant_id).filter(Boolean);
      let profilesMap: Record<string, any> = {};
      if (applicantIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url, username, headline, role, activity_score, location_city, location_state, skills")
          .in("id", applicantIds);
        (profilesData || []).forEach(p => { profilesMap[p.id] = p; });
      }

      setApps(appsWithProfiles);
      if (appsWithProfiles.length > 0 && !selectedApp) setSelectedApp(appsWithProfiles[0]);
    } catch (e) { console.warn("[AppsDashboard]", e); }
    setLoading(false);
  }, [id, user, isInstitution, org, navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredApps = apps.filter(a => {
    if (activeFilter !== "All" && a.status !== activeFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const name = (a.profile?.full_name || "").toLowerCase();
      return name.includes(q);
    }
    return true;
  });

  const [showSelectModal, setShowSelectModal] = useState<any>(null);
  const [offerMessage, setOfferMessage] = useState("");

  const handleStatusChange = async (appId: string, status: string) => {
    if (status === "selected") {
      const app = apps.find(a => a.id === appId);
      setOfferMessage(`Congratulations! 🎉 We're thrilled to select you for the ${opp?.title} role at ${org?.name || "our organization"}. We'd love to have you on board. Please confirm your acceptance.`);
      setShowSelectModal(app);
      return;
    }
    try {
      const updates: any = { status };
      await supabase.from("opportunity_applications").update(updates).eq("id", appId);
      setApps(prev => prev.map(a => a.id === appId ? { ...a, ...updates } : a));
      if (selectedApp?.id === appId) setSelectedApp((prev: any) => ({ ...prev, ...updates }));
      toast.success(`Status updated to ${status}`);
    } catch (e) { console.warn("[AppsDashboard] status update:", e); }
  };

  const confirmSelect = async () => {
    if (!showSelectModal || !opp) return;
    const app = showSelectModal;
    try {
      await supabase.from("opportunity_applications").update({ status: "selected", selected_at: new Date().toISOString() }).eq("id", app.id);
      setApps(prev => prev.map(a => a.id === app.id ? { ...a, status: "selected" } : a));
      if (selectedApp?.id === app.id) setSelectedApp((prev: any) => ({ ...prev, status: "selected" }));

      // Create offer alert for the applicant
      await supabase.from("alerts").insert({
        user_id: app.applicant_id,
        type: "offer",
        title: `You've been selected! 🎉`,
        body: `${org?.name || "An organization"} has selected you for ${opp.title}`,
        action_url: `/app/opportunities`,
        data: { org_id: org?.id, org_name: org?.name, opportunity_id: opp.id, role_title: opp.title, application_id: app.id } as any,
      });

      // Send Ping to applicant
      try {
        const ownerId = user?.id;
        if (ownerId && app.applicant_id) {
          const { data: conv } = await supabase.from("conversations").insert({
            participant_1: ownerId, participant_2: app.applicant_id,
          }).select().single();
          if (conv) {
            await supabase.from("pings").insert({
              conversation_id: conv.id, sender_id: ownerId,
              content: offerMessage, is_opener: true,
            });
          }
        }
      } catch (pingErr) { console.warn("[AppsDashboard] ping send:", pingErr); }

      toast.success(`Offer sent to ${app.profile?.full_name || "applicant"}!`);
      setShowSelectModal(null);
    } catch (e) { console.warn("[AppsDashboard] select:", e); toast.error("Failed to send offer"); }
  };

  const handleSaveNote = async () => {
    if (!selectedApp || !noteText.trim()) return;
    setSavingNote(true);
    try {
      const existing = selectedApp.recruiter_notes || "";
      const timestamp = new Date().toLocaleString();
      const updated = `${existing}\n[${timestamp}] ${noteText}`.trim();
      await supabase.from("opportunity_applications").update({ recruiter_notes: updated }).eq("id", selectedApp.id);
      setSelectedApp((prev: any) => ({ ...prev, recruiter_notes: updated }));
      setApps(prev => prev.map(a => a.id === selectedApp.id ? { ...a, recruiter_notes: updated } : a));
      setNoteText("");
      toast.success("Note saved");
    } catch (e) { console.warn("[AppsDashboard] note:", e); }
    setSavingNote(false);
  };

  const daysAgo = (d: string) => {
    const diff = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
    return diff === 0 ? "Today" : `${diff}d ago`;
  };

  if (loading) return <PageLoader />;
  if (!opp) return null;

  return (
    <div className="flex flex-col h-[calc(100vh-60px)]">
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-3" style={{ borderBottom: "1px solid #F0E8E0" }}>
        <button type="button" onClick={() => navigate("/app/opportunities")} className="p-2 rounded-lg cursor-pointer" style={{ color: "#6B6B6B" }}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-[16px] font-bold truncate" style={{ color: "#1A1A1A" }}>{opp.title}</h1>
          <p className="text-[13px]" style={{ color: "#9CA3AF" }}>
            {apps.length} applied
            {(() => {
              const qualifiedCount = apps.filter((a: any) => a.is_qualified === true).length;
              return qualifiedCount > 0 ? ` · ${qualifiedCount} qualified` : "";
            })()}
          </p>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Left panel */}
        <div className="w-[380px] shrink-0 flex flex-col" style={{ borderRight: "1px solid #F0E8E0" }}>
          {/* Filters */}
          <div className="px-3 py-2 space-y-2" style={{ borderBottom: "1px solid #F0E8E0" }}>
            <div className="flex gap-1 flex-wrap">
              {statusFilters.map(f => (
                <button key={f} type="button" onClick={() => setActiveFilter(f)}
                  className="px-3 py-1 text-[11px] font-semibold rounded-full cursor-pointer capitalize"
                  style={{
                    background: activeFilter === f ? "#E8580A" : "#F3F4F6",
                    color: activeFilter === f ? "#fff" : "#374151",
                  }}>
                  {f}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#9CA3AF" }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search applicants..."
                className="w-full h-10 rounded-full pl-9 pr-3 text-[13px] outline-none"
                style={{ background: "#F9FAFB", border: "1px solid #F0E8E0", color: "#1A1A1A" }} />
            </div>
          </div>

          {/* Applicant list */}
          <div className="flex-1 overflow-y-auto">
            {filteredApps.length === 0 ? (
              <p className="text-center py-8 text-[13px]" style={{ color: "#9CA3AF" }}>No applicants found</p>
            ) : filteredApps.map(app => {
              const sc = statusColors[app.status] || statusColors.applied;
              const isActive = selectedApp?.id === app.id;
              return (
                <button key={app.id} type="button" onClick={() => { setSelectedApp(app); setActiveTab("profile"); }}
                  className="w-full text-left px-4 py-3 flex items-center gap-3 cursor-pointer"
                  style={{
                    background: isActive ? "#FFF3EC" : "transparent",
                    borderLeft: isActive ? "3px solid #E8580A" : "3px solid transparent",
                    borderBottom: "1px solid #F9FAFB",
                  }}>
                  <Avatar className="w-10 h-10 shrink-0">
                    <AvatarImage src={app.profile?.avatar_url ? storageImageUrl(app.profile.avatar_url, "thumbnail") : undefined} />
                    <AvatarFallback style={{ background: "#FFF3EC", color: "#E8580A", fontSize: 12 }}>
                      {(app.profile?.full_name || "U").substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold truncate" style={{ color: "#1A1A1A" }}>{app.profile?.full_name || "Unknown"}</p>
                    <p className="text-[11px]" style={{ color: "#9CA3AF" }}>{app.created_at ? daysAgo(app.created_at) : ""}</p>
                  </div>
                  <Badge className="text-[10px] capitalize shrink-0" style={{ background: sc.bg, color: sc.text, border: "none" }}>
                    {app.status}
                  </Badge>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right panel */}
        <div className="flex-1 flex flex-col min-w-0">
          {!selectedApp ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <User className="w-12 h-12 mx-auto mb-3" style={{ color: "#9CA3AF" }} />
                <p className="text-[16px] font-bold" style={{ color: "#1A1A1A" }}>Select an applicant</p>
                <p className="text-[13px]" style={{ color: "#9CA3AF" }}>Click on an applicant to view their details</p>
              </div>
            </div>
          ) : (
            <>
              {/* Applicant header */}
              <div className="p-6 flex items-start gap-4" style={{ borderBottom: "1px solid #F0E8E0" }}>
                <Avatar className="w-16 h-16 shrink-0">
                  <AvatarImage src={selectedApp.profile?.avatar_url ? storageImageUrl(selectedApp.profile.avatar_url, "avatar") : undefined} />
                  <AvatarFallback style={{ background: "#FFF3EC", color: "#E8580A", fontSize: 20 }}>
                    {(selectedApp.profile?.full_name || "U").substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h2 className="text-[22px] font-bold" style={{ color: "#1A1A1A" }}>{selectedApp.profile?.full_name}</h2>
                  <p className="text-[15px]" style={{ color: "#6B6B6B" }}>{selectedApp.profile?.headline || selectedApp.profile?.role || ""}</p>
                  {(selectedApp.profile?.location_city || selectedApp.profile?.location_state) && (
                    <p className="text-[13px]" style={{ color: "#9CA3AF" }}>
                      {[selectedApp.profile?.location_city, selectedApp.profile?.location_state].filter(Boolean).join(", ")}
                    </p>
                  )}
                </div>
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-[14px] font-bold"
                  style={{ background: "#FFF3EC", color: "#E8580A", border: "2px solid #E8580A" }}>
                  {selectedApp.profile?.activity_score || 0}
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-0 px-6" style={{ borderBottom: "1px solid #F0E8E0" }}>
                {["profile", "resume", "answers", "notes"].map(t => (
                  <button key={t} type="button" onClick={() => setActiveTab(t)}
                    className="px-4 py-3 text-[13px] font-semibold capitalize cursor-pointer"
                    style={{
                      color: activeTab === t ? "#E8580A" : "#6B6B6B",
                      borderBottom: activeTab === t ? "2px solid #E8580A" : "2px solid transparent",
                    }}>
                    {t}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="flex-1 overflow-y-auto p-6">
                {activeTab === "profile" && (
                  <div className="space-y-4">
                    {selectedApp.profile?.skills?.length > 0 && (
                      <div>
                        <h4 className="text-[13px] font-semibold mb-2" style={{ color: "#6B6B6B" }}>Skills</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {(selectedApp.profile.skills as string[]).map((s: string) => (
                            <span key={s} className="text-[11px] px-2.5 py-1 rounded-full" style={{ background: "#F3F4F6", color: "#374151" }}>{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="rounded-xl p-4" style={{ background: "#F9FAFB", border: "1px solid #F0E8E0" }}>
                      <p className="text-[13px]" style={{ color: "#6B6B6B" }}>
                        View full profile on Tiikme
                      </p>
                      <Button variant="outline" size="sm" className="mt-2 gap-1.5" onClick={() => navigate(`/app/profile/${selectedApp.profile?.id}`)}>
                        <ExternalLink className="w-3.5 h-3.5" /> View Profile
                      </Button>
                    </div>
                  </div>
                )}

                {activeTab === "resume" && (
                  <div className="space-y-4">
                    {selectedApp.resume_url ? (
                      <div className="rounded-xl p-4" style={{ background: "#F9FAFB", border: "1px solid #F0E8E0" }}>
                        <div className="flex items-center gap-3">
                          <FileText className="w-8 h-8" style={{ color: "#E8580A" }} />
                          <div className="flex-1">
                            <p className="text-[14px] font-semibold" style={{ color: "#1A1A1A" }}>Resume / CV</p>
                            <a href={selectedApp.resume_url} target="_blank" rel="noopener noreferrer" className="text-[13px]" style={{ color: "#E8580A" }}>
                              Open →
                            </a>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[14px] text-center py-8" style={{ color: "#9CA3AF" }}>No resume uploaded</p>
                    )}
                    {selectedApp.portfolio_url && (
                      <div className="rounded-xl p-4" style={{ background: "#F9FAFB", border: "1px solid #F0E8E0" }}>
                        <p className="text-[13px] font-semibold mb-1" style={{ color: "#1A1A1A" }}>Portfolio</p>
                        <a href={selectedApp.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-[13px]" style={{ color: "#E8580A" }}>
                          {selectedApp.portfolio_url}
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "answers" && (
                  <div className="space-y-4">
                    {selectedApp.why_good_fit && (
                      <div className="rounded-xl p-4" style={{ background: "#FFF3EC", border: "1px solid #F0E8E0" }}>
                        <p className="text-[12px] font-bold uppercase mb-2" style={{ color: "#E8580A" }}>Why they're a good fit</p>
                        <p className="text-[14px]" style={{ color: "#1A1A1A" }}>{selectedApp.why_good_fit}</p>
                      </div>
                    )}
                    {selectedApp.cover_letter && (
                      <div className="rounded-xl p-4" style={{ background: "#F9FAFB", border: "1px solid #F0E8E0" }}>
                        <p className="text-[12px] font-bold uppercase mb-2" style={{ color: "#6B6B6B" }}>Cover Letter</p>
                        <p className="text-[14px] whitespace-pre-wrap" style={{ color: "#1A1A1A" }}>{selectedApp.cover_letter}</p>
                      </div>
                    )}
                    {selectedApp.custom_answers && Object.keys(selectedApp.custom_answers).length > 0 && (
                      <div className="space-y-3">
                        <p className="text-[12px] font-bold uppercase" style={{ color: "#6B6B6B" }}>Custom Answers</p>
                        {Object.entries(selectedApp.custom_answers).map(([q, a]) => (
                          <div key={q} className="rounded-xl p-4" style={{ background: "#F9FAFB", border: "1px solid #F0E8E0" }}>
                            <p className="text-[13px] font-semibold mb-1" style={{ color: "#6B6B6B" }}>{q}</p>
                            <p className="text-[14px]" style={{ color: "#1A1A1A" }}>{String(a)}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {!selectedApp.why_good_fit && !selectedApp.cover_letter && (
                      <p className="text-center py-8 text-[14px]" style={{ color: "#9CA3AF" }}>No answers provided</p>
                    )}
                  </div>
                )}

                {activeTab === "notes" && (
                  <div className="space-y-4">
                    {selectedApp.recruiter_notes && (
                      <div className="rounded-xl p-4 whitespace-pre-wrap text-[14px]"
                        style={{ background: "#F9FAFB", border: "1px solid #F0E8E0", color: "#1A1A1A" }}>
                        {selectedApp.recruiter_notes}
                      </div>
                    )}
                    <div className="space-y-2">
                      <textarea value={noteText} onChange={e => setNoteText(e.target.value)}
                        placeholder="Add a private note about this applicant..."
                        rows={3}
                        className="w-full rounded-xl p-3.5 text-[14px] outline-none resize-none"
                        style={{ background: "#F9FAFB", border: "1.5px solid #F0E8E0", color: "#1A1A1A" }} />
                      <Button onClick={handleSaveNote} disabled={savingNote || !noteText.trim()} size="sm"
                        style={{ background: "#E8580A", color: "#fff", borderRadius: 8 }}>
                        {savingNote ? "Saving..." : "Save note"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Action bar */}
              <div className="px-6 py-3 flex gap-2" style={{ borderTop: "1px solid #F0E8E0", background: "#FFFFFF" }}>
                <Button variant="outline" size="sm" onClick={() => handleStatusChange(selectedApp.id, "rejected")}
                  disabled={selectedApp.status === "rejected"}
                  style={{ borderColor: "#E5E7EB", color: "#6B7280", borderRadius: 8 }}>
                  <XCircle className="w-4 h-4 mr-1" /> Reject
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleStatusChange(selectedApp.id, "shortlisted")}
                  disabled={selectedApp.status === "shortlisted"}
                  style={{ borderColor: "#E8580A", color: "#E8580A", borderRadius: 8 }}>
                  <Star className="w-4 h-4 mr-1" /> Shortlist
                </Button>
                <Button size="sm" onClick={() => handleStatusChange(selectedApp.id, "selected")}
                  disabled={selectedApp.status === "selected"}
                  style={{ background: "#16A34A", color: "#fff", borderRadius: 8 }}>
                  <CheckCircle2 className="w-4 h-4 mr-1" /> Select ✓
                </Button>
                <Button variant="outline" size="sm" onClick={async () => {
                  if (!user || !selectedApp?.applicant_id) return;
                  try {
                    const { data: existing } = await supabase.from("conversations")
                      .select("id")
                      .or(`and(participant_1.eq.${user.id},participant_2.eq.${selectedApp.applicant_id}),and(participant_1.eq.${selectedApp.applicant_id},participant_2.eq.${user.id})`)
                      .maybeSingle();
                    if (existing) {
                      navigate(`/app/pings`);
                    } else {
                      await supabase.from("conversations").insert({ participant_1: user.id, participant_2: selectedApp.applicant_id });
                      navigate(`/app/pings`);
                    }
                  } catch { navigate(`/app/pings`); }
                }}
                  style={{ borderColor: "#F0E8E0", color: "#6B6B6B", borderRadius: 8 }}>
                  <MessageSquare className="w-4 h-4 mr-1" /> Contact via Pings
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Selection Confirmation Modal */}
      {showSelectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.5)" }} onClick={() => setShowSelectModal(null)}>
          <div className="rounded-2xl p-6 max-w-[400px] w-full" style={{ background: "#fff" }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="w-12 h-12">
                <AvatarImage src={showSelectModal.profile?.avatar_url ? storageImageUrl(showSelectModal.profile.avatar_url, "thumbnail") : undefined} />
                <AvatarFallback style={{ background: "#FFF3EC", color: "#E8580A" }}>{(showSelectModal.profile?.full_name || "U").substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-[16px] font-bold" style={{ color: "#1A1A1A" }}>{showSelectModal.profile?.full_name}</p>
                <p className="text-[13px]" style={{ color: "#9CA3AF" }}>{showSelectModal.profile?.headline || ""}</p>
              </div>
            </div>
            <label className="text-[13px] font-semibold block mb-1.5" style={{ color: "#1A1A1A" }}>Offer message</label>
            <textarea value={offerMessage} onChange={e => setOfferMessage(e.target.value)} rows={4}
              className="w-full rounded-xl p-3 text-[14px] outline-none resize-none mb-4"
              style={{ background: "#F9FAFB", border: "1.5px solid #F0E8E0", color: "#1A1A1A" }} />
            <Button className="w-full" onClick={confirmSelect} style={{ height: 52, borderRadius: 12, background: "#E8580A", color: "#fff" }}>
              Send Offer & Select
            </Button>
            <button type="button" onClick={() => setShowSelectModal(null)} className="w-full text-center text-[13px] mt-2 cursor-pointer" style={{ color: "#9CA3AF" }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

import { storageImageUrl } from "@/lib/imageTransform";
import { useState, useEffect, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { Search, Briefcase, MapPin, Bookmark, Clock, Plus, Building2, Users as UsersIcon, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import PostOpportunityModal from "@/components/opportunities/PostOpportunityModal";
import ApplyModal from "@/components/opportunities/ApplyModal";
import GlassBox from "@/components/ui/GlassBox";

const typeFilters = ["All", "Full-time", "Internship", "Remote"];
const typeColors: Record<string, string> = { fulltime: "#2563EB", "full-time": "#2563EB", internship: "#7C3AED", parttime: "#C2410C", contract: "#0E7490", volunteer: "#10B981", freelance: "#F59E0B" };

const Opportunities = () => {
  const { user, profile } = useAuth();
  const isInstitution = profile?.account_type === "institution";
  const navigate = useNavigate();
  const [activeType, setActiveType] = useState("All");
  const [search, setSearch] = useState("");
  const [opps, setOpps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [showCreate, setShowCreate] = useState(false);
  const [showApply, setShowApply] = useState<any>(null);
  const [tab, setTab] = useState<"all" | "mine">(isInstitution ? "mine" : "all");

  const fetchOpps = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from("opportunities")
        .select("*, org:organizations!opportunities_org_id_fkey(id, name, logo_url, type, slug)")
        .eq("is_open", true).order("created_at", { ascending: false }).limit(50);
      if (search.trim()) query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
      if (activeType === "Full-time") query = query.or("type.eq.fulltime,type.eq.full-time,type.eq.job");
      else if (activeType === "Internship") query = query.eq("type", "internship");
      else if (activeType === "Remote") query = query.eq("is_remote", true);
      const { data, error } = await query;
      if (error) console.warn("[Opportunities]", error.message);
      setOpps(data || []);
    } catch (e) { console.warn("[Opportunities]", e); }
    setLoading(false);
  }, [search, activeType]);

  useEffect(() => { const t = setTimeout(fetchOpps, 300); return () => clearTimeout(t); }, [fetchOpps]);

  useEffect(() => {
    if (!user) return;
    supabase.from("opportunity_applications").select("opportunity_id").eq("applicant_id", user.id)
      .then(({ data }) => setAppliedIds(new Set((data || []).map((a: any) => a.opportunity_id))));
  }, [user]);

  const toggleSave = (id: string) => {
    setSaved(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
    toast.success(saved.has(id) ? "Removed" : "Saved");
  };

  const myOpps = opps.filter(o => o.poster_id === user?.id);
  const displayOpps = tab === "mine" ? myOpps : opps;
  const daysAgo = (d: string) => { const diff = Math.floor((Date.now() - new Date(d).getTime()) / 86400000); return diff === 0 ? "Today" : `${diff}d ago`; };
  const daysLeft = (d: string) => { const diff = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000); return diff > 0 ? `${diff} days left` : "Expired"; };

  return (
    <main className="max-w-[960px] mx-auto px-4 md:px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div>
          <h1 className="text-[28px] font-bold" style={{ color: "#1A1A1A" }}>Opportunities</h1>
          <p className="text-[14px]" style={{ color: "#9CA3AF" }}>
            {isInstitution ? "Manage your job postings and applications" : "Roles matched to your profile"}
          </p>
        </div>
        {isInstitution && (
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setTab(tab === "mine" ? "all" : "mine")}>
              {tab === "mine" ? "Browse All" : "My Postings"}
            </Button>
            <Button size="sm" onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4 mr-1" /> Post
            </Button>
          </div>
        )}
      </div>

      {/* Filter bar */}
      <div className="sticky top-0 z-10 py-3 flex items-center gap-3 flex-wrap" style={{ background: "linear-gradient(135deg, #FFF8F2, #FFF0E8)" }}>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: "#9CA3AF" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search roles, companies..."
            className="w-full h-[52px] rounded-full pl-12 pr-4 text-[14px] outline-none"
            style={{ background: "rgba(255,255,255,0.72)", border: "1.5px solid rgba(255,255,255,0.9)", color: "#1A1A1A", backdropFilter: "blur(24px)", boxShadow: "0 2px 8px rgba(232,88,10,0.06), 0 8px 32px rgba(0,0,0,0.08)" }} />
        </div>
        <div className="flex gap-1.5">
          {typeFilters.map(f => (
            <button key={f} type="button" onClick={() => setActiveType(f)}
              className="h-9 px-4 rounded-full text-[13px] font-semibold cursor-pointer"
              style={{ background: activeType === f ? "#E8580A" : "rgba(255,255,255,0.72)", color: activeType === f ? "#fff" : "#374151", border: activeType === f ? "none" : "1.5px solid rgba(255,255,255,0.9)" }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Cards */}
      {loading ? (
        <div className="space-y-4 mt-4">{[1,2,3].map(i => (
          <div key={i} className="animate-pulse rounded-xl p-5" style={{ background: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.9)" }}>
            <div className="flex gap-3"><div className="w-12 h-12 rounded-full" style={{ background: "#F3F4F6" }} /><div className="flex-1 space-y-2"><div className="h-5 w-2/3 rounded" style={{ background: "#F3F4F6" }} /><div className="h-4 w-1/3 rounded" style={{ background: "#F3F4F6" }} /></div></div>
          </div>
        ))}</div>
      ) : displayOpps.length === 0 ? (
        <div className="text-center py-16">
          <Briefcase className="w-12 h-12 mx-auto mb-3" style={{ color: "#9CA3AF" }} />
          <p className="text-[16px] font-bold" style={{ color: "#1A1A1A" }}>No opportunities yet</p>
          <p className="text-[13px] mt-1" style={{ color: "#9CA3AF" }}>Check back later</p>
        </div>
      ) : (
        <div className="space-y-3 mt-2">
          {displayOpps.map(o => {
            const orgData = o.org;
            const typeColor = typeColors[o.type || ""] || "#6B7280";
            const applied = appliedIds.has(o.id);
            return (
              <GlassBox key={o.id} accent={typeColor}>
                {/* Top row */}
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-[14px] font-bold shrink-0 overflow-hidden" style={{ background: "#FFF3EC", border: "1.5px solid #F0E8E0" }}>
                    {orgData?.logo_url ? <img src={storageImageUrl(orgData.logo_url, "thumbnail")} alt="" className="w-full h-full object-cover" /> : <Building2 className="w-5 h-5" style={{ color: "#E8580A" }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-semibold" style={{ color: "#1A1A1A" }}>{orgData?.name || "Organization"}</span>
                      {orgData?.type && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#EFF6FF", color: "#1D4ED8" }}>{orgData.type}</span>}
                    </div>
                  </div>
                  <span className="text-[12px] shrink-0" style={{ color: "#9CA3AF" }}>{o.created_at ? daysAgo(o.created_at) : ""}</span>
                </div>

                <h3 className="text-[20px] font-bold mt-2" style={{ color: "#1A1A1A" }}>{o.title}</h3>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full" style={{ background: `${typeColor}14`, color: typeColor }}>{(o.type || "job").replace(/[-_]/g, " ").toUpperCase()}</span>
                  {o.location && <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1" style={{ background: "#F0FDF4", color: "#16A34A" }}><MapPin className="w-3 h-3" />{o.location}</span>}
                  {o.compensation && <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full" style={{ background: "#FFF3EC", color: "#E8580A" }}>{o.compensation}</span>}
                </div>

                {o.description && <p className="text-[14px] mt-2 line-clamp-2" style={{ color: "#4B5563" }}>{o.description}</p>}

                {/* Skills */}
                {o.skills_required?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {(o.skills_required as string[]).slice(0, 5).map((s: string) => (
                      <span key={s} className="text-[11px] px-2.5 py-0.5 rounded-full" style={{ background: "#F3F4F6", color: "#374151" }}>{s}</span>
                    ))}
                    {o.skills_required.length > 5 && <span className="text-[11px] px-2 py-0.5" style={{ color: "#9CA3AF" }}>+{o.skills_required.length - 5}</span>}
                  </div>
                )}

                {/* Bottom */}
                <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: "1px solid rgba(240,232,224,0.5)" }}>
                  <div className="flex items-center gap-3 text-[12px]" style={{ color: "#9CA3AF" }}>
                    <span><UsersIcon className="w-3.5 h-3.5 inline mr-1" />{o.responses_count || 0} applicants</span>
                    {o.deadline && <span><Clock className="w-3.5 h-3.5 inline mr-1" />{daysLeft(o.deadline)}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    {o.poster_id === user?.id ? (
                      <Button onClick={() => navigate(`/app/opportunities/${o.id}/applications`)}
                        variant="outline" style={{ height: 40, borderRadius: 12, borderColor: "#E8580A", color: "#E8580A" }}>
                        <Eye className="w-4 h-4 mr-1" /> {o.responses_count || 0} Applications
                      </Button>
                    ) : (
                      <>
                        <button type="button" onClick={() => toggleSave(o.id)} className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer"
                          style={{ border: "1.5px solid #F0E8E0" }}>
                          <Bookmark className="w-4 h-4" style={{ color: saved.has(o.id) ? "#E8580A" : "#9CA3AF", fill: saved.has(o.id) ? "#E8580A" : "none" }} />
                        </button>
                        {applied ? (
                          <Button disabled style={{ height: 40, borderRadius: 12, background: "#F0FDF4", color: "#16A34A", border: "1.5px solid #16A34A" }}>Applied ✓</Button>
                        ) : (
                          <Button onClick={() => setShowApply(o)} style={{ height: 40, borderRadius: 12, background: "#E8580A", color: "#fff" }}>Apply Now</Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </GlassBox>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {showCreate && <PostOpportunityModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={opp => { if (opp) setOpps(prev => [opp, ...prev]); }} />}
        {showApply && <ApplyModal open={!!showApply} onClose={() => setShowApply(null)} opportunity={showApply} orgName={showApply?.org?.name} onApplied={() => { setAppliedIds(prev => new Set([...prev, showApply.id])); setShowApply(null); }} />}
      </AnimatePresence>
    </main>
  );
};

export default Opportunities;

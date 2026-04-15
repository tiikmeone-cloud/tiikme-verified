import { storageImageUrl } from "@/lib/imageTransform";
import { calculateOpportunityMatch } from "@/lib/algorithms";
import { useState, useEffect, useCallback, useMemo } from "react";
import { PageSEO } from "@/hooks/usePageSEO";
import { AnimatePresence } from "framer-motion";
import { Search, Briefcase, MapPin, Bookmark, Clock, Plus, Building2, Users as UsersIcon, Eye, Trophy, GraduationCap, Code, Zap, Hammer, CalendarDays, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import ApplyModal from "@/components/opportunities/ApplyModal";
import GlassBox from "@/components/ui/GlassBox";

const TYPE_META: Record<string, { label: string; color: string; icon: any }> = {
  full_time: { label: "Full-time", color: "#2563EB", icon: Briefcase },
  fulltime: { label: "Full-time", color: "#2563EB", icon: Briefcase },
  "full-time": { label: "Full-time", color: "#2563EB", icon: Briefcase },
  part_time: { label: "Part-time", color: "#7C3AED", icon: Clock },
  parttime: { label: "Part-time", color: "#7C3AED", icon: Clock },
  internship: { label: "Internship", color: "#10B981", icon: GraduationCap },
  freelance: { label: "Freelance", color: "#F59E0B", icon: Code },
  contract: { label: "Contract", color: "#0E7490", icon: Hammer },
  gig: { label: "Gig", color: "#EC4899", icon: Zap },
  hackathon: { label: "Hackathon", color: "#8B5CF6", icon: Trophy },
  walk_in_interview: { label: "Walk-in", color: "#EF4444", icon: CalendarDays },
  campus_recruitment: { label: "Campus Drive", color: "#14B8A6", icon: GraduationCap },
  apprenticeship: { label: "Apprenticeship", color: "#6366F1", icon: Hammer },
  job: { label: "Job", color: "#2563EB", icon: Briefcase },
  volunteer: { label: "Volunteer", color: "#10B981", icon: UsersIcon },
};

const FILTER_TABS = ["All", "Full-time", "Internship", "Freelance", "Hackathon", "Remote"];
const filterMap: Record<string, (q: any) => any> = {
  "Full-time": q => q.or("type.eq.full_time,type.eq.fulltime,type.eq.full-time,type.eq.job"),
  "Internship": q => q.eq("type", "internship"),
  "Freelance": q => q.or("type.eq.freelance,type.eq.gig"),
  "Hackathon": q => q.eq("type", "hackathon"),
  "Remote": q => q.eq("is_remote", true),
};

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
  const [showApply, setShowApply] = useState<any>(null);
  const [tab, setTab] = useState<"all" | "mine">(isInstitution ? "mine" : "all");

  const fetchOpps = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from("opportunities")
        .select("*, org:organizations!opportunities_org_id_fkey(id, name, logo_url, type, slug, is_verified)")
        .eq("is_open", true).eq("status", "active").order("created_at", { ascending: false }).limit(50);
      if (search.trim()) query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
      if (activeType !== "All" && filterMap[activeType]) query = filterMap[activeType](query);
      const { data, error } = await query;
      if (error) console.warn("[Opportunities]", error.message);

      // Apply client-side opportunity matching
      const scored = (data || []).map((opp: any) => ({
        ...opp,
        _matchScore: profile ? calculateOpportunityMatch({
          opportunity: opp,
          userProfile: {
            skills: profile.skills,
            location_city: profile.location_city,
            sector: profile.sector,
            activity_score: profile.activity_score,
            is_verified: profile.is_verified,
          },
        }) : 0,
      }));
      scored.sort((a: any, b: any) => b._matchScore - a._matchScore);
      setOpps(scored);
    } catch (e) { console.warn("[Opportunities]", e); }
    setLoading(false);
  }, [search, activeType, profile]);

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

  // Smart matching — recommended opps based on skills & score
  const recommended = useMemo(() => {
    if (!profile?.skills?.length || isInstitution) return [];
    const userSkills = new Set((profile.skills as string[]).map(s => s.toLowerCase()));
    return opps
      .filter(o => o.poster_id !== user?.id)
      .map(o => {
        const oppSkills = (o.skills_required || []).map((s: string) => s.toLowerCase());
        const matchCount = oppSkills.filter((s: string) => userSkills.has(s)).length;
        const scoreOk = !o.activity_score_min || (profile.activity_score || 0) >= o.activity_score_min;
        return { ...o, _matchScore: matchCount, _scoreOk: scoreOk };
      })
      .filter(o => o._matchScore > 0 || o._scoreOk)
      .sort((a, b) => b._matchScore - a._matchScore)
      .slice(0, 5);
  }, [opps, profile, user, isInstitution]);

  const myOpps = opps.filter(o => o.poster_id === user?.id);
  const displayOpps = tab === "mine" ? myOpps : opps;
  const daysAgo = (d: string) => { const diff = Math.floor((Date.now() - new Date(d).getTime()) / 86400000); return diff === 0 ? "Today" : `${diff}d ago`; };
  const daysLeft = (d: string) => { const diff = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000); return diff > 0 ? `${diff} days left` : "Expired"; };

  return (
    <main className="max-w-[960px] mx-auto px-4 md:px-6 py-6">
      <PageSEO
        title="Opportunities | Tiikme"
        description="Browse verified jobs, internships, hackathons, and freelance opportunities across India. Apply on Tiikme."
        canonical="https://tiikme.in/app/opportunities"
      />
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div>
          <h1 className="text-[28px] font-bold" style={{ color: "var(--text-1)" }}>Opportunities</h1>
          <p className="text-[14px]" style={{ color: "var(--text-3)" }}>
            {isInstitution ? "Manage your job postings and applications" : "Roles matched to your profile"}
          </p>
        </div>
        {isInstitution && (
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setTab(tab === "mine" ? "all" : "mine")}>
              {tab === "mine" ? "Browse All" : "My Postings"}
            </Button>
            <Button size="sm" onClick={() => navigate("/app/opportunities/create")}>
              <Plus className="w-4 h-4 mr-1" /> Post
            </Button>
          </div>
        )}
      </div>

      {/* Filter bar */}
      <div className="sticky top-0 z-10 py-3 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: "var(--text-3)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search roles, companies..."
            className="w-full h-[48px] rounded-[20px] pl-12 pr-4 text-[14px] outline-none transition-all duration-200 glass-input" />
        </div>
        <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {FILTER_TABS.map(f => (
            <button key={f} type="button" onClick={() => setActiveType(f)}
              className="h-9 px-5 rounded-[20px] text-[13px] font-semibold cursor-pointer transition-all duration-200 shrink-0 btn-glass-pill"
              style={activeType === f
                ? { background: "linear-gradient(135deg, #E8733A, #FF6B9D)", color: "#fff", border: "none", boxShadow: "0 4px 16px rgba(232,115,58,0.30)" }
                : {}
              }>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Recommended Section */}
      {recommended.length > 0 && tab === "all" && !search.trim() && activeType === "All" && (
        <div className="mb-6">
          <h2 className="text-[16px] font-bold mb-3 flex items-center gap-2" style={{ color: "var(--text-1)" }}>
            <Zap className="w-4 h-4" style={{ color: "#F59E0B" }} /> Recommended for You
          </h2>
          <div className="space-y-3">
            {recommended.map(o => <OpportunityCard key={`rec-${o.id}`} o={o} user={user} appliedIds={appliedIds} saved={saved} onSave={toggleSave} onApply={setShowApply} navigate={navigate} daysAgo={daysAgo} daysLeft={daysLeft} />)}
          </div>
        </div>
      )}

      {/* Cards */}
      {loading ? (
        <div className="space-y-4 mt-4">{[1,2,3].map(i => (
          <div key={i} className="animate-pulse rounded-xl p-5 glass-light" style={{ minHeight: 120 }}>
            <div className="flex gap-3"><div className="w-11 h-11 rounded-xl" style={{ background: "var(--surface-2)" }} /><div className="flex-1 space-y-2"><div className="h-5 w-2/3 rounded" style={{ background: "var(--surface-2)" }} /><div className="h-4 w-1/3 rounded" style={{ background: "var(--surface-2)" }} /></div></div>
          </div>
        ))}</div>
      ) : displayOpps.length === 0 ? (
        <div className="text-center py-16">
          <Briefcase className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--text-3)" }} />
          <p className="text-[16px] font-bold" style={{ color: "var(--text-1)" }}>No opportunities yet</p>
          <p className="text-[13px] mt-1" style={{ color: "var(--text-3)" }}>Check back later</p>
        </div>
      ) : (
        <>
          {recommended.length > 0 && tab === "all" && !search.trim() && activeType === "All" && (
            <h2 className="text-[16px] font-bold mb-3" style={{ color: "var(--text-1)" }}>All Opportunities</h2>
          )}
          <div className="space-y-3">
            {displayOpps.map(o => <OpportunityCard key={o.id} o={o} user={user} appliedIds={appliedIds} saved={saved} onSave={toggleSave} onApply={setShowApply} navigate={navigate} daysAgo={daysAgo} daysLeft={daysLeft} />)}
          </div>
        </>
      )}

      <AnimatePresence>
        {showApply && <ApplyModal open={!!showApply} onClose={() => setShowApply(null)} opportunity={showApply} orgName={showApply?.org?.name} onApplied={() => { setAppliedIds(prev => new Set([...prev, showApply.id])); setShowApply(null); }} />}
      </AnimatePresence>
    </main>
  );
};

/* ─── Opportunity Card Component ─── */
function OpportunityCard({ o, user, appliedIds, saved, onSave, onApply, navigate, daysAgo, daysLeft }: any) {
  const orgData = o.org;
  const meta = TYPE_META[o.type || "job"] || TYPE_META.job;
  const TypeIcon = meta.icon;
  const applied = appliedIds.has(o.id);

  return (
    <GlassBox accent={meta.color}>
      {/* Top row */}
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-[13px] font-bold shrink-0 overflow-hidden" style={{ background: "var(--surface-2)", border: "1.5px solid var(--border)" }}>
          {orgData?.logo_url ? <img src={storageImageUrl(orgData.logo_url, "thumbnail")} alt="" className="w-full h-full object-cover" /> : <Building2 className="w-5 h-5" style={{ color: meta.color }} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-semibold" style={{ color: "var(--text-1)" }}>{orgData?.name || "Organization"}</span>
            {orgData?.is_verified && <Shield className="w-3.5 h-3.5" style={{ color: "#10B981" }} />}
          </div>
        </div>
        <span className="text-[11px] shrink-0" style={{ color: "var(--text-3)" }}>{o.created_at ? daysAgo(o.created_at) : ""}</span>
      </div>

      <h3 className="text-[16px] font-bold mt-2" style={{ color: "var(--text-1)" }}>{o.title}</h3>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mt-2">
        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1" style={{ background: `${meta.color}14`, color: meta.color }}>
          <TypeIcon className="w-3 h-3" />{meta.label}
        </span>
        {o.location && <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1" style={{ background: "#F0FDF4", color: "#16A34A" }}><MapPin className="w-3 h-3" />{o.location}</span>}
        {o.is_remote && <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full" style={{ background: "#EFF6FF", color: "#2563EB" }}>Remote</span>}
        {o.compensation && <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full" style={{ background: "#FFF3EC", color: "#E8580A" }}>{o.compensation}</span>}
        {o.activity_score_min > 0 && <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full" style={{ background: "#FEF3C7", color: "#D97706" }}>Score: {o.activity_score_min}+</span>}
      </div>

      {o.description && <p className="text-[13px] mt-2 line-clamp-2" style={{ color: "var(--text-2)" }}>{o.description}</p>}

      {/* Skills */}
      {o.skills_required?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {(o.skills_required as string[]).slice(0, 4).map((s: string) => (
            <span key={s} className="text-[11px] px-2.5 py-0.5 rounded-full" style={{ background: "var(--surface-2)", color: "var(--text-2)" }}>{s}</span>
          ))}
          {o.skills_required.length > 4 && <span className="text-[11px] px-2 py-0.5" style={{ color: "var(--text-3)" }}>+{o.skills_required.length - 4}</span>}
        </div>
      )}

      {/* Bottom */}
      <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="flex items-center gap-3 text-[12px]" style={{ color: "var(--text-3)" }}>
          <span><UsersIcon className="w-3.5 h-3.5 inline mr-1" />{o.responses_count || 0} applicants</span>
          {o.deadline && <span><Clock className="w-3.5 h-3.5 inline mr-1" />{daysLeft(o.deadline)}</span>}
        </div>
        <div className="flex items-center gap-2">
          {o.poster_id === user?.id ? (
            <Button onClick={() => navigate(`/app/opportunities/${o.id}/applications`)}
              variant="outline" style={{ height: 40, borderRadius: 12, borderColor: "var(--brand)", color: "var(--brand)" }}>
              <Eye className="w-4 h-4 mr-1" /> {o.responses_count || 0} Applications
            </Button>
          ) : (
            <>
              <button type="button" onClick={() => onSave(o.id)} className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer"
                style={{ border: "1.5px solid var(--border)" }}>
                <Bookmark className="w-4 h-4" style={{ color: saved.has(o.id) ? "#E8580A" : "var(--text-3)", fill: saved.has(o.id) ? "#E8580A" : "none" }} />
              </button>
              {applied ? (
                <Button disabled style={{ height: 40, borderRadius: 12, background: "#F0FDF4", color: "#16A34A", border: "1.5px solid #16A34A" }}>Applied ✓</Button>
              ) : (
                <Button onClick={() => onApply(o)} className="btn-liquid-primary" style={{ height: 40, borderRadius: 12 }}>Apply Now</Button>
              )}
            </>
          )}
        </div>
      </div>
    </GlassBox>
  );
}

export default Opportunities;

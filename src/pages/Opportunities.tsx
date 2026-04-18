import { storageImageUrl } from "@/lib/imageTransform";
import SubscriptionGate from "@/components/SubscriptionGate";
import { calculateOpportunityMatch } from "@/lib/algorithms";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PageSEO } from "@/hooks/usePageSEO";
import { AnimatePresence } from "framer-motion";
import { Search, Briefcase, MapPin, Bookmark, Clock, Plus, Building2, Users as UsersIcon, Eye, Trophy, GraduationCap, Code, Zap, Hammer, CalendarDays, Shield, Heart, MessageCircle, Link2, Send, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import ApplyModal from "@/components/opportunities/ApplyModal";
import GlassBox from "@/components/ui/GlassBox";
import FindTab from "@/components/opportunities/FindTab";
import ReferModal from "@/components/opportunities/ReferModal";
import ReferralsTab from "@/components/opportunities/ReferralsTab";
import AvatarSquare from "@/components/ui/AvatarSquare";

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

type UserTab = "jobs" | "find" | "referrals" | "applications";
type OrgTab = "post" | "listings" | "talent";

function expiryBadge(d: string | null) {
  if (!d) return null;
  const diff = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
  if (diff <= 0) return { label: "Expired", bg: "rgba(239,68,68,0.12)", color: "#EF4444" };
  if (diff <= 3) return { label: `${diff}d left`, bg: "rgba(239,68,68,0.12)", color: "#EF4444" };
  if (diff <= 7) return { label: `${diff}d left`, bg: "rgba(255,184,0,0.12)", color: "#FFB800" };
  return { label: `${diff}d left`, bg: "rgba(52,199,89,0.12)", color: "#34C759" };
}

const Opportunities = () => {
  const { user, profile } = useAuth();
  const isInstitution = profile?.account_type === "institution";
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeType, setActiveType] = useState("All");
  const [search, setSearch] = useState("");
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [showApply, setShowApply] = useState<any>(null);
  const [userTab, setUserTab] = useState<UserTab>("jobs");
  const [orgTab, setOrgTab] = useState<OrgTab>("listings");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const t = searchParams.get("tab");
    if (t === "referrals") setUserTab("referrals");
    else if (t === "find") setUserTab("find");
    else if (t === "applications") setUserTab("applications");
  }, [searchParams]);

  useEffect(() => { const t = setTimeout(() => setDebouncedSearch(search), 300); return () => clearTimeout(t); }, [search]);

  const fetchOppsData = useCallback(async () => {
    await supabase
      .from("opportunities")
      .update({ is_expired: true, is_open: false } as any)
      .lt("expires_at", new Date().toISOString())
      .eq("is_expired", false)
      .not("expires_at", "is", null);

    let query = supabase.from("opportunities")
      .select("*, org:organizations!opportunities_org_id_fkey(id, name, logo_url, type, slug, is_verified)")
      .eq("is_open", true).eq("status", "active").order("created_at", { ascending: false }).limit(50);
    if (debouncedSearch.trim()) query = query.or(`title.ilike.%${debouncedSearch}%,description.ilike.%${debouncedSearch}%`);
    if (activeType !== "All" && filterMap[activeType]) query = filterMap[activeType](query);
    const { data } = await query;

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
    return scored;
  }, [debouncedSearch, activeType, profile]);

  const { data: opps = [], isLoading: loading } = useQuery({
    queryKey: ["opportunities", debouncedSearch, activeType],
    queryFn: fetchOppsData,
    staleTime: 3 * 60 * 1000,
  });

  const { data: appliedIds = new Set<string>() } = useQuery({
    queryKey: ["applied-opportunities", user?.id],
    queryFn: async () => {
      if (!user) return new Set<string>();
      const { data } = await supabase.from("opportunity_applications").select("opportunity_id").eq("applicant_id", user.id);
      return new Set((data || []).map((a: any) => a.opportunity_id));
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const toggleSave = (id: string) => {
    setSaved(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
    toast.success(saved.has(id) ? "Removed" : "Saved");
  };

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
  const daysAgo = (d: string) => { const diff = Math.floor((Date.now() - new Date(d).getTime()) / 86400000); return diff === 0 ? "Today" : `${diff}d ago`; };
  const daysLeft = (d: string) => { const diff = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000); return diff > 0 ? `${diff} days left` : "Expired"; };

  const cardProps = { user, profile, isInstitution, appliedIds, saved, onSave: toggleSave, onApply: setShowApply, navigate, daysAgo, daysLeft };

  return (
    <SubscriptionGate feature="opportunities">
    <main className="max-w-[960px] mx-auto px-4 md:px-6 py-6">
      <PageSEO
        title="Opportunities | Tiikme"
        description="Browse verified jobs, internships, hackathons, and freelance opportunities across India. Apply on Tiikme."
        canonical="https://tiikme.in/app/opportunities"
      />
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="text-[28px] font-bold" style={{ color: "var(--text-1)" }}>Opportunities</h1>
          <p className="text-[14px]" style={{ color: "var(--text-3)" }}>
            {isInstitution ? "Manage your job postings and find talent" : "Roles matched to your profile"}
          </p>
        </div>
      </div>

      {/* USER TAB BAR */}
      {!isInstitution && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-4 pb-1">
          {(["jobs", "find", "referrals", "applications"] as UserTab[]).map(t => {
            const labels: Record<UserTab, string> = { jobs: "Jobs", find: "Find", referrals: "Referrals", applications: "My Applications" };
            return (
              <button key={t} type="button" onClick={() => setUserTab(t)}
                className="shrink-0 cursor-pointer transition-all"
                style={{
                  height: 36, padding: "0 20px", borderRadius: 20, fontSize: 13, fontWeight: 600,
                  ...(userTab === t
                    ? { background: "linear-gradient(135deg, #E8733A, #FF6B9D)", color: "#fff", border: "none", boxShadow: "0 4px 16px rgba(232,115,58,0.30)" }
                    : { background: "rgba(255,255,255,0.20)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.25)", color: "#1A1A2E" }),
                }}>
                {labels[t]}
              </button>
            );
          })}
        </div>
      )}

      {/* ORG TAB BAR */}
      {isInstitution && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-4 pb-1">
          {(["post", "listings", "talent"] as OrgTab[]).map(t => {
            const labels: Record<OrgTab, string> = { post: "Post Job", listings: "My Job List", talent: "Find Talent" };
            return (
              <button key={t} type="button" onClick={() => setOrgTab(t)}
                className="shrink-0 cursor-pointer transition-all"
                style={{
                  height: 36, padding: "0 20px", borderRadius: 20, fontSize: 13, fontWeight: 600,
                  ...(orgTab === t
                    ? { background: "linear-gradient(135deg, #E8733A, #FF6B9D)", color: "#fff", border: "none", boxShadow: "0 4px 16px rgba(232,115,58,0.30)" }
                    : { background: "rgba(255,255,255,0.20)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.25)", color: "#1A1A2E" }),
                }}>
                {labels[t]}
              </button>
            );
          })}
        </div>
      )}

      {/* USER: JOBS TAB */}
      {!isInstitution && userTab === "jobs" && (
        <>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-3" style={{ scrollbarWidth: "none" }}>
            {FILTER_TABS.map(f => (
              <button key={f} type="button" onClick={() => setActiveType(f)}
                className="h-8 px-4 rounded-full text-[12px] font-semibold cursor-pointer transition-all shrink-0 btn-glass-pill"
                style={activeType === f ? { background: "#E8733A", color: "#fff", border: "none" } : {}}>
                {f}
              </button>
            ))}
          </div>
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-3)" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search roles, companies..."
              className="w-full h-11 rounded-2xl pl-11 pr-4 text-[14px] outline-none glass-input" />
          </div>

          {recommended.length > 0 && !search.trim() && activeType === "All" && (
            <div className="mb-6">
              <h2 className="text-[16px] font-bold mb-3 flex items-center gap-2" style={{ color: "var(--text-1)" }}>
                <Zap className="w-4 h-4" style={{ color: "#F59E0B" }} /> Recommended for You
              </h2>
              <div className="space-y-3">
                {recommended.map(o => <OpportunityCard key={`rec-${o.id}`} o={o} {...cardProps} />)}
              </div>
            </div>
          )}

          {loading && !opps.length ? (
            <div className="space-y-4 mt-4">{[1,2,3].map(i => (
              <div key={i} className="animate-pulse rounded-xl p-5 glass-light" style={{ minHeight: 120 }}>
                <div className="flex gap-3"><div className="w-11 h-11 rounded-xl" style={{ background: "var(--surface-2)" }} /><div className="flex-1 space-y-2"><div className="h-5 w-2/3 rounded" style={{ background: "var(--surface-2)" }} /><div className="h-4 w-1/3 rounded" style={{ background: "var(--surface-2)" }} /></div></div>
              </div>
            ))}</div>
          ) : opps.length === 0 ? (
            <div className="text-center py-16">
              <Briefcase className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--text-3)" }} />
              <p className="text-[16px] font-bold" style={{ color: "var(--text-1)" }}>No opportunities yet</p>
              <p className="text-[13px] mt-1" style={{ color: "var(--text-3)" }}>Check back later</p>
            </div>
          ) : (
            <div className="space-y-3">
              {opps.map(o => <OpportunityCard key={o.id} o={o} {...cardProps} />)}
            </div>
          )}
        </>
      )}

      {!isInstitution && userTab === "find" && <FindTab />}
      {!isInstitution && userTab === "referrals" && <ReferralsTab />}
      {!isInstitution && userTab === "applications" && <MyApplicationsTab userId={user?.id} />}

      {/* ORG: POST */}
      {isInstitution && orgTab === "post" && (
        <div className="text-center py-12">
          <Button onClick={() => navigate("/app/opportunities/create")}
            className="btn-liquid-primary h-12 px-8 rounded-2xl text-[15px] font-bold">
            <Plus className="w-5 h-5 mr-2" /> Create New Job Posting
          </Button>
        </div>
      )}

      {/* ORG: LISTINGS */}
      {isInstitution && orgTab === "listings" && (
        <div className="space-y-3">
          {loading && !opps.length ? (
            [1,2,3].map(i => <div key={i} className="animate-pulse glass-light rounded-xl" style={{ height: 120 }} />)
          ) : myOpps.length === 0 ? (
            <div className="text-center py-16">
              <Briefcase className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--text-3)" }} />
              <p className="text-[16px] font-bold" style={{ color: "#1A1A2E" }}>No active postings</p>
              <button type="button" onClick={() => setOrgTab("post")} className="mt-3 text-[13px] font-semibold cursor-pointer"
                style={{ color: "#E8733A", background: "none", border: "none" }}>Post your first job →</button>
            </div>
          ) : myOpps.map(o => <OpportunityCard key={o.id} o={o} {...cardProps} />)}
        </div>
      )}

      {/* ORG: FIND TALENT */}
      {isInstitution && orgTab === "talent" && <FindTalentTab />}

      <AnimatePresence>
        {showApply && <ApplyModal open={!!showApply} onClose={() => setShowApply(null)} opportunity={showApply} orgName={showApply?.org?.name} onApplied={() => { queryClient.invalidateQueries({ queryKey: ["applied-opportunities"] }); queryClient.invalidateQueries({ queryKey: ["opportunities"] }); setShowApply(null); }} />}
      </AnimatePresence>
    </main>
    </SubscriptionGate>
  );
};

/* ─── Opportunity Card Component ─── */
function OpportunityCard({ o, user, profile, isInstitution, appliedIds, saved, onSave, onApply, navigate, daysAgo, daysLeft }: any) {
  const orgData = o.org;
  const meta = TYPE_META[o.type || "job"] || TYPE_META.job;
  const TypeIcon = meta.icon;
  const applied = appliedIds.has(o.id);

  // Engagement state
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");
  const [showRefer, setShowRefer] = useState(false);
  const [referrers, setReferrers] = useState<any[]>([]);

  useEffect(() => {
    if (!o.id) return;
    let cancelled = false;
    (async () => {
      const [likeCountRes, likedRes, commentCountRes, referralsRes] = await Promise.all([
        supabase.from("opportunity_likes").select("*", { count: "exact", head: true }).eq("opportunity_id", o.id),
        user?.id ? supabase.from("opportunity_likes").select("id").eq("opportunity_id", o.id).eq("user_id", user.id).maybeSingle() : Promise.resolve({ data: null }),
        supabase.from("opportunity_comments").select("*", { count: "exact", head: true }).eq("opportunity_id", o.id),
        supabase.from("opportunity_referrals").select("referrer_id").eq("opportunity_id", o.id).limit(5),
      ]);
      if (cancelled) return;
      setLikeCount(likeCountRes.count || 0);
      setLiked(!!likedRes.data);
      setCommentCount(commentCountRes.count || 0);

      // Fetch referrer profiles
      const refData = (referralsRes as any).data || [];
      if (refData.length > 0) {
        const refIds = [...new Set(refData.map((r: any) => r.referrer_id))];
        const { data: profs } = await supabase.from("profiles").select("id, full_name, avatar_url").in("id", refIds as string[]);
        if (!cancelled) setReferrers(profs || []);
      }
    })();
    return () => { cancelled = true; };
  }, [o.id, user?.id]);

  const toggleLike = async () => {
    if (!user?.id) return;
    if (liked) {
      setLiked(false); setLikeCount(p => Math.max(0, p - 1));
      const { error } = await supabase.from("opportunity_likes").delete().eq("opportunity_id", o.id).eq("user_id", user.id);
      if (error) { setLiked(true); setLikeCount(p => p + 1); }
    } else {
      setLiked(true); setLikeCount(p => p + 1);
      const { error } = await supabase.from("opportunity_likes").insert({ opportunity_id: o.id, user_id: user.id } as any);
      if (error) { setLiked(false); setLikeCount(p => Math.max(0, p - 1)); }
    }
  };

  const loadComments = async () => {
    const { data } = await supabase
      .from("opportunity_comments")
      .select("id, content, user_id, created_at")
      .eq("opportunity_id", o.id)
      .order("created_at", { ascending: true })
      .limit(20);
    if (data?.length) {
      const uids = [...new Set(data.map(c => c.user_id))];
      const { data: profs } = await supabase.from("profiles").select("id, full_name, avatar_url").in("id", uids);
      const profMap: Record<string, any> = {};
      for (const p of profs || []) profMap[p.id] = p;
      setComments(data.map(c => ({ ...c, author: profMap[c.user_id] })));
    } else {
      setComments([]);
    }
  };

  const toggleComments = async () => {
    if (!showComments) await loadComments();
    setShowComments(p => !p);
  };

  const submitComment = async () => {
    if (!user?.id || !commentText.trim()) return;
    const { data, error } = await supabase.from("opportunity_comments")
      .insert({ opportunity_id: o.id, user_id: user.id, content: commentText.trim() } as any)
      .select("id, content, user_id, created_at")
      .single();
    if (error) { toast.error(error.message); return; }
    setComments(prev => [...prev, { ...data, author: { id: user.id, full_name: profile?.full_name, avatar_url: profile?.avatar_url } }]);
    setCommentCount(p => p + 1);
    setCommentText("");
  };

  const handleRefer = () => {
    if (isInstitution) {
      setShowRefer(true);
    } else {
      const url = `${window.location.origin}/app/opportunities`;
      navigator.clipboard.writeText(url);
      toast.success("Link copied! Share with your connections.");
    }
  };

  return (
    <>
      <GlassBox accent={meta.color}>
        {/* Top row */}
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-[13px] font-bold shrink-0 overflow-hidden" style={{ background: "var(--surface-2)", border: "1.5px solid var(--border)" }}>
            {orgData?.logo_url ? <img src={storageImageUrl(orgData.logo_url, "thumbnail")} alt="" loading="lazy" className="w-full h-full object-cover" /> : <Building2 className="w-5 h-5" style={{ color: meta.color }} />}
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
          {(() => {
            const eb = expiryBadge(o.expires_at);
            return eb ? <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1" style={{ background: eb.bg, color: eb.color }}><Clock className="w-3 h-3" />{eb.label}</span> : null;
          })()}
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

        {/* Referrer avatars */}
        {referrers.length > 0 && (
          <div className="flex items-center gap-1.5 mt-2">
            <span className="text-[11px]" style={{ color: "var(--text-3)" }}>Referred by</span>
            <div className="flex -space-x-1.5">
              {referrers.slice(0, 3).map(r => (
                <div key={r.id} className="cursor-pointer" onClick={() => navigate(`/app/profile/${r.id}`)} title={r.full_name}>
                  <AvatarSquare src={r.avatar_url} name={r.full_name || "U"} size={20} />
                </div>
              ))}
            </div>
            {referrers.length === 1 && <span className="text-[11px] font-medium" style={{ color: "var(--text-2)" }}>{referrers[0].full_name}</span>}
          </div>
        )}

        {/* Engagement row */}
        <div className="flex items-center gap-4 mt-3 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
          <button type="button" onClick={toggleLike} className="flex items-center gap-1.5 cursor-pointer active:scale-95" style={{ background: "none", border: "none" }}>
            <Heart className="w-4 h-4" style={{ color: liked ? "#EF4444" : "var(--text-3)", fill: liked ? "#EF4444" : "none", transition: "all 150ms" }} />
            <span className="text-[12px] font-semibold" style={{ color: liked ? "#EF4444" : "var(--text-3)" }}>{likeCount || ""}</span>
          </button>
          <button type="button" onClick={toggleComments} className="flex items-center gap-1.5 cursor-pointer active:scale-95" style={{ background: "none", border: "none" }}>
            <MessageCircle className="w-4 h-4" style={{ color: showComments ? "#E8733A" : "var(--text-3)", transition: "all 150ms" }} />
            <span className="text-[12px] font-semibold" style={{ color: showComments ? "#E8733A" : "var(--text-3)" }}>{commentCount || ""}</span>
          </button>
          <button type="button" onClick={handleRefer} className="flex items-center gap-1.5 cursor-pointer active:scale-95" style={{ background: "none", border: "none" }}>
            <Link2 className="w-4 h-4" style={{ color: "var(--text-3)" }} />
            <span className="text-[12px] font-semibold" style={{ color: "var(--text-3)" }}>Refer</span>
          </button>
        </div>

        {/* Comments section */}
        {showComments && (
          <div className="mt-2 pt-2 space-y-2" style={{ borderTop: "1px solid var(--border)" }}>
            {comments.map(c => (
              <div key={c.id} className="flex items-start gap-2">
                <AvatarSquare src={c.author?.avatar_url} name={c.author?.full_name || "U"} size={24} />
                <div className="flex-1 min-w-0">
                  <span className="text-[12px] font-semibold" style={{ color: "var(--text-1)" }}>{c.author?.full_name || "User"}</span>
                  <p className="text-[12px]" style={{ color: "var(--text-2)" }}>{c.content}</p>
                </div>
              </div>
            ))}
            {user && (
              <div className="flex items-center gap-2">
                <input value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Add a comment..."
                  className="flex-1 h-8 rounded-lg px-3 text-[12px] outline-none glass-input"
                  onKeyDown={e => { if (e.key === "Enter" && commentText.trim()) submitComment(); }} />
                <button type="button" onClick={submitComment} disabled={!commentText.trim()}
                  className="w-7 h-7 rounded-full flex items-center justify-center cursor-pointer active:scale-95 disabled:opacity-40"
                  style={{ background: commentText.trim() ? "#E8733A" : "var(--surface-2)" }}>
                  <Send className="w-3 h-3" style={{ color: commentText.trim() ? "white" : "var(--text-3)" }} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Bottom actions */}
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
                  <Button disabled style={{ height: 40, borderRadius: 12, background: "#F0FDF4", color: "#16A34A", border: "1.5px solid #16A34A" }}>Applied</Button>
                ) : (
                  <Button onClick={() => onApply(o)} className="btn-liquid-primary" style={{ height: 40, borderRadius: 12 }}>Apply Now</Button>
                )}
              </>
            )}
          </div>
        </div>
      </GlassBox>

      {showRefer && <ReferModal open={showRefer} onClose={() => setShowRefer(false)} opportunity={o} />}
    </>
  );
}

/* ─── My Applications Tab ─── */
function MyApplicationsTab({ userId }: { userId: string | undefined }) {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    supabase.from("opportunity_applications")
      .select("id, status, created_at, opportunity:opportunities(id, title, type, location, org:organizations!opportunities_org_id_fkey(name, logo_url))")
      .eq("applicant_id", userId)
      .order("created_at", { ascending: false })
      .then(({ data }) => { setApplications(data || []); setLoading(false); });
  }, [userId]);

  const statusColors: Record<string, { bg: string; color: string; label: string }> = {
    under_review: { bg: "rgba(255,184,0,0.12)", color: "#FFB800", label: "Under Review" },
    qualified: { bg: "rgba(16,185,129,0.12)", color: "#10B981", label: "Qualified" },
    shortlisted: { bg: "rgba(59,130,246,0.12)", color: "#3B82F6", label: "Shortlisted" },
    offered: { bg: "rgba(52,199,89,0.12)", color: "#34C759", label: "Offered" },
    rejected: { bg: "rgba(239,68,68,0.10)", color: "#EF4444", label: "Not Selected" },
  };

  if (loading) return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="animate-pulse glass-light rounded-xl" style={{ height: 80 }} />)}</div>;
  if (applications.length === 0) return (
    <div className="text-center py-16">
      <Briefcase className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--text-3)" }} />
      <p className="text-[16px] font-bold" style={{ color: "#1A1A2E" }}>No applications yet</p>
      <p className="text-[13px] mt-1" style={{ color: "#6B7094" }}>Apply to jobs and track your status here</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {applications.map((app: any) => {
        const s = statusColors[app.status] || statusColors.under_review;
        const opp = app.opportunity;
        return (
          <div key={app.id} className="glass-card" style={{ padding: 14, borderRadius: 14 }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center"
                style={{ background: "var(--surface-2)", border: "1.5px solid var(--border)", flexShrink: 0 }}>
                {opp?.org?.logo_url
                  ? <img src={opp.org.logo_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                  : <Building2 className="w-5 h-5" style={{ color: "#6B7094" }} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate" style={{ fontSize: 14, color: "#1A1A2E" }}>{opp?.title || "Opportunity"}</p>
                <p className="text-[12px] truncate" style={{ color: "#6B7094" }}>{opp?.org?.name || "—"}</p>
              </div>
              <span className="text-[11px] font-semibold px-3 py-1 rounded-full shrink-0"
                style={{ background: s.bg, color: s.color }}>{s.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Find Talent Tab ─── */
function FindTalentTab() {
  const [talent, setTalent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.from("profiles")
      .select("id, full_name, avatar_url, role, headline, location_city, skills, activity_score")
      .eq("open_to_work", true)
      .eq("is_public", true)
      .order("activity_score", { ascending: false })
      .limit(30)
      .then(({ data }) => { setTalent(data || []); setLoading(false); });
  }, []);

  if (loading) return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="animate-pulse glass-light rounded-xl" style={{ height: 64 }} />)}</div>;
  if (talent.length === 0) return (
    <div className="text-center py-16">
      <UsersIcon className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--text-3)" }} />
      <p className="text-[14px]" style={{ color: "#6B7094" }}>No candidates marked open to work yet</p>
    </div>
  );

  return (
    <div className="space-y-2">
      {talent.map((p: any) => (
        <div key={p.id} className="glass-card flex items-center gap-3 cursor-pointer"
          style={{ padding: 12, borderRadius: 12 }}
          onClick={() => navigate(`/app/profile/${p.id}`)}>
          <AvatarSquare src={p.avatar_url} name={p.full_name || "U"} size={44} />
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate" style={{ fontSize: 14, color: "#1A1A2E" }}>{p.full_name}</p>
            <p className="text-[12px] truncate" style={{ color: "#6B7094" }}>{p.headline || p.role}</p>
            {p.location_city && <p className="text-[11px]" style={{ color: "#9CA3C0" }}>{p.location_city}</p>}
          </div>
          <span className="text-[11px] font-semibold px-2 py-1 rounded-full shrink-0"
            style={{ background: "rgba(52,199,89,0.10)", color: "#34C759" }}>Open</span>
        </div>
      ))}
    </div>
  );
}

export default Opportunities;

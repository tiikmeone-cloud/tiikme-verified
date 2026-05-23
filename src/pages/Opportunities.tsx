import SubscriptionGate from "@/components/SubscriptionGate";
import { calculateOpportunityMatch } from "@/lib/algorithms";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PageSEO } from "@/hooks/usePageSEO";
import { AnimatePresence } from "framer-motion";
import { Search, Briefcase, Plus, Building2, Users as UsersIcon, Trophy, GraduationCap, Code, Zap, Hammer, CalendarDays, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import ApplyModal from "@/components/opportunities/ApplyModal";
import FindTab from "@/components/opportunities/FindTab";
import ReferralsTab from "@/components/opportunities/ReferralsTab";
import { OpportunityCard as SharedOpportunityCard } from "@/components/opportunities/OpportunityCard";
import AvatarSquare from "@/components/ui/AvatarSquare";
import PrimaryTabs from "@/components/filters/PrimaryTabs";
import FilterBar, { useScrollPastThreshold } from "@/components/filters/FilterBar";
import BottomSheet from "@/components/ui/BottomSheet";

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

const Opportunities = () => {
  const { user, profile } = useAuth();
  const isInstitution = profile?.account_type === "institution";
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeType, setActiveType] = useState("All");
  const [search, setSearch] = useState("");
  const [showApply, setShowApply] = useState<any>(null);
  const [userTab, setUserTab] = useState<UserTab>("jobs");
  const [orgTab, setOrgTab] = useState<OrgTab>("listings");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchParams] = useSearchParams();
  const targetOppId = searchParams.get("opp");
  const scrolledRef = useRef(false);

  useEffect(() => {
    const t = searchParams.get("tab");
    if (t === "referrals") setUserTab("referrals");
    else if (t === "find") setUserTab("find");
    else if (t === "applications") setUserTab("applications");
  }, [searchParams]);

  useEffect(() => { const t = setTimeout(() => setDebouncedSearch(search), 300); return () => clearTimeout(t); }, [search]);

  const fetchOppsData = useCallback(async () => {
    // NOTE: expiry is handled server-side via DB trigger/cron, not here.
    const today = new Date().toISOString().slice(0, 10);
    let query = supabase.from("opportunities")
      .select("*, org:organizations!opportunities_org_id_fkey(id, name, logo_url, type, slug, is_verified)")
      .eq("is_open", true).eq("status", "active")
      .or("is_expired.is.null,is_expired.eq.false")
      .or(`deadline.is.null,deadline.gte.${today}`)
      .order("created_at", { ascending: false }).limit(50);
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

  useEffect(() => {
    if (!targetOppId || scrolledRef.current) return;
    const el = document.getElementById(`opportunity-${targetOppId}`);
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      el.style.transition = "box-shadow 600ms";
      el.style.boxShadow = "0 0 0 2px #E8733A, 0 1px 4px rgba(0,0,0,0.04)";
      setTimeout(() => { el.style.boxShadow = ""; }, 1800);
      scrolledRef.current = true;
    });
  }, [targetOppId, opps]);

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
  return (
    <SubscriptionGate feature="opportunities">
    <main className="max-w-[960px] mx-auto px-4 md:px-6 py-6">
      <PageSEO
        title="Opportunities | Tiikme"
        description="Browse verified jobs, internships, hackathons, and freelance opportunities across India. Apply on Tiikme."
        canonical="https://tiikme.com/app/opportunities"
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

      {/* STICKY TAB + FILTER BAND */}
      <StickyOppHeader
        isInstitution={isInstitution}
        userTab={userTab}
        setUserTab={setUserTab}
        orgTab={orgTab}
        setOrgTab={setOrgTab}
        activeType={activeType}
        setActiveType={setActiveType}
      />

      {/* USER: JOBS TAB */}
      {!isInstitution && userTab === "jobs" && (() => {
        // Hide opportunities the user already applied to
        const visibleOpps = opps.filter(o => !appliedIds.has(o.id));
        const visibleRecommended = recommended.filter(o => !appliedIds.has(o.id));
        return (
          <>
            <div className="relative mb-4 mt-3">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-3)" }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search roles, companies..."
                className="w-full h-11 rounded-2xl pl-11 pr-4 text-[14px] outline-none glass-input" />
            </div>

            {visibleRecommended.length > 0 && !search.trim() && activeType === "All" && (
              <div className="mb-6">
                <h2 className="text-[16px] font-bold mb-3 flex items-center gap-2" style={{ color: "var(--text-1)" }}>
                  <Zap className="w-4 h-4" style={{ color: "#F59E0B" }} /> Recommended for You
                </h2>
                <div className="space-y-3">
                  {visibleRecommended.map(o => (
                    <SharedOpportunityCard
                      key={`rec-${o.id}`}
                      opp={o}
                      company={o.org ? { id: o.org.id, name: o.org.name, logo_url: o.org.logo_url } : null}
                      isLikedByMe={false}
                      hasApplied={appliedIds.has(o.id)}
                      initialLikeCount={0}
                      initialCommentCount={0}
                      onApply={(opp) => setShowApply(opp)}
                    />
                  ))}
                </div>
              </div>
            )}

            {loading && !visibleOpps.length ? (
              <div className="space-y-4 mt-4">{[1,2,3].map(i => (
                <div key={i} className="animate-pulse rounded-xl p-5 glass-light" style={{ minHeight: 120 }}>
                  <div className="flex gap-3"><div className="w-11 h-11 rounded-xl" style={{ background: "var(--surface-2)" }} /><div className="flex-1 space-y-2"><div className="h-5 w-2/3 rounded" style={{ background: "var(--surface-2)" }} /><div className="h-4 w-1/3 rounded" style={{ background: "var(--surface-2)" }} /></div></div>
                </div>
              ))}</div>
            ) : visibleOpps.length === 0 ? (
              <div className="text-center py-16">
                <Briefcase className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--text-3)" }} />
                <p className="text-[16px] font-bold" style={{ color: "var(--text-1)" }}>No opportunities yet</p>
                <p className="text-[13px] mt-1" style={{ color: "var(--text-3)" }}>Check back later</p>
              </div>
            ) : (
              <div className="space-y-3">
                {visibleOpps.map(o => (
                  <SharedOpportunityCard
                    key={o.id}
                    opp={o}
                    company={o.org ? { id: o.org.id, name: o.org.name, logo_url: o.org.logo_url } : null}
                    isLikedByMe={false}
                    hasApplied={appliedIds.has(o.id)}
                    initialLikeCount={0}
                    initialCommentCount={0}
                    onApply={(opp) => setShowApply(opp)}
                  />
                ))}
              </div>
            )}
          </>
        );
      })()}

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
          ) : myOpps.map(o => (
            <SharedOpportunityCard
              key={o.id}
              opp={o}
              company={o.org ? { id: o.org.id, name: o.org.name, logo_url: o.org.logo_url } : null}
              isLikedByMe={false}
              hasApplied={appliedIds.has(o.id)}
              initialLikeCount={0}
              initialCommentCount={0}
              onApply={(opp) => setShowApply(opp)}
            />
          ))}
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

/* ─── Sticky 2-row Tab + Filter header for Opportunities ─── */
interface StickyOppHeaderProps {
  isInstitution: boolean;
  userTab: UserTab;
  setUserTab: (tab: UserTab) => void;
  orgTab: OrgTab;
  setOrgTab: (tab: OrgTab) => void;
  activeType: string;
  setActiveType: (type: string) => void;
}

function StickyOppHeader({ isInstitution, userTab, setUserTab, orgTab, setOrgTab, activeType, setActiveType }: StickyOppHeaderProps) {
  const scrolled = useScrollPastThreshold(120);
  const [moreOpen, setMoreOpen] = useState(false);
  const filterCount = activeType !== "All" ? 1 : 0;

  const userTabs = [
    { key: "jobs", label: "For you" },
    { key: "find", label: "Find" },
    { key: "referrals", label: "Referrals" },
    { key: "applications", label: "Applications" },
  ];
  const orgTabs = [
    { key: "post", label: "Post Job" },
    { key: "listings", label: "My Listings" },
    { key: "talent", label: "Find Talent" },
  ];
  const showFilters = (!isInstitution && userTab === "jobs") || (isInstitution && orgTab === "listings");

  return (
    <div className="sticky z-30" style={{ top: 0, background: "rgba(255,255,255,0.78)", backdropFilter: "blur(14px)", marginInline: -16, paddingInline: 16, borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
      {!isInstitution
        ? <PrimaryTabs tabs={userTabs as any} active={userTab} onChange={setUserTab} />
        : <PrimaryTabs tabs={orgTabs as any} active={orgTab} onChange={setOrgTab} />}
      {showFilters && (
        <FilterBar
          condensed={scrolled}
          activeCount={filterCount}
          onClearAll={() => setActiveType("All")}
          onMore={() => setMoreOpen(true)}
          chips={FILTER_TABS.filter(f => f !== "All").map(f => ({
            key: f, label: f, active: activeType === f,
            onToggle: () => setActiveType(activeType === f ? "All" : f),
          }))}
        />
      )}
      <BottomSheet open={moreOpen} onClose={() => setMoreOpen(false)} title="Filter opportunities" description="Pick one to narrow results"
        footer={
          <>
            <button type="button" onClick={() => setActiveType("All")} className="flex-1 cursor-pointer"
              style={{ height: 40, borderRadius: 10, fontSize: 13, fontWeight: 600, background: "rgba(0,0,0,0.06)", color: "#1A1A2E", border: "none" }}>Reset</button>
            <button type="button" onClick={() => setMoreOpen(false)} className="flex-1 cursor-pointer"
              style={{ height: 40, borderRadius: 10, fontSize: 13, fontWeight: 700, background: "#FF5A1F", color: "#fff", border: "none" }}>Apply</button>
          </>
        }>
        <div className="flex flex-wrap gap-2">
          {FILTER_TABS.map(f => (
            <button key={f} type="button" onClick={() => setActiveType(f)}
              className="cursor-pointer"
              style={{
                height: 32, padding: "0 12px", borderRadius: 999, fontSize: 12, fontWeight: 600,
                background: activeType === f ? "#FF5A1F" : "rgba(0,0,0,0.05)",
                color: activeType === f ? "#fff" : "#1A1A2E", border: "none",
              }}>{f}</button>
          ))}
        </div>
      </BottomSheet>
    </div>
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

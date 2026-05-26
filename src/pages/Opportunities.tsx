import { toast } from "sonner";
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
import { sendNotification } from "@/lib/notify";
import ApplyModal from "@/components/opportunities/ApplyModal";
import FindTab from "@/components/opportunities/FindTab";
import ReferralsTab from "@/components/opportunities/ReferralsTab";
import { OpportunityCard as SharedOpportunityCard } from "@/components/opportunities/OpportunityCard";
import AvatarSquare from "@/components/ui/AvatarSquare";
import PrimaryTabs from "@/components/filters/PrimaryTabs";
import FilterBar, { useScrollPastThreshold } from "@/components/filters/FilterBar";
import BottomSheet from "@/components/ui/BottomSheet";

const FILTER_TABS = ["All", "Full-time", "Part-time", "Internship", "Freelance", "Gig", "Hackathon"];
const filterMap: Record<string, (q: any) => any> = {
  "Full-time": q => q.or("type.eq.full_time,type.eq.fulltime,type.eq.full-time,type.eq.job"),
  "Part-time": q => q.or("type.eq.part_time,type.eq.parttime,type.eq.part-time"),
  "Internship": q => q.eq("type", "internship"),
  "Freelance": q => q.eq("type", "freelance"),
  "Gig": q => q.eq("type", "gig"),
  "Hackathon": q => q.eq("type", "hackathon"),
};

type UserTab = "jobs" | "find" | "referrals" | "applications" | "campaigns";
type OrgTab = "post" | "listings" | "talent" | "campaigns";

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
        opportunity: { title: opp.title, ...opp },
        userProfile: {
          skills: profile.skills,
          location_city: profile.location_city,
          sector: profile.sector,
          activity_score: profile.activity_score,
          is_verified: profile.is_verified,
          profession_type: (profile as any).profession_type || null,
          role_subtype: (profile as any).role_subtype || null,
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

  const { data: followedOrgIds = new Set<string>() } = useQuery({
    queryKey: ["followed-orgs", user?.id],
    queryFn: async () => {
      if (!user) return new Set<string>();
      const { data } = await supabase.from("org_followers").select("org_id").eq("user_id", user.id);
      return new Set((data || []).map((r: any) => r.org_id));
    },
    enabled: !!user,
    staleTime: 10 * 60 * 1000,
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
        // Boost score for orgs the user follows
        const followBoost = o.org_id && followedOrgIds.has(o.org_id) ? 2 : 0;
        return { ...o, _matchScore: matchCount + followBoost, _scoreOk: scoreOk };
      })
      .filter(o => o._matchScore > 0 || o._scoreOk)
      .sort((a, b) => b._matchScore - a._matchScore)
      .slice(0, 5);
  }, [opps, profile, user, isInstitution, followedOrgIds]);

  // Show all jobs from this org (any admin) OR posted by this user.
  // Using org_id is more robust than poster_id for institution accounts,
  // and avoids the race where user?.id is null when opps data first arrives.
  const myOpps = opps.filter(o =>
    (isInstitution && profile?.org_id && o.org_id === profile.org_id) ||
    (user?.id && o.poster_id === user.id)
  );
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
                      isFollowingOrg={!!(o.org?.id && followedOrgIds.has(o.org.id))}
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
                    isFollowingOrg={!!(o.org?.id && followedOrgIds.has(o.org.id))}
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
      {!isInstitution && userTab === "campaigns" && <CampaignsTab />}
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
      {isInstitution && orgTab === "talent" && <FindTalentTab currentUserId={user?.id} orgId={profile?.org_id ?? undefined} />}

      {/* ORG: CAMPAIGNS */}
      {isInstitution && orgTab === "campaigns" && <OrgCampaignsTab />}

      {/* ORG: CAMPAIGNS */}
      {isInstitution && orgTab === "campaigns" && <OrgCampaignsTab />}

      <AnimatePresence>
        {showApply && <ApplyModal open={!!showApply} onClose={() => setShowApply(null)} opportunity={showApply} orgName={showApply?.org?.name} onApplied={() => { queryClient.invalidateQueries({ queryKey: ["applied-opportunities"] }); queryClient.invalidateQueries({ queryKey: ["opportunities"] }); setShowApply(null); }} />}
      </AnimatePresence>

      {/* FAB — only for institution accounts */}
      {isInstitution && (
        <button
          type="button"
          onClick={() => navigate("/app/opportunities/create")}
          aria-label="Create new job posting"
          className="cursor-pointer"
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "#FF5A1F",
            border: "none",
            boxShadow: "0 4px 20px rgba(255,90,31,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            transition: "transform 150ms, box-shadow 150ms",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.08)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 28px rgba(255,90,31,0.55)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = ""; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 20px rgba(255,90,31,0.4)"; }}
        >
          <Plus className="w-7 h-7 text-white" />
        </button>
      )}
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
    { key: "campaigns", label: "Campaigns" },
    { key: "referrals", label: "Referrals" },
    { key: "applications", label: "Applications" },
  ];
  const orgTabs = [
    { key: "post", label: "Post Job" },
    { key: "listings", label: "My Listings" },
    { key: "talent", label: "Find Talent" },
    { key: "campaigns", label: "Campaigns" },
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
    shortlisted: { bg: "rgba(22,101,52,0.10)", color: "#166534", label: "Shortlisted" },
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
function FindTalentTab({ currentUserId, orgId }: { currentUserId?: string; orgId?: string }) {
  const [talent, setTalent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Refer Job modal state
  const [referTarget, setReferTarget] = useState<{ id: string; full_name: string } | null>(null);
  const [orgOpps, setOrgOpps] = useState<{ id: string; title: string; type: string }[]>([]);
  const [oppsLoading, setOppsLoading] = useState(false);
  const [selectedOppId, setSelectedOppId] = useState<string>("");
  const [referMessage, setReferMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.from("profiles")
      .select("id, full_name, avatar_url, role, headline, location_city, skills, activity_score")
      .eq("open_to_work", true)
      .eq("is_public", true)
      .order("activity_score", { ascending: false })
      .limit(30)
      .then(({ data }) => { setTalent(data || []); setLoading(false); });
  }, []);

  const openReferModal = async (person: { id: string; full_name: string }) => {
    if (!orgId) { toast.error("No organisation linked to your account"); return; }
    setReferTarget(person);
    setSelectedOppId("");
    setReferMessage("");
    setOppsLoading(true);
    // Try with status filter first, fall back without it
    let { data } = await supabase.from("opportunities")
      .select("id, title, type")
      .eq("org_id", orgId)
      .gt("expires_at", new Date().toISOString())
      .eq("status", "active");
    if (!data || data.length === 0) {
      const fallback = await supabase.from("opportunities")
        .select("id, title, type")
        .eq("org_id", orgId)
        .gt("expires_at", new Date().toISOString());
      data = fallback.data;
    }
    if (!data || data.length === 0) {
      // Try without expires_at filter too
      const fallback2 = await supabase.from("opportunities")
        .select("id, title, type")
        .eq("org_id", orgId)
        .eq("is_open", true);
      data = fallback2.data;
    }
    setOrgOpps(data || []);
    setOppsLoading(false);
  };

  const handleReferSubmit = async () => {
    if (!selectedOppId) { toast.error("Please select a job to refer to"); return; }
    if (!referTarget || !currentUserId || !orgId) return;
    setSubmitting(true);

    const { error } = await supabase.from("job_referrals").insert({
      org_id: orgId,
      user_id: referTarget.id,
      opportunity_id: selectedOppId,
      referred_by: currentUserId,
      message: referMessage.trim() || null,
    } as any);

    if (error) {
      setSubmitting(false);
      if (error.code === "23505") {
        toast.error("Already referred this person for this job");
      } else {
        toast.error("Failed to send referral");
      }
      return;
    }

    // Find selected opportunity title for notification
    const selectedOpp = orgOpps.find(o => o.id === selectedOppId);
    const jobTitle = selectedOpp?.title || "a job";

    // Notify the referred user
    sendNotification({
      userId: referTarget.id,
      actorId: currentUserId,
      type: "opportunity",
      title: "You've been referred for a job!",
      body: `An organisation thinks you'd be a great fit for ${jobTitle}. Check it out!`,
      actionUrl: "/app/opportunities",
    });

    setSubmitting(false);
    toast.success("Referral sent!");
    setReferTarget(null);
  };

  if (loading) return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="animate-pulse glass-light rounded-xl" style={{ height: 64 }} />)}</div>;
  if (talent.length === 0) return (
    <div className="text-center py-16">
      <UsersIcon className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--text-3)" }} />
      <p className="text-[14px]" style={{ color: "#6B7094" }}>No candidates marked open to work yet</p>
    </div>
  );

  return (
    <>
      <div className="space-y-2">
        {talent.map((p: any) => (
          <div key={p.id} className="glass-card flex items-center gap-3"
            style={{ padding: 12, borderRadius: 12 }}>
            <div className="cursor-pointer flex items-center gap-3 flex-1 min-w-0"
              onClick={() => navigate(`/app/profile/${p.id}`)}>
              <AvatarSquare src={p.avatar_url} name={p.full_name || "U"} size={44} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate" style={{ fontSize: 14, color: "#1A1A2E" }}>{p.full_name}</p>
                <p className="text-[12px] truncate" style={{ color: "#6B7094" }}>{p.headline || p.role}</p>
                {p.location_city && <p className="text-[11px]" style={{ color: "#9CA3C0" }}>{p.location_city}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] font-semibold px-2 py-1 rounded-full"
                style={{ background: "rgba(52,199,89,0.10)", color: "#34C759" }}>Open</span>
              <button
                type="button"
                onClick={() => openReferModal({ id: p.id, full_name: p.full_name || "User" })}
                className="cursor-pointer text-[11px] font-semibold px-2.5 py-1 rounded-full"
                style={{ border: "1.5px solid #E8733A", color: "#E8733A", background: "transparent" }}>
                Refer Job →
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Refer Job Modal */}
      {referTarget && (
        <div
          className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center"
          style={{ background: "rgba(0,0,0,0.45)" }}
          onClick={() => setReferTarget(null)}>
          <div
            className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-5 bg-white"
            onClick={e => e.stopPropagation()}
            style={{ maxHeight: "90vh", overflowY: "auto" }}>
            <h3 className="font-bold text-[16px] mb-4" style={{ color: "#1A1A2E" }}>
              Refer {referTarget.full_name} to a job
            </h3>

            {oppsLoading ? (
              <div className="space-y-2 mb-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse rounded-xl" style={{ height: 44, background: "#F5F5F5" }} />
                ))}
              </div>
            ) : orgOpps.length === 0 ? (
              <p className="text-[13px] mb-4 text-center py-4" style={{ color: "#6B7094" }}>
                No active job postings found. Post a job first.
              </p>
            ) : (
              <div className="space-y-2 mb-4">
                <p className="text-[12px] font-semibold mb-2" style={{ color: "#6B7094" }}>Select a job</p>
                {orgOpps.map(opp => (
                  <button
                    key={opp.id}
                    type="button"
                    onClick={() => setSelectedOppId(opp.id)}
                    className="w-full text-left cursor-pointer px-3 py-3 rounded-xl transition-colors"
                    style={{
                      border: selectedOppId === opp.id ? "2px solid #E8733A" : "1.5px solid #E8E8E8",
                      background: selectedOppId === opp.id ? "rgba(232,115,58,0.06)" : "#FAFAFA",
                    }}>
                    <p className="font-semibold text-[13px]" style={{ color: "#1A1A2E" }}>{opp.title}</p>
                    {opp.type && (
                      <p className="text-[11px] mt-0.5" style={{ color: "#9CA3C0" }}>{opp.type}</p>
                    )}
                  </button>
                ))}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-[12px] font-bold mb-1" style={{ color: "#1A1A2E" }}>
                Add a personal note <span style={{ color: "#9CA3C0", fontWeight: 400 }}>(optional)</span>
              </label>
              <textarea
                value={referMessage}
                onChange={e => setReferMessage(e.target.value.slice(0, 500))}
                rows={3}
                placeholder="Why do you think they'd be a great fit?"
                className="w-full outline-none text-[13px]"
                style={{ padding: "10px 12px", borderRadius: 12, border: "1.5px solid #E8E8E8", background: "#FAFAFA", resize: "none", width: "100%" }}
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setReferTarget(null)}
                className="flex-1 cursor-pointer py-2.5 rounded-xl text-[13px] font-semibold"
                style={{ background: "#F5F5F5", color: "#1A1A2E", border: "none" }}>
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReferSubmit}
                disabled={submitting || !selectedOppId || orgOpps.length === 0}
                className="flex-1 cursor-pointer py-2.5 rounded-xl text-[13px] font-bold disabled:opacity-50"
                style={{ background: "#E8733A", color: "#fff", border: "none" }}>
                {submitting ? "Sending..." : "Send Referral"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ─── Org Campaigns Tab ─── */
function OrgCampaignsTab() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", campaign_type: "ugc", deliverable_platforms: [] as string[], budget_per_creator: "", creator_slots: "5", min_followers: "0", deliverable_description: "", application_deadline: "" });
  const [creating, setCreating] = useState(false);

  const orgId = (profile as any)?.org_id;

  useEffect(() => {
    if (!orgId) { setLoading(false); return; }
    supabase.from("campaigns")
      .select("*, _apps:opportunity_applications!opportunity_applications_campaign_id_fkey(id)")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false })
      .limit(30)
      .then(({ data }) => { setCampaigns(data || []); setLoading(false); });
  }, [orgId]);

  const handleCreate = async () => {
    if (!orgId || !form.title.trim()) { toast.error("Campaign title is required"); return; }
    setCreating(true);
    const { data, error } = await supabase.from("campaigns").insert({
      org_id: orgId,
      title: form.title.trim(),
      description: form.description.trim() || null,
      campaign_type: form.campaign_type,
      deliverable_platforms: form.deliverable_platforms,
      budget_per_creator: form.budget_per_creator ? parseInt(form.budget_per_creator) : null,
      slots_available: parseInt(form.creator_slots) || 5,
      min_followers: parseInt(form.min_followers) || 0,
      application_deadline: form.application_deadline || null,
      status: "active",
    }).select().single();
    setCreating(false);
    if (error) { toast.error("Failed to create campaign"); return; }
    setCampaigns(prev => [{ ...data, _apps: [] }, ...prev]);
    toast.success("Campaign published!");
    setShowCreate(false);
    setForm({ title: "", description: "", campaign_type: "ugc", deliverable_platforms: [], budget_per_creator: "", creator_slots: "5", min_followers: "0", deliverable_description: "", application_deadline: "" });
  };

  const togglePlatform = (p: string) => {
    setForm(f => ({ ...f, deliverable_platforms: f.deliverable_platforms.includes(p) ? f.deliverable_platforms.filter(x => x !== p) : [...f.deliverable_platforms, p] }));
  };

  const inputStyle = { padding: "10px 12px", borderRadius: 12, border: "1.5px solid #E8E8E8", background: "#FAFAFA", fontSize: 13, width: "100%", outline: "none" } as React.CSSProperties;

  if (loading) return <div className="animate-pulse" style={{ height: 80, borderRadius: 12, background: "#F5F5F5" }} />;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[12px] font-semibold" style={{ color: "#6B7094" }}>Creator campaigns you've posted</p>
        <button type="button" onClick={() => setShowCreate(true)}
          className="flex items-center gap-1 cursor-pointer px-3 py-1.5 rounded-xl text-[12px] font-bold"
          style={{ background: "#FF5A1F", color: "#fff", border: "none" }}>
          <Plus className="w-3 h-3" /> New campaign
        </button>
      </div>

      {campaigns.length === 0 ? (
        <div className="text-center py-12">
          <Zap className="w-10 h-10 mx-auto mb-2" style={{ color: "var(--text-3)" }} />
          <p className="text-[14px] font-semibold mb-1" style={{ color: "#1A1A2E" }}>No campaigns yet</p>
          <p className="text-[13px]" style={{ color: "#6B7094" }}>Create your first creator campaign to find influencers and UGC creators.</p>
        </div>
      ) : campaigns.map(c => {
        const typeConf = CAMPAIGN_TYPE_LABELS[c.campaign_type] || CAMPAIGN_TYPE_LABELS.ugc;
        const appCount = Array.isArray(c._apps) ? c._apps.length : 0;
        return (
          <div key={c.id} className="bg-white border border-gray-100 rounded-2xl p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-[14px]" style={{ color: "#1A1A2E" }}>{c.title}</p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: typeConf.bg, color: typeConf.color }}>{typeConf.label}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.status === "active" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>{c.status}</span>
                </div>
                {c.description && <p className="text-[12px] mt-1 line-clamp-1" style={{ color: "#6B7094" }}>{c.description}</p>}
                <div className="flex items-center gap-3 mt-2 text-[11px]" style={{ color: "#9CA3C0" }}>
                  <span>{appCount} applicant{appCount !== 1 ? "s" : ""}</span>
                  {c.budget_per_creator && <span>₹{c.budget_per_creator.toLocaleString()}/creator</span>}
                  {c.slots_available && <span>{c.slots_available} slots</span>}
                </div>
              </div>
              <button type="button"
                onClick={() => navigate(`/app/opportunities/campaign/${c.id}/applicants`)}
                className="shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold cursor-pointer"
                style={{ background: "#F5F5F5", color: "#1A1A2E", border: "none" }}>
                Review →
              </button>
            </div>
          </div>
        );
      })}

      {/* Create campaign modal */}
      {showCreate && (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center" style={{ background: "rgba(0,0,0,0.45)" }} onClick={() => setShowCreate(false)}>
          <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-5 bg-white" onClick={e => e.stopPropagation()} style={{ maxHeight: "90vh", overflowY: "auto" }}>
            <h3 className="font-bold text-[16px] mb-4" style={{ color: "#1A1A2E" }}>Create creator campaign</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-[12px] font-bold mb-1" style={{ color: "#1A1A2E" }}>Campaign title *</label>
                <input style={inputStyle} placeholder="e.g. Unboxing campaign for new product" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value.slice(0, 100) }))} />
              </div>
              <div>
                <label className="block text-[12px] font-bold mb-1" style={{ color: "#1A1A2E" }}>Campaign type</label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(CAMPAIGN_TYPE_LABELS).map(([k, v]) => (
                    <button key={k} type="button" onClick={() => setForm(f => ({ ...f, campaign_type: k }))}
                      className="cursor-pointer px-3 py-1 rounded-full text-[11px] font-bold"
                      style={{ background: form.campaign_type === k ? v.bg : "#F5F5F5", color: form.campaign_type === k ? v.color : "#6B7094", border: form.campaign_type === k ? `1.5px solid ${v.color}` : "1.5px solid transparent" }}>
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-bold mb-1" style={{ color: "#1A1A2E" }}>Platforms</label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(PLATFORM_LABELS).map(([k, v]) => (
                    <button key={k} type="button" onClick={() => togglePlatform(k)}
                      className="cursor-pointer px-2.5 py-1 rounded-full text-[11px] font-semibold"
                      style={{ background: form.deliverable_platforms.includes(k) ? "#FF5A1F" : "#F5F5F5", color: form.deliverable_platforms.includes(k) ? "#fff" : "#6B7094", border: "none" }}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-bold mb-1" style={{ color: "#1A1A2E" }}>What creators must deliver</label>
                <textarea value={form.deliverable_description} onChange={e => setForm(f => ({ ...f, deliverable_description: e.target.value.slice(0, 500) }))}
                  rows={2} placeholder="e.g. 1 Instagram Reel (30–60s) with product mention"
                  className="w-full outline-none" style={{ ...inputStyle, resize: "none" }} />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[12px] font-bold mb-1" style={{ color: "#1A1A2E" }}>Budget/creator (₹)</label>
                  <input type="number" style={inputStyle} placeholder="e.g. 5000" value={form.budget_per_creator} onChange={e => setForm(f => ({ ...f, budget_per_creator: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-[12px] font-bold mb-1" style={{ color: "#1A1A2E" }}>Slots</label>
                  <input type="number" style={inputStyle} value={form.creator_slots} onChange={e => setForm(f => ({ ...f, creator_slots: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-[12px] font-bold mb-1" style={{ color: "#1A1A2E" }}>Min followers</label>
                  <input type="number" style={inputStyle} value={form.min_followers} onChange={e => setForm(f => ({ ...f, min_followers: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-bold mb-1" style={{ color: "#1A1A2E" }}>Application deadline</label>
                <input type="date" style={inputStyle} value={form.application_deadline} onChange={e => setForm(f => ({ ...f, application_deadline: e.target.value }))} />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowCreate(false)}
                  className="flex-1 cursor-pointer py-2.5 rounded-xl text-[13px] font-semibold"
                  style={{ background: "#F5F5F5", color: "#1A1A2E", border: "none" }}>Cancel</button>
                <button type="button" onClick={handleCreate} disabled={creating || !form.title.trim()}
                  className="flex-1 cursor-pointer py-2.5 rounded-xl text-[13px] font-bold disabled:opacity-50"
                  style={{ background: "#FF5A1F", color: "#fff", border: "none" }}>
                  {creating ? "Publishing..." : "Publish campaign"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Campaigns Tab ─── */
const PLATFORM_LABELS: Record<string, string> = {
  instagram: "Instagram", youtube: "YouTube", linkedin: "LinkedIn",
  twitter: "Twitter/X", reels: "Reels", shorts: "Shorts", blog: "Blog/Article",
};
const CAMPAIGN_TYPE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  ugc: { label: "UGC", color: "#7E22CE", bg: "#FDF4FF" },
  awareness: { label: "Awareness", color: "#0369A1", bg: "#F0F9FF" },
  review: { label: "Review", color: "#166534", bg: "#F0FDF4" },
  event: { label: "Event", color: "#92400E", bg: "#FFF7ED" },
  affiliate: { label: "Affiliate", color: "#C44A1F", bg: "#FFF7ED" },
  sponsored: { label: "Sponsored", color: "#1A1A2E", bg: "#F5F5F5" },
};

function CampaignsTab() {
  const { user, profile } = useAuth();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);
  const [applied, setApplied] = useState<Set<string>>(new Set());
  const [openPitch, setOpenPitch] = useState<any>(null);
  const [pitchText, setPitchText] = useState("");
  const [pitchPlatform, setPitchPlatform] = useState("");
  const [pitchFollowers, setPitchFollowers] = useState("");
  const [pitchPortfolio, setPitchPortfolio] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const [{ data: camps }, { data: myApps }] = await Promise.all([
        supabase.from("campaigns")
          .select("*, org:organizations!campaigns_org_id_fkey(id, name, logo_url, slug)")
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(50),
        user ? supabase.from("opportunity_applications")
          .select("campaign_id").eq("applicant_id", user.id).not("campaign_id", "is", null) : Promise.resolve({ data: [] }),
      ]);
      setCampaigns(camps || []);
      setApplied(new Set((myApps || []).map((a: any) => a.campaign_id)));
      setLoading(false);
    })();
  }, [user?.id]);

  const handleApply = async () => {
    if (!user || !openPitch) return;
    setSubmitting(true);
    const { error } = await supabase.from("opportunity_applications").insert({
      campaign_id: openPitch.id,
      applicant_id: user.id,
      pitch_text: pitchText.trim() || null,
      platform: pitchPlatform || null,
      follower_count: pitchFollowers ? parseInt(pitchFollowers) : null,
      portfolio_url: pitchPortfolio.trim() || null,
    });
    setSubmitting(false);
    if (error) { toast.error("Failed to apply"); return; }
    setApplied(prev => new Set([...prev, openPitch.id]));
    toast.success("Application sent to brand!");
    setOpenPitch(null); setPitchText(""); setPitchPlatform(""); setPitchFollowers(""); setPitchPortfolio("");
  };

  if (loading) return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="animate-pulse glass-light rounded-xl" style={{ height: 120 }} />)}</div>;
  if (campaigns.length === 0) return (
    <div className="text-center py-16">
      <Zap className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--text-3)" }} />
      <p className="font-semibold mb-1" style={{ fontSize: 15, color: "#1A1A2E" }}>No active campaigns</p>
      <p className="text-[13px]" style={{ color: "#6B7094" }}>Brands will post creator campaigns here. Check back soon.</p>
    </div>
  );

  return (
    <div className="space-y-3">
      <p className="text-[12px] font-semibold" style={{ color: "#6B7094" }}>Brand campaigns open for creators and gig workers</p>
      {campaigns.map(c => {
        const typeConf = CAMPAIGN_TYPE_LABELS[c.campaign_type] || CAMPAIGN_TYPE_LABELS.ugc;
        const isApplied = applied.has(c.id);
        const platforms = (c.deliverable_platforms || []).map((p: string) => PLATFORM_LABELS[p] || p);
        return (
          <div key={c.id} className="bg-white border border-gray-100 rounded-2xl p-4" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <div className="flex items-start gap-3">
              <AvatarSquare src={c.org?.logo_url} name={c.org?.name || "Brand"} size={40} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-[14px]" style={{ color: "#1A1A2E" }}>{c.title}</p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: typeConf.bg, color: typeConf.color }}>{typeConf.label}</span>
                </div>
                <p className="text-[12px]" style={{ color: "#6B7094" }}>{c.org?.name}</p>
              </div>
              <button
                type="button"
                disabled={isApplied || applying === c.id}
                onClick={() => { setOpenPitch(c); setPitchText(""); setPitchPlatform(""); setPitchFollowers(""); setPitchPortfolio(""); }}
                className="shrink-0 px-3 py-1.5 rounded-xl text-[12px] font-bold cursor-pointer disabled:opacity-60 disabled:cursor-default"
                style={{ background: isApplied ? "#F0FDF4" : "#FF5A1F", color: isApplied ? "#166534" : "#fff", border: "none" }}>
                {isApplied ? "Applied ✓" : "Apply"}
              </button>
            </div>
            {c.description && <p className="text-[13px] mt-2 line-clamp-2" style={{ color: "#374151" }}>{c.description}</p>}
            <div className="flex items-center flex-wrap gap-2 mt-2">
              {c.budget_per_creator && (
                <span className="text-[11px] font-semibold bg-green-50 text-green-700 px-2 py-0.5 rounded-full">₹{c.budget_per_creator.toLocaleString()} per creator</span>
              )}
              {c.slots_available && (
                <span className="text-[11px] text-gray-500">{c.slots_available} slots</span>
              )}
              {c.min_followers > 0 && (
                <span className="text-[11px] text-gray-500">{c.min_followers.toLocaleString()}+ followers</span>
              )}
              {platforms.slice(0, 3).map((p: string) => (
                <span key={p} className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{p}</span>
              ))}
              {c.application_deadline && (
                <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                  Deadline: {new Date(c.application_deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </span>
              )}
            </div>
          </div>
        );
      })}

      {/* Apply pitch modal */}
      {openPitch && (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center" style={{ background: "rgba(0,0,0,0.45)" }} onClick={() => setOpenPitch(null)}>
          <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-5 bg-white" onClick={e => e.stopPropagation()} style={{ maxHeight: "90vh", overflowY: "auto" }}>
            <h3 className="font-bold text-[15px] mb-1" style={{ color: "#1A1A2E" }}>Apply to: {openPitch.title}</h3>
            <p className="text-[12px] mb-4" style={{ color: "#6B7094" }}>{openPitch.org?.name}</p>
            <div className="space-y-3">
              <div>
                <label className="block text-[12px] font-bold mb-1" style={{ color: "#1A1A2E" }}>Your pitch <span style={{ color: "#9CA3C0", fontWeight: 400 }}>(optional)</span></label>
                <textarea value={pitchText} onChange={e => setPitchText(e.target.value.slice(0, 500))}
                  rows={3} placeholder="Why are you a good fit for this campaign?"
                  className="w-full outline-none text-[13px]"
                  style={{ padding: "10px 12px", borderRadius: 12, border: "1.5px solid #E8E8E8", background: "#FAFAFA", resize: "none" }} />
              </div>
              <div>
                <label className="block text-[12px] font-bold mb-1" style={{ color: "#1A1A2E" }}>Primary platform</label>
                <select value={pitchPlatform} onChange={e => setPitchPlatform(e.target.value)}
                  className="w-full outline-none text-[13px] cursor-pointer"
                  style={{ padding: "10px 12px", borderRadius: 12, border: "1.5px solid #E8E8E8", background: "#FAFAFA" }}>
                  <option value="">Select platform</option>
                  {Object.entries(PLATFORM_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-[12px] font-bold mb-1" style={{ color: "#1A1A2E" }}>Followers / subscribers</label>
                  <input type="number" value={pitchFollowers} onChange={e => setPitchFollowers(e.target.value)}
                    placeholder="e.g. 5000"
                    className="w-full outline-none text-[13px]"
                    style={{ padding: "10px 12px", borderRadius: 12, border: "1.5px solid #E8E8E8", background: "#FAFAFA" }} />
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-bold mb-1" style={{ color: "#1A1A2E" }}>Portfolio / profile link <span style={{ color: "#9CA3C0", fontWeight: 400 }}>(optional)</span></label>
                <input type="url" value={pitchPortfolio} onChange={e => setPitchPortfolio(e.target.value)}
                  placeholder="https://..."
                  className="w-full outline-none text-[13px]"
                  style={{ padding: "10px 12px", borderRadius: 12, border: "1.5px solid #E8E8E8", background: "#FAFAFA" }} />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setOpenPitch(null)}
                  className="flex-1 cursor-pointer py-2.5 rounded-xl text-[13px] font-semibold"
                  style={{ background: "#F5F5F5", color: "#1A1A2E", border: "none" }}>Cancel</button>
                <button type="button" onClick={handleApply} disabled={submitting}
                  className="flex-1 cursor-pointer py-2.5 rounded-xl text-[13px] font-bold disabled:opacity-50"
                  style={{ background: "#FF5A1F", color: "#fff", border: "none" }}>
                  {submitting ? "Sending..." : "Send application"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Org Campaigns Tab ─── */
function OrgCampaignsTab() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", campaign_type: "ugc", deliverable_platforms: [] as string[], budget_per_creator: "", creator_slots: "5", min_followers: "0", deliverable_description: "", application_deadline: "" });
  const [creating, setCreating] = useState(false);

  const orgId = (profile as any)?.org_id;

  useEffect(() => {
    if (!orgId) { setLoading(false); return; }
    supabase.from("campaigns")
      .select("*, _apps:opportunity_applications!opportunity_applications_campaign_id_fkey(id)")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false })
      .limit(30)
      .then(({ data }) => { setCampaigns(data || []); setLoading(false); });
  }, [orgId]);

  const handleCreate = async () => {
    if (!orgId || !form.title.trim()) { toast.error("Campaign title is required"); return; }
    setCreating(true);
    const { data, error } = await supabase.from("campaigns").insert({
      org_id: orgId,
      title: form.title.trim(),
      description: form.description.trim() || null,
      campaign_type: form.campaign_type,
      deliverable_platforms: form.deliverable_platforms,
      budget_per_creator: form.budget_per_creator ? parseInt(form.budget_per_creator) : null,
      slots_available: parseInt(form.creator_slots) || 5,
      min_followers: parseInt(form.min_followers) || 0,
      application_deadline: form.application_deadline || null,
      status: "active",
    }).select().single();
    setCreating(false);
    if (error) { toast.error("Failed to create campaign"); return; }
    setCampaigns(prev => [{ ...data, _apps: [] }, ...prev]);
    toast.success("Campaign published!");
    setShowCreate(false);
    setForm({ title: "", description: "", campaign_type: "ugc", deliverable_platforms: [], budget_per_creator: "", creator_slots: "5", min_followers: "0", deliverable_description: "", application_deadline: "" });
  };

  const togglePlatform = (p: string) => {
    setForm(f => ({ ...f, deliverable_platforms: f.deliverable_platforms.includes(p) ? f.deliverable_platforms.filter(x => x !== p) : [...f.deliverable_platforms, p] }));
  };

  const inputStyle = { padding: "10px 12px", borderRadius: 12, border: "1.5px solid #E8E8E8", background: "#FAFAFA", fontSize: 13, width: "100%", outline: "none" } as React.CSSProperties;

  if (loading) return <div className="animate-pulse" style={{ height: 80, borderRadius: 12, background: "#F5F5F5" }} />;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[12px] font-semibold" style={{ color: "#6B7094" }}>Creator campaigns you've posted</p>
        <button type="button" onClick={() => setShowCreate(true)}
          className="flex items-center gap-1 cursor-pointer px-3 py-1.5 rounded-xl text-[12px] font-bold"
          style={{ background: "#FF5A1F", color: "#fff", border: "none" }}>
          <Plus className="w-3 h-3" /> New campaign
        </button>
      </div>

      {campaigns.length === 0 ? (
        <div className="text-center py-12">
          <Zap className="w-10 h-10 mx-auto mb-2" style={{ color: "var(--text-3)" }} />
          <p className="text-[14px] font-semibold mb-1" style={{ color: "#1A1A2E" }}>No campaigns yet</p>
          <p className="text-[13px]" style={{ color: "#6B7094" }}>Create your first creator campaign to find influencers and UGC creators.</p>
        </div>
      ) : campaigns.map(c => {
        const typeConf = CAMPAIGN_TYPE_LABELS[c.campaign_type] || CAMPAIGN_TYPE_LABELS.ugc;
        const appCount = Array.isArray(c._apps) ? c._apps.length : 0;
        return (
          <div key={c.id} className="bg-white border border-gray-100 rounded-2xl p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-[14px]" style={{ color: "#1A1A2E" }}>{c.title}</p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: typeConf.bg, color: typeConf.color }}>{typeConf.label}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.status === "active" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>{c.status}</span>
                </div>
                {c.description && <p className="text-[12px] mt-1 line-clamp-1" style={{ color: "#6B7094" }}>{c.description}</p>}
                <div className="flex items-center gap-3 mt-2 text-[11px]" style={{ color: "#9CA3C0" }}>
                  <span>{appCount} applicant{appCount !== 1 ? "s" : ""}</span>
                  {c.budget_per_creator && <span>₹{c.budget_per_creator.toLocaleString()}/creator</span>}
                  {c.slots_available && <span>{c.slots_available} slots</span>}
                </div>
              </div>
              <button type="button"
                onClick={() => navigate(`/app/opportunities/campaign/${c.id}/applicants`)}
                className="shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold cursor-pointer"
                style={{ background: "#F5F5F5", color: "#1A1A2E", border: "none" }}>
                Review →
              </button>
            </div>
          </div>
        );
      })}

      {/* Create campaign modal */}
      {showCreate && (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center" style={{ background: "rgba(0,0,0,0.45)" }} onClick={() => setShowCreate(false)}>
          <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-5 bg-white" onClick={e => e.stopPropagation()} style={{ maxHeight: "90vh", overflowY: "auto" }}>
            <h3 className="font-bold text-[16px] mb-4" style={{ color: "#1A1A2E" }}>Create creator campaign</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-[12px] font-bold mb-1" style={{ color: "#1A1A2E" }}>Campaign title *</label>
                <input style={inputStyle} placeholder="e.g. Unboxing campaign for new product" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value.slice(0, 100) }))} />
              </div>
              <div>
                <label className="block text-[12px] font-bold mb-1" style={{ color: "#1A1A2E" }}>Campaign type</label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(CAMPAIGN_TYPE_LABELS).map(([k, v]) => (
                    <button key={k} type="button" onClick={() => setForm(f => ({ ...f, campaign_type: k }))}
                      className="cursor-pointer px-3 py-1 rounded-full text-[11px] font-bold"
                      style={{ background: form.campaign_type === k ? v.bg : "#F5F5F5", color: form.campaign_type === k ? v.color : "#6B7094", border: form.campaign_type === k ? `1.5px solid ${v.color}` : "1.5px solid transparent" }}>
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-bold mb-1" style={{ color: "#1A1A2E" }}>Platforms</label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(PLATFORM_LABELS).map(([k, v]) => (
                    <button key={k} type="button" onClick={() => togglePlatform(k)}
                      className="cursor-pointer px-2.5 py-1 rounded-full text-[11px] font-semibold"
                      style={{ background: form.deliverable_platforms.includes(k) ? "#FF5A1F" : "#F5F5F5", color: form.deliverable_platforms.includes(k) ? "#fff" : "#6B7094", border: "none" }}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-bold mb-1" style={{ color: "#1A1A2E" }}>What creators must deliver</label>
                <textarea value={form.deliverable_description} onChange={e => setForm(f => ({ ...f, deliverable_description: e.target.value.slice(0, 500) }))}
                  rows={2} placeholder="e.g. 1 Instagram Reel (30–60s) with product mention"
                  className="w-full outline-none" style={{ ...inputStyle, resize: "none" }} />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[12px] font-bold mb-1" style={{ color: "#1A1A2E" }}>Budget/creator (₹)</label>
                  <input type="number" style={inputStyle} placeholder="e.g. 5000" value={form.budget_per_creator} onChange={e => setForm(f => ({ ...f, budget_per_creator: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-[12px] font-bold mb-1" style={{ color: "#1A1A2E" }}>Slots</label>
                  <input type="number" style={inputStyle} value={form.creator_slots} onChange={e => setForm(f => ({ ...f, creator_slots: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-[12px] font-bold mb-1" style={{ color: "#1A1A2E" }}>Min followers</label>
                  <input type="number" style={inputStyle} value={form.min_followers} onChange={e => setForm(f => ({ ...f, min_followers: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-bold mb-1" style={{ color: "#1A1A2E" }}>Application deadline</label>
                <input type="date" style={inputStyle} value={form.application_deadline} onChange={e => setForm(f => ({ ...f, application_deadline: e.target.value }))} />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowCreate(false)}
                  className="flex-1 cursor-pointer py-2.5 rounded-xl text-[13px] font-semibold"
                  style={{ background: "#F5F5F5", color: "#1A1A2E", border: "none" }}>Cancel</button>
                <button type="button" onClick={handleCreate} disabled={creating || !form.title.trim()}
                  className="flex-1 cursor-pointer py-2.5 rounded-xl text-[13px] font-bold disabled:opacity-50"
                  style={{ background: "#FF5A1F", color: "#fff", border: "none" }}>
                  {creating ? "Publishing..." : "Publish campaign"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Campaigns Tab ─── */
const PLATFORM_LABELS: Record<string, string> = {
  instagram: "Instagram", youtube: "YouTube", linkedin: "LinkedIn",
  twitter: "Twitter/X", reels: "Reels", shorts: "Shorts", blog: "Blog/Article",
};
const CAMPAIGN_TYPE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  ugc: { label: "UGC", color: "#7E22CE", bg: "#FDF4FF" },
  awareness: { label: "Awareness", color: "#0369A1", bg: "#F0F9FF" },
  review: { label: "Review", color: "#166534", bg: "#F0FDF4" },
  event: { label: "Event", color: "#92400E", bg: "#FFF7ED" },
  affiliate: { label: "Affiliate", color: "#C44A1F", bg: "#FFF7ED" },
  sponsored: { label: "Sponsored", color: "#1A1A2E", bg: "#F5F5F5" },
};

function CampaignsTab() {
  const { user, profile } = useAuth();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);
  const [applied, setApplied] = useState<Set<string>>(new Set());
  const [openPitch, setOpenPitch] = useState<any>(null);
  const [pitchText, setPitchText] = useState("");
  const [pitchPlatform, setPitchPlatform] = useState("");
  const [pitchFollowers, setPitchFollowers] = useState("");
  const [pitchPortfolio, setPitchPortfolio] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const [{ data: camps }, { data: myApps }] = await Promise.all([
        supabase.from("campaigns")
          .select("*, org:organizations!campaigns_org_id_fkey(id, name, logo_url, slug)")
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(50),
        user ? supabase.from("opportunity_applications")
          .select("campaign_id").eq("applicant_id", user.id).not("campaign_id", "is", null) : Promise.resolve({ data: [] }),
      ]);
      setCampaigns(camps || []);
      setApplied(new Set((myApps || []).map((a: any) => a.campaign_id)));
      setLoading(false);
    })();
  }, [user?.id]);

  const handleApply = async () => {
    if (!user || !openPitch) return;
    setSubmitting(true);
    const { error } = await supabase.from("opportunity_applications").insert({
      campaign_id: openPitch.id,
      applicant_id: user.id,
      pitch_text: pitchText.trim() || null,
      platform: pitchPlatform || null,
      follower_count: pitchFollowers ? parseInt(pitchFollowers) : null,
      portfolio_url: pitchPortfolio.trim() || null,
    });
    setSubmitting(false);
    if (error) { toast.error("Failed to apply"); return; }
    setApplied(prev => new Set([...prev, openPitch.id]));
    toast.success("Application sent to brand!");
    setOpenPitch(null); setPitchText(""); setPitchPlatform(""); setPitchFollowers(""); setPitchPortfolio("");
  };

  if (loading) return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="animate-pulse glass-light rounded-xl" style={{ height: 120 }} />)}</div>;
  if (campaigns.length === 0) return (
    <div className="text-center py-16">
      <Zap className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--text-3)" }} />
      <p className="font-semibold mb-1" style={{ fontSize: 15, color: "#1A1A2E" }}>No active campaigns</p>
      <p className="text-[13px]" style={{ color: "#6B7094" }}>Brands will post creator campaigns here. Check back soon.</p>
    </div>
  );

  return (
    <div className="space-y-3">
      <p className="text-[12px] font-semibold" style={{ color: "#6B7094" }}>Brand campaigns open for creators and gig workers</p>
      {campaigns.map(c => {
        const typeConf = CAMPAIGN_TYPE_LABELS[c.campaign_type] || CAMPAIGN_TYPE_LABELS.ugc;
        const isApplied = applied.has(c.id);
        const platforms = (c.deliverable_platforms || []).map((p: string) => PLATFORM_LABELS[p] || p);
        return (
          <div key={c.id} className="bg-white border border-gray-100 rounded-2xl p-4" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <div className="flex items-start gap-3">
              <AvatarSquare src={c.org?.logo_url} name={c.org?.name || "Brand"} size={40} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-[14px]" style={{ color: "#1A1A2E" }}>{c.title}</p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: typeConf.bg, color: typeConf.color }}>{typeConf.label}</span>
                </div>
                <p className="text-[12px]" style={{ color: "#6B7094" }}>{c.org?.name}</p>
              </div>
              <button
                type="button"
                disabled={isApplied || applying === c.id}
                onClick={() => { setOpenPitch(c); setPitchText(""); setPitchPlatform(""); setPitchFollowers(""); setPitchPortfolio(""); }}
                className="shrink-0 px-3 py-1.5 rounded-xl text-[12px] font-bold cursor-pointer disabled:opacity-60 disabled:cursor-default"
                style={{ background: isApplied ? "#F0FDF4" : "#FF5A1F", color: isApplied ? "#166534" : "#fff", border: "none" }}>
                {isApplied ? "Applied ✓" : "Apply"}
              </button>
            </div>
            {c.description && <p className="text-[13px] mt-2 line-clamp-2" style={{ color: "#374151" }}>{c.description}</p>}
            <div className="flex items-center flex-wrap gap-2 mt-2">
              {c.budget_per_creator && (
                <span className="text-[11px] font-semibold bg-green-50 text-green-700 px-2 py-0.5 rounded-full">₹{c.budget_per_creator.toLocaleString()} per creator</span>
              )}
              {c.slots_available && (
                <span className="text-[11px] text-gray-500">{c.slots_available} slots</span>
              )}
              {c.min_followers > 0 && (
                <span className="text-[11px] text-gray-500">{c.min_followers.toLocaleString()}+ followers</span>
              )}
              {platforms.slice(0, 3).map((p: string) => (
                <span key={p} className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{p}</span>
              ))}
              {c.application_deadline && (
                <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                  Deadline: {new Date(c.application_deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </span>
              )}
            </div>
          </div>
        );
      })}

      {/* Apply pitch modal */}
      {openPitch && (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center" style={{ background: "rgba(0,0,0,0.45)" }} onClick={() => setOpenPitch(null)}>
          <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-5 bg-white" onClick={e => e.stopPropagation()} style={{ maxHeight: "90vh", overflowY: "auto" }}>
            <h3 className="font-bold text-[15px] mb-1" style={{ color: "#1A1A2E" }}>Apply to: {openPitch.title}</h3>
            <p className="text-[12px] mb-4" style={{ color: "#6B7094" }}>{openPitch.org?.name}</p>
            <div className="space-y-3">
              <div>
                <label className="block text-[12px] font-bold mb-1" style={{ color: "#1A1A2E" }}>Your pitch <span style={{ color: "#9CA3C0", fontWeight: 400 }}>(optional)</span></label>
                <textarea value={pitchText} onChange={e => setPitchText(e.target.value.slice(0, 500))}
                  rows={3} placeholder="Why are you a good fit for this campaign?"
                  className="w-full outline-none text-[13px]"
                  style={{ padding: "10px 12px", borderRadius: 12, border: "1.5px solid #E8E8E8", background: "#FAFAFA", resize: "none" }} />
              </div>
              <div>
                <label className="block text-[12px] font-bold mb-1" style={{ color: "#1A1A2E" }}>Primary platform</label>
                <select value={pitchPlatform} onChange={e => setPitchPlatform(e.target.value)}
                  className="w-full outline-none text-[13px] cursor-pointer"
                  style={{ padding: "10px 12px", borderRadius: 12, border: "1.5px solid #E8E8E8", background: "#FAFAFA" }}>
                  <option value="">Select platform</option>
                  {Object.entries(PLATFORM_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-[12px] font-bold mb-1" style={{ color: "#1A1A2E" }}>Followers / subscribers</label>
                  <input type="number" value={pitchFollowers} onChange={e => setPitchFollowers(e.target.value)}
                    placeholder="e.g. 5000"
                    className="w-full outline-none text-[13px]"
                    style={{ padding: "10px 12px", borderRadius: 12, border: "1.5px solid #E8E8E8", background: "#FAFAFA" }} />
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-bold mb-1" style={{ color: "#1A1A2E" }}>Portfolio / profile link <span style={{ color: "#9CA3C0", fontWeight: 400 }}>(optional)</span></label>
                <input type="url" value={pitchPortfolio} onChange={e => setPitchPortfolio(e.target.value)}
                  placeholder="https://..."
                  className="w-full outline-none text-[13px]"
                  style={{ padding: "10px 12px", borderRadius: 12, border: "1.5px solid #E8E8E8", background: "#FAFAFA" }} />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setOpenPitch(null)}
                  className="flex-1 cursor-pointer py-2.5 rounded-xl text-[13px] font-semibold"
                  style={{ background: "#F5F5F5", color: "#1A1A2E", border: "none" }}>Cancel</button>
                <button type="button" onClick={handleApply} disabled={submitting}
                  className="flex-1 cursor-pointer py-2.5 rounded-xl text-[13px] font-bold disabled:opacity-50"
                  style={{ background: "#FF5A1F", color: "#fff", border: "none" }}>
                  {submitting ? "Sending..." : "Send application"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Opportunities;

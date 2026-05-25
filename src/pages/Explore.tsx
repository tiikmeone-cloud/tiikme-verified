import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, X, AlertCircle } from "lucide-react";
import { cleanUsername } from "@/lib/cleanUsername";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { sendNotification } from "@/lib/notify";
import { PersonCard, OrgCard, TrendingPostCard, TopicPill } from "@/components/explore/ExploreCard";
import CircleCard from "@/components/explore/CircleCard";
import HorizontalCarousel from "@/components/explore/HorizontalCarousel";
import AvatarSquare from "@/components/ui/AvatarSquare";
import { getOrgTypeConfig } from "@/lib/orgTypes";
import { sendConnectionRequest } from "@/hooks/useConnectionStatus";
import { PageSEO } from "@/hooks/usePageSEO";

/* ─────────── Helpers ─────────── */
const HASHTAG_RE = /#([\p{L}0-9_]{2,40})/gu;
const lower = (s?: string | null) => (s || "").toLowerCase();
const overlap = (a: string[], b: string[]) => {
  if (!a.length || !b.length) return false;
  const A = new Set(a.map(lower));
  return b.some(x => A.has(lower(x)));
};

type SectionKey = "people" | "circles" | "orgs" | "posts" | "hashtags";
const SECTIONS: { key: SectionKey; label: string }[] = [
  { key: "people", label: "People" },
  { key: "circles", label: "Circles" },
  { key: "orgs", label: "Organizations" },
  { key: "posts", label: "Top Posts" },
  { key: "hashtags", label: "Hashtags" },
];

/* ─────────── Section helpers (responsive grid w/ section header) ─────────── */
const SectionGrid = ({
  sectionRef, title, count, cols, children,
}: {
  sectionRef: (el: HTMLDivElement | null) => void;
  title: string;
  count: number;
  cols: string;
  children: React.ReactNode;
}) => (
  <section ref={sectionRef} style={{ marginBottom: 28 }}>
    <div className="flex items-center" style={{ marginBottom: 12 }}>
      <div style={{ width: 3, height: 18, borderRadius: 2, background: "#E8733A", marginRight: 8, flexShrink: 0 }} />
      <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", flex: 1, margin: 0 }}>{title}</h2>
      <span className="num" style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: 8 }}>{count}</span>
    </div>
    <div className={`grid gap-3 md:gap-4 ${cols}`}>
      {children}
    </div>
  </section>
);

/* GridCell breaks the 280px hardcoded width on the inner card so it
 * fills the grid track instead of overflowing. */
const GridCell = ({ children }: { children: React.ReactNode }) => (
  <div className="min-w-0 [&>article]:!w-full [&>article]:!min-w-0">
    {children}
  </div>
);

const clampTwoLinesStyle = {
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical" as const,
  overflow: "hidden",
  overflowWrap: "anywhere" as const,
  wordBreak: "break-word" as const,
};


const Explore = () => {
  const { user, profile } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [focused, setFocused] = useState(false);
  const mountedRef = useRef(true);

  const [strandMap, setStrandMap] = useState<Record<string, string>>({});
  const [followMap, setFollowMap] = useState<Record<string, boolean>>({});
  const [memberMap, setMemberMap] = useState<Record<string, boolean>>({});
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [activeFilter, setActiveFilter] = useState<SectionKey | null>(null);

  const sectionRefs = useRef<Record<SectionKey, HTMLDivElement | null>>({
    people: null, circles: null, orgs: null, posts: null, hashtags: null,
  });

  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

  /* ─────────── Search (debounced) — also dedupes people the viewer
   *  has already requested or connected with, using the live strandMap. */
  useEffect(() => {
    if (search.trim().length < 2) { setSearchResults([]); setShowSearchResults(false); return; }
    const t = setTimeout(async () => {
      const term = `%${search}%`;
      const [{ data: profiles }, { data: orgs }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, username, avatar_url, role")
          .eq("is_public", true).neq("id", user?.id || "")
          .or(`full_name.ilike.${term},username.ilike.${term}`).limit(8),
        supabase.from("organizations").select("id, name, slug, type, subtype, logo_url")
          .or(`name.ilike.${term}`).limit(5),
      ]);
      const results: any[] = [];
      (profiles || []).forEach(p => {
        const st = strandMap[p.id];
        if (st === "accepted" || st === "pending") return;   // dedupe
        results.push({ ...p, kind: "person" });
      });
      (orgs || []).forEach(o => results.push({ ...o, kind: "org" }));
      if (mountedRef.current) { setSearchResults(results.slice(0, 8)); setShowSearchResults(true); }
    }, 300);
    return () => clearTimeout(t);
  }, [search, user?.id, strandMap]);

  /* ─────────── Profile signals ─────────── */
  const viewerInterests = useMemo(() => {
    const set = new Set<string>();
    ((profile as any)?.interests || []).forEach((i: string) => i && set.add(lower(i)));
    ((profile as any)?.skills || []).forEach((s: string) => s && set.add(lower(s)));
    if (profile?.sector) set.add(lower(profile.sector));
    return Array.from(set);
  }, [profile]);

  const profileIncomplete = !profile?.role && !profile?.location_city && viewerInterests.length === 0;

  /* ─────────── Unified fetch ─────────── */
  const fetchAll = useCallback(async () => {
    if (!user) return null;

    /* strands → exclusion + status map */
    const { data: strands } = await supabase
      .from("strands")
      .select("requester_id, receiver_id, status")
      .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`);

    const sMap: Record<string, string> = {};
    const excluded = new Set<string>([user.id]);
    (strands || []).forEach((s: any) => {
      const otherId = s.requester_id === user.id ? s.receiver_id : s.requester_id;
      if (!otherId) return;
      sMap[otherId] = s.status || "pending";
      if (s.status === "accepted" || s.status === "pending") excluded.add(otherId);
    });
    const connectedIds = new Set<string>(
      (strands || []).filter((s: any) => s.status === "accepted")
        .map((s: any) => s.requester_id === user.id ? s.receiver_id : s.requester_id)
        .filter(Boolean)
    );

    /* follows + circle membership */
    const [followsRes, myCirclesRes] = await Promise.all([
      supabase.from("org_followers").select("org_id").eq("user_id", user.id),
      supabase.from("circle_members").select("circle_id").eq("user_id", user.id),
    ]);
    const fMap: Record<string, boolean> = {};
    (followsRes.data || []).forEach((f: any) => { fMap[f.org_id] = true; });
    const mMap: Record<string, boolean> = {};
    (myCirclesRes.data || []).forEach((m: any) => { mMap[m.circle_id] = true; });

    /* ─── PEOPLE (relevance filtered, backfill with top activity) ─── */
    const { data: peopleRaw } = await supabase
      .from("profiles")
      .select("id, full_name, username, avatar_url, role, role_subtype, headline, designation, institution_name, currently_working_at, display_preference, location_city, is_verified, activity_score, privacy_settings, privacy, sector, skills, interests, role_metadata, account_type, profession_type")
      .eq("is_public", true)
      .not("full_name", "is", null)
      .neq("id", user.id)
      .order("activity_score", { ascending: false, nullsFirst: false })
      .limit(120);

    const peopleSafe = (peopleRaw || []).filter((p: any) => {
      // New canonical column `privacy.show_in_explore` (defaults true)
      const newP = (p as any).privacy as any;
      if (newP && newP.show_in_explore === false) return false;
      // Legacy fallback
      const ps = p.privacy_settings as any;
      if (ps && ps.show_in_search === false) return false;
      return !excluded.has(p.id);
    });

    const viewerProfType = (profile as any)?.profession_type;
    const matchedPeople = peopleSafe.filter((p: any) => {
      const sameProfType = viewerProfType && p.profession_type && p.profession_type === viewerProfType;
      const sameRole = profile?.role && (p.role === profile.role || (p.role_subtype && p.role_subtype === profile.role_subtype));
      const sameCity = profile?.location_city && lower(p.location_city) === lower(profile.location_city);
      const tagMatch = overlap(viewerInterests, [...(p.skills || []), ...(p.interests || []), p.sector].filter(Boolean) as string[]);
      const sameAccountType = !profile?.role && profile?.account_type && p.account_type === profile.account_type;
      return sameProfType || sameRole || sameCity || tagMatch || sameAccountType;
    });

    /* backfill so the carousel never feels dead */
    const peopleSet = new Set(matchedPeople.map((p: any) => p.id));
    const backfill = peopleSafe.filter((p: any) => !peopleSet.has(p.id)).slice(0, Math.max(0, 20 - matchedPeople.length));
    const people = [...matchedPeople, ...backfill].slice(0, 20);

    /* ─── ORGS (top by followers, exclude already followed) ─── */
    const { data: orgsRaw } = await supabase
      .from("organizations")
      .select("id, name, slug, type, subtype, logo_url, city, state, followers_count, created_by, created_at, description")
      .order("followers_count", { ascending: false, nullsFirst: false })
      .limit(40);
    const orgs = (orgsRaw || []).filter((o: any) => !fMap[o.id]).slice(0, 10);

    /* ─── CIRCLES (relevance + popular) ─── */
    const { data: circlesRaw } = await supabase
      .from("circles")
      .select("id, name, slug, description, icon_url, member_count, active_7d, type, created_by, created_at")
      .eq("visibility", "public")
      .order("member_count", { ascending: false, nullsFirst: false })
      .order("active_7d", { ascending: false, nullsFirst: false })
      .limit(40);

    const notMember = (circlesRaw || []).filter((c: any) => !mMap[c.id]);
    const circleMatched = notMember.filter((c: any) => {
      const hay = `${c.name || ""} ${c.type || ""}`.toLowerCase();
      if (profile?.sector && hay.includes(lower(profile.sector))) return true;
      if (profile?.role && hay.includes(lower(profile.role))) return true;
      if (profile?.location_city && hay.includes(lower(profile.location_city))) return true;
      if (viewerInterests.some(t => hay.includes(t))) return true;
      return false;
    });
    const circleSet = new Set(circleMatched.map((c: any) => c.id));
    const circleBackfill = notMember.filter((c: any) => !circleSet.has(c.id)).slice(0, Math.max(0, 20 - circleMatched.length));
    const circles = [...circleMatched, ...circleBackfill].slice(0, 20);

    /* ─── TOP POSTS (interest-tag overlap or from connections, < 48h) ─── */
    const twoDaysAgo = new Date(Date.now() - 48 * 3600000).toISOString();
    const { data: postsRaw } = await supabase
      .from("posts")
      .select("id, content, author_id, reactions, comment_count, created_at, image_urls, hashtags")
      .gte("created_at", twoDaysAgo)
      .eq("visibility", "everyone")
      .order("created_at", { ascending: false })
      .limit(80);

    const scoredPosts = (postsRaw || [])
      .map((p: any) => {
        const r = (p.reactions || {}) as Record<string, number>;
        const reactionCount = (r.useful || 0) + (r.inspiring || 0) + (r.insightful || 0) + (r.like || 0);
        const interestMatch = overlap(viewerInterests, p.hashtags || []);
        const fromConnection = connectedIds.has(p.author_id);
        return { ...p, _engagement: reactionCount + (p.comment_count || 0), _relevant: interestMatch || fromConnection };
      })
      .filter((p: any) => p._relevant || p._engagement > 0);

    scoredPosts.sort((a: any, b: any) => {
      if (a._relevant !== b._relevant) return a._relevant ? -1 : 1;
      return b._engagement - a._engagement;
    });
    const posts = scoredPosts.slice(0, 5);

    const authorIds = [...new Set(posts.map((p: any) => p.author_id).filter(Boolean))];
    const postAuthors: Record<string, any> = {};
    if (authorIds.length) {
      const { data: authors } = await supabase.from("profiles").select("id, full_name, avatar_url").in("id", authorIds);
      (authors || []).forEach((a: any) => { postAuthors[a.id] = a; });
    }

    /* ─── TRENDING HASHTAGS (last 7 days, posts + circle_posts) ─── */
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600000).toISOString();
    const [{ data: feedTags }, { data: cpTags }] = await Promise.all([
      supabase.from("posts").select("hashtags").gte("created_at", sevenDaysAgo).limit(500),
      supabase.from("circle_posts").select("body").gte("created_at", sevenDaysAgo).limit(500),
    ]);
    const tagCount: Record<string, number> = {};
    (feedTags || []).forEach((row: any) => {
      (row.hashtags || []).forEach((h: string) => {
        const k = lower(h).replace(/^#/, "");
        if (k) tagCount[k] = (tagCount[k] || 0) + 1;
      });
    });
    (cpTags || []).forEach((row: any) => {
      const text = row.body || "";
      const matches = text.matchAll(HASHTAG_RE);
      for (const m of matches) {
        const k = lower(m[1]);
        if (k) tagCount[k] = (tagCount[k] || 0) + 1;
      }
    });
    const hashtags = Object.entries(tagCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));

    return { sMap, fMap, mMap, people, orgs, circles, posts, postAuthors, hashtags };
  }, [user?.id, profile?.role, profile?.role_subtype, profile?.location_city, profile?.sector, profile?.account_type, (profile as any)?.profession_type, viewerInterests.join(",")]);

  const { data: exploreData, isLoading } = useQuery({
    queryKey: ["explore-sectioned", user?.id, (profile as any)?.profession_type],
    queryFn: fetchAll,
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (exploreData) {
      setStrandMap(exploreData.sMap);
      setFollowMap(exploreData.fMap);
      setMemberMap(exploreData.mMap);
    }
  }, [exploreData]);

  /* ─────────── Actions ─────────── */
  const handleStrand = async (personId: string) => {
    if (!user) return;
    // Optimistic: drop the card from People you may know immediately so
    // the list never re-shows someone we just requested.
    qc.setQueryData(["explore-sectioned", user.id], (old: any) =>
      old ? { ...old, people: (old.people || []).filter((p: any) => p.id !== personId) } : old
    );
    setStrandMap(prev => ({ ...prev, [personId]: "pending" }));
    const result = await sendConnectionRequest(user.id, personId, profile?.full_name || "Someone");
    if (result === null) {
      // request already existed — keep the card hidden, don't roll back
      return;
    }
    setStrandMap(prev => ({ ...prev, [personId]: result }));
    toast.success(result === "accepted" ? "Connected!" : "Request sent");
  };

  const toggleFollow = async (orgId: string, createdBy?: string) => {
    if (!user) return;
    if (followMap[orgId]) {
      await supabase.from("org_followers").delete().eq("org_id", orgId).eq("user_id", user.id);
      setFollowMap(prev => ({ ...prev, [orgId]: false }));
    } else {
      await supabase.from("org_followers").insert({ org_id: orgId, user_id: user.id });
      setFollowMap(prev => ({ ...prev, [orgId]: true }));
      if (createdBy) {
        sendNotification({
          userId: createdBy, actorId: user.id, type: "follow",
          title: `${profile?.full_name || "Someone"} started following your organization`,
          actionUrl: `/app/explore`,
        });
      }
    }
  };

  const joinCircle = async (circleId: string) => {
    if (!user) return;
    const { error } = await supabase.from("circle_members").insert({ circle_id: circleId, user_id: user.id });
    if (error) { toast.error("Couldn't join"); return; }
    setMemberMap(prev => ({ ...prev, [circleId]: true }));
    toast.success("Joined circle");
  };

  const toggleSectionFilter = (k: SectionKey) => {
    setActiveFilter(prev => {
      const next = prev === k ? null : k;
      if (next) {
        requestAnimationFrame(() => {
          sectionRefs.current[next]?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }
      return next;
    });
  };

  const getOrgNavigateTo = (org: any) => org.slug ? `/org/${org.slug}` : "#";

  const showPeople = (exploreData?.people.length ?? 0) > 0;
  const showCircles = (exploreData?.circles.length ?? 0) > 0;
  const showOrgs = (exploreData?.orgs.length ?? 0) > 0;
  const showPosts = (exploreData?.posts.length ?? 0) > 0;
  const showHashtags = (exploreData?.hashtags.length ?? 0) > 0;
  const anyContent = showPeople || showCircles || showOrgs || showPosts || showHashtags;

  return (
    <main className="mx-auto max-w-6xl px-4 md:px-6 pt-4 pb-24 md:pb-12">
      <PageSEO
        title="Explore Verified Professionals & Organizations | Tiikme"
        description="Discover verified professionals, organizations, trending opportunities, and circles on Tiikme — India's professional identity network."
        canonical="https://tiikme.com/app/explore"
        ogType="website"
        twitterCard="summary_large_image"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "SearchResultsPage",
          name: "Explore | Tiikme",
          description: "Discover verified professionals and organizations on Tiikme",
          url: "https://tiikme.com/app/explore",
          isPartOf: { "@type": "WebSite", name: "Tiikme", url: "https://tiikme.com" },
        }}
      />
      {/* Sticky top bar */}
      <div style={{ position: "sticky", top: 0, zIndex: 20, background: "var(--bg-base)", paddingBottom: 12 }}>
        {/* Search */}
        <div className="relative">
          <Search className="absolute" style={{ left: 16, top: "50%", transform: "translateY(-50%)", width: 20, height: 20, color: "var(--text-muted)" }} />
          <input type="text" value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => { setFocused(false); setShowSearchResults(false); }, 200)}
            placeholder="Search people, companies, circles..."
            className="w-full outline-none"
            style={{
              height: 48, borderRadius: 16, paddingLeft: 48, paddingRight: 16, fontSize: 14, fontWeight: 400,
              background: "#FFFFFF",
              border: focused ? "1px solid rgba(232,115,58,0.50)" : "1px solid #E5E7EB",
              boxShadow: focused ? "0 0 0 3px rgba(232,115,58,0.10)" : "none",
              color: "#1A1A2E", transition: "border-color 150ms, box-shadow 150ms",
            }} />
          {search && (
            <button type="button" onClick={() => setSearch("")} className="absolute" style={{ right: 16, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }} aria-label="Clear search">
              <X style={{ width: 16, height: 16 }} />
            </button>
          )}

          {showSearchResults && searchResults.length > 0 && (
            <div className="absolute w-full overflow-y-auto" style={{
              marginTop: 4, maxHeight: 320, padding: 4, borderRadius: 12, zIndex: 30,
              background: "#FFFFFF",
              border: "1px solid #E5E7EB",
              boxShadow: "0 8px 32px rgba(26,26,78,0.12)",
            }}>
              {searchResults.map((r: any) => (
                <button key={r.id} type="button"
                  className="w-full flex items-start text-left"
                  style={{ gap: 10, padding: 10, borderRadius: 8, transition: "background 100ms", cursor: "pointer", background: "transparent", border: "none" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-card-hover)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                  onClick={() => { navigate(r.kind === "person" ? `/app/profile/${r.id}` : `/org/${r.slug}`); setShowSearchResults(false); setSearch(""); }}>
                  <AvatarSquare src={r.avatar_url || r.logo_url} name={r.full_name || r.name || "?"} size={32} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", lineHeight: "17px", ...clampTwoLinesStyle }}>{r.full_name || r.name}</p>
                    {r.kind === "person" ? (
                      <p style={{ fontSize: 12, fontWeight: 400, color: "var(--text-muted)", marginTop: 2, lineHeight: "16px", ...clampTwoLinesStyle }}>@{cleanUsername(r.username) || "user"}</p>
                    ) : (() => {
                      const conf = getOrgTypeConfig(r.type);
                      return (
                        <span style={{
                          display: "inline-flex", alignItems: "center", flexWrap: "wrap", gap: 4, marginTop: 4,
                          padding: "3px 7px", borderRadius: 6,
                          fontSize: 9, fontWeight: 700, letterSpacing: 0.3,
                          background: conf.bg, color: conf.color, textTransform: "uppercase",
                        }}>
                          {conf.label}
                          {r.subtype && <span style={{ opacity: 0.7, textTransform: "none", fontWeight: 500, maxWidth: 160, ...clampTwoLinesStyle }}>· {r.subtype}</span>}
                        </span>
                      );
                    })()}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Section nav pills */}
        <div className="flex overflow-x-auto" style={{ gap: 8, marginTop: 12, paddingBottom: 4, scrollbarWidth: "none" }}>
          {SECTIONS.map(s => {
            const isActive = activeFilter === s.key;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => toggleSectionFilter(s.key)}
                className="cursor-pointer transition-all active:scale-95 hover:opacity-90"
                style={{
                  flexShrink: 0, padding: "0 16px", height: 32, borderRadius: 999,
                  fontSize: 13, fontWeight: 600, whiteSpace: "nowrap",
                  background: isActive ? "#FF5A1F" : "#FFFFFF",
                  border: isActive ? "1px solid #FF5A1F" : "1px solid #E5E7EB",
                  color: isActive ? "#FFFFFF" : "#6B7094",
                  boxShadow: isActive ? "0 4px 12px rgba(249,115,22,0.25)" : "none",
                }}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Profile-incomplete banner */}
      {profileIncomplete && !isLoading && (
        <div className="flex items-center" style={{
          gap: 12, padding: 14, marginTop: 16, borderRadius: 12,
          background: "rgba(232,115,58,0.08)", border: "1px solid rgba(232,115,58,0.20)",
        }}>
          <AlertCircle style={{ width: 20, height: 20, color: "#E8733A", flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>Complete your profile for better picks</p>
            <p style={{ fontSize: 12, fontWeight: 400, color: "var(--text-secondary)", margin: 0 }}>Add your role, city and interests to personalize Explore.</p>
          </div>
          <Link to="/app/profile" style={{
            padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
            background: "#E8733A", color: "#fff", textDecoration: "none", whiteSpace: "nowrap",
          }}>Edit profile</Link>
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && !exploreData && (
        <div style={{ marginTop: 16 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ marginBottom: 24 }}>
              <div style={{ height: 18, width: 160, borderRadius: 4, background: "var(--bg-card)", marginBottom: 12 }} />
              <div className="flex" style={{ gap: 10 }}>
                {[1, 2, 3, 4].map(j => (
                  <div key={j} style={{ height: 110, width: 280, flexShrink: 0, borderRadius: 12, background: "var(--bg-card)" }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sections */}
      <div style={{ marginTop: 18 }}>
        {showPeople && (!activeFilter || activeFilter === "people") && (
          <SectionGrid
            sectionRef={el => { sectionRefs.current.people = el; }}
            title="People you may know"
            count={exploreData!.people.length}
            cols="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {exploreData!.people.slice(0, 12).map(p => (
              <GridCell key={p.id}>
                <PersonCard
                  p={p}
                  strandStatus={strandMap[p.id] || "none"}
                  onStrand={() => handleStrand(p.id)}
                  currentUserId={user?.id}
                />
              </GridCell>
            ))}
          </SectionGrid>
        )}

        {showCircles && (!activeFilter || activeFilter === "circles") && (
          <SectionGrid
            sectionRef={el => { sectionRefs.current.circles = el; }}
            title="Circles for you"
            count={exploreData!.circles.length}
            cols="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          >
            {exploreData!.circles.slice(0, 9).map(c => (
              <GridCell key={c.id}>
                <CircleCard
                  circle={c}
                  isMember={!!memberMap[c.id]}
                  onJoin={(e) => { e.stopPropagation(); joinCircle(c.id); }}
                />
              </GridCell>
            ))}
          </SectionGrid>
        )}

        {showOrgs && (!activeFilter || activeFilter === "orgs") && (
          <SectionGrid
            sectionRef={el => { sectionRefs.current.orgs = el; }}
            title="Organizations to discover"
            count={exploreData!.orgs.length}
            cols="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          >
            {exploreData!.orgs.slice(0, 9).map(o => (
              <GridCell key={o.id}>
                <OrgCard
                  org={o}
                  following={!!followMap[o.id]}
                  onToggleFollow={() => toggleFollow(o.id, o.created_by)}
                  navigateTo={getOrgNavigateTo(o)}
                />
              </GridCell>
            ))}
          </SectionGrid>
        )}

        {showPosts && (!activeFilter || activeFilter === "posts") && (
          <div ref={el => { sectionRefs.current.posts = el; }}>
            <HorizontalCarousel title="Top posts" count={exploreData!.posts.length}>
              {exploreData!.posts.map(p => (
                <div key={p.id} style={{ scrollSnapAlign: "start", flexShrink: 0, width: "min(320px, calc(100vw - 48px))" }}>
                  <TrendingPostCard post={p} authorProfile={exploreData!.postAuthors[p.author_id]} />
                </div>
              ))}
            </HorizontalCarousel>
          </div>
        )}

        {showHashtags && (!activeFilter || activeFilter === "hashtags") && (
          <div ref={el => { sectionRefs.current.hashtags = el; }} style={{ marginBottom: 24 }}>
            <div className="flex items-center" style={{ marginBottom: 10 }}>
              <div style={{ width: 3, height: 18, borderRadius: 2, background: "#E8733A", marginRight: 8, flexShrink: 0 }} />
              <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", flex: 1, margin: 0 }}>Trending hashtags</h2>
              <span style={{ fontSize: 12, fontWeight: 400, color: "var(--text-muted)", marginLeft: 8 }}>{exploreData!.hashtags.length}</span>
            </div>
            <div className="flex overflow-x-auto" style={{ gap: 8, paddingBottom: 4, scrollbarWidth: "none" }}>
              {exploreData!.hashtags.map(h => (
                <TopicPill
                  key={h.tag}
                  tag={h.tag}
                  count={h.count}
                  onClick={() => navigate(`/tag/${encodeURIComponent(h.tag)}`)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Empty state */}
      {!isLoading && !anyContent && (
        <div style={{ textAlign: "center", padding: "64px 0" }}>
          <Search style={{ width: 48, height: 48, margin: "0 auto 12px", color: "var(--text-muted)" }} />
          <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>Nothing to show yet</p>
          <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>Add interests or grow your network to see more.</p>
        </div>
      )}
    </main>
  );
};

export default Explore;

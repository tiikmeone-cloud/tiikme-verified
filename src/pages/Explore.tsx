import { useState, useEffect, useCallback, useRef } from "react";
import { Search, X } from "lucide-react";
import { cleanUsername } from "@/lib/cleanUsername";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { sendNotification } from "@/lib/notify";
import { calculateExploreScore } from "@/lib/algorithms";
import HorizontalCarousel from "@/components/explore/HorizontalCarousel";
import { PersonCard, OrgCard, TrendingPostCard, TopicPill, StartupCard, InvestorCard } from "@/components/explore/ExploreCard";
import AvatarSquare from "@/components/ui/AvatarSquare";

const FILTER_TABS = ["All", "People", "Companies", "Colleges", "Hospitals", "Government", "NGO", "Startups", "Investors", "Trending"];

const Explore = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [focused, setFocused] = useState(false);
  const mountedRef = useRef(true);

  const [people, setPeople] = useState<any[]>([]);
  const [strandMap, setStrandMap] = useState<Record<string, string>>({});
  const [companies, setCompanies] = useState<any[]>([]);
  const [colleges, setColleges] = useState<any[]>([]);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [govOrgs, setGovOrgs] = useState<any[]>([]);
  const [ngos, setNgos] = useState<any[]>([]);
  const [trendingTopics, setTrendingTopics] = useState<{ tag: string; count: number }[]>([]);
  const [trendingPosts, setTrendingPosts] = useState<any[]>([]);
  const [postAuthors, setPostAuthors] = useState<Record<string, any>>({});
  const [followMap, setFollowMap] = useState<Record<string, boolean>>({});
  const [startups, setStartups] = useState<any[]>([]);
  const [investors, setInvestors] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

  // Search
  useEffect(() => {
    if (search.trim().length < 2) { setSearchResults([]); setShowSearchResults(false); return; }
    const t = setTimeout(async () => {
      const term = `%${search}%`;
      const [{ data: profiles }, { data: orgs }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, username, avatar_url, role").eq("is_public", true).or(`full_name.ilike.${term},username.ilike.${term}`).limit(5),
        supabase.from("organizations").select("id, name, slug, type, logo_url").or(`name.ilike.${term}`).limit(5),
      ]);
      const results: any[] = [];
      (profiles || []).forEach(p => results.push({ ...p, kind: "person" }));
      (orgs || []).forEach(o => results.push({ ...o, kind: "org" }));
      if (mountedRef.current) { setSearchResults(results); setShowSearchResults(true); }
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  // Data fetch
  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Strands
      const { data: strands } = await supabase.from("strands")
        .select("requester_id, receiver_id, status")
        .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`);
      const sMap: Record<string, string> = {};
      const connectedIds = new Set<string>();
      (strands || []).forEach((s: any) => {
        const otherId = s.requester_id === user.id ? s.receiver_id : s.requester_id;
        if (otherId) {
          sMap[otherId] = s.status || "pending";
          if (s.status === "accepted") connectedIds.add(otherId);
        }
      });
      if (mountedRef.current) setStrandMap(sMap);

      // Follows
      const { data: follows } = await supabase.from("org_followers").select("org_id").eq("user_id", user.id);
      const fMap: Record<string, boolean> = {};
      (follows || []).forEach((f: any) => { fMap[f.org_id] = true; });
      if (mountedRef.current) setFollowMap(fMap);

      // Also collect pending ids to exclude
      const excludedIds = new Set<string>();
      (strands || []).forEach((s: any) => {
        const otherId = s.requester_id === user.id ? s.receiver_id : s.requester_id;
        if (otherId && (s.status === "accepted" || s.status === "pending")) excludedIds.add(otherId);
      });

      const show = (cat: string) => activeFilter === "All" || activeFilter === cat;

      // People — filter out connected AND pending users
      if (show("People")) {
        const { data } = await supabase.from("profiles")
          .select("id, full_name, username, avatar_url, role, headline, institution_name, location_city, is_verified, activity_score, privacy_settings, sector, skills, location_state")
          .eq("is_public", true).not("full_name", "is", null).neq("id", user.id)
          .order("activity_score", { ascending: false }).limit(60);
        const filtered = (data || []).filter((p: any) => {
          const ps = p.privacy_settings as any;
          if (ps && ps.show_in_search === false) return false;
          if (excludedIds.has(p.id)) return false;
          return true;
        });
        // PYMK scoring
        filtered.sort((a: any, b: any) => {
          let aS = 0, bS = 0;
          if (profile?.sector && a.sector === profile.sector) aS += 20;
          if (profile?.sector && b.sector === profile.sector) bS += 20;
          if (profile?.location_city && a.location_city === profile.location_city) aS += 15;
          if (profile?.location_city && b.location_city === profile.location_city) bS += 15;
          // Skill overlap
          const mySkills = new Set(profile?.skills || []);
          const aOverlap = (a.skills || []).filter((s: string) => mySkills.has(s)).length;
          const bOverlap = (b.skills || []).filter((s: string) => mySkills.has(s)).length;
          aS += Math.min(aOverlap * 2, 10);
          bS += Math.min(bOverlap * 2, 10);
          aS += Math.min((a.activity_score || 0) / 10, 10);
          bS += Math.min((b.activity_score || 0) / 10, 10);
          if (a.is_verified) aS += 13;
          if (b.is_verified) bS += 13;
          return bS - aS;
        });
        if (mountedRef.current) setPeople(filtered.slice(0, 20));
      } else { setPeople([]); }

      // Orgs — with explore ranking
      const rankItems = (items: any[]) => {
        if (!profile) return items;
        return items
          .map(item => ({
            ...item,
            _exploreScore: calculateExploreScore({
              page: { industry: item.industry || item.type, city: item.city, state: item.state, tracker_count: item.tracker_count || item.followers_count || 0, trust_score: item.trust_score || 0, created_at: item.created_at },
              userProfile: { sector: profile.sector, location_city: profile.location_city, location_state: profile.location_state },
            }),
          }))
          .sort((a: any, b: any) => b._exploreScore - a._exploreScore);
      };

      // Get followed org ids and tracked page ids to exclude
      const followedOrgIds = new Set(Object.keys(fMap).filter(k => fMap[k]));
      const { data: trackedPages } = await supabase.from("page_trackers").select("page_id").eq("user_id", user.id);
      const trackedPageIds = new Set((trackedPages || []).map((t: any) => t.page_id));

      const fetchOrgs = async (type: string) => {
        const { data } = await supabase.from("organizations")
          .select("id, name, slug, type, logo_url, city, state, followers_count, created_by, created_at")
          .eq("type", type).order("followers_count", { ascending: false }).limit(40);
        return rankItems((data || []).filter((o: any) => !followedOrgIds.has(o.id)));
      };
      const fetchPages = async (pageType: string) => {
        const { data } = await supabase.from("pages")
          .select("id, name, slug, page_type, logo_url, city, state, industry, naac_grade, nabh_accredited, specialisations, tracker_count, trust_score, created_at")
          .eq("page_type", pageType).order("tracker_count", { ascending: false }).limit(40);
        return rankItems((data || []).filter((p: any) => !trackedPageIds.has(p.id)).map((p: any) => ({ ...p, type: p.page_type })));
      };

      const [companyData, collegeData, hospitalData, govData, ngoData] = await Promise.all([
        show("Companies") ? fetchOrgs("company") : Promise.resolve([]),
        show("Colleges") ? fetchPages("college").then(async pages => {
          const { data: eduOrgs } = await supabase.from("organizations").select("id, name, slug, type, logo_url, city, followers_count, created_by").eq("type", "education").order("followers_count", { ascending: false }).limit(20);
          return [...pages, ...(eduOrgs || [])];
        }) : Promise.resolve([]),
        show("Hospitals") ? fetchPages("hospital") : Promise.resolve([]),
        show("Government") ? Promise.all([fetchPages("government"), fetchOrgs("government")]).then(([a, b]) => [...a, ...b]) : Promise.resolve([]),
        show("NGO") ? Promise.all([fetchPages("ngo"), fetchOrgs("ngo")]).then(([a, b]) => [...a, ...b]) : Promise.resolve([]),
      ]);

      if (mountedRef.current) {
        setCompanies(companyData); setColleges(collegeData);
        setHospitals(hospitalData); setGovOrgs(govData); setNgos(ngoData);
      }

      // Trending topics
      if (show("All")) {
        const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
        const { data: recentPosts } = await supabase.from("posts")
          .select("hashtags").not("hashtags", "is", null).gte("created_at", weekAgo).limit(500);
        const tagCount: Record<string, number> = {};
        (recentPosts || []).forEach((p: any) => { (p.hashtags || []).forEach((h: string) => { tagCount[h] = (tagCount[h] || 0) + 1; }); });
        const sorted = Object.entries(tagCount).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([tag, count]) => ({ tag, count }));
        if (mountedRef.current) setTrendingTopics(sorted);

        // Trending posts
        const twoDaysAgo = new Date(Date.now() - 48 * 3600000).toISOString();
        const { data: hotPosts } = await supabase.from("posts")
          .select("id, content, author_id, reactions, comment_count, created_at, image_urls")
          .gte("created_at", twoDaysAgo).eq("visibility", "everyone")
          .order("comment_count", { ascending: false }).limit(15);
        const sorted2 = (hotPosts || []).map((p: any) => ({
          ...p, _engagement: (p.reactions?.useful || 0) + (p.reactions?.inspiring || 0) + (p.reactions?.insightful || 0) + (p.comment_count || 0)
        })).sort((a: any, b: any) => b._engagement - a._engagement).slice(0, 10);
        if (mountedRef.current) setTrendingPosts(sorted2);

        const authorIds = [...new Set(sorted2.map((p: any) => p.author_id).filter(Boolean))];
        if (authorIds.length) {
          const { data: authors } = await supabase.from("profiles").select("id, full_name, avatar_url").in("id", authorIds);
          const aMap: Record<string, any> = {};
          (authors || []).forEach((a: any) => { aMap[a.id] = a; });
          if (mountedRef.current) setPostAuthors(aMap);
        }

        // Startups
        if (show("Startups") || activeFilter === "All") {
          const { data: spData } = await supabase.from("startup_profiles")
            .select("id, page_id, funding_stage, sectors, looking_for_funding, founder_id")
            .eq("looking_for_funding", true).limit(20);
          if (spData && spData.length > 0) {
            const pageIds = spData.map((s: any) => s.page_id).filter(Boolean);
            const { data: pages } = await supabase.from("pages").select("id, name, slug, logo_url").in("id", pageIds);
            const pageMap = new Map((pages || []).map((p: any) => [p.id, p]));
            if (mountedRef.current) setStartups(spData.map((s: any) => ({ ...s, page: pageMap.get(s.page_id) })));
          } else { if (mountedRef.current) setStartups([]); }
        }

        // Investors
        if (show("Investors") || activeFilter === "All") {
          const { data: allProfiles } = await supabase.from("profiles")
            .select("id, full_name, avatar_url, role_metadata")
            .eq("is_public", true).neq("id", user.id)
            .not("role_metadata", "is", null).limit(200);
          const investorProfiles = (allProfiles || []).filter((p: any) => {
            const meta = p.role_metadata as any;
            return meta?.is_investor === true || meta?.investor_profile;
          }).slice(0, 20);
          if (mountedRef.current) setInvestors(investorProfiles);
        }
      }
    } catch (err) { console.warn("[Explore] fetch error:", err); }
    if (mountedRef.current) setLoading(false);
  }, [user, activeFilter, profile?.sector, profile?.location_city, profile?.skills]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleStrand = async (personId: string) => {
    if (!user) return;
    // Duplicate check
    const { data: existing } = await supabase.from("strands").select("id")
      .or(`and(requester_id.eq.${user.id},receiver_id.eq.${personId}),and(requester_id.eq.${personId},receiver_id.eq.${user.id})`)
      .maybeSingle();
    if (existing) return;
    await supabase.from("strands").insert({ requester_id: user.id, receiver_id: personId });
    setStrandMap(prev => ({ ...prev, [personId]: "pending" }));
    sendNotification({
      userId: personId, actorId: user.id, type: "connection_request",
      title: `${profile?.full_name || "Someone"} wants to connect`, actionUrl: `/app/connections`,
      data: { actor_id: user.id },
    });
    toast.success("Request sent");
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

  const getOrgNavigateTo = (org: any) => org.slug ? (org.page_type ? `/page/${org.slug}` : `/org/${org.slug}`) : "#";

  const renderOrgCarousel = (title: string, data: any[]) => {
    if (data.length === 0) return null;
    return (
      <HorizontalCarousel title={title} count={data.length}>
        {data.map((org: any) => (
          <OrgCard key={org.id} org={org} following={!!followMap[org.id]}
            onToggleFollow={() => toggleFollow(org.id, org.created_by)}
            navigateTo={getOrgNavigateTo(org)} />
        ))}
      </HorizontalCarousel>
    );
  };

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: 16 }}>
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute" style={{ left: 16, top: "50%", transform: "translateY(-50%)", width: 20, height: 20, color: "var(--text-muted)" }} />
        <input type="text" value={search}
          onChange={e => setSearch(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => { setFocused(false); setShowSearchResults(false); }, 200)}
          placeholder="Search people, companies, colleges..."
          className="w-full outline-none"
          style={{
            height: 48, borderRadius: 16, paddingLeft: 48, paddingRight: 16, fontSize: 14, fontWeight: 400,
            background: "var(--bg-card)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
            border: focused ? "1px solid rgba(232,115,58,0.50)" : "1px solid var(--border-glass)",
            boxShadow: focused ? "0 0 0 3px rgba(232,115,58,0.10)" : "none",
            color: "var(--text-primary)", transition: "border-color 150ms, box-shadow 150ms",
          }} />
        {search && (
          <button type="button" onClick={() => setSearch("")} className="absolute" style={{ right: 16, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
            <X style={{ width: 16, height: 16 }} />
          </button>
        )}

        {/* Search dropdown */}
        {showSearchResults && searchResults.length > 0 && (
          <div className="absolute w-full overflow-y-auto" style={{
            marginTop: 4, maxHeight: 320, padding: 4, borderRadius: 12, zIndex: 30,
            background: "var(--bg-card)", backdropFilter: "blur(20px)", border: "1px solid var(--border-glass)",
            boxShadow: "0 8px 32px rgba(26,26,78,0.12)",
          }}>
            {searchResults.map((r: any) => (
              <button key={r.id} type="button"
                className="w-full flex items-center text-left"
                style={{ gap: 8, padding: 8, borderRadius: 6, transition: "background 100ms", cursor: "pointer", background: "transparent", border: "none" }}
                onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-card-hover)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                onClick={() => { navigate(r.kind === "person" ? `/app/profile/${r.id}` : `/org/${r.slug}`); setShowSearchResults(false); setSearch(""); }}>
                <AvatarSquare src={r.avatar_url || r.logo_url} name={r.full_name || r.name || "?"} size={32} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.full_name || r.name}</p>
                  <p style={{ fontSize: 12, fontWeight: 400, color: "var(--text-muted)" }}>{r.kind === "person" ? `@${cleanUsername(r.username) || "user"}` : r.type}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex overflow-x-auto" style={{ gap: 6, marginTop: 12, marginBottom: 16, scrollbarWidth: "none" }}>
        {FILTER_TABS.map(tab => (
          <button type="button" key={tab} onClick={() => setActiveFilter(tab)}
            style={{
              flexShrink: 0, height: 34, padding: "0 18px", borderRadius: 12,
              fontSize: 13, fontWeight: activeFilter === tab ? 600 : 400,
              transition: "all 150ms", cursor: "pointer", border: "none",
              ...(activeFilter === tab
                ? { background: "linear-gradient(135deg, #E8733A, #FF6B9D)", color: "white", boxShadow: "0 4px 14px rgba(232,115,58,0.25)" }
                : { background: "var(--bg-card)", border: "1px solid var(--border-glass)", color: "var(--text-primary)" }
              ),
            }}>
            {tab}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {[1, 2, 3].map(i => (
            <div key={i}>
              <div style={{ height: 18, width: 160, borderRadius: 8, background: "var(--bg-card)", marginBottom: 10 }} />
              <div className="flex" style={{ gap: 10, overflow: "hidden" }}>
                {[1, 2, 3, 4].map(j => <div key={j} style={{ width: 190, height: 200, borderRadius: 16, background: "var(--bg-card)", flexShrink: 0 }} />)}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && (
        <>
          {/* 1. People You May Know */}
          {people.length > 0 && (activeFilter === "All" || activeFilter === "People") && (
            <HorizontalCarousel title="People You May Know" count={people.length}>
              {people.map(p => (
                <PersonCard key={p.id} p={p} strandStatus={strandMap[p.id] || "none"} onStrand={() => handleStrand(p.id)} currentUserId={user?.id} />
              ))}
            </HorizontalCarousel>
          )}

          {/* 2. Trending Topics */}
          {trendingTopics.length > 0 && activeFilter === "All" && (
            <HorizontalCarousel title="Trending Topics">
              {trendingTopics.map(t => (
                <TopicPill key={t.tag} tag={t.tag} count={t.count} onClick={() => navigate(`/app/feed?tag=${t.tag}`)} />
              ))}
            </HorizontalCarousel>
          )}

          {/* 3-7. Org carousels */}
          {(activeFilter === "All" || activeFilter === "Companies") && renderOrgCarousel("Companies", companies)}
          {(activeFilter === "All" || activeFilter === "Colleges") && renderOrgCarousel("Colleges & Universities", colleges)}
          {(activeFilter === "All" || activeFilter === "Hospitals") && renderOrgCarousel("Hospitals & Healthcare", hospitals)}
          {(activeFilter === "All" || activeFilter === "Government") && renderOrgCarousel("Government Bodies", govOrgs)}
          {(activeFilter === "All" || activeFilter === "NGO") && renderOrgCarousel("NGOs & Non-Profits", ngos)}

          {/* 8. Startups */}
          {startups.length > 0 && (activeFilter === "All" || activeFilter === "Startups") && (
            <HorizontalCarousel title="Startups Looking for Funding" count={startups.length}>
              {startups.map(s => <StartupCard key={s.id} startup={s} page={s.page} />)}
            </HorizontalCarousel>
          )}

          {/* 9. Investors */}
          {investors.length > 0 && (activeFilter === "All" || activeFilter === "Investors") && (
            <HorizontalCarousel title="Active Investors" count={investors.length}>
              {investors.map(inv => <InvestorCard key={inv.id} investor={inv} />)}
            </HorizontalCarousel>
          )}

          {/* 10. Trending Posts */}
          {trendingPosts.length > 0 && activeFilter === "All" && (
            <HorizontalCarousel title="Trending Posts" count={trendingPosts.length}>
              {trendingPosts.map(post => (
                <TrendingPostCard key={post.id} post={post} authorProfile={postAuthors[post.author_id]} />
              ))}
            </HorizontalCarousel>
          )}

          {/* Empty */}
          {people.length === 0 && companies.length === 0 && colleges.length === 0 && hospitals.length === 0 && govOrgs.length === 0 && ngos.length === 0 && startups.length === 0 && investors.length === 0 && (
            <div style={{ textAlign: "center", padding: "64px 0" }}>
              <Search style={{ width: 48, height: 48, margin: "0 auto 12px", color: "var(--text-muted)" }} />
              <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>No results found</p>
              <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>Try a different search term or filter</p>
            </div>
          )}
        </>
      )}
    </main>
  );
};

export default Explore;

import { useState, useEffect, useCallback, useRef } from "react";
import { Search, X, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { sendNotification } from "@/lib/notify";
import HorizontalCarousel from "@/components/explore/HorizontalCarousel";
import { PersonCard, OrgCard, TrendingPostCard, TopicPill, StartupCard, InvestorCard } from "@/components/explore/ExploreCard";
import AvatarSquare from "@/components/ui/AvatarSquare";

const FILTER_TABS = ["All", "People", "Companies", "Colleges", "Hospitals", "Government", "NGO"];

const Explore = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [focused, setFocused] = useState(false);
  const mountedRef = useRef(true);

  // Data
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

  // Search results
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

  // Search handler
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

  // Main data fetch
  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Strands
      const { data: strands } = await supabase.from("strands")
        .select("requester_id, receiver_id, status")
        .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`);
      const sMap: Record<string, string> = {};
      (strands || []).forEach((s: any) => {
        const otherId = s.requester_id === user.id ? s.receiver_id : s.requester_id;
        if (otherId) sMap[otherId] = s.status || "pending";
      });
      if (mountedRef.current) setStrandMap(sMap);

      // Follows
      const { data: follows } = await supabase.from("org_followers").select("org_id").eq("user_id", user.id);
      const fMap: Record<string, boolean> = {};
      (follows || []).forEach((f: any) => { fMap[f.org_id] = true; });
      if (mountedRef.current) setFollowMap(fMap);

      const show = (cat: string) => activeFilter === "All" || activeFilter === cat;

      // People — relevance: same sector, same location, higher score, verified
      if (show("People")) {
        const { data } = await supabase.from("profiles")
          .select("id, full_name, username, avatar_url, role, headline, institution_name, location_city, is_verified, activity_score, privacy_settings, sector, location_state")
          .eq("is_public", true).not("full_name", "is", null).neq("id", user.id)
          .order("activity_score", { ascending: false }).limit(30);
        const filtered = (data || []).filter((p: any) => {
          const ps = p.privacy_settings as any;
          return !ps || ps.show_in_search !== false;
        });
        // Sort by relevance
        filtered.sort((a: any, b: any) => {
          let aScore = 0, bScore = 0;
          if (profile?.sector && a.sector === profile.sector) aScore += 30;
          if (profile?.sector && b.sector === profile.sector) bScore += 30;
          if (profile?.location_city && a.location_city === profile.location_city) aScore += 20;
          if (profile?.location_city && b.location_city === profile.location_city) bScore += 20;
          if (a.is_verified) aScore += 10;
          if (b.is_verified) bScore += 10;
          aScore += (a.activity_score || 0);
          bScore += (b.activity_score || 0);
          return bScore - aScore;
        });
        if (mountedRef.current) setPeople(filtered);
      } else { setPeople([]); }

      // Organizations by type
      const fetchOrgs = async (type: string) => {
        const { data } = await supabase.from("organizations")
          .select("id, name, slug, type, logo_url, city, followers_count, created_by")
          .eq("type", type).order("followers_count", { ascending: false }).limit(20);
        return data || [];
      };

      // Pages by type
      const fetchPages = async (pageType: string) => {
        const { data } = await supabase.from("pages")
          .select("id, name, slug, page_type, logo_url, city, naac_grade, nabh_accredited, specialisations, tracker_count")
          .eq("page_type", pageType).order("tracker_count", { ascending: false }).limit(20);
        return (data || []).map((p: any) => ({ ...p, type: p.page_type }));
      };

      const [companyData, collegeData, hospitalData, govData, ngoData] = await Promise.all([
        show("Companies") ? fetchOrgs("company") : Promise.resolve([]),
        show("Colleges") ? fetchPages("college").then(async pages => {
          const { data: eduOrgs } = await supabase.from("organizations").select("id, name, slug, type, logo_url, city, followers_count, created_by").eq("type", "education").order("followers_count", { ascending: false }).limit(20);
          return [...pages, ...(eduOrgs || []).map((o: any) => ({ ...o }))];
        }) : Promise.resolve([]),
        show("Hospitals") ? fetchPages("hospital") : Promise.resolve([]),
        show("Government") ? Promise.all([fetchPages("government"), fetchOrgs("government")]).then(([a, b]) => [...a, ...b]) : Promise.resolve([]),
        show("NGO") ? Promise.all([fetchPages("ngo"), fetchOrgs("ngo")]).then(([a, b]) => [...a, ...b]) : Promise.resolve([]),
      ]);

      if (mountedRef.current) {
        setCompanies(companyData);
        setColleges(collegeData);
        setHospitals(hospitalData);
        setGovOrgs(govData);
        setNgos(ngoData);
      }

      // Trending topics (hashtags from last 7 days)
      if (show("All")) {
        const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
        const { data: recentPosts } = await supabase.from("posts")
          .select("hashtags").not("hashtags", "is", null).gte("created_at", weekAgo).limit(500);
        const tagCount: Record<string, number> = {};
        (recentPosts || []).forEach((p: any) => {
          (p.hashtags || []).forEach((h: string) => { tagCount[h] = (tagCount[h] || 0) + 1; });
        });
        const sorted = Object.entries(tagCount).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([tag, count]) => ({ tag, count }));
        if (mountedRef.current) setTrendingTopics(sorted);

        // Trending posts (last 48h, highest engagement)
        const twoDaysAgo = new Date(Date.now() - 48 * 3600000).toISOString();
        const { data: hotPosts } = await supabase.from("posts")
          .select("id, content, author_id, reactions, comment_count, created_at")
          .gte("created_at", twoDaysAgo).eq("visibility", "everyone")
          .order("comment_count", { ascending: false }).limit(15);
        // Sort by total engagement
        const sorted2 = (hotPosts || []).map((p: any) => ({
          ...p,
          _engagement: (p.reactions?.useful || 0) + (p.reactions?.inspiring || 0) + (p.reactions?.insightful || 0) + (p.comment_count || 0)
        })).sort((a: any, b: any) => b._engagement - a._engagement).slice(0, 10);
        if (mountedRef.current) setTrendingPosts(sorted2);

        // Fetch author profiles for trending posts
        const authorIds = [...new Set(sorted2.map((p: any) => p.author_id).filter(Boolean))];
        if (authorIds.length) {
          const { data: authors } = await supabase.from("profiles").select("id, full_name, avatar_url").in("id", authorIds);
          const aMap: Record<string, any> = {};
          (authors || []).forEach((a: any) => { aMap[a.id] = a; });
          if (mountedRef.current) setPostAuthors(aMap);
        }
      }
    } catch (err) { console.warn("[Explore] fetch error:", err); }
    if (mountedRef.current) setLoading(false);
  }, [user, activeFilter, profile?.sector, profile?.location_city]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleStrand = async (personId: string) => {
    if (!user) return;
    await supabase.from("strands").insert({ requester_id: user.id, receiver_id: personId });
    setStrandMap(prev => ({ ...prev, [personId]: "pending" }));
    sendNotification({
      userId: personId, actorId: user.id, type: "connection_request",
      title: `${profile?.full_name || "Someone"} wants to connect`, actionUrl: `/app/strands`,
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

  const renderOrgCarousel = (title: string, data: any[], accent: string) => {
    if (data.length === 0) return null;
    return (
      <HorizontalCarousel title={title} count={data.length} accentColor={accent}>
        {data.map((org: any) => (
          <OrgCard
            key={org.id}
            org={org}
            following={!!followMap[org.id]}
            onToggleFollow={() => toggleFollow(org.id, org.created_by)}
            navigateTo={getOrgNavigateTo(org)}
          />
        ))}
      </HorizontalCarousel>
    );
  };

  const isFiltered = activeFilter !== "All";

  return (
    <main className="max-w-[1100px] mx-auto px-4 md:px-6 py-4 md:py-7">
      {/* Search bar */}
      <div className="relative mb-4">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: "var(--color-text-secondary)" }} />
        <input type="text" value={search}
          onChange={e => setSearch(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => { setFocused(false); setShowSearchResults(false); }, 200)}
          placeholder="Search people, companies, colleges..."
          className="w-full outline-none transition-all duration-200"
          style={{
            height: 48, borderRadius: 20, paddingLeft: 48, paddingRight: 56, fontSize: 14,
            background: "var(--glass-bg)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
            border: focused ? "1px solid var(--input-focus-border)" : "1px solid var(--glass-border-subtle)",
            boxShadow: focused ? "0 0 24px var(--input-focus-glow)" : "none",
            color: "var(--color-text)",
          }} />
        {search && (
          <button type="button" onClick={() => setSearch("")} className="absolute right-14 top-1/2 -translate-y-1/2 cursor-pointer" style={{ color: "var(--color-text-secondary)" }}>
            <X className="w-4 h-4" />
          </button>
        )}
        <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "var(--glass-bg)", backdropFilter: "blur(12px)", border: "1px solid var(--glass-border-subtle)" }}>
          <Filter className="w-4 h-4" style={{ color: "var(--color-accent)" }} />
        </button>

        {/* Search dropdown */}
        {showSearchResults && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 rounded-2xl overflow-hidden z-20"
            style={{ background: "var(--glass-bg)", backdropFilter: "blur(20px)", border: "1px solid var(--glass-border)", boxShadow: "0 8px 32px var(--glass-shadow)" }}>
            {searchResults.map((r: any) => (
              <button key={r.id} type="button"
                className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/10"
                onClick={() => { navigate(r.kind === "person" ? `/app/profile/${r.id}` : `/org/${r.slug}`); setShowSearchResults(false); setSearch(""); }}>
                <AvatarSquare src={r.avatar_url || r.logo_url} name={r.full_name || r.name || "?"} size={32} />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold truncate" style={{ color: "var(--color-text)" }}>{r.full_name || r.name}</p>
                  <p className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>{r.kind === "person" ? `@${r.username || "user"}` : r.type}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-5" style={{ scrollbarWidth: "none" }}>
        {FILTER_TABS.map(tab => (
          <button type="button" key={tab} onClick={() => setActiveFilter(tab)}
            className="shrink-0 px-5 py-2 rounded-full text-[13px] font-semibold transition-all"
            style={activeFilter === tab
              ? { background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-pink))", color: "#fff", border: "none", boxShadow: "0 4px 16px rgba(232,115,58,0.30)" }
              : { background: "var(--glass-bg)", backdropFilter: "blur(12px)", border: "1px solid var(--glass-border-subtle)", color: "var(--color-text)", cursor: "pointer" }
            }
          >
            {tab}
          </button>
        ))}
      </div>

      {loading && (
        <div className="space-y-6">
          {[1, 2, 3].map(i => (
            <div key={i}>
              <div className="h-5 w-40 rounded glass-skeleton mb-3" />
              <div className="flex gap-3 overflow-hidden">
                {[1, 2, 3, 4].map(j => <div key={j} className="shrink-0 rounded-2xl glass-skeleton" style={{ width: 180, height: 200 }} />)}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && (
        <>
          {/* People */}
          {people.length > 0 && (activeFilter === "All" || activeFilter === "People") && (
            <HorizontalCarousel title="People You May Know" count={people.length} accentColor="#6D28D9">
              {people.map(p => (
                <PersonCard key={p.id} p={p} strandStatus={strandMap[p.id] || "none"} onStrand={() => handleStrand(p.id)} currentUserId={user?.id} />
              ))}
            </HorizontalCarousel>
          )}

          {/* Trending Topics */}
          {trendingTopics.length > 0 && activeFilter === "All" && (
            <HorizontalCarousel title="Trending Topics" accentColor="#E8733A">
              {trendingTopics.map(t => (
                <TopicPill key={t.tag} tag={t.tag} count={t.count} onClick={() => navigate(`/app/feed?tag=${t.tag}`)} />
              ))}
            </HorizontalCarousel>
          )}

          {/* Companies */}
          {renderOrgCarousel("Companies", companies, "#1D4ED8")}

          {/* Colleges */}
          {renderOrgCarousel("Colleges & Universities", colleges, "#1D4ED8")}

          {/* Hospitals */}
          {renderOrgCarousel("Hospitals & Healthcare", hospitals, "#BE123C")}

          {/* Government */}
          {renderOrgCarousel("Government Bodies", govOrgs, "#15803D")}

          {/* NGOs */}
          {renderOrgCarousel("NGOs & Non-Profits", ngos, "#6D28D9")}

          {/* Trending Posts */}
          {trendingPosts.length > 0 && activeFilter === "All" && (
            <HorizontalCarousel title="Trending Posts" count={trendingPosts.length} accentColor="#E8733A">
              {trendingPosts.map(post => (
                <TrendingPostCard key={post.id} post={post} authorProfile={postAuthors[post.author_id]} />
              ))}
            </HorizontalCarousel>
          )}

          {/* Empty state */}
          {people.length === 0 && companies.length === 0 && colleges.length === 0 && hospitals.length === 0 && govOrgs.length === 0 && ngos.length === 0 && (
            <div className="text-center py-16">
              <Search className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--color-text-secondary)" }} />
              <p className="text-[15px] font-bold mb-2" style={{ color: "var(--color-text)" }}>No results found</p>
              <p className="text-[13px]" style={{ color: "var(--color-text-secondary)" }}>Try a different search term or filter</p>
            </div>
          )}
        </>
      )}
    </main>
  );
};

export default Explore;

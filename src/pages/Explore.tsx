import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, X, Check } from "lucide-react";
import { cleanUsername } from "@/lib/cleanUsername";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { sendNotification } from "@/lib/notify";
import { PersonCard, OrgCard, TrendingPostCard } from "@/components/explore/ExploreCard";
import CircleCard from "@/components/explore/CircleCard";
import TopicPillsBar from "@/components/explore/TopicPillsBar";
import AvatarSquare from "@/components/ui/AvatarSquare";
import BottomSheet from "@/components/ui/BottomSheet";
import { getOrgTypeConfig } from "@/lib/orgTypes";
import { rankExploreCards, type MixedCard, type UserStrandsGraph } from "@/lib/exploreScore";

const FALLBACK_TOPICS = [
  "Engineering", "Design", "Product", "Marketing", "Data", "AI",
  "Startup", "Healthcare", "Education", "Finance", "Government", "NGO",
];

const Explore = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [focused, setFocused] = useState(false);
  const mountedRef = useRef(true);

  const [strandMap, setStrandMap] = useState<Record<string, string>>({});
  const [followMap, setFollowMap] = useState<Record<string, boolean>>({});
  const [memberMap, setMemberMap] = useState<Record<string, boolean>>({});
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Topic interests — derived from profile.interests + sector + skills fallback
  const allUserTopics = useMemo(() => {
    const set = new Set<string>();
    ((profile as any)?.interests || []).forEach((i: string) => i && set.add(i));
    if (profile?.sector) set.add(profile.sector);
    ((profile as any)?.skills || []).slice(0, 6).forEach((s: string) => s && set.add(s));
    if (set.size === 0) FALLBACK_TOPICS.slice(0, 8).forEach(t => set.add(t));
    return Array.from(set);
  }, [profile]);

  const [activeTopics, setActiveTopics] = useState<Set<string>>(new Set());
  useEffect(() => { setActiveTopics(new Set(allUserTopics)); }, [allUserTopics.join(",")]);
  const [editOpen, setEditOpen] = useState(false);
  const [editDraft, setEditDraft] = useState<Set<string>>(new Set());

  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

  // Search (kept)
  useEffect(() => {
    if (search.trim().length < 2) { setSearchResults([]); setShowSearchResults(false); return; }
    const t = setTimeout(async () => {
      const term = `%${search}%`;
      const [{ data: profiles }, { data: orgs }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, username, avatar_url, role").eq("is_public", true).neq("id", user?.id || "").or(`full_name.ilike.${term},username.ilike.${term}`).limit(5),
        supabase.from("organizations").select("id, name, slug, type, subtype, logo_url").or(`name.ilike.${term}`).limit(5),
      ]);
      const results: any[] = [];
      (profiles || []).forEach(p => results.push({ ...p, kind: "person" }));
      (orgs || []).forEach(o => results.push({ ...o, kind: "org" }));
      if (mountedRef.current) { setSearchResults(results); setShowSearchResults(true); }
    }, 300);
    return () => clearTimeout(t);
  }, [search, user?.id]);

  // Fetch unified data + build strand graph
  const fetchAll = useCallback(async () => {
    if (!user) return null;

    // Strands (1st-degree)
    const { data: strands } = await supabase
      .from("strands")
      .select("requester_id, receiver_id, status")
      .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`);

    const sMap: Record<string, string> = {};
    const firstDegree = new Set<string>();
    const excluded = new Set<string>();
    (strands || []).forEach((s: any) => {
      const otherId = s.requester_id === user.id ? s.receiver_id : s.requester_id;
      if (!otherId) return;
      sMap[otherId] = s.status || "pending";
      if (s.status === "accepted") firstDegree.add(otherId);
      if (s.status === "accepted" || s.status === "pending") excluded.add(otherId);
    });

    // 2nd-degree: friends-of-friends
    let secondDegree = new Set<string>();
    if (firstDegree.size > 0) {
      const ids = Array.from(firstDegree);
      const { data: fofStrands } = await supabase
        .from("strands")
        .select("requester_id, receiver_id, status")
        .eq("status", "accepted")
        .or(`requester_id.in.(${ids.join(",")}),receiver_id.in.(${ids.join(",")})`);
      (fofStrands || []).forEach((s: any) => {
        if (firstDegree.has(s.requester_id) && s.receiver_id !== user.id && !firstDegree.has(s.receiver_id)) {
          secondDegree.add(s.receiver_id);
        }
        if (firstDegree.has(s.receiver_id) && s.requester_id !== user.id && !firstDegree.has(s.requester_id)) {
          secondDegree.add(s.requester_id);
        }
      });
    }

    // Follows + circle membership
    const [followsRes, myCirclesRes] = await Promise.all([
      supabase.from("org_followers").select("org_id").eq("user_id", user.id),
      supabase.from("circle_members").select("circle_id").eq("user_id", user.id),
    ]);
    const fMap: Record<string, boolean> = {};
    (followsRes.data || []).forEach((f: any) => { fMap[f.org_id] = true; });
    const mMap: Record<string, boolean> = {};
    const myCircleIds = (myCirclesRes.data || []).map((m: any) => m.circle_id);
    myCircleIds.forEach(id => { mMap[id] = true; });

    // 1) People (graph distance ≤ 3 → top 20 by activity)
    const { data: peopleRaw } = await supabase
      .from("profiles")
      .select("id, full_name, username, avatar_url, role, headline, institution_name, location_city, is_verified, activity_score, privacy_settings, sector, skills, designation, role_metadata, account_type")
      .eq("is_public", true)
      .not("full_name", "is", null)
      .neq("id", user.id)
      .order("activity_score", { ascending: false })
      .limit(60);
    const people = (peopleRaw || []).filter((p: any) => {
      const ps = p.privacy_settings as any;
      if (ps && ps.show_in_search === false) return false;
      if (excluded.has(p.id)) return false;
      return true;
    }).slice(0, 20);

    // 2) Orgs (10) — by interest match or popularity
    const { data: orgsRaw } = await supabase
      .from("organizations")
      .select("id, name, slug, type, subtype, logo_url, city, state, followers_count, created_by, created_at, description")
      .order("followers_count", { ascending: false })
      .limit(40);
    const orgs = (orgsRaw || []).filter((o: any) => !fMap[o.id]).slice(0, 10);

    // 3) Posts (30) — from circles user is in + connections
    const ids = [...firstDegree];
    const twoDaysAgo = new Date(Date.now() - 48 * 3600000).toISOString();
    const postsQuery = supabase
      .from("posts")
      .select("id, content, author_id, reactions, comment_count, created_at, image_urls, hashtags")
      .gte("created_at", twoDaysAgo)
      .eq("visibility", "everyone")
      .order("comment_count", { ascending: false })
      .limit(30);
    const { data: postsRaw } = ids.length > 0
      ? await postsQuery.in("author_id", [...ids, user.id])
      : await postsQuery;
    const posts = postsRaw || [];

    const authorIds = [...new Set(posts.map((p: any) => p.author_id).filter(Boolean))];
    const postAuthors: Record<string, any> = {};
    if (authorIds.length) {
      const { data: authors } = await supabase.from("profiles").select("id, full_name, avatar_url").in("id", authorIds);
      (authors || []).forEach((a: any) => { postAuthors[a.id] = a; });
    }

    // 4) Circles (5 — public, user is NOT in)
    const { data: circlesRaw } = await supabase
      .from("circles")
      .select("id, name, slug, description, icon_url, member_count, active_7d, type, created_by, created_at")
      .eq("visibility", "public")
      .order("active_7d", { ascending: false })
      .limit(20);
    const circles = (circlesRaw || []).filter((c: any) => !mMap[c.id]).slice(0, 5);

    return {
      sMap, fMap, mMap,
      graph: { firstDegree, secondDegree } as UserStrandsGraph,
      people, orgs, posts, postAuthors, circles,
    };
  }, [user?.id]);

  const { data: exploreData, isLoading } = useQuery({
    queryKey: ["explore-unified", user?.id],
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

  // Build mixed card list + rank
  const rankedCards = useMemo<MixedCard[]>(() => {
    if (!exploreData || !user) return [];
    const cards: MixedCard[] = [];
    exploreData.people.forEach(p => cards.push({
      id: `person-${p.id}`,
      kind: "person",
      authorId: p.id,
      activityScore: p.activity_score || 0,
      tags: [...(p.skills || []), p.sector].filter(Boolean) as string[],
      createdAt: null,
      payload: p,
    }));
    exploreData.orgs.forEach(o => cards.push({
      id: `org-${o.id}`,
      kind: "org",
      authorId: o.created_by,
      activityScore: Math.min((o.followers_count || 0) / 10, 100),
      tags: [o.type, o.subtype, o.city].filter(Boolean) as string[],
      createdAt: o.created_at,
      payload: o,
    }));
    exploreData.posts.forEach(p => {
      const engagement = (p.reactions?.useful || 0) + (p.reactions?.inspiring || 0) + (p.reactions?.insightful || 0) + (p.comment_count || 0);
      cards.push({
        id: `post-${p.id}`,
        kind: "post",
        authorId: p.author_id,
        activityScore: Math.min(engagement * 2, 100),
        tags: p.hashtags || [],
        createdAt: p.created_at,
        payload: p,
      });
    });
    exploreData.circles.forEach(c => cards.push({
      id: `circle-${c.id}`,
      kind: "circle",
      authorId: c.created_by,
      activityScore: Math.min((c.active_7d || 0) * 5, 100),
      tags: [c.type, c.name].filter(Boolean) as string[],
      createdAt: c.created_at,
      payload: c,
    }));

    return rankExploreCards(cards, {
      userId: user.id,
      interests: Array.from(activeTopics),
      graph: exploreData.graph,
    });
  }, [exploreData, user, activeTopics]);

  // Actions
  const handleStrand = async (personId: string) => {
    if (!user) return;
    const { sendConnectionRequest } = await import("@/hooks/useConnectionStatus");
    const result = await sendConnectionRequest(user.id, personId, profile?.full_name || "Someone");
    if (result === null) return;
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

  const toggleTopic = (t: string) => {
    setActiveTopics(prev => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t); else next.add(t);
      return next;
    });
  };

  const openEdit = () => {
    setEditDraft(new Set(allUserTopics));
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!user) return;
    const next = Array.from(editDraft);
    const { error } = await supabase.from("profiles").update({ interests: next } as any).eq("id", user.id);
    if (error) { toast.error("Couldn't save"); return; }
    setActiveTopics(new Set(next));
    toast.success("Interests updated");
    setEditOpen(false);
  };

  const getOrgNavigateTo = (org: any) => org.slug ? `/org/${org.slug}` : "#";

  // Suggested topics for editor (current + popular fallbacks not yet picked)
  const editorOptions = useMemo(() => {
    const set = new Set<string>([...allUserTopics, ...FALLBACK_TOPICS, ...((profile as any)?.skills || [])]);
    return Array.from(set);
  }, [allUserTopics, profile]);

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: 16 }}>
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
                    {r.kind === "person" ? (
                      <p style={{ fontSize: 12, fontWeight: 400, color: "var(--text-muted)" }}>@{cleanUsername(r.username) || "user"}</p>
                    ) : (() => {
                      const conf = getOrgTypeConfig(r.type);
                      return (
                        <span style={{
                          display: "inline-flex", alignItems: "center", marginTop: 2,
                          padding: "2px 6px", borderRadius: 5,
                          fontSize: 9, fontWeight: 700, letterSpacing: 0.3,
                          background: conf.bg, color: conf.color, textTransform: "uppercase",
                        }}>
                          {conf.label}
                          {r.subtype && <span style={{ marginLeft: 5, opacity: 0.7, textTransform: "none", fontWeight: 500 }}>· {r.subtype}</span>}
                        </span>
                      );
                    })()}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Topic pills */}
        <div style={{ marginTop: 12 }}>
          <TopicPillsBar
            topics={allUserTopics}
            activeTopics={activeTopics}
            onToggle={toggleTopic}
            onEdit={openEdit}
          />
        </div>
      </div>

      {/* Loading skeleton */}
      {isLoading && !exploreData && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12, marginTop: 16 }}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} style={{ height: 180, borderRadius: 12, background: "var(--bg-card)" }} />
          ))}
        </div>
      )}

      {/* Unified mixed feed */}
      {rankedCards.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 12,
            marginTop: 16,
            alignItems: "start",
          }}
        >
          {rankedCards.map(card => {
            if (card.kind === "person") {
              return (
                <div key={card.id} style={{ width: "100%" }}>
                  <PersonCard
                    p={card.payload}
                    strandStatus={strandMap[card.payload.id] || "none"}
                    onStrand={() => handleStrand(card.payload.id)}
                    currentUserId={user?.id}
                  />
                </div>
              );
            }
            if (card.kind === "org") {
              return (
                <div key={card.id} style={{ width: "100%" }}>
                  <OrgCard
                    org={card.payload}
                    following={!!followMap[card.payload.id]}
                    onToggleFollow={() => toggleFollow(card.payload.id, card.payload.created_by)}
                    navigateTo={getOrgNavigateTo(card.payload)}
                  />
                </div>
              );
            }
            if (card.kind === "post") {
              return (
                <div key={card.id} style={{ width: "100%" }}>
                  <TrendingPostCard
                    post={card.payload}
                    authorProfile={exploreData?.postAuthors[card.payload.author_id]}
                  />
                </div>
              );
            }
            return (
              <CircleCard
                key={card.id}
                circle={card.payload}
                isMember={!!memberMap[card.payload.id]}
                onJoin={(e) => { e.stopPropagation(); joinCircle(card.payload.id); }}
              />
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && rankedCards.length === 0 && (
        <div style={{ textAlign: "center", padding: "64px 0" }}>
          <Search style={{ width: 48, height: 48, margin: "0 auto 12px", color: "var(--text-muted)" }} />
          <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>Nothing to show yet</p>
          <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>Add interests or grow your network to see more.</p>
        </div>
      )}

      {/* Edit interests bottom sheet */}
      <BottomSheet
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Your interests"
        description="These shape what shows up in Explore."
        footer={
          <>
            <button
              type="button"
              onClick={() => setEditOpen(false)}
              className="cursor-pointer"
              style={{
                flex: 1, height: 44, borderRadius: 10, border: "1px solid var(--border-glass)",
                background: "transparent", color: "var(--text-primary)", fontWeight: 600, fontSize: 14,
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveEdit}
              className="cursor-pointer"
              style={{
                flex: 1, height: 44, borderRadius: 10, border: "none",
                background: "linear-gradient(135deg, #E8733A, #FF6B9D)",
                color: "#fff", fontWeight: 600, fontSize: 14,
              }}
            >
              Save
            </button>
          </>
        }
      >
        <div className="flex flex-wrap" style={{ gap: 8 }}>
          {editorOptions.map(t => {
            const isOn = editDraft.has(t);
            return (
              <button
                key={t}
                type="button"
                onClick={() => setEditDraft(prev => {
                  const next = new Set(prev);
                  if (next.has(t)) next.delete(t); else next.add(t);
                  return next;
                })}
                className="cursor-pointer flex items-center"
                style={{
                  gap: 4, padding: "0 12px", height: 32, borderRadius: 10,
                  fontSize: 13, fontWeight: isOn ? 600 : 500, border: "none",
                  ...(isOn
                    ? { background: "rgba(232,115,58,0.12)", color: "#E8733A" }
                    : { background: "var(--bg-card)", border: "1px solid var(--border-glass)", color: "var(--text-primary)" }
                  ),
                }}
              >
                {isOn && <Check style={{ width: 12, height: 12 }} />}
                {t}
              </button>
            );
          })}
        </div>
      </BottomSheet>
    </main>
  );
};

export default Explore;

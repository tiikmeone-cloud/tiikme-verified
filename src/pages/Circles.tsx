import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Search, TrendingUp, Clock, Award, MessageCircle, MoreHorizontal,
  Pencil, Trash2, Loader2, ArrowLeft, ChevronRight, X as XIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { CIRCLE_TYPE_CONFIG, POST_TYPE_CONFIG, SIGNTYPE_CONFIG } from "@/lib/circlesMeta";
import AvatarSquare from "@/components/ui/AvatarSquare";
import { moderateText, logModerationFlag } from "@/lib/moderation";
import SoftWarnModal from "@/components/moderation/SoftWarnModal";
import ReportButton from "@/components/moderation/ReportButton";
import CircleCreatePage from "@/pages/CircleCreate";
import CommentPanel from "@/components/comments/CommentPanel";

type CircleRecord = any;

// =================================================================
// DISCOVERY — carousel layout
// =================================================================
function CirclesDiscovery() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [search, setSearch] = useState("");
  const [seeAllSection, setSeeAllSection] = useState<null | { title: string; items: CircleRecord[] }>(null);
  const qc = useQueryClient();

  // Cached circles (10 min stale) — instant on revisit
  const { data: allCircles = [], isLoading: loadingCircles } = useQuery({
    queryKey: ["circles", "all-public"],
    queryFn: async () => {
      const { data } = await supabase.from("circles").select("*").eq("visibility", "public")
        .order("active_7d", { ascending: false })
        .order("member_count", { ascending: false })
        .limit(200);
      return (data || []) as CircleRecord[];
    },
    staleTime: 10 * 60 * 1000,
  });

  // Cached membership
  const { data: joined = [] as string[] } = useQuery({
    queryKey: ["circles", "joined", user?.id],
    queryFn: async () => {
      if (!user) return [] as string[];
      const { data } = await supabase.from("circle_members").select("circle_id").eq("user_id", user.id);
      return (data || []).map((m: any) => m.circle_id);
    },
    enabled: !!user,
    staleTime: 10 * 60 * 1000,
  });

  const loading = loadingCircles;

  const join = async (circleId: string) => {
    if (!user) { toast.error("Sign in to join"); return; }
    // Optimistic cache updates
    qc.setQueryData(["circles", "joined", user.id], (prev: string[] = []) => [...prev, circleId]);
    qc.setQueryData(["circles", "all-public"], (prev: CircleRecord[] = []) =>
      prev.map(c => c.id === circleId ? { ...c, member_count: (c.member_count || 0) + 1 } : c)
    );
    const { error } = await supabase.from("circle_members").insert({ circle_id: circleId, user_id: user.id });
    if (error) {
      qc.setQueryData(["circles", "joined", user.id], (prev: string[] = []) => prev.filter(id => id !== circleId));
      qc.setQueryData(["circles", "all-public"], (prev: CircleRecord[] = []) =>
        prev.map(c => c.id === circleId ? { ...c, member_count: Math.max(0, (c.member_count || 1) - 1) } : c)
      );
      toast.error(error.message);
      return;
    }
    toast.success("Joined");
  };

  // Build deduplicated, prioritized sections
  const sections = useMemo(() => {
    const q = search.trim().toLowerCase();
    const matchesQuery = (c: CircleRecord) => !q || c.name?.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q);

    const taken = new Set<string>();
    const claim = (c: CircleRecord) => { taken.add(c.id); return c; };

    const userCity = (profile as any)?.location_city?.toString().toLowerCase().trim();
    const userRole = (profile as any)?.role?.toString().toLowerCase().trim();
    const userSubtype = (profile as any)?.role_subtype?.toString().toLowerCase().trim();

    // 1. Your circles (always first if present)
    const yours = allCircles.filter(c => joined.includes(c.id) && matchesQuery(c)).map(claim);

    // 2. City circles — match by type='city' or city keyword in name
    const cityCircles = allCircles.filter(c => {
      if (taken.has(c.id) || !matchesQuery(c)) return false;
      if (c.type === "city") {
        if (userCity && c.name?.toLowerCase().includes(userCity)) return true;
        return true;
      }
      return false;
    }).map(claim);

    // 3. Role & Career — strictly type='role'
    const roleCircles = allCircles
      .filter(c => !taken.has(c.id) && matchesQuery(c) && c.type === "role")
      .sort((a, b) => {
        const aMatch = userRole && (a.name?.toLowerCase().includes(userRole) || a.name?.toLowerCase().includes(userSubtype || "")) ? 1 : 0;
        const bMatch = userRole && (b.name?.toLowerCase().includes(userRole) || b.name?.toLowerCase().includes(userSubtype || "")) ? 1 : 0;
        return bMatch - aMatch;
      })
      .map(claim);

    // 3b. By Sector — strictly type='sector'
    const sectorCircles = allCircles
      .filter(c => !taken.has(c.id) && matchesQuery(c) && c.type === "sector")
      .sort((a, b) => (b.member_count || 0) - (a.member_count || 0))
      .map(claim);

    // 4. Trending — by active_7d DESC, member_count DESC
    const trending = allCircles
      .filter(c => !taken.has(c.id) && matchesQuery(c))
      .sort((a, b) => (b.active_7d || 0) - (a.active_7d || 0) || (b.member_count || 0) - (a.member_count || 0))
      .slice(0, 24)
      .map(claim);

    return [
      { key: "yours", title: "Your circles", items: yours },
      { key: "city", title: "City Circles", items: cityCircles },
      { key: "role", title: "Role & Career", items: roleCircles },
      { key: "sector", title: "By Sector", items: sectorCircles },
      { key: "trending", title: "Trending", items: trending },
    ].filter(s => s.items.length > 0);
  }, [allCircles, joined, profile, search]);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }} className="px-4 sm:px-6 py-4 sm:py-6">
      {/* Header */}
      <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1A1A2E" }}>Circles</h1>
        <button
          type="button"
          onClick={() => navigate("/app/circles/create")}
          className="flex items-center gap-1.5 cursor-pointer active:scale-95"
          style={{ height: 36, padding: "0 14px", borderRadius: 10, fontSize: 13, fontWeight: 700, background: "#FA903E", color: "#fff", border: "none" }}
        >
          <Plus style={{ width: 14, height: 14 }} /> Create
        </button>
      </div>

      {/* Search */}
      <div className="relative" style={{ marginBottom: 18 }}>
        <Search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "#6B7094" }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search circles..."
          className="w-full outline-none"
          style={{
            height: 40, borderRadius: 12, paddingLeft: 36, paddingRight: 12, fontSize: 13,
            background: "rgba(255,255,255,0.20)", backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.30)",
          }}
        />
      </div>

      {loading && <p style={{ textAlign: "center", color: "#6B7094", fontSize: 13, padding: 24 }}>Loading...</p>}

      {!loading && sections.length === 0 && (
        <div className="glass-card" style={{ padding: 32, borderRadius: 16, textAlign: "center", color: "#6B7094", fontSize: 13 }}>
          No circles found{search ? ` for "${search}"` : ""}. Try creating one.
        </div>
      )}

      {sections.map(section => (
        <CarouselSection
          key={section.key}
          title={section.title}
          items={section.items}
          joined={joined}
          onOpen={(slug) => navigate(`/app/circles/${slug}`)}
          onJoin={join}
          onSeeAll={() => setSeeAllSection({ title: section.title, items: section.items })}
        />
      ))}

      {/* See-all sheet */}
      {seeAllSection && (
        <SeeAllSheet
          title={seeAllSection.title}
          items={seeAllSection.items}
          joined={joined}
          onOpen={(slug) => { setSeeAllSection(null); navigate(`/app/circles/${slug}`); }}
          onJoin={join}
          onClose={() => setSeeAllSection(null)}
        />
      )}
    </div>
  );
}

function CarouselSection({
  title, items, joined, onOpen, onJoin, onSeeAll,
}: {
  title: string;
  items: CircleRecord[];
  joined: string[];
  onOpen: (slug: string) => void;
  onJoin: (id: string) => void;
  onSeeAll: () => void;
}) {
  return (
    <section style={{ marginBottom: 26 }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
        <h2 style={{ fontSize: 15, fontWeight: 800, color: "#1A1A2E" }}>{title}</h2>
        {items.length > 6 && (
          <button
            type="button"
            onClick={onSeeAll}
            className="flex items-center gap-1 cursor-pointer"
            style={{ background: "none", border: "none", fontSize: 12, fontWeight: 600, color: "#FA903E" }}
          >
            See all <ChevronRight style={{ width: 14, height: 14 }} />
          </button>
        )}
      </div>
      <div
        className="flex gap-3 overflow-x-auto pb-2"
        style={{
          scrollSnapType: "x mandatory",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        <style>{`section .flex.overflow-x-auto::-webkit-scrollbar { display: none; }`}</style>
        {items.map(c => (
          <CircleCardCompact
            key={c.id}
            c={c}
            joined={joined.includes(c.id)}
            onOpen={() => onOpen(c.slug)}
            onJoin={() => onJoin(c.id)}
          />
        ))}
      </div>
    </section>
  );
}

function CircleCardCompact({ c, joined, onOpen, onJoin }: {
  c: CircleRecord; joined: boolean; onOpen: () => void; onJoin: () => void;
}) {
  const conf = (CIRCLE_TYPE_CONFIG as any)[c.type] || CIRCLE_TYPE_CONFIG.topic;
  const Icon = conf.icon;
  const customIcon = c.icon_url && c.icon_url.length <= 4; // emoji
  return (
    <div
      onClick={onOpen}
      className="glass-card cursor-pointer active:scale-[0.98] flex-shrink-0"
      style={{
        width: 160, padding: 14, borderRadius: 14,
        background: "rgba(255,255,255,0.65)",
        border: "1px solid rgba(255,255,255,0.40)",
        scrollSnapAlign: "start",
        display: "flex", flexDirection: "column", gap: 8,
      }}
    >
      <div
        style={{
          width: 44, height: 44, borderRadius: 12, background: conf.bg,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22,
        }}
      >
        {customIcon ? (
          <span>{c.icon_url}</span>
        ) : (
          <Icon style={{ width: 22, height: 22, color: conf.color }} />
        )}
      </div>
      <div style={{ minHeight: 36 }}>
        <p
          style={{
            fontSize: 13, fontWeight: 700, color: "#1A1A2E",
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any,
            overflow: "hidden", lineHeight: 1.3,
          }}
        >
          {c.name}
        </p>
        <p style={{ fontSize: 11, color: "#6B7094", marginTop: 4 }}>{c.member_count || 0} members</p>
      </div>
      <button
        type="button"
        onClick={e => { e.stopPropagation(); if (!joined) onJoin(); else onOpen(); }}
        className="cursor-pointer active:scale-95"
        style={{
          height: 30, borderRadius: 8, fontSize: 12, fontWeight: 700,
          background: joined ? "rgba(107,112,148,0.15)" : "#FA903E",
          color: joined ? "#1A1A2E" : "#fff",
          border: "none",
        }}
      >
        {joined ? "Open" : "Join"}
      </button>
    </div>
  );
}

function SeeAllSheet({
  title, items, joined, onOpen, onJoin, onClose,
}: {
  title: string;
  items: CircleRecord[];
  joined: string[];
  onOpen: (slug: string) => void;
  onJoin: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.45)", animation: "fade-in 200ms ease" }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-white w-full sm:max-w-2xl"
        style={{
          borderRadius: "20px 20px 0 0",
          maxHeight: "85vh",
          overflow: "auto",
          boxShadow: "0 -8px 32px rgba(0,0,0,0.20)",
        }}
      >
        <div
          className="sticky top-0 z-10 flex items-center justify-between px-4 sm:px-6 py-4"
          style={{ background: "#fff", borderBottom: "1px solid #E5E7EB" }}
        >
          <h2 style={{ fontSize: 17, fontWeight: 800, color: "#1A1A2E" }}>{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer"
            style={{ background: "none", border: "none", padding: 4 }}
          >
            <XIcon style={{ width: 22, height: 22, color: "#6B7094" }} />
          </button>
        </div>
        <div
          className="px-4 sm:px-6 py-4"
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}
        >
          {items.map(c => (
            <CircleCardCompact
              key={c.id}
              c={c}
              joined={joined.includes(c.id)}
              onOpen={() => onOpen(c.slug)}
              onJoin={() => onJoin(c.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// =================================================================
// DETAIL — circle view with back button
// =================================================================
function CircleDetail({ slug }: { slug: string }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [circle, setCircle] = useState<any>(null);
  const [linkedOrg, setLinkedOrg] = useState<{ name: string; logo_url: string | null; slug: string | null } | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [isMember, setIsMember] = useState(false);
  const [sort, setSort] = useState<"new" | "hot" | "top">("new");
  const [showComposer, setShowComposer] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data: c } = await supabase.from("circles").select("*").eq("slug", slug).maybeSingle();
      if (!c) return;
      setCircle(c);

      // Load linked organization (if any)
      const linkedId = (c as any).linked_org_id;
      if (linkedId) {
        supabase.from("organizations").select("name, logo_url, slug").eq("id", linkedId).maybeSingle()
          .then(({ data }) => setLinkedOrg(data as any));
      } else {
        setLinkedOrg(null);
      }

      const orderCol = sort === "hot" ? "hot_score" : sort === "top" ? "upvote_count" : "created_at";
      let q = supabase.from("circle_posts").select("*, author:profiles!circle_posts_author_id_fkey(id, full_name, avatar_url, role)")
        .eq("circle_id", c.id).eq("is_flagged", false)
        .order(orderCol, { ascending: false }).limit(50);
      if (sort === "top") {
        const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        q = q.gte("created_at", since);
      }
      const [postsRes, memRes] = await Promise.all([
        q,
        user ? supabase.from("circle_members").select("id").eq("circle_id", c.id).eq("user_id", user.id).maybeSingle() : Promise.resolve({ data: null }),
      ]);
      const fetchedPosts = postsRes.data || [];
      let upvotedSet = new Set<string>();
      if (user && fetchedPosts.length) {
        const { data: ups } = await supabase
          .from("circle_post_upvotes")
          .select("post_id")
          .eq("user_id", user.id)
          .in("post_id", fetchedPosts.map((p: any) => p.id));
        upvotedSet = new Set((ups || []).map((u: any) => u.post_id));
      }
      setPosts(fetchedPosts.map((p: any) => ({ ...p, viewer_upvoted: upvotedSet.has(p.id) })));
      setIsMember(!!memRes.data);
    })();
  }, [slug, sort, user]);

  const join = async () => {
    if (!user || !circle) return;
    setIsMember(true);
    setCircle((prev: any) => prev ? { ...prev, member_count: (prev.member_count || 0) + 1 } : prev);
    const { error } = await supabase.from("circle_members").insert({ circle_id: circle.id, user_id: user.id });
    if (error) {
      setIsMember(false);
      setCircle((prev: any) => prev ? { ...prev, member_count: Math.max(0, (prev.member_count || 1) - 1) } : prev);
      toast.error(error.message);
      return;
    }
    toast.success("Joined " + circle.name);
  };

  const toggleUpvote = async (postId: string, currentUpvoted: boolean) => {
    if (!user) { toast.error("Sign in to upvote"); return; }
    const delta = currentUpvoted ? -1 : 1;
    setPosts(prev => prev.map(p => p.id === postId
      ? { ...p, upvote_count: Math.max(0, (p.upvote_count || 0) + delta), viewer_upvoted: !currentUpvoted }
      : p));
    const op = currentUpvoted
      ? supabase.from("circle_post_upvotes").delete().eq("post_id", postId).eq("user_id", user.id)
      : supabase.from("circle_post_upvotes").insert({ post_id: postId, user_id: user.id });
    const { error } = await op;
    if (error) {
      setPosts(prev => prev.map(p => p.id === postId
        ? { ...p, upvote_count: Math.max(0, (p.upvote_count || 0) - delta), viewer_upvoted: currentUpvoted }
        : p));
      if (!currentUpvoted && error.code !== "23505") toast.error("Couldn't upvote — try again");
    }
  };

  if (!circle) return <p style={{ textAlign: "center", color: "#6B7094", fontSize: 13, padding: 32 }}>Loading circle...</p>;

  const conf = (CIRCLE_TYPE_CONFIG as any)[circle.type] || CIRCLE_TYPE_CONFIG.topic;
  const Icon = conf.icon;
  const customIcon = circle.icon_url && circle.icon_url.length <= 4;

  const handleBack = () => {
    // Prefer history, fallback to discovery
    if (window.history.length > 1) navigate(-1);
    else navigate("/app/circles");
  };

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }} className="px-4 sm:px-6 py-4 sm:py-6">
      {/* Back button */}
      <button
        type="button"
        onClick={handleBack}
        className="flex items-center gap-2 cursor-pointer active:scale-95"
        style={{
          background: "none", border: "none", color: "#6B7094",
          fontSize: 13, fontWeight: 600, marginBottom: 12, padding: "4px 0",
        }}
      >
        <ArrowLeft style={{ width: 16, height: 16 }} /> Back to Circles
      </button>

      {/* Header */}
      <div
        className="glass-card"
        style={{
          padding: 16, borderRadius: 14,
          background: "rgba(255,255,255,0.55)",
          border: "1px solid rgba(255,255,255,0.30)",
          marginBottom: 14,
        }}
      >
        <div className="flex items-center gap-3" style={{ marginBottom: 10 }}>
          <div
            style={{
              width: 48, height: 48, borderRadius: 12, background: conf.bg,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              fontSize: 24,
            }}
          >
            {customIcon ? <span>{circle.icon_url}</span> : <Icon style={{ width: 24, height: 24, color: conf.color }} />}
          </div>
          <div className="flex-1 min-w-0">
            <h1 style={{ fontSize: 18, fontWeight: 800, color: "#1A1A2E" }}>{circle.name}</h1>
            <p style={{ fontSize: 12, color: "#6B7094", marginTop: 2 }}>
              {circle.member_count || 0} members · {circle.post_count || 0} posts
            </p>
            {linkedOrg && (
              <button
                type="button"
                onClick={() => linkedOrg.slug && navigate(`/org/${linkedOrg.slug}`)}
                className="mt-1.5 inline-flex items-center gap-1.5 cursor-pointer"
                style={{
                  height: 22, padding: "0 8px", borderRadius: 999,
                  background: "rgba(232,115,58,0.10)", border: "1px solid rgba(232,115,58,0.25)",
                  fontSize: 11, fontWeight: 600, color: "#9A4C1F",
                }}
              >
                {linkedOrg.logo_url && (
                  <img src={linkedOrg.logo_url} alt="" style={{ width: 14, height: 14, borderRadius: 3, objectFit: "cover" }} />
                )}
                Created by {linkedOrg.name}
              </button>
            )}
          </div>
          {!isMember ? (
            <button
              onClick={join}
              type="button"
              className="cursor-pointer active:scale-95"
              style={{
                height: 34, padding: "0 14px", borderRadius: 10, fontSize: 13, fontWeight: 700,
                background: conf.color, color: "#fff", border: "none",
              }}
            >
              Join
            </button>
          ) : (
            <button
              onClick={() => setShowComposer(true)}
              type="button"
              className="cursor-pointer active:scale-95"
              style={{
                height: 34, padding: "0 14px", borderRadius: 10, fontSize: 13, fontWeight: 700,
                background: "#FA903E", color: "#fff", border: "none",
              }}
            >
              + Post
            </button>
          )}
        </div>
        {circle.description && (
          <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{circle.description}</p>
        )}
      </div>

      {/* Sort tabs */}
      <div className="flex gap-2" style={{ marginBottom: 12 }}>
        {[
          { key: "new", label: "New", icon: Clock },
          { key: "hot", label: "Hot", icon: TrendingUp },
          { key: "top", label: "Top (7d)", icon: Award },
        ].map(s => (
          <button
            key={s.key}
            onClick={() => setSort(s.key as any)}
            type="button"
            className="flex items-center gap-1.5 cursor-pointer active:scale-95"
            style={{
              height: 30, padding: "0 12px", borderRadius: 8,
              fontSize: 12, fontWeight: 700,
              background: sort === s.key ? "#1A1A2E" : "rgba(255,255,255,0.2)",
              color: sort === s.key ? "#fff" : "#1A1A2E",
              border: "none",
            }}
          >
            <s.icon style={{ width: 12, height: 12 }} /> {s.label}
          </button>
        ))}
      </div>

      {/* Posts */}
      <div className="flex flex-col" style={{ gap: 10 }}>
        {posts.length === 0 ? (
          <div
            className="glass-card"
            style={{
              padding: 24, borderRadius: 12,
              background: "rgba(255,255,255,0.45)",
              border: "1px solid rgba(255,255,255,0.30)",
              textAlign: "center", fontSize: 13, color: "#6B7094",
            }}
          >
            No posts yet. {isMember ? "Be the first to post." : "Join to see the conversation."}
          </div>
        ) : posts.map(p => (
          <CirclePostCard
            key={p.id}
            post={p}
            onUpvote={() => toggleUpvote(p.id, !!p.viewer_upvoted)}
            onDeleted={(id) => setPosts(prev => prev.filter(x => x.id !== id))}
            onEdited={(id, body) => setPosts(prev => prev.map(x => x.id === id ? { ...x, body, content: body } : x))}
          />
        ))}
      </div>

      {showComposer && isMember && (
        <CircleComposer
          circle={circle}
          onClose={() => setShowComposer(false)}
          onPosted={(newPost: any) => { setPosts(prev => [newPost, ...prev]); setShowComposer(false); }}
        />
      )}
    </div>
  );
}

// =================================================================
// POST CARD (with edit/delete for owner — already implemented)
// =================================================================
function CirclePostCard({
  post, onUpvote, onDeleted, onEdited,
}: {
  post: any;
  onUpvote?: () => void;
  onDeleted?: (id: string) => void;
  onEdited?: (id: string, body: string) => void;
}) {
  const { user } = useAuth();
  const author = post.author;
  const showName = post.signtype === "full_profile";
  const label = (SIGNTYPE_CONFIG as any)[post.signtype]?.label || "User";
  const typeConf = (POST_TYPE_CONFIG as any)[post.post_type] || POST_TYPE_CONFIG.discussion;
  const upvoted = !!post.viewer_upvoted;
  const isOwn = user?.id === post.author_id;

  const [showMenu, setShowMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState(post.body || post.content || "");
  const [savingEdit, setSavingEdit] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentDelta, setCommentDelta] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showMenu) return;
    const fn = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [showMenu]);

  const saveEdit = async () => {
    const text = editBody.trim();
    if (!text || !user) return;
    setSavingEdit(true);
    const { error } = await supabase.from("circle_posts")
      .update({
        body: text,
        content: text,
        title: post.title || null,
        link_url: post.link_url || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", post.id).eq("author_id", user.id);
    setSavingEdit(false);
    if (error) { toast.error("Failed to save"); return; }
    onEdited?.(post.id, text);
    setEditing(false);
    toast.success("Post updated");
  };

  const doDelete = async () => {
    if (!user) return;
    setDeleting(true);
    const { error } = await supabase.from("circle_posts").delete().eq("id", post.id).eq("author_id", user.id);
    setDeleting(false);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success("Post deleted");
    onDeleted?.(post.id);
  };

  const commentCount = Math.max(0, (post.comment_count || post.reply_count || 0) + commentDelta);

  return (
    <article className="glass-card" style={{ padding: 14, borderRadius: 12, background: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.30)" }}>
      <div className="flex items-center gap-2" style={{ marginBottom: 10 }}>
        {showName && author ? (
          <AvatarSquare src={author.avatar_url} name={author.full_name || "?"} size={32} />
        ) : (
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(107,112,148,0.20)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#6B7094" }}>?</div>
        )}
        <div className="flex-1 min-w-0">
          <p style={{ fontSize: 13, fontWeight: 700, color: "#1A1A2E" }}>
            {showName ? author?.full_name : label}
          </p>
          <p style={{ fontSize: 11, color: "#6B7094" }}>
            {typeConf.icon} {typeConf.label} · {new Date(post.created_at).toLocaleDateString()}
          </p>
        </div>
        {isOwn && (
          <div className="relative shrink-0" ref={menuRef}>
            <button type="button" onClick={() => setShowMenu(s => !s)}
              className="flex items-center justify-center cursor-pointer"
              style={{ width: 28, height: 28, background: "none", border: "none", color: "#6B7094" }}>
              <MoreHorizontal style={{ width: 16, height: 16 }} />
            </button>
            {showMenu && (
              <div className="absolute right-0 z-[60]" style={{ top: 30, width: 160, borderRadius: 10, padding: "6px 0", background: "#FFFFFF", border: "1px solid #E5E7EB", boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}>
                <button type="button" onClick={() => { setEditing(true); setShowMenu(false); }}
                  className="flex items-center gap-2 w-full cursor-pointer hover:bg-[#F5F5F5]" style={{ padding: "8px 12px", fontSize: 13, color: "#1A1A2E", background: "none", border: "none" }}>
                  <Pencil style={{ width: 12, height: 12 }} /> Edit post
                </button>
                <button type="button" onClick={() => { setConfirmDelete(true); setShowMenu(false); }}
                  className="flex items-center gap-2 w-full cursor-pointer hover:bg-[#F5F5F5]" style={{ padding: "8px 12px", fontSize: 13, color: "#EF4444", background: "none", border: "none" }}>
                  <Trash2 style={{ width: 12, height: 12 }} /> Delete post
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      {post.title && <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1A1A2E", marginBottom: 6 }}>{post.title}</h3>}

      {editing ? (
        <div>
          <textarea value={editBody} onChange={e => setEditBody(e.target.value.slice(0, 5000))} rows={4}
            className="w-full outline-none"
            style={{ fontSize: 13, padding: 10, borderRadius: 10, background: "#F5F5F5", border: "1px solid #E8E8E8", resize: "vertical" }} />
          <div className="flex items-center gap-2 mt-2">
            <button type="button" onClick={saveEdit} disabled={savingEdit || !editBody.trim()} className="cursor-pointer disabled:opacity-50"
              style={{ fontSize: 12, fontWeight: 700, padding: "6px 14px", borderRadius: 8, background: "#FA903E", color: "#fff", border: "none" }}>
              {savingEdit ? <Loader2 className="animate-spin" style={{ width: 12, height: 12 }} /> : "Save"}
            </button>
            <button type="button" onClick={() => { setEditing(false); setEditBody(post.body || post.content || ""); }} className="cursor-pointer"
              style={{ fontSize: 12, fontWeight: 600, padding: "6px 12px", color: "#6B7094", background: "none", border: "none" }}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.55, whiteSpace: "pre-wrap" }}>{post.body || post.content}</p>
      )}

      <div className="flex items-center gap-4" style={{ marginTop: 10, fontSize: 12, color: "#6B7094" }}>
        <button type="button" onClick={onUpvote} className="cursor-pointer transition-all active:scale-95"
          style={{ background: "none", border: "none", padding: "2px 4px", borderRadius: 6, color: upvoted ? "#FA903E" : "#6B7094", fontWeight: upvoted ? 700 : 500 }}>
          ▲ {post.upvote_count || 0}
        </button>
        <button type="button" onClick={() => setShowComments(s => !s)}
          className="cursor-pointer flex items-center gap-1"
          style={{ background: "none", border: "none", padding: "2px 4px", borderRadius: 6, color: showComments ? "#FA903E" : "#6B7094", fontWeight: showComments ? 700 : 500 }}>
          <MessageCircle style={{ width: 13, height: 13 }} /> {commentCount}
        </button>
        <div style={{ marginLeft: "auto" }}>
          <ReportButton contentType="circle_post" contentId={post.id} />
        </div>
      </div>

      {showComments && (
        <CommentPanel
          postId={post.id}
          table="circle_post_comments"
          postAuthorId={post.author_id}
          onCountChange={(d) => setCommentDelta(prev => prev + d)}
        />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.45)" }} onClick={() => setConfirmDelete(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 14, padding: 20, maxWidth: 360, width: "90%", textAlign: "center" }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1A1A2E", marginBottom: 6 }}>Delete this post?</h3>
            <p style={{ fontSize: 13, color: "#6B7094", marginBottom: 16 }}>This cannot be undone.</p>
            <div className="flex items-center justify-center gap-2">
              <button type="button" onClick={() => setConfirmDelete(false)} className="cursor-pointer"
                style={{ padding: "8px 16px", fontSize: 13, fontWeight: 600, borderRadius: 8, background: "#F5F5F5", color: "#1A1A2E", border: "none" }}>Cancel</button>
              <button type="button" onClick={doDelete} disabled={deleting} className="cursor-pointer disabled:opacity-50"
                style={{ padding: "8px 16px", fontSize: 13, fontWeight: 700, borderRadius: 8, background: "#DC2626", color: "#fff", border: "none" }}>
                {deleting ? <Loader2 className="animate-spin" style={{ width: 14, height: 14 }} /> : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

// =================================================================
// COMPOSER — fixed margins
// =================================================================
function CircleComposer({ circle, onClose, onPosted }: any) {
  const { user } = useAuth();
  const [step, setStep] = useState<"type" | "form">("type");
  const [postType, setPostType] = useState("discussion");
  const [signtype, setSigntype] = useState("full_profile");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [softWarn, setSoftWarn] = useState<{ open: boolean; category?: string; matchedTerm?: string }>({ open: false });

  const proceedInsert = async () => {
    if (!user) return;
    setSaving(true);
    const { data, error } = await supabase.from("circle_posts").insert({
      circle_id: circle.id, author_id: user.id,
      signtype, post_type: postType,
      title: title.trim() || null, body: body.trim(),
      content: body.trim(),
    }).select("*, author:profiles!circle_posts_author_id_fkey(id, full_name, avatar_url, role)").single();
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Posted");
    onPosted(data);
  };

  const submit = async () => {
    if (!user || !body.trim()) { toast.error("Add a message"); return; }
    const combined = (title + " " + body).trim();
    const mod = await moderateText(combined);
    if (!mod.allowed) {
      await logModerationFlag({
        contentType: "circle_post",
        authorId: user.id,
        textPreview: combined,
        result: mod,
      });
      toast.error("This post appears to violate community guidelines and cannot be posted.");
      return;
    }
    if (mod.severity >= 0.3) {
      setSoftWarn({ open: true, category: mod.category, matchedTerm: mod.matchedTerm });
      return;
    }
    proceedInsert();
  };

  const showRisk = (signtype === "verified_employee" || signtype === "verified_role") && (circle.member_count || 0) < 50;

  return (
    <div onClick={onClose} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ background: "rgba(0,0,0,0.45)" }}>
      <div
        onClick={e => e.stopPropagation()}
        className="glass-card w-full sm:max-w-lg sm:mx-auto"
        style={{
          padding: 18,
          borderRadius: "16px 16px 0 0",
          background: "rgba(255,255,255,0.98)",
          maxHeight: "90vh",
          overflow: "auto",
          // Mobile-safe horizontal margins via parent flex centering + full width
          // The bottom-sheet takes full viewport width on mobile; padding above keeps composer inside bounds
        }}
      >
        <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1A1A2E" }}>Post in {circle.name}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{ background: "none", border: "none", fontSize: 22, color: "#6B7094", cursor: "pointer", lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        {step === "type" ? (
          <>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#6B7094", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
              What kind of post?
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {Object.entries(POST_TYPE_CONFIG).map(([key, conf]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => { setPostType(key); setStep("form"); }}
                  className="glass-card text-left cursor-pointer"
                  style={{
                    padding: 10, borderRadius: 10,
                    border: postType === key ? "2px solid #FA903E" : "1px solid rgba(255,255,255,0.3)",
                    background: "rgba(255,255,255,0.6)",
                  }}
                >
                  <p style={{ fontSize: 16, marginBottom: 4 }}>{(conf as any).icon}</p>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#1A1A2E" }}>{(conf as any).label}</p>
                  <p style={{ fontSize: 10, color: "#6B7094", marginTop: 2 }}>{(conf as any).hint}</p>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="w-full">
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Title (optional)"
              className="w-full outline-none mb-2 box-border"
              style={{
                height: 38, borderRadius: 10, padding: "0 12px", fontSize: 13,
                background: "rgba(255,255,255,0.4)", border: "1px solid rgba(0,0,0,0.10)",
              }}
            />
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="What's on your mind?"
              rows={5}
              className="w-full outline-none mb-3 box-border"
              style={{
                borderRadius: 10, padding: 12, fontSize: 13,
                background: "rgba(255,255,255,0.4)", border: "1px solid rgba(0,0,0,0.10)",
                resize: "vertical",
              }}
            />

            <p style={{ fontSize: 11, fontWeight: 700, color: "#1A1A2E", marginBottom: 6 }}>Post as</p>
            <select
              value={signtype}
              onChange={e => setSigntype(e.target.value)}
              className="w-full outline-none mb-3 box-border"
              style={{
                height: 36, borderRadius: 10, padding: "0 12px", fontSize: 12,
                background: "rgba(255,255,255,0.4)", border: "1px solid rgba(0,0,0,0.10)",
              }}
            >
              {Object.entries(SIGNTYPE_CONFIG).map(([key, conf]) => (
                <option key={key} value={key}>{(conf as any).label} — {(conf as any).hint}</option>
              ))}
            </select>

            {showRisk && (
              <div
                style={{
                  padding: 10, borderRadius: 10,
                  background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.4)",
                  fontSize: 11, color: "#78350F", marginBottom: 12,
                }}
              >
                ⚠ This circle has fewer than 50 members. Posting with a verified identity may make you identifiable. Consider "Anonymous" for sensitive content.
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep("type")}
                style={{
                  flex: 1, height: 38, borderRadius: 10, fontSize: 13, fontWeight: 700,
                  background: "rgba(107,112,148,0.15)", color: "#1A1A2E", border: "none", cursor: "pointer",
                }}
              >
                Back
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={saving || !body.trim()}
                style={{
                  flex: 2, height: 38, borderRadius: 10, fontSize: 13, fontWeight: 700,
                  background: saving || !body.trim() ? "#9CA3AF" : "#FA903E",
                  color: "#fff", border: "none", cursor: saving ? "default" : "pointer",
                }}
              >
                {saving ? "Posting..." : "Post"}
              </button>
            </div>
          </div>
        )}
      </div>
      <SoftWarnModal
        open={softWarn.open}
        category={softWarn.category}
        matchedTerm={softWarn.matchedTerm}
        onConfirm={() => { setSoftWarn({ open: false }); proceedInsert(); }}
        onCancel={() => setSoftWarn({ open: false })}
      />
    </div>
  );
}

// =================================================================
// ROUTER
// =================================================================
export default function Circles() {
  const { circleSlug } = useParams<{ circleSlug?: string }>();
  if (circleSlug === "create") return <CircleCreatePage />;
  return circleSlug ? <CircleDetail slug={circleSlug} /> : <CirclesDiscovery />;
}

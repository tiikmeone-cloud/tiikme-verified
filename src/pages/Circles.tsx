import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AvatarSquare from "@/components/ui/AvatarSquare";
import { Users, Plus, ChevronRight, ArrowLeft, ThumbsUp, MessageCircle, Bookmark, Share2 } from "lucide-react";
import { toast } from "sonner";

type Circle = {
  id: string;
  name: string;
  slug: string;
  type: string;
  icon_url: string | null;
  description: string | null;
  member_count: number;
  active_7d: number;
  is_unlocked: boolean;
};

const signtypeLabels: Record<string, string> = {
  full_profile: "Full Profile",
  verified_employee: "Verified Employee",
  verified_alumni: "Verified Alumni",
  verified_role: "Verified Role",
  verified_anonymous: "Anonymous",
};

const postTypeLabels: Record<string, string> = {
  discussion: "Discussion",
  question: "Question",
  poll: "Poll",
  salary_share: "Salary Share",
  company_review: "Company Review",
  link_share: "Link Share",
};

const CirclesPage = () => {
  const { circleSlug } = useParams<{ circleSlug?: string }>();
  if (circleSlug) return <CircleDetail slug={circleSlug} />;
  return <CircleList />;
};

const CircleList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [myCircles, setMyCircles] = useState<Circle[]>([]);
  const [discover, setDiscover] = useState<{ sectors: Circle[]; cities: Circle[]; roles: Circle[] }>({ sectors: [], cities: [], roles: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("circle_members" as any)
        .select("circle:circles(id, name, slug, type, icon_url, description, member_count, active_7d, is_unlocked)")
        .eq("user_id", user.id),
      supabase.from("circles" as any).select("id, name, slug, type, icon_url, description, member_count, active_7d, is_unlocked").eq("type", "sector").eq("is_unlocked", true).order("member_count", { ascending: false }).limit(8),
      supabase.from("circles" as any).select("id, name, slug, type, icon_url, description, member_count, active_7d, is_unlocked").eq("type", "city").order("member_count", { ascending: false }).limit(8),
      supabase.from("circles" as any).select("id, name, slug, type, icon_url, description, member_count, active_7d, is_unlocked").eq("type", "role").order("member_count", { ascending: false }).limit(8),
    ]).then(([myRes, secRes, cityRes, roleRes]) => {
      setMyCircles(((myRes.data as any[]) || []).map((m: any) => m.circle).filter(Boolean));
      setDiscover({
        sectors: (secRes.data as any[]) || [],
        cities: (cityRes.data as any[]) || [],
        roles: (roleRes.data as any[]) || [],
      });
      setLoading(false);
    });
  }, [user]);

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: 16 }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1A1A2E" }}>Circles</h1>
          <p style={{ fontSize: 13, color: "#6B7094", marginTop: 2 }}>Spaces to share, discuss and learn with your community</p>
        </div>
        <button type="button" onClick={() => toast.info("Custom circle creation coming soon")}
          className="flex items-center gap-1.5 cursor-pointer"
          style={{ height: 36, padding: "0 14px", borderRadius: 12, fontSize: 13, fontWeight: 600,
            background: "linear-gradient(135deg, #E8733A, #FF6B9D)", color: "#fff", border: "none" }}>
          <Plus style={{ width: 14, height: 14 }} /> Create
        </button>
      </div>

      {loading && (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="animate-pulse" style={{ height: 64, borderRadius: 14, background: "rgba(0,0,0,0.04)" }} />)}
        </div>
      )}

      {!loading && myCircles.length > 0 && (
        <section className="mb-6">
          <h2 style={{ fontSize: 14, fontWeight: 700, color: "#1A1A2E", marginBottom: 10 }}>My Circles</h2>
          <div className="space-y-2">
            {myCircles.map(c => (
              <button key={c.id} type="button" onClick={() => navigate(`/app/circles/${c.slug}`)}
                className="glass-card flex items-center gap-3 text-left cursor-pointer w-full"
                style={{ padding: 12, borderRadius: 14, border: "1px solid rgba(0,0,0,0.06)" }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(232,115,58,0.10)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {c.icon_url ? <img src={c.icon_url} alt="" style={{ width: 28, height: 28, borderRadius: 8 }} /> : <Users style={{ width: 18, height: 18, color: "#E8733A" }} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#1A1A2E" }}>{c.name}</p>
                  <p style={{ fontSize: 12, color: "#6B7094" }}>{c.member_count || 0} members · {c.active_7d || 0} active</p>
                </div>
                <ChevronRight style={{ width: 16, height: 16, color: "#9CA3C0" }} />
              </button>
            ))}
          </div>
        </section>
      )}

      <DiscoverSection title="Discover by Sector" circles={discover.sectors} userId={user?.id} navigate={navigate} />
      <DiscoverSection title="Discover by City" circles={discover.cities} userId={user?.id} navigate={navigate} />
      <DiscoverSection title="Discover by Role" circles={discover.roles} userId={user?.id} navigate={navigate} />
    </main>
  );
};

const DiscoverSection = ({ title, circles, userId, navigate }: { title: string; circles: Circle[]; userId?: string; navigate: ReturnType<typeof useNavigate> }) => {
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());

  const handleJoin = async (circleId: string) => {
    if (!userId) return;
    const { error } = await supabase.from("circle_members" as any).insert({ circle_id: circleId, user_id: userId });
    if (error) { toast.error("Couldn't join"); return; }
    setJoinedIds(prev => new Set(prev).add(circleId));
    toast.success("Joined!");
  };

  if (!circles.length) return null;
  return (
    <section className="mb-6">
      <h2 style={{ fontSize: 14, fontWeight: 700, color: "#1A1A2E", marginBottom: 10 }}>{title}</h2>
      <div className="space-y-2">
        {circles.map(c => (
          <div key={c.id} className="glass-card flex items-center gap-3"
            style={{ padding: 12, borderRadius: 14, border: "1px solid rgba(0,0,0,0.06)" }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(107,112,148,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Users style={{ width: 16, height: 16, color: "#6B7094" }} />
            </div>
            <button type="button" onClick={() => navigate(`/app/circles/${c.slug}`)}
              className="flex-1 text-left min-w-0 cursor-pointer"
              style={{ background: "none", border: "none", padding: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#1A1A2E" }}>{c.name}</p>
              <p style={{ fontSize: 11, color: "#9CA3C0" }}>{c.member_count || 0} members</p>
            </button>
            {!joinedIds.has(c.id) ? (
              <button type="button" onClick={() => handleJoin(c.id)}
                className="cursor-pointer shrink-0"
                style={{ height: 26, padding: "0 12px", borderRadius: 8, fontSize: 11, fontWeight: 700,
                  background: "rgba(232,115,58,0.10)", color: "#E8733A", border: "none" }}>
                Join
              </button>
            ) : (
              <span className="shrink-0" style={{ fontSize: 11, fontWeight: 600, color: "#34C759" }}>✓ Joined</span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

const CircleDetail = ({ slug }: { slug: string }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [circle, setCircle] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [postContent, setPostContent] = useState("");
  const [postType, setPostType] = useState<string>("discussion");
  const [signtype, setSigntype] = useState<string>("full_profile");
  const [posting, setPosting] = useState(false);

  const loadAll = async () => {
    if (!user) return;
    const { data: c } = await supabase.from("circles" as any).select("*").eq("slug", slug).maybeSingle();
    if (!c) { setLoading(false); return; }
    setCircle(c);
    const [memberRes, postsRes] = await Promise.all([
      supabase.from("circle_members" as any).select("id").eq("user_id", user.id).eq("circle_id", (c as any).id).maybeSingle(),
      supabase.from("circle_posts" as any)
        .select("id, content, post_type, signtype, author_id, created_at, upvote_count, reply_count, is_pinned, author:profiles(full_name, avatar_url, role)")
        .eq("circle_id", (c as any).id)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(50),
    ]);
    setIsMember(!!memberRes.data);
    setPosts((postsRes.data as any[]) || []);
    setLoading(false);
  };

  useEffect(() => { loadAll(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [slug, user?.id]);

  const handleJoin = async () => {
    if (!circle || !user) return;
    const { error } = await supabase.from("circle_members" as any).insert({ circle_id: circle.id, user_id: user.id });
    if (error) { toast.error("Couldn't join"); return; }
    setIsMember(true);
    toast.success(`Joined ${circle.name}!`);
  };

  const handlePost = async () => {
    if (!postContent.trim() || !circle || !user || posting) return;
    setPosting(true);
    const { data, error } = await supabase.from("circle_posts" as any)
      .insert({ circle_id: circle.id, author_id: user.id, content: postContent.trim(), post_type: postType, signtype })
      .select("id, content, post_type, signtype, author_id, created_at, upvote_count, reply_count, is_pinned, author:profiles(full_name, avatar_url, role)")
      .single();
    setPosting(false);
    if (error) { toast.error("Failed to post"); return; }
    if (data) setPosts(prev => [data, ...prev]);
    setPostContent("");
    toast.success("Posted!");
  };

  if (loading) return <main style={{ maxWidth: 720, margin: "0 auto", padding: 16 }}><div className="animate-pulse" style={{ height: 200, borderRadius: 16, background: "rgba(0,0,0,0.04)" }} /></main>;
  if (!circle) return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: 16, textAlign: "center" }}>
      <p style={{ fontSize: 16, fontWeight: 700, color: "#1A1A2E" }}>Circle not found</p>
      <button type="button" onClick={() => navigate("/app/circles")} className="mt-3 cursor-pointer"
        style={{ fontSize: 13, color: "#E8733A", background: "none", border: "none" }}>← Back to Circles</button>
    </main>
  );

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: 16 }}>
      <div className="flex items-center gap-3 mb-4">
        <button type="button" onClick={() => navigate("/app/circles")}
          className="cursor-pointer flex items-center justify-center"
          style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(0,0,0,0.04)", border: "none" }}>
          <ArrowLeft style={{ width: 16, height: 16, color: "#1A1A2E" }} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 style={{ fontSize: 18, fontWeight: 800, color: "#1A1A2E" }}>{circle.name}</h1>
          <p style={{ fontSize: 12, color: "#6B7094" }}>{circle.member_count || 0} members</p>
        </div>
        {!isMember ? (
          <button type="button" onClick={handleJoin} className="cursor-pointer"
            style={{ height: 32, padding: "0 14px", borderRadius: 10, fontSize: 12, fontWeight: 700,
              background: "linear-gradient(135deg, #E8733A, #FF6B9D)", color: "#fff", border: "none" }}>
            Join
          </button>
        ) : (
          <span style={{ height: 32, padding: "0 12px", borderRadius: 10, fontSize: 12, fontWeight: 700,
            background: "rgba(52,199,89,0.10)", color: "#34C759", display: "inline-flex", alignItems: "center" }}>
            ✓ Member
          </span>
        )}
      </div>

      {circle.description && (
        <p style={{ fontSize: 13, color: "#6B7094", marginBottom: 16 }}>{circle.description}</p>
      )}

      {isMember && (
        <div className="glass-card mb-4" style={{ padding: 12, borderRadius: 14, border: "1px solid rgba(0,0,0,0.06)" }}>
          <textarea
            value={postContent}
            onChange={e => setPostContent(e.target.value.slice(0, 1000))}
            placeholder={`Share something in ${circle.name}...`}
            rows={2}
            className="w-full outline-none resize-none mb-2"
            style={{ background: "#F5F5F5", border: "1px solid #E8E8E8", borderRadius: 10, padding: "8px 12px", fontSize: 14, color: "#1A1A2E" }}
          />
          <div className="flex items-center gap-2 flex-wrap">
            <select value={postType} onChange={e => setPostType(e.target.value)}
              className="cursor-pointer outline-none"
              style={{ height: 30, padding: "0 8px", borderRadius: 8, fontSize: 12, fontWeight: 600, background: "rgba(232,115,58,0.08)", color: "#E8733A", border: "1px solid rgba(232,115,58,0.20)" }}>
              {Object.entries(postTypeLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <select value={signtype} onChange={e => setSigntype(e.target.value)}
              className="cursor-pointer outline-none"
              style={{ height: 30, padding: "0 8px", borderRadius: 8, fontSize: 12, fontWeight: 600, background: "rgba(107,112,148,0.08)", color: "#6B7094", border: "1px solid rgba(107,112,148,0.20)" }}>
              {Object.entries(signtypeLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <button type="button" onClick={handlePost} disabled={posting || !postContent.trim()}
              className="cursor-pointer ml-auto disabled:opacity-50"
              style={{ height: 30, padding: "0 16px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                background: "linear-gradient(135deg, #E8733A, #FF6B9D)", color: "#fff", border: "none" }}>
              {posting ? "Posting..." : "Post"}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {posts.length === 0 && (
          <div className="text-center py-12">
            <p style={{ fontSize: 14, fontWeight: 600, color: "#1A1A2E" }}>No posts yet</p>
            <p style={{ fontSize: 13, color: "#9CA3C0", marginTop: 4 }}>{isMember ? "Be the first to post!" : "Join this circle to see and create posts."}</p>
          </div>
        )}
        {posts.map(p => <CirclePostCard key={p.id} post={p} userId={user?.id} />)}
      </div>
    </main>
  );
};

const CirclePostCard = ({ post, userId }: { post: any; userId?: string }) => {
  const [upvoted, setUpvoted] = useState(false);
  const [upvoteCount, setUpvoteCount] = useState<number>(post.upvote_count || 0);

  useEffect(() => {
    if (!userId) return;
    supabase.from("circle_post_upvotes" as any).select("id").eq("post_id", post.id).eq("user_id", userId).maybeSingle()
      .then(({ data }) => { if (data) setUpvoted(true); });
  }, [userId, post.id]);

  const showAuthor = post.signtype === "full_profile" || post.signtype === "verified_employee" || post.signtype === "verified_alumni";
  const displayName = showAuthor ? (post.author?.full_name || "User") : (signtypeLabels[post.signtype] || "Member");
  const displayAvatar = showAuthor ? post.author?.avatar_url : null;

  const handleUpvote = async () => {
    if (!userId) return;
    if (upvoted) {
      await supabase.from("circle_post_upvotes" as any).delete().eq("post_id", post.id).eq("user_id", userId);
      setUpvoted(false);
      setUpvoteCount(p => Math.max(0, p - 1));
    } else {
      const { error } = await supabase.from("circle_post_upvotes" as any).insert({ post_id: post.id, user_id: userId });
      if (error) return;
      setUpvoted(true);
      setUpvoteCount(p => p + 1);
    }
  };

  const timeAgo = (d: string) => {
    const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
    if (s < 60) return "just now";
    const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  return (
    <div className="glass-card" style={{ padding: 14, borderRadius: 16, background: "#FFFFFF", border: "1px solid #E8E8E8" }}>
      <div className="flex items-center gap-2 mb-2">
        <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#E8733A" }}>
          {postTypeLabels[post.post_type] || "Post"}
        </span>
        {post.is_pinned && <span style={{ fontSize: 10, fontWeight: 700, color: "#6B7094" }}>Pinned</span>}
      </div>
      <div className="flex items-center gap-2 mb-3">
        <AvatarSquare src={displayAvatar} name={displayName} size={32} />
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#1A1A2E" }}>{displayName}</p>
          <div className="flex items-center gap-1.5">
            <span style={{ fontSize: 10, fontWeight: 600, background: "rgba(107,112,148,0.10)", color: "#6B7094", padding: "1px 6px", borderRadius: 4 }}>
              {signtypeLabels[post.signtype]}
            </span>
            <span style={{ fontSize: 11, color: "#9CA3C0" }}>· {timeAgo(post.created_at)}</span>
          </div>
        </div>
      </div>
      <p style={{ fontSize: 14, color: "#1A1A2E", lineHeight: "20px", marginBottom: 10, whiteSpace: "pre-wrap" }}>{post.content}</p>
      <div className="flex items-center gap-3 pt-2" style={{ borderTop: "1px solid #F0F0F0" }}>
        <button type="button" onClick={handleUpvote} className="flex items-center gap-1.5 cursor-pointer"
          style={{ background: "none", border: "none" }}>
          <ThumbsUp style={{ width: 14, height: 14, color: upvoted ? "#E8733A" : "#9CA3C0", fill: upvoted ? "#E8733A" : "none" }} />
          <span style={{ fontSize: 12, color: upvoted ? "#E8733A" : "#9CA3C0" }}>{upvoteCount || "Upvote"}</span>
        </button>
        <button type="button" className="flex items-center gap-1.5 cursor-pointer" style={{ background: "none", border: "none" }}>
          <MessageCircle style={{ width: 14, height: 14, color: "#9CA3C0" }} />
          <span style={{ fontSize: 12, color: "#9CA3C0" }}>{post.reply_count || "Reply"}</span>
        </button>
        <button type="button" className="flex items-center gap-1.5 cursor-pointer" style={{ background: "none", border: "none" }}>
          <Bookmark style={{ width: 14, height: 14, color: "#9CA3C0" }} />
          <span style={{ fontSize: 12, color: "#9CA3C0" }}>Save</span>
        </button>
        <button type="button" className="flex items-center gap-1.5 cursor-pointer ml-auto" style={{ background: "none", border: "none" }}>
          <Share2 style={{ width: 14, height: 14, color: "#9CA3C0" }} />
        </button>
      </div>
    </div>
  );
};

export default CirclesPage;

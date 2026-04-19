import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Users, Plus, ArrowLeft, ThumbsUp, MessageCircle, Share2,
  Eye, Flame, Clock, TrendingUp, DollarSign, Star, Link as LinkIcon,
  HelpCircle, BarChart2, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

const CIRCLE_TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  company: { bg: "rgba(232,115,58,0.12)", color: "#E8733A" },
  college: { bg: "rgba(99,102,241,0.12)", color: "#6366F1" },
  sector:  { bg: "rgba(16,185,129,0.12)", color: "#10B981" },
  city:    { bg: "rgba(59,130,246,0.12)", color: "#3B82F6" },
  role:    { bg: "rgba(139,92,246,0.12)", color: "#8B5CF6" },
  topic:   { bg: "rgba(245,158,11,0.12)", color: "#F59E0B" },
};

const POST_TYPE_META: Record<string, { label: string; icon: any; color: string; emoji: string }> = {
  discussion:     { label: "Discussion",     icon: MessageCircle, color: "#6366F1", emoji: "💬" },
  question:       { label: "Question",       icon: HelpCircle,    color: "#3B82F6", emoji: "❓" },
  poll:           { label: "Poll",           icon: BarChart2,     color: "#8B5CF6", emoji: "📊" },
  salary_share:   { label: "Salary Share",   icon: DollarSign,    color: "#10B981", emoji: "💰" },
  company_review: { label: "Company Review", icon: Star,          color: "#F59E0B", emoji: "⭐" },
  link_share:     { label: "Link Share",     icon: LinkIcon,      color: "#E8733A", emoji: "🔗" },
};

const SIGNTYPE_META: Record<string, { label: string; subLabel: string; showAvatar: boolean; showName: boolean; showOrg: boolean }> = {
  full_profile:       { label: "Full Profile",       subLabel: "Name + role visible",          showAvatar: true,  showName: true,  showOrg: true  },
  verified_employee:  { label: "Verified Employee",  subLabel: "Company visible, name hidden", showAvatar: false, showName: false, showOrg: true  },
  verified_alumni:    { label: "Verified Alumni",    subLabel: "Alumni badge, name hidden",    showAvatar: false, showName: false, showOrg: true  },
  verified_role:      { label: "Verified Role",      subLabel: "Role visible, no name/org",    showAvatar: false, showName: false, showOrg: false },
  verified_anonymous: { label: "Anonymous",          subLabel: "No name, no org, no role",     showAvatar: false, showName: false, showOrg: false },
};

const timeAgo = (d: string) => {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60); if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
};

const CirclesPage = () => {
  const { circleSlug } = useParams<{ circleSlug?: string }>();
  if (circleSlug) return <CircleDetail slug={circleSlug} />;
  return <CircleList />;
};

const CircleList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [myCircles, setMyCircles] = useState<any[]>([]);
  const [discover, setDiscover] = useState<{ sectors: any[]; cities: any[]; roles: any[]; topics: any[] }>({
    sectors: [], cities: [], roles: [], topics: [],
  });
  const [activeFilter, setActiveFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    if (!user) return;
    Promise.all([
      supabase.from("circle_members").select("circle:circles(id, name, slug, type, icon_url, member_count, active_7d)").eq("user_id", user.id),
      supabase.from("circles").select("id, name, slug, type, member_count, active_7d").eq("type", "sector").order("member_count", { ascending: false }).limit(8),
      supabase.from("circles").select("id, name, slug, type, member_count, active_7d").eq("type", "city").order("member_count", { ascending: false }).limit(15),
      supabase.from("circles").select("id, name, slug, type, member_count, active_7d").eq("type", "role").order("member_count", { ascending: false }).limit(12),
      supabase.from("circles").select("id, name, slug, type, member_count, active_7d").eq("type", "topic").order("member_count", { ascending: false }).limit(8),
    ]).then(([myRes, sectorRes, cityRes, roleRes, topicRes]) => {
      setMyCircles((myRes.data || []).map((m: any) => m.circle).filter(Boolean));
      setDiscover({
        sectors: sectorRes.data || [],
        cities:  cityRes.data  || [],
        roles:   roleRes.data  || [],
        topics:  topicRes.data || [],
      });
      setLoading(false);
    });
  };

  useEffect(() => { loadData(); /* eslint-disable-next-line */ }, [user]);

  const filterTabs = ["all", "sector", "city", "role", "topic"];

  const allDiscover = [
    ...(activeFilter === "all" || activeFilter === "sector" ? discover.sectors : []),
    ...(activeFilter === "all" || activeFilter === "city"   ? discover.cities  : []),
    ...(activeFilter === "all" || activeFilter === "role"   ? discover.roles   : []),
    ...(activeFilter === "all" || activeFilter === "topic"  ? discover.topics  : []),
  ].filter(c => !myCircles.find((m: any) => m?.id === c.id));

  return (
    <div className="max-w-3xl mx-auto px-4 py-5">
      <div className="flex items-center gap-2 mb-4">
        <Users style={{ width: 22, height: 22, color: "#1A1A2E" }} />
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1A1A2E", letterSpacing: "-0.02em" }}>Circles</h1>
      </div>

      {loading && (
        <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide">
          {[1,2,3].map(i => (
            <div key={i} style={{ width: 148, height: 96, borderRadius: 16, background: "rgba(0,0,0,0.04)" }} className="shrink-0 animate-pulse" />
          ))}
        </div>
      )}
      {!loading && myCircles.length > 0 && (
        <div className="mb-6">
          <p style={{ fontSize: 11, fontWeight: 700, color: "#9CA3C0", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>My Circles</p>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {myCircles.map((c: any) => {
              if (!c) return null;
              const tc = CIRCLE_TYPE_COLORS[c.type] || CIRCLE_TYPE_COLORS.topic;
              return (
                <button key={c.id} type="button" onClick={() => navigate(`/app/circles/${c.slug}`)}
                  className="shrink-0 flex flex-col items-start cursor-pointer transition-all hover:scale-[1.02]"
                  style={{ width: 148, padding: "12px 14px", borderRadius: 16, background: "#FFFFFF",
                    border: `1.5px solid ${tc.color}22`, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", textAlign: "left" }}>
                  <div className="flex items-center gap-1 mb-2">
                    <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: tc.color, background: tc.bg, padding: "2px 6px", borderRadius: 5 }}>{c.type}</span>
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#1A1A2E", marginBottom: 2, lineHeight: "16px" }} className="line-clamp-2">{c.name}</p>
                  <p style={{ fontSize: 10, color: "#9CA3C0" }}>{(c.member_count || 0).toLocaleString()} members</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center gap-2 mb-3">
          <p style={{ fontSize: 11, fontWeight: 700, color: "#9CA3C0", textTransform: "uppercase", letterSpacing: "0.06em" }}>Discover</p>
        </div>

        <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
          {filterTabs.map(f => (
            <button key={f} type="button" onClick={() => setActiveFilter(f)}
              className="shrink-0 cursor-pointer capitalize transition-all"
              style={{
                height: 32, padding: "0 16px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                ...(activeFilter === f
                  ? { background: "#1A1A2E", color: "#FFFFFF", border: "none" }
                  : { background: "rgba(0,0,0,0.04)", color: "#6B7094", border: "1px solid rgba(0,0,0,0.08)" }),
              }}>
              {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {[1,2,3,4].map(i => <div key={i} style={{ height: 88, borderRadius: 14, background: "rgba(0,0,0,0.04)" }} className="animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {allDiscover.map(c => <DiscoverCircleCard key={c.id} circle={c} userId={user?.id} navigate={navigate} onJoined={loadData} />)}
            {allDiscover.length === 0 && (
              <div className="col-span-full text-center py-8" style={{ background: "rgba(0,0,0,0.02)", borderRadius: 12 }}>
                <p style={{ fontSize: 13, color: "#9CA3C0" }}>You've joined all circles in this category!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const DiscoverCircleCard = ({ circle, userId, navigate, onJoined }: any) => {
  const [joined, setJoined] = useState(false);
  const tc = CIRCLE_TYPE_COLORS[circle.type] || CIRCLE_TYPE_COLORS.topic;

  const handleJoin = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userId || joined) return;
    const { error } = await supabase.from("circle_members").insert({ circle_id: circle.id, user_id: userId });
    if (error) { toast.error("Failed to join"); return; }
    setJoined(true);
    onJoined();
    toast.success(`Joined ${circle.name}!`);
  };

  return (
    <div onClick={() => navigate(`/app/circles/${circle.slug}`)}
      className="flex items-center gap-3 cursor-pointer transition-all hover:shadow-sm"
      style={{ padding: "12px 14px", borderRadius: 14, background: "#FFFFFF", border: "1px solid #EAEAEE" }}>
      <div className="flex items-center justify-center" style={{ width: 40, height: 40, borderRadius: 10, background: tc.bg, flexShrink: 0 }}>
        <Users style={{ width: 18, height: 18, color: tc.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p style={{ fontSize: 13, fontWeight: 700, color: "#1A1A2E", lineHeight: "16px" }} className="truncate">{circle.name}</p>
        <p style={{ fontSize: 11, color: "#9CA3C0", marginTop: 2 }}>{(circle.member_count || 0).toLocaleString()} members</p>
      </div>
      {joined ? (
        <span style={{ fontSize: 11, fontWeight: 600, color: "#10B981", padding: "5px 10px", background: "rgba(16,185,129,0.10)", borderRadius: 8 }}>✓ Joined</span>
      ) : (
        <button type="button" onClick={handleJoin} className="cursor-pointer hover:opacity-90"
          style={{ height: 28, padding: "0 12px", borderRadius: 8, fontSize: 11, fontWeight: 700, color: "#fff", background: tc.color, border: "none" }}>
          + Join
        </button>
      )}
    </div>
  );
};

const CircleDetail = ({ slug }: { slug: string }) => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [circle, setCircle] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<"hot" | "new" | "top">("hot");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showComposer, setShowComposer] = useState(false);

  useEffect(() => {
    if (!slug || !user) return;
    setLoading(true);
    supabase.from("circles").select("*").eq("slug", slug).maybeSingle().then(async ({ data: c }) => {
      if (!c) { setLoading(false); return; }
      setCircle(c);
      const [memberRes, postsRes] = await Promise.all([
        supabase.from("circle_members").select("id").eq("user_id", user.id).eq("circle_id", c.id).maybeSingle(),
        supabase.from("circle_posts")
          .select("id, content, post_type, signtype, author_id, created_at, upvote_count, reply_count, is_pinned, poll_options, poll_votes, poll_ends_at, link_url, author:profiles(full_name, avatar_url, role, headline)")
          .eq("circle_id", c.id)
          .order("is_pinned", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(50),
      ]);
      setIsMember(!!memberRes.data);
      setPosts(postsRes.data || []);
      setLoading(false);
    });
  }, [slug, user]);

  const handleJoin = async () => {
    if (!circle || !user) return;
    const { error } = await supabase.from("circle_members").insert({ circle_id: circle.id, user_id: user.id });
    if (error) { toast.error("Failed to join"); return; }
    setIsMember(true);
    setCircle((prev: any) => ({ ...prev, member_count: (prev.member_count || 0) + 1 }));
    toast.success(`Joined ${circle.name}!`);
  };

  const filteredPosts = posts
    .filter(p => typeFilter === "all" || p.post_type === typeFilter)
    .sort((a, b) => {
      if (sort === "new") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sort === "top") return (b.upvote_count || 0) - (a.upvote_count || 0);
      const aScore = (a.upvote_count || 0) * 2 + (a.reply_count || 0);
      const bScore = (b.upvote_count || 0) * 2 + (b.reply_count || 0);
      return bScore - aScore;
    });

  const tc = CIRCLE_TYPE_COLORS[circle?.type] || CIRCLE_TYPE_COLORS.topic;

  if (loading) return (
    <div className="max-w-3xl mx-auto px-4 py-5">
      <div style={{ height: 60, borderRadius: 14, background: "rgba(0,0,0,0.04)" }} className="animate-pulse mb-4" />
      {[1,2,3].map(i => <div key={i} style={{ height: 140, borderRadius: 16, background: "rgba(0,0,0,0.04)" }} className="animate-pulse mb-3" />)}
    </div>
  );
  if (!circle) return (
    <div className="max-w-3xl mx-auto px-4 py-5 text-center">
      <p style={{ fontSize: 14, color: "#9CA3C0" }}>Circle not found</p>
      <button type="button" onClick={() => navigate("/app/circles")}
        style={{ color: "#E8733A", fontSize: 13, fontWeight: 600, background: "none", border: "none", cursor: "pointer", marginTop: 8 }}>
        ← Back to Circles
      </button>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-5">
      <div className="sticky top-0 z-10 mb-4" style={{ background: "rgba(248,248,250,0.95)", backdropFilter: "blur(8px)", padding: "8px 0" }}>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => navigate("/app/circles")}
            className="cursor-pointer p-1.5 rounded-xl" style={{ background: "rgba(0,0,0,0.04)", border: "none" }}>
            <ArrowLeft style={{ width: 18, height: 18, color: "#1A1A2E" }} />
          </button>
          <div className="flex items-center justify-center" style={{ width: 40, height: 40, borderRadius: 10, background: tc.bg, flexShrink: 0 }}>
            <Users style={{ width: 18, height: 18, color: tc.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <h1 style={{ fontSize: 16, fontWeight: 800, color: "#1A1A2E", letterSpacing: "-0.01em" }} className="truncate">{circle.name}</h1>
            <p style={{ fontSize: 11, color: "#9CA3C0" }}>{(circle.member_count || 0).toLocaleString()} members</p>
          </div>
          {!isMember ? (
            <button type="button" onClick={handleJoin} className="cursor-pointer hover:opacity-90"
              style={{ height: 32, padding: "0 14px", borderRadius: 10, fontSize: 12, fontWeight: 700, color: "#fff", background: tc.color, border: "none" }}>
              + Join
            </button>
          ) : (
            <span style={{ fontSize: 11, fontWeight: 600, color: "#10B981", padding: "6px 12px", background: "rgba(16,185,129,0.10)", borderRadius: 8 }}>✓ Member</span>
          )}
        </div>

        <div className="flex items-center gap-2 mt-3 overflow-x-auto scrollbar-hide">
          <div className="flex gap-1 shrink-0">
            {[
              { key: "hot", icon: Flame, label: "Hot" },
              { key: "new", icon: Clock, label: "New" },
              { key: "top", icon: TrendingUp, label: "Top" },
            ].map(s => (
              <button key={s.key} type="button" onClick={() => setSort(s.key as any)}
                className="flex items-center gap-1 cursor-pointer transition-all"
                style={{ height: 28, padding: "0 10px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                  background: sort === s.key ? "#1A1A2E" : "rgba(0,0,0,0.04)",
                  color: sort === s.key ? "#FFFFFF" : "#6B7094", border: "none" }}>
                <s.icon style={{ width: 12, height: 12 }} />
                {s.label}
              </button>
            ))}
          </div>
          <div style={{ width: 1, height: 20, background: "rgba(0,0,0,0.10)" }} className="shrink-0" />
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            {["all", ...Object.keys(POST_TYPE_META)].map(t => (
              <button key={t} type="button" onClick={() => setTypeFilter(t)}
                className="shrink-0 cursor-pointer transition-all"
                style={{ height: 28, padding: "0 10px", borderRadius: 8, fontSize: 11, fontWeight: 600,
                  background: typeFilter === t ? "rgba(232,115,58,0.12)" : "transparent",
                  color: typeFilter === t ? "#E8733A" : "#9CA3C0",
                  border: typeFilter === t ? "1px solid rgba(232,115,58,0.25)" : "1px solid transparent" }}>
                {t === "all" ? "All" : POST_TYPE_META[t]?.emoji + " " + POST_TYPE_META[t]?.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        {isMember && !showComposer && (
          <button type="button" onClick={() => setShowComposer(true)}
            className="w-full flex items-center gap-3 mb-4 cursor-pointer transition-all hover:shadow-sm"
            style={{ padding: "12px 16px", borderRadius: 14, background: "#FFFFFF", border: "1.5px dashed rgba(0,0,0,0.12)", textAlign: "left" }}>
            <Plus style={{ width: 16, height: 16, color: "#9CA3C0" }} />
            <span style={{ fontSize: 13, color: "#9CA3C0" }}>Share something in {circle.name}...</span>
          </button>
        )}
        {isMember && showComposer && (
          <CircleComposer circle={circle} profile={profile} userId={user?.id}
            onPost={(newPost: any) => { setPosts(prev => [newPost, ...prev]); setShowComposer(false); }}
            onClose={() => setShowComposer(false)}
          />
        )}

        <div className="space-y-3 mt-3">
          {filteredPosts.length === 0 && (
            <div className="text-center py-12" style={{ background: "#FFFFFF", borderRadius: 16, border: "1px solid #EAEAEE" }}>
              <p style={{ fontSize: 32, marginBottom: 8 }}>✨</p>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#1A1A2E" }}>
                {typeFilter !== "all" ? `No ${POST_TYPE_META[typeFilter]?.label} posts yet` : "No posts yet"}
              </p>
              <p style={{ fontSize: 12, color: "#9CA3C0", marginTop: 4 }}>
                {isMember ? "Be the first to post!" : "Join to post and see all content."}
              </p>
            </div>
          )}
          {filteredPosts.map(p => <CirclePostCard key={p.id} post={p} userId={user?.id} circle={circle} />)}
        </div>
      </div>

      {isMember && (
        <button type="button" onClick={() => setShowComposer(true)}
          className="md:hidden fixed cursor-pointer flex items-center gap-2 shadow-lg"
          style={{ bottom: 90, right: 20, height: 48, padding: "0 20px", borderRadius: 24, fontSize: 14, fontWeight: 700,
            background: "linear-gradient(135deg, #E8733A, #FF6B9D)", color: "#fff", border: "none",
            boxShadow: "0 8px 24px rgba(232,115,58,0.35)", zIndex: 30 }}>
          <Plus style={{ width: 18, height: 18 }} /> Post
        </button>
      )}
    </div>
  );
};

const CircleComposer = ({ circle, profile, userId, onPost, onClose }: any) => {
  const [step, setStep] = useState<"type" | "compose">("type");
  const [postType, setPostType] = useState("discussion");
  const [signtype, setSigntype] = useState("full_profile");
  const [content, setContent] = useState("");
  const [salaryRole, setSalaryRole] = useState("");
  const [salaryYoe, setSalaryYoe] = useState("");
  const [salaryCity, setSalaryCity] = useState("");
  const [salaryBase, setSalaryBase] = useState("");
  const [salaryBonus, setSalaryBonus] = useState("");
  const [salaryContext, setSalaryContext] = useState("");
  const [reviewRating, setReviewRating] = useState(4);
  const [reviewRelation, setReviewRelation] = useState("current");
  const [reviewPros, setReviewPros] = useState("");
  const [reviewCons, setReviewCons] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [pollDays, setPollDays] = useState(3);
  const [linkUrl, setLinkUrl] = useState("");
  const [posting, setPosting] = useState(false);

  const signtypeMeta = SIGNTYPE_META[signtype];
  const previewName = signtypeMeta?.showName ? (profile?.full_name || "You") : signtypeMeta?.label || "Anonymous";
  const previewOrg = signtypeMeta?.showOrg ? (profile?.headline || "") : "";
  const previewAvatar = signtypeMeta?.showAvatar ? profile?.avatar_url : null;

  const showRiskWarning =
    (signtype === "verified_employee" || signtype === "verified_role") &&
    (circle.member_count || 0) < 50;

  const buildContent = () => {
    if (postType === "salary_share") {
      return JSON.stringify({ role: salaryRole, yoe: salaryYoe, city: salaryCity, base: salaryBase, bonus: salaryBonus, context: salaryContext });
    }
    if (postType === "company_review") {
      return JSON.stringify({ rating: reviewRating, relation: reviewRelation, pros: reviewPros, cons: reviewCons });
    }
    return content;
  };

  const handlePost = async () => {
    if (posting || !userId || !circle) return;
    const builtContent = buildContent();
    if (!builtContent.trim() && postType !== "salary_share" && postType !== "company_review") return;

    setPosting(true);
    const insertData: any = {
      circle_id: circle.id,
      author_id: userId,
      content: builtContent,
      post_type: postType,
      signtype,
    };
    if (postType === "poll") {
      insertData.poll_options = pollOptions.filter(o => o.trim()).map(o => ({ text: o, votes: 0 }));
      insertData.poll_ends_at = new Date(Date.now() + pollDays * 86400000).toISOString();
    }
    if (postType === "link_share") {
      insertData.link_url = linkUrl;
    }

    const { data, error } = await supabase.from("circle_posts")
      .insert(insertData)
      .select("id, content, post_type, signtype, author_id, created_at, upvote_count, reply_count, is_pinned, poll_options, poll_votes, poll_ends_at, link_url, author:profiles(full_name, avatar_url, role, headline)")
      .single();
    setPosting(false);
    if (error) { toast.error("Failed to post"); return; }
    toast.success("Posted!");
    onPost(data);
  };

  if (step === "type") {
    return (
      <div className="mb-4" style={{ background: "#FFFFFF", borderRadius: 14, border: "1px solid #EAEAEE", padding: 14 }}>
        <div className="flex items-center justify-between mb-3">
          <p style={{ fontSize: 13, fontWeight: 700, color: "#1A1A2E" }}>What do you want to share?</p>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", color: "#9CA3C0", cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Object.entries(POST_TYPE_META).map(([key, meta]) => (
            <button key={key} type="button" onClick={() => { setPostType(key); setStep("compose"); }}
              className="flex flex-col items-start cursor-pointer transition-all hover:scale-[1.02]"
              style={{ padding: "12px 14px", borderRadius: 12, background: "rgba(0,0,0,0.02)", border: "1.5px solid rgba(0,0,0,0.06)", textAlign: "left" }}>
              <span style={{ fontSize: 18 }}>{meta.emoji}</span>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#1A1A2E", marginTop: 4 }}>{meta.label}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4" style={{ background: "#FFFFFF", borderRadius: 14, border: "1px solid #EAEAEE", padding: 14 }}>
      <div className="flex items-center gap-2 mb-3">
        <button type="button" onClick={() => setStep("type")} style={{ background: "none", border: "none", color: "#9CA3C0", cursor: "pointer", fontSize: 16 }}>←</button>
        <span style={{ fontSize: 14 }}>{POST_TYPE_META[postType]?.emoji}</span>
        <p style={{ fontSize: 13, fontWeight: 700, color: "#1A1A2E", flex: 1 }}>{POST_TYPE_META[postType]?.label}</p>
        <button type="button" onClick={onClose} style={{ background: "none", border: "none", color: "#9CA3C0", cursor: "pointer", fontSize: 16 }}>✕</button>
      </div>

      <div>
        {(postType === "discussion" || postType === "question" || postType === "link_share") && (
          <>
            <textarea value={content} onChange={e => setContent(e.target.value.slice(0, 1000))}
              placeholder={postType === "question" ? "Ask the circle..." : postType === "link_share" ? "Add context (optional)..." : "What's on your mind?"}
              rows={3} className="w-full outline-none resize-none"
              style={{ background: "#F8F8FA", border: "1px solid #EBEBF0", borderRadius: 10, padding: "10px 12px", fontSize: 14, color: "#1A1A2E", lineHeight: "21px" }} />
            {postType === "link_share" && (
              <input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="Paste URL..."
                className="w-full outline-none mt-2"
                style={{ background: "#F8F8FA", border: "1px solid #EBEBF0", borderRadius: 10, padding: "10px 12px", fontSize: 14, color: "#1A1A2E", height: 40 }} />
            )}
          </>
        )}

        {postType === "poll" && (
          <>
            <textarea value={content} onChange={e => setContent(e.target.value.slice(0, 200))}
              placeholder="Ask your question..." rows={2} className="w-full outline-none resize-none"
              style={{ background: "#F8F8FA", border: "1px solid #EBEBF0", borderRadius: 10, padding: "10px 12px", fontSize: 14, color: "#1A1A2E", lineHeight: "21px", marginBottom: 10 }} />
            {pollOptions.map((opt, i) => (
              <input key={i} value={opt} onChange={e => { const o = [...pollOptions]; o[i] = e.target.value; setPollOptions(o); }}
                placeholder={`Option ${i + 1}`} className="w-full outline-none mb-2"
                style={{ background: "#F8F8FA", border: "1px solid #EBEBF0", borderRadius: 10, padding: "9px 12px", fontSize: 13, color: "#1A1A2E", height: 38 }} />
            ))}
            {pollOptions.length < 6 && (
              <button type="button" onClick={() => setPollOptions([...pollOptions, ""])}
                style={{ fontSize: 12, fontWeight: 600, color: "#E8733A", background: "none", border: "none", cursor: "pointer", padding: "4px 0" }}>
                + Add option
              </button>
            )}
            <div className="flex items-center gap-2 mt-2">
              <span style={{ fontSize: 12, color: "#6B7094" }}>Duration:</span>
              {[1, 3, 7].map(d => (
                <button key={d} type="button" onClick={() => setPollDays(d)}
                  style={{ height: 26, padding: "0 10px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer",
                    background: pollDays === d ? "rgba(232,115,58,0.10)" : "rgba(0,0,0,0.04)",
                    color: pollDays === d ? "#E8733A" : "#9CA3C0", border: "none" }}>
                  {d}d
                </button>
              ))}
            </div>
          </>
        )}

        {postType === "salary_share" && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <input value={salaryRole} onChange={e => setSalaryRole(e.target.value)} placeholder="Role (e.g. SDE-2)"
                className="outline-none" style={{ background: "#F8F8FA", border: "1px solid #EBEBF0", borderRadius: 10, padding: "9px 12px", fontSize: 13, color: "#1A1A2E", height: 38 }} />
              <input value={salaryYoe} onChange={e => setSalaryYoe(e.target.value)} placeholder="YOE (e.g. 4)"
                className="outline-none" style={{ background: "#F8F8FA", border: "1px solid #EBEBF0", borderRadius: 10, padding: "9px 12px", fontSize: 13, color: "#1A1A2E", height: 38 }} />
            </div>
            <input value={salaryCity} onChange={e => setSalaryCity(e.target.value)} placeholder="City (e.g. Bengaluru)"
              className="outline-none w-full" style={{ background: "#F8F8FA", border: "1px solid #EBEBF0", borderRadius: 10, padding: "9px 12px", fontSize: 13, color: "#1A1A2E", height: 38 }} />
            <div className="grid grid-cols-2 gap-2">
              <input value={salaryBase} onChange={e => setSalaryBase(e.target.value)} placeholder="Base ₹ (e.g. 18,00,000)"
                className="outline-none" style={{ background: "#F8F8FA", border: "1px solid #EBEBF0", borderRadius: 10, padding: "9px 12px", fontSize: 13, color: "#1A1A2E", height: 38 }} />
              <input value={salaryBonus} onChange={e => setSalaryBonus(e.target.value)} placeholder="Bonus ₹ (optional)"
                className="outline-none" style={{ background: "#F8F8FA", border: "1px solid #EBEBF0", borderRadius: 10, padding: "9px 12px", fontSize: 13, color: "#1A1A2E", height: 38 }} />
            </div>
            <input value={salaryContext} onChange={e => setSalaryContext(e.target.value)} placeholder="Context (e.g. lateral hire, WFH flex...)"
              className="outline-none w-full" style={{ background: "#F8F8FA", border: "1px solid #EBEBF0", borderRadius: 10, padding: "9px 12px", fontSize: 13, color: "#1A1A2E", height: 38 }} />
          </div>
        )}

        {postType === "company_review" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 12, fontWeight: 600, color: "#6B7094" }}>Rating:</span>
              <div className="flex gap-1">
                {[1,2,3,4,5].map(n => (
                  <button key={n} type="button" onClick={() => setReviewRating(n)}
                    style={{ fontSize: 20, background: "none", border: "none", cursor: "pointer", color: n <= reviewRating ? "#F59E0B" : "#D1D5DB" }}>★</button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              {["current", "former"].map(r => (
                <button key={r} type="button" onClick={() => setReviewRelation(r)}
                  style={{ height: 28, padding: "0 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
                    background: reviewRelation === r ? "rgba(232,115,58,0.10)" : "rgba(0,0,0,0.04)",
                    color: reviewRelation === r ? "#E8733A" : "#9CA3C0", border: "none" }}>
                  {r === "current" ? "Current Employee" : "Former Employee"}
                </button>
              ))}
            </div>
            <textarea value={reviewPros} onChange={e => setReviewPros(e.target.value.slice(0, 500))}
              placeholder="What did you like? (Pros)" rows={2} className="w-full outline-none resize-none"
              style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, padding: "10px 12px", fontSize: 13, color: "#1A1A2E", lineHeight: "20px" }} />
            <textarea value={reviewCons} onChange={e => setReviewCons(e.target.value.slice(0, 500))}
              placeholder="What could be better? (Cons)" rows={2} className="w-full outline-none resize-none"
              style={{ background: "#FFF1F2", border: "1px solid #FECDD3", borderRadius: 10, padding: "10px 12px", fontSize: 13, color: "#1A1A2E", lineHeight: "20px" }} />
          </div>
        )}

        <div className="mt-4 pt-3" style={{ borderTop: "1px solid #F0F0F4" }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#9CA3C0", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Posting as</p>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-3">
            {Object.entries(SIGNTYPE_META).map(([key, meta]) => (
              <button key={key} type="button" onClick={() => setSigntype(key)}
                className="shrink-0 cursor-pointer transition-all"
                style={{ height: 30, padding: "0 12px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                  background: signtype === key ? "#1A1A2E" : "rgba(0,0,0,0.04)",
                  color: signtype === key ? "#FFFFFF" : "#6B7094", border: "none" }}>
                {meta.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 p-2 rounded-xl" style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.06)" }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, overflow: "hidden", background: "rgba(0,0,0,0.08)", flexShrink: 0 }}>
              {previewAvatar ? <img src={previewAvatar} alt="" className="w-full h-full object-cover" /> : (
                <div className="w-full h-full flex items-center justify-center" style={{ background: "rgba(107,112,148,0.15)" }}>
                  <Eye style={{ width: 12, height: 12, color: "#9CA3C0" }} />
                </div>
              )}
            </div>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#1A1A2E" }}>{previewName}</p>
              {previewOrg && <p style={{ fontSize: 10, color: "#9CA3C0" }}>{previewOrg}</p>}
              <p style={{ fontSize: 10, color: "#9CA3C0" }}>{signtypeMeta?.subLabel}</p>
            </div>
          </div>

          {showRiskWarning && (
            <div className="flex items-start gap-2 mt-2 p-2 rounded-xl" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)" }}>
              <AlertCircle style={{ width: 14, height: 14, color: "#F59E0B", flexShrink: 0, marginTop: 1 }} />
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#92400E" }}>Heads-up: Small circle</p>
                <p style={{ fontSize: 10, color: "#92400E", lineHeight: "14px" }}>This circle has under 50 members. Your role/employer may be traceable to you.</p>
                <button type="button" onClick={() => setSigntype("verified_anonymous")}
                  style={{ fontSize: 10, fontWeight: 700, color: "#F59E0B", background: "none", border: "none", cursor: "pointer", padding: "2px 0" }}>
                  Switch to Anonymous →
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-4">
          <button type="button" onClick={onClose} className="cursor-pointer"
            style={{ flex: 1, height: 40, borderRadius: 10, fontSize: 13, fontWeight: 600, color: "#9CA3C0", background: "rgba(0,0,0,0.04)", border: "none" }}>
            Cancel
          </button>
          <button type="button" onClick={handlePost} disabled={posting}
            className="cursor-pointer disabled:opacity-50 transition-all hover:opacity-90"
            style={{ flex: 2, height: 40, borderRadius: 10, fontSize: 13, fontWeight: 700, color: "#fff",
              background: "linear-gradient(135deg, #E8733A, #FF6B9D)", border: "none" }}>
            {posting ? "Posting..." : "Post"}
          </button>
        </div>
      </div>
    </div>
  );
};

const CirclePostCard = ({ post, userId, circle: _circle }: any) => {
  const [upvoted, setUpvoted] = useState(false);
  const [upvoteCount, setUpvoteCount] = useState(post.upvote_count || 0);

  const meta = SIGNTYPE_META[post.signtype];
  const displayName = meta?.showName ? (post.author?.full_name || "Member") : SIGNTYPE_META[post.signtype]?.label;
  const displayOrg = meta?.showOrg ? (post.author?.headline || "") : "";
  const displayAvatar = meta?.showAvatar ? post.author?.avatar_url : null;
  const ptMeta = POST_TYPE_META[post.post_type];

  const handleUpvote = async () => {
    if (!userId) return;
    if (upvoted) {
      await supabase.from("circle_post_upvotes").delete().eq("post_id", post.id).eq("user_id", userId);
      setUpvoted(false); setUpvoteCount((n: number) => Math.max(0, n - 1));
    } else {
      await supabase.from("circle_post_upvotes").insert({ post_id: post.id, user_id: userId });
      setUpvoted(true); setUpvoteCount((n: number) => n + 1);
    }
  };

  let parsedContent: any = null;
  if (post.post_type === "salary_share" || post.post_type === "company_review") {
    try { parsedContent = JSON.parse(post.content); } catch { parsedContent = null; }
  }

  return (
    <div style={{ background: "#FFFFFF", borderRadius: 16, border: "1px solid #EAEAEE", overflow: "hidden" }}>
      <div className="flex items-center gap-2" style={{ padding: "10px 14px 0" }}>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em",
          color: ptMeta?.color || "#E8733A", background: `${ptMeta?.color || "#E8733A"}14`, padding: "2px 7px", borderRadius: 6 }}>
          {ptMeta?.emoji} {ptMeta?.label}
        </span>
        {post.is_pinned && <span style={{ fontSize: 10, fontWeight: 700, color: "#9CA3C0" }}>📌</span>}
      </div>

      <div style={{ padding: "8px 14px 12px" }}>
        <div className="flex items-center gap-2 mb-2.5">
          <div style={{ width: 30, height: 30, borderRadius: 8, overflow: "hidden", background: "rgba(0,0,0,0.06)", flexShrink: 0 }}>
            {displayAvatar ? <img src={displayAvatar} alt="" className="w-full h-full object-cover" /> : (
              <div className="w-full h-full flex items-center justify-center">
                <Eye style={{ width: 12, height: 12, color: "#9CA3C0" }} />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span style={{ fontSize: 12, fontWeight: 700, color: "#1A1A2E" }}>{displayName}</span>
              <span style={{ fontSize: 10, fontWeight: 600, background: "rgba(107,112,148,0.08)", color: "#9CA3C0", padding: "1px 5px", borderRadius: 4 }}>
                {SIGNTYPE_META[post.signtype]?.label} ✓
              </span>
            </div>
            {displayOrg && <p style={{ fontSize: 10, color: "#9CA3C0" }}>{displayOrg}</p>}
          </div>
          <span style={{ fontSize: 11, color: "#C4C8D8", flexShrink: 0 }}>{timeAgo(post.created_at)}</span>
        </div>

        {(post.post_type === "discussion" || post.post_type === "question" || post.post_type === "link_share") && (
          <>
            <p style={{ fontSize: 14, color: "#1A1A2E", lineHeight: "21px", whiteSpace: "pre-wrap" }}>{post.content}</p>
            {post.post_type === "link_share" && post.link_url && (
              <a href={post.link_url} target="_blank" rel="noopener noreferrer"
                className="block mt-2"
                style={{ fontSize: 12, color: "#E8733A", fontWeight: 600, padding: "8px 10px", background: "rgba(232,115,58,0.06)", border: "1px solid rgba(232,115,58,0.18)", borderRadius: 8, wordBreak: "break-all" }}>
                🔗 {post.link_url}
              </a>
            )}
          </>
        )}

        {post.post_type === "poll" && post.poll_options && (() => {
          const totalVotes = (post.poll_options as any[]).reduce((s: number, o: any) => s + (o.votes || 0), 0);
          return (
            <>
              <p style={{ fontSize: 14, color: "#1A1A2E", lineHeight: "21px", marginBottom: 8 }}>{post.content}</p>
              <div className="space-y-2">
                {(post.poll_options as any[]).map((opt: any, i: number) => {
                  const pct = totalVotes > 0 ? Math.round((opt.votes || 0) / totalVotes * 100) : 0;
                  return (
                    <div key={i} className="relative overflow-hidden rounded-lg" style={{ height: 36, background: "rgba(0,0,0,0.04)" }}>
                      <div style={{ position: "absolute", top: 0, left: 0, height: "100%", width: `${pct}%`, background: "rgba(232,115,58,0.12)", transition: "width 0.4s ease" }} />
                      <div className="relative flex items-center justify-between px-3 h-full">
                        <span style={{ fontSize: 13, fontWeight: 500, color: "#1A1A2E" }}>{opt.text}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#E8733A" }}>{pct}%</span>
                      </div>
                    </div>
                  );
                })}
                <p style={{ fontSize: 11, color: "#9CA3C0" }}>{totalVotes} votes</p>
              </div>
            </>
          );
        })()}

        {post.post_type === "salary_share" && parsedContent && (
          <div style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)", borderRadius: 12, padding: "10px 12px" }}>
            <div className="flex items-center gap-1.5 mb-2">
              <span style={{ fontSize: 14 }}>💰</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#10B981" }}>Salary Snapshot</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {parsedContent.role  && <div><span style={{ fontSize: 10, color: "#9CA3C0", fontWeight: 600 }}>ROLE</span><p style={{ fontSize: 13, fontWeight: 700, color: "#1A1A2E" }}>{parsedContent.role}</p></div>}
              {parsedContent.yoe   && <div><span style={{ fontSize: 10, color: "#9CA3C0", fontWeight: 600 }}>YOE</span><p style={{ fontSize: 13, fontWeight: 700, color: "#1A1A2E" }}>{parsedContent.yoe} years</p></div>}
              {parsedContent.city  && <div><span style={{ fontSize: 10, color: "#9CA3C0", fontWeight: 600 }}>CITY</span><p style={{ fontSize: 13, fontWeight: 700, color: "#1A1A2E" }}>{parsedContent.city}</p></div>}
              {parsedContent.base  && <div><span style={{ fontSize: 10, color: "#9CA3C0", fontWeight: 600 }}>BASE</span><p style={{ fontSize: 13, fontWeight: 700, color: "#1A1A2E" }}>₹{parsedContent.base}</p></div>}
              {parsedContent.bonus && <div><span style={{ fontSize: 10, color: "#9CA3C0", fontWeight: 600 }}>BONUS</span><p style={{ fontSize: 13, fontWeight: 700, color: "#1A1A2E" }}>₹{parsedContent.bonus}</p></div>}
            </div>
            {parsedContent.context && <p style={{ fontSize: 12, color: "#6B7094", marginTop: 6 }}>{parsedContent.context}</p>}
          </div>
        )}

        {post.post_type === "company_review" && parsedContent && (
          <div style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.15)", borderRadius: 12, padding: "10px 12px" }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex">{[1,2,3,4,5].map(n => <span key={n} style={{ fontSize: 14, color: n <= (parsedContent.rating || 0) ? "#F59E0B" : "#E5E7EB" }}>★</span>)}</div>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#9CA3C0" }}>{parsedContent.relation === "current" ? "Current Employee" : "Former Employee"}</span>
            </div>
            {parsedContent.pros && (
              <div className="mb-1.5">
                <span style={{ fontSize: 10, fontWeight: 700, color: "#10B981", textTransform: "uppercase" }}>Pros</span>
                <p style={{ fontSize: 13, color: "#1A1A2E", lineHeight: "19px" }}>{parsedContent.pros}</p>
              </div>
            )}
            {parsedContent.cons && (
              <div>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#EF4444", textTransform: "uppercase" }}>Cons</span>
                <p style={{ fontSize: 13, color: "#1A1A2E", lineHeight: "19px" }}>{parsedContent.cons}</p>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-1 mt-3 pt-2.5" style={{ borderTop: "1px solid #F2F2F6" }}>
          <button type="button" onClick={handleUpvote} className="flex items-center gap-1.5 cursor-pointer transition-all hover:opacity-80"
            style={{ height: 30, padding: "0 8px", borderRadius: 8, background: upvoted ? "rgba(232,115,58,0.08)" : "transparent", border: "none" }}>
            <ThumbsUp style={{ width: 13, height: 13, color: upvoted ? "#E8733A" : "#9CA3C0", fill: upvoted ? "#E8733A" : "none" }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: upvoted ? "#E8733A" : "#9CA3C0" }}>{upvoteCount > 0 ? upvoteCount : "Upvote"}</span>
          </button>
          <button type="button" className="flex items-center gap-1.5 cursor-pointer hover:opacity-80"
            style={{ height: 30, padding: "0 8px", borderRadius: 8, background: "transparent", border: "none" }}>
            <MessageCircle style={{ width: 13, height: 13, color: "#9CA3C0" }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: "#9CA3C0" }}>{post.reply_count > 0 ? post.reply_count : "Reply"}</span>
          </button>
          <button type="button" className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 ml-auto"
            style={{ height: 30, padding: "0 8px", borderRadius: 8, background: "transparent", border: "none" }}>
            <Share2 style={{ width: 13, height: 13, color: "#9CA3C0" }} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CirclesPage;

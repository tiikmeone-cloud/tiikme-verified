import { useState, useEffect, useRef } from "react";
import { Heart, Lightbulb, Sparkles, MessageSquare, Repeat2, Share2, MoreHorizontal, Flag, Send, FileText, ChevronDown, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import NewPostModal from "@/components/NewPostModal";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import ImageGrid from "@/components/feed/ImageGrid";
import PdfCarousel from "@/components/feed/PdfCarousel";
import MentionText from "@/components/feed/MentionText";
import ActivityScoreRing from "@/components/ActivityScoreRing";
import SkeletonCard from "@/components/SkeletonCard";
import { useFeedPosts } from "@/hooks/useFeedPosts";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { usePostReactions } from "@/hooks/usePostReactions";
import { usePostComments } from "@/hooks/usePostComments";

const getComposePlaceholder = (role: string) => {
  switch (role) {
    case "student": return "Share a milestone, update, or thought...";
    case "doctor": return "Share a case, insight, or health tip...";
    case "government": return "Share something from your work today...";
    case "skilled_trade": return "Share a job you completed or a skill...";
    case "hr": return "Share a hiring insight or opportunity...";
    default: return "Share a milestone, update, or thought...";
  }
};

const getQuickActions = (role: string) => {
  switch (role) {
    case "student": return [{ label: "Project update", type: "work" }, { label: "Opportunity", type: "opportunity" }, { label: "Collaborator", type: "collab" }, { label: "PDF", type: "pdf" }];
    case "hr": return [{ label: "Job opening", type: "opportunity" }, { label: "Insight", type: "thought" }, { label: "PDF", type: "pdf" }];
    default: return [{ label: "Project update", type: "work" }, { label: "Opportunity", type: "opportunity" }, { label: "PDF", type: "pdf" }];
  }
};

const trendingTopics = ["#AgriTech", "#HealthTech", "#GovtJobs", "#UPSC", "#StartupIndia", "#SkilledTrade", "#TeacherLife", "#BankingCareers"];


const reactionConfig = [
  { key: "insightful", icon: Heart, label: "Insightful" },
  { key: "useful", icon: Lightbulb, label: "Useful" },
  { key: "inspiring", icon: Sparkles, label: "Inspiring" },
];

const roleColorMap: Record<string, string> = {
  student: "#4F46E5",
  professional: "#0369A1",
  doctor: "#0E7490",
  government: "#166534",
  skilled_trade: "#C2410C",
  hr: "#6B21A8",
};

/* ─── LIVE POST CARD (from DB) ─── */
const LivePostCard = ({ post }: { post: any }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const { user, profile: authProfile, initials: userInitials } = useAuth();
  const { userReaction, counts, toggleReaction } = usePostReactions(post.id, user?.id);
  const { comments, loading: commentsLoading, addComment } = usePostComments(post.id, showComments);

  const author = post.author;
  const name = author?.full_name || author?.username || "Unknown";
  const initials = name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
  const role = author?.role || "user";
  const roleColor = roleColorMap[role] || "#6B7280";
  const timeAgo = post.created_at ? getTimeAgo(new Date(post.created_at)) : "";

  const handleComment = async () => {
    if (!commentText.trim() || !user) return;
    await addComment(user.id, commentText.trim());
    setCommentText("");
    toast.success("Comment posted");
  };

  return (
    <article className="glass-liquid glass-liquid-hover rounded-2xl md:rounded-3xl mb-3 overflow-hidden">
      <div className="flex items-center gap-3 px-4 pt-4 pb-1">
        <Link to={`/app/profile/${author?.id || ""}`}>
          <div className="w-11 h-11 rounded-full flex items-center justify-center text-[14px] font-bold text-white shrink-0 transition-transform duration-200 hover:scale-105" style={{ backgroundColor: roleColor }}>
            {author?.avatar_url ? <img src={author.avatar_url} alt="" className="w-full h-full rounded-full object-cover" /> : initials}
          </div>
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Link to={`/app/profile/${author?.id || ""}`} className="text-[14px] font-bold hover:underline transition-colors" style={{ color: "var(--text-1)" }}>{name}</Link>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full" style={{ background: `${roleColor}1A`, color: roleColor, border: `1px solid ${roleColor}33` }}>{role}</span>
            {post.type && post.type !== "thought" && <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: "var(--surface-2)", color: "var(--text-3)", border: "1px solid var(--border)" }}>{post.type}</span>}
          </div>
          <span className="text-[11px]" style={{ color: "var(--text-3)" }}>{timeAgo}</span>
        </div>
        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)} className="p-1.5 rounded-lg transition-all duration-150 cursor-pointer" style={{ color: "var(--text-3)" }}><MoreHorizontal className="w-4 h-4" /></button>
          {showMenu && (
            <div className="absolute right-0 top-8 glass-liquid rounded-xl p-1 min-w-[160px] z-10">
              <button onClick={() => { toast.info("Following"); setShowMenu(false); }} className="flex items-center gap-2 w-full px-3 py-2 text-[12px] rounded-lg transition-all duration-150 cursor-pointer" style={{ color: "var(--text-2)" }}>Follow this person</button>
              <button onClick={() => { toast.info("Report submitted"); setShowMenu(false); }} className="flex items-center gap-2 w-full px-3 py-2 text-[12px] rounded-lg transition-all duration-150 cursor-pointer" style={{ color: "var(--text-2)" }}><Flag className="w-3 h-3" /> Report</button>
              <button onClick={() => { navigator.clipboard.writeText("https://tiikme.in/post/" + post.id); toast.success("Link copied"); setShowMenu(false); }} className="flex items-center gap-2 w-full px-3 py-2 text-[12px] rounded-lg transition-all duration-150 cursor-pointer" style={{ color: "var(--text-2)" }}>Copy link</button>
              {user?.id === post.author_id && (
                <button onClick={async () => { await supabase.from("posts").delete().eq("id", post.id); toast.success("Post deleted"); setShowMenu(false); }} className="flex items-center gap-2 w-full px-3 py-2 text-[12px] rounded-lg transition-all duration-150 cursor-pointer" style={{ color: "#DC2626" }}>Delete post</button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="px-4 py-2.5 post-body" style={{ fontSize: "14px", lineHeight: 1.75, color: "var(--text-2)" }}>
        <MentionText text={post.content} />
      </div>

      {post.image_urls && post.image_urls.length > 0 && (
        <div className="px-4 pb-2"><div className="rounded-xl overflow-hidden"><ImageGrid images={post.image_urls} /></div></div>
      )}

      {post.pdf_url && (
        <div className="mx-4 mb-3">
          <div className="flex items-center gap-3 glass-liquid rounded-xl p-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(220,38,38,0.1)" }}>
              <FileText className="w-5 h-5" style={{ color: "#DC2626" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold truncate" style={{ color: "var(--text-1)" }}>Attached PDF</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-1.5 px-4 py-2">
        {reactionConfig.map(r => {
          const count = counts[r.key] || 0;
          const active = userReaction === r.key;
          return (
            <button
              key={r.key}
              onClick={() => toggleReaction(r.key)}
              className="h-7 px-2.5 rounded-full text-[12px] font-semibold flex items-center gap-1 transition-all duration-200 cursor-pointer active:scale-95"
              style={{
                background: active ? "var(--brand-dim)" : "var(--surface-2)",
                border: active ? "1px solid var(--brand)" : "1px solid var(--border)",
                color: active ? "var(--brand)" : "var(--text-3)",
                boxShadow: active ? "0 0 8px var(--brand-glow)" : "none",
              }}
            >
              <r.icon className="w-3.5 h-3.5" /> {r.label} · {count}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-0.5 px-4 py-2" style={{ borderTop: "1px solid var(--border)" }}>
        <button onClick={() => setShowComments(!showComments)} className="h-9 px-3 rounded-xl text-[13px] font-medium flex items-center gap-1.5 transition-all duration-150 cursor-pointer hover:bg-[var(--brand-dim)]" style={{ color: "var(--text-2)" }}>
          <MessageSquare className="w-4 h-4" /> {post.comment_count || 0} <ChevronDown className={`w-3 h-3 transition-transform ${showComments ? "rotate-180" : ""}`} />
        </button>
        <button onClick={() => toast.success("Reposted")} className="h-9 px-3 rounded-xl text-[13px] font-medium flex items-center gap-1.5 transition-all duration-150 cursor-pointer hover:bg-[var(--brand-dim)]" style={{ color: "var(--text-2)" }}>
          <Repeat2 className="w-4 h-4" />
        </button>
        <button onClick={() => { navigator.clipboard.writeText("https://tiikme.in/post/" + post.id); toast.success("Link copied!"); }} className="h-9 px-3 rounded-xl text-[13px] font-medium flex items-center gap-1.5 transition-all duration-150 cursor-pointer hover:bg-[var(--brand-dim)]" style={{ color: "var(--text-2)" }}>
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      {showComments && (
        <div className="px-4 pb-4 pt-3 space-y-3" style={{ borderTop: "1px solid var(--border)" }}>
          {commentsLoading && <p className="text-[12px]" style={{ color: "var(--text-3)" }}>Loading comments...</p>}
          {comments.map((c: any) => {
            const cName = c.author?.full_name || c.author?.username || "User";
            const cInitials = cName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
            const cRole = c.author?.role || "user";
            const cColor = roleColorMap[cRole] || "#6B7280";
            const cTime = c.created_at ? getTimeAgo(new Date(c.created_at)) : "";
            return (
              <div key={c.id} className="flex items-start gap-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0" style={{ backgroundColor: cColor }}>
                  {c.author?.avatar_url ? <img src={c.author.avatar_url} alt="" className="w-full h-full rounded-full object-cover" /> : cInitials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-bold" style={{ color: "var(--text-1)" }}>{cName}</span>
                    <span className="text-[11px]" style={{ color: "var(--text-3)" }}>{cTime}</span>
                  </div>
                  <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-2)" }}><MentionText text={c.content} /></p>
                </div>
              </div>
            );
          })}
          {!commentsLoading && comments.length === 0 && (
            <p className="text-[12px]" style={{ color: "var(--text-3)" }}>No comments yet. Be the first!</p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0 overflow-hidden" style={{ background: "var(--brand)" }}>
              {authProfile?.avatar_url ? <img src={authProfile.avatar_url} alt="" className="w-full h-full object-cover" /> : userInitials}
            </div>
            <input value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Write a comment..."
              className="flex-1 h-9 rounded-xl px-3 text-[13px] outline-none transition-all duration-150"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-1)" }}
              onKeyDown={e => { if (e.key === "Enter" && commentText.trim()) handleComment(); }} />
            <button onClick={handleComment}
              className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer active:scale-95"
              style={{ background: commentText.trim() ? "var(--brand)" : "var(--surface-2)" }}>
              <Send className="w-3.5 h-3.5" style={{ color: commentText.trim() ? "white" : "var(--text-3)" }} />
            </button>
          </div>
        </div>
      )}
    </article>
  );
};


/* ─── HELPERS ─── */
function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/* ─── RIGHT RAIL WIDGETS ─── */
const ActivityWidget = () => (
  <aside className="glass-liquid rounded-2xl p-5 mb-4">
    <p className="micro-label mb-4">ACTIVITY THIS QUARTER</p>
    <div className="flex justify-center">
      <ActivityScoreRing score={78} size={100} strokeWidth={7} trend="+5 this week" percentile="Top 15% in your domain" />
    </div>
  </aside>
);

const RecruiterWidget = () => (
  <aside className="glass-liquid rounded-2xl p-5 mb-4">
    <p className="micro-label mb-3">WHO SAW YOUR WORK</p>
    <p className="text-[13px] mb-3" style={{ color: "var(--text-2)" }}>3 recruiters viewed your work this week</p>
    <div className="flex -space-x-2 mb-3">
      {[{ i: "ZP", c: "#6B21A8" }, { i: "RA", c: "#0369A1" }, { i: "TC", c: "#C2410C" }, { i: "MK", c: "#166534" }, { i: "SJ", c: "#92400E" }].map((a, idx) => (
        <div key={idx} className="w-8 h-8 rounded-full flex items-center justify-center text-[9px] font-bold text-white" style={{ backgroundColor: a.c, border: "2px solid var(--surface)" }}>{a.i}</div>
      ))}
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-[9px] font-bold" style={{ background: "var(--surface-2)", border: "2px solid var(--surface)", color: "var(--text-3)" }}>+2</div>
    </div>
    <Link to="/app/teams" className="text-[13px] font-semibold flex items-center gap-1" style={{ color: "var(--brand)" }}>See full activity <ArrowUpRight className="w-3 h-3" /></Link>
  </aside>
);

const OpportunitiesWidget = () => (
  <aside className="glass-liquid rounded-2xl p-5 mb-4">
    <p className="micro-label mb-3">OPEN OPPORTUNITIES</p>
    <div className="space-y-0">
      {[{ title: "Rural Water Monitoring IoT", reward: "₹25,000", days: "12d" }, { title: "AI Crop Disease Detection", reward: "₹50,000", days: "20d" }, { title: "E-Governance Portal Redesign", reward: "₹30,000", days: "8d" }].map((ch, i) => (
        <Link key={ch.title} to="/app/opportunities" className="flex items-start gap-2.5 py-2.5 cursor-pointer" style={{ borderBottom: i < 2 ? "1px solid var(--border)" : "none" }}>
          <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: "#F59E0B" }} />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold" style={{ color: "var(--text-1)" }}>{ch.title}</p>
            <div className="flex gap-1.5 text-[11px]" style={{ color: "var(--text-3)" }}>
              <span className="font-bold" style={{ color: "#F59E0B" }}>{ch.reward}</span>
              <span>·</span><span>{ch.days}</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
    <Link to="/app/opportunities" className="text-[13px] font-semibold mt-2 flex items-center gap-1" style={{ color: "var(--brand)" }}>View all <ArrowUpRight className="w-3 h-3" /></Link>
  </aside>
);

const SuggestedWidget = () => (
  <aside className="glass-liquid rounded-2xl p-5">
    <p className="micro-label mb-3">SUGGESTED CONNECTIONS</p>
    <div className="space-y-3">
      {[{ name: "Priya M.", role: "Faculty", initials: "PM", color: "#92400E", context: "Teaches at DTU" }, { name: "Rahul K.", role: "Professional", initials: "RK", color: "#0369A1", context: "Worked at Zepto" }, { name: "Dr. Neha S.", role: "Doctor", initials: "NS", color: "#0E7490", context: "Alumni of DTU" }].map(s => (
        <div key={s.name} className="flex items-center gap-2.5">
          <Link to="/app/profile">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold text-white hover:scale-105 transition-transform" style={{ backgroundColor: s.color }}>{s.initials}</div>
          </Link>
          <div className="flex-1 min-w-0">
            <Link to="/app/profile" className="text-[13px] font-bold truncate block hover:underline" style={{ color: "var(--text-1)" }}>{s.name}</Link>
            <p className="text-[11px]" style={{ color: "var(--text-3)" }}>{s.context}</p>
          </div>
          <Button variant="secondary" size="xs" className="active:scale-95 transition-all duration-200" onClick={() => toast.success("Request sent")}>Connect</Button>
        </div>
      ))}
    </div>
    <Link to="/app/explore" className="text-[13px] font-semibold mt-3 flex items-center gap-1" style={{ color: "var(--brand)" }}>Find more <ArrowUpRight className="w-3 h-3" /></Link>
  </aside>
);

/* ─── FEED PAGE ─── */
const Feed = () => {
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [postModalType, setPostModalType] = useState<string | undefined>();
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const { posts: livePosts, loading, loadingMore, hasMore, loadMore, refresh } = useFeedPosts();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const { profile, initials } = useAuth();
  const userRole = profile?.role || "student";

  // Pull-to-refresh state
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const feedRef = useRef<HTMLDivElement>(null);
  const PULL_THRESHOLD = 80;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      touchStartY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (refreshing || window.scrollY > 0) return;
    const dy = e.touches[0].clientY - touchStartY.current;
    if (dy > 0) {
      setPullY(Math.min(dy * 0.4, 120));
    }
  };

  const handleTouchEnd = async () => {
    if (pullY >= PULL_THRESHOLD && !refreshing) {
      setRefreshing(true);
      setPullY(PULL_THRESHOLD);
      await refresh();
      setRefreshing(false);
    }
    setPullY(0);
  };

  // Infinite scroll observer
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loadMore]);

  const openCompose = (type?: string) => { setPostModalType(type); setPostModalOpen(true); };
  const quickActions = getQuickActions(userRole);

  

  return (
    <main className="max-w-[960px] mx-auto px-4 md:px-6 py-7"
      ref={feedRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull-to-refresh indicator (mobile) */}
      <div className="md:hidden flex items-center justify-center overflow-hidden transition-all duration-200"
        style={{ height: pullY > 0 ? `${pullY}px` : 0, opacity: pullY > 20 ? 1 : 0 }}>
        <div className={`w-7 h-7 rounded-full border-2 border-t-transparent ${refreshing ? 'animate-spin' : ''}`}
          style={{ borderColor: "var(--brand)", borderTopColor: "transparent", transform: `rotate(${pullY * 3}deg)` }} />
        {pullY >= PULL_THRESHOLD && !refreshing && (
          <span className="ml-2 text-[11px] font-semibold" style={{ color: "var(--text-3)" }}>Release to refresh</span>
        )}
      </div>
      <div className="flex gap-6">
        {/* Feed column */}
        <div className="flex-1 min-w-0 max-w-[660px]">
          {/* Compose box */}
          <div className="glass-liquid rounded-2xl md:rounded-3xl p-3 mb-4">
           <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold text-white shrink-0 overflow-hidden" style={{ backgroundColor: "var(--brand)" }}>
                {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : initials}
              </div>
              <button onClick={() => openCompose()} className="flex-1 text-left text-[13px] h-10 glass-input px-4 cursor-pointer" style={{ color: "var(--text-3)" }}>
                {getComposePlaceholder(userRole)}
              </button>
            </div>
            <div className="flex items-center gap-1.5 ml-12 pt-2 mt-2" style={{ borderTop: "1px solid var(--border)" }}>
              {quickActions.map(item => (
                <button key={item.label} onClick={() => openCompose(item.type)}
                  className="h-7 px-2.5 rounded-full text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-all duration-200 active:scale-95 hover:border-[var(--brand)] hover:text-[var(--brand)]"
                  style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-2)" }}>
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Trending */}
          <div className="mb-4">
            <p className="micro-label px-1 mb-2">TRENDING</p>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {trendingTopics.map(t => (
                <button key={t} onClick={() => setActiveTopic(activeTopic === t ? null : t)}
                  className="whitespace-nowrap text-[11px] font-semibold h-7 px-2.5 rounded-full transition-all duration-200 shrink-0 cursor-pointer active:scale-95"
                  style={{
                    background: activeTopic === t ? "var(--brand)" : "var(--surface-2)",
                    border: `1px solid ${activeTopic === t ? "var(--brand)" : "var(--border)"}`,
                    color: activeTopic === t ? "white" : "var(--text-2)",
                  }}>{t}</button>
              ))}
            </div>
          </div>

          {/* Today divider */}
          {!loading && livePosts.length > 0 && (
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
              <span className="text-[11px] font-semibold px-4 py-1.5 rounded-full" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-2)" }}>
                Today · {livePosts.length} posts
              </span>
              <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
            </div>
          )}

          {/* Loading skeleton */}
          {loading && <SkeletonCard count={3} />}

          {/* Live posts from DB */}
          {!loading && livePosts.length > 0 && livePosts.map(post => (
            <LivePostCard key={post.id} post={post} />
          ))}

          {/* Empty state when no posts */}
          {!loading && livePosts.length === 0 && (
            <div className="glass-liquid rounded-2xl p-10 text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--text-3)" }} />
              <p className="text-[16px] font-bold mb-1" style={{ color: "var(--text-1)" }}>Nothing here yet</p>
              <p className="text-[13px] mb-4" style={{ color: "var(--text-3)" }}>Be the first to post something.</p>
              <Button onClick={() => openCompose()} className="rounded-full">Write a post →</Button>
            </div>
          )}

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} className="h-1" />

          {loadingMore && <SkeletonCard count={2} />}

          {!loading && !hasMore && livePosts.length > 0 && (
            <div className="flex items-center justify-center py-8">
              <span className="text-[12px] font-medium px-5 py-2 rounded-full" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-3)" }}>You're caught up ✓</span>
            </div>
          )}
        </div>

        {/* Right rail — desktop only */}
        <aside className="hidden lg:block w-[280px] shrink-0 sticky top-7 self-start space-y-0">
          <ActivityWidget />
          <RecruiterWidget />
          <OpportunitiesWidget />
          <SuggestedWidget />
        </aside>
      </div>

      <NewPostModal open={postModalOpen} onClose={() => setPostModalOpen(false)} defaultType={postModalType} />
    </main>
  );
};

export default Feed;

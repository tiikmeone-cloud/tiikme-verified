import { useState, useEffect, useRef, useMemo } from "react";
import { Heart, MessageSquare, Repeat2, MoreHorizontal, Flag, Send, FileText, ChevronDown, ArrowUpRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import ImageGrid from "@/components/feed/ImageGrid";
import MentionText from "@/components/feed/MentionText";
import ActivityScoreRing from "@/components/ActivityScoreRing";
import SkeletonCard from "@/components/SkeletonCard";
import { useFeedPosts } from "@/hooks/useFeedPosts";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useLikes } from "@/hooks/useLikes";
import { useComments } from "@/hooks/useComments";

const roleColorMap: Record<string, string> = {
  student: "#4F46E5", professional: "#0369A1", doctor: "#0E7490",
  government: "#166534", skilled_trade: "#C2410C", hr: "#6B21A8", faculty: "#92400E",
};

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

interface PostCardProps {
  post: any;
  likeCounts: Record<string, number>;
  myLikes: Record<string, boolean>;
  toggleLike: (postId: string) => void;
  commentCounts: Record<string, number>;
  commentsData: Record<string, any[]>;
  commentsOpen: Set<string>;
  commentInputs: Record<string, string>;
  setCommentInputs: (fn: (prev: Record<string, string>) => Record<string, string>) => void;
  toggleComments: (postId: string) => void;
  submitComment: (postId: string) => void;
  deleteComment: (postId: string, commentId: string) => void;
  onDelete: (postId: string) => void;
}

const LivePostCard = ({
  post, likeCounts, myLikes, toggleLike,
  commentCounts, commentsData, commentsOpen, commentInputs,
  setCommentInputs, toggleComments, submitComment, deleteComment, onDelete,
}: PostCardProps) => {
  const [showMenu, setShowMenu] = useState(false);
  const { user, profile: authProfile, initials: userInitials } = useAuth();

  const author = post.author;
  const name = author?.full_name || author?.username || "Unknown";
  const initials = name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
  const role = author?.role || "user";
  const roleColor = roleColorMap[role] || "#6B7280";
  const timeAgo = post.created_at ? getTimeAgo(new Date(post.created_at)) : "";
  const isOwn = user?.id === post.author_id;

  const liked = myLikes[post.id] || false;
  const likeCount = likeCounts[post.id] || 0;
  const commentCount = commentCounts[post.id] || 0;
  const isOpen = commentsOpen.has(post.id);
  const comments = commentsData[post.id] || [];
  const commentText = commentInputs[post.id] || "";

  const handleDelete = async () => {
    onDelete(post.id);
    await supabase.from("posts").delete().eq("id", post.id);
    toast.success("Post deleted");
    setShowMenu(false);
  };

  const handleRepost = async () => {
    if (!user) return;
    if (!confirm("Repost to your feed?")) return;
    await supabase.from("posts").insert({
      author_id: user.id, content: post.content, repost_of: post.id,
      post_type: "thought", type: "thought", visibility: "everyone",
      image_urls: post.image_urls || [],
    } as any);
    toast.success("Reposted ✓");
  };

  return (
    <article className="glass-liquid glass-liquid-hover rounded-2xl md:rounded-3xl mb-3 overflow-hidden">
      <div className="flex items-center gap-3 px-4 pt-4 pb-1">
        <Link to={`/app/profile/${author?.id || ""}`}>
          <div className="w-11 h-11 rounded-full flex items-center justify-center text-[14px] font-bold text-white shrink-0 hover:scale-105 transition-transform overflow-hidden" style={{ backgroundColor: roleColor }}>
            {author?.avatar_url ? <img src={author.avatar_url} alt="" className="w-full h-full rounded-full object-cover" /> : initials}
          </div>
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Link to={`/app/profile/${author?.id || ""}`} className="text-[14px] font-bold hover:underline" style={{ color: "var(--text-1)" }}>{name}</Link>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full" style={{ background: `${roleColor}1A`, color: roleColor }}>{role}</span>
          </div>
          <span className="text-[11px]" style={{ color: "var(--text-3)" }}>{timeAgo}</span>
        </div>
        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)} className="p-1.5 rounded-lg cursor-pointer" style={{ color: "var(--text-3)" }}><MoreHorizontal className="w-4 h-4" /></button>
          {showMenu && (
            <div className="absolute right-0 top-8 glass-liquid rounded-xl p-1 min-w-[160px] z-10">
              {isOwn ? (
                <button onClick={handleDelete} className="flex items-center gap-2 w-full px-3 py-2 text-[12px] rounded-lg cursor-pointer" style={{ color: "#DC2626" }}><Trash2 className="w-3 h-3" /> Delete post</button>
              ) : (
                <button onClick={() => { toast.info("Report submitted"); setShowMenu(false); }} className="flex items-center gap-2 w-full px-3 py-2 text-[12px] rounded-lg cursor-pointer" style={{ color: "var(--text-2)" }}><Flag className="w-3 h-3" /> Report</button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="px-4 py-2.5" style={{ fontSize: "14px", lineHeight: 1.75, color: "var(--text-2)" }}>
        <MentionText text={post.content} />
      </div>

      {post.image_urls?.length > 0 && (
        <div className="px-4 pb-2"><div className="rounded-xl overflow-hidden"><ImageGrid images={post.image_urls} /></div></div>
      )}

      {post.pdf_url && (
        <div className="mx-4 mb-3">
          <a href={post.pdf_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 glass-liquid rounded-xl p-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(220,38,38,0.1)" }}>
              <FileText className="w-5 h-5" style={{ color: "#DC2626" }} />
            </div>
            <p className="text-[13px] font-bold truncate flex-1" style={{ color: "var(--text-1)" }}>Attached PDF · Tap to open ↗</p>
          </a>
        </div>
      )}

      {/* Like / Comment / Repost */}
      <div className="flex items-center px-4 py-2" style={{ borderTop: "1px solid var(--border)" }}>
        <button onClick={() => toggleLike(post.id)} className="h-9 px-3 rounded-xl text-[13px] font-medium flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all" style={{ color: liked ? "var(--brand)" : "var(--text-2)" }}>
          <Heart className="w-4 h-4" style={{ fill: liked ? "var(--brand)" : "none", color: liked ? "var(--brand)" : "var(--text-2)" }} />
          {likeCount > 0 && <span>{likeCount}</span>}
        </button>
        <button onClick={() => toggleComments(post.id)} className="h-9 px-3 rounded-xl text-[13px] font-medium flex items-center gap-1.5 cursor-pointer hover:bg-[var(--brand-dim)]" style={{ color: "var(--text-2)" }}>
          <MessageSquare className="w-4 h-4" /> {commentCount || ""}
          <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>
        <button onClick={handleRepost} className="h-9 px-3 rounded-xl text-[13px] font-medium flex items-center gap-1.5 cursor-pointer hover:bg-[var(--brand-dim)]" style={{ color: "var(--text-2)" }}>
          <Repeat2 className="w-4 h-4" /> Repost
        </button>
      </div>

      {/* Comments */}
      {isOpen && (
        <div className="px-4 pb-4 pt-3 space-y-3" style={{ borderTop: "1px solid var(--border)" }}>
          {comments.length === 0 && <p className="text-[12px]" style={{ color: "var(--text-3)" }}>No comments yet. Be the first!</p>}
          {comments.map((c: any) => {
            const cName = c.author?.full_name || "User";
            const cInitials = cName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
            const cColor = roleColorMap[c.author?.role || ""] || "#6B7280";
            const cTime = c.created_at ? getTimeAgo(new Date(c.created_at)) : "";
            const isOwnComment = user?.id === c.user_id;
            return (
              <div key={c.id} className="flex items-start gap-2 group">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0 overflow-hidden" style={{ backgroundColor: cColor }}>
                  {c.author?.avatar_url ? <img src={c.author.avatar_url} alt="" className="w-full h-full rounded-full object-cover" /> : cInitials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link to={`/app/profile/${c.author?.id || c.user_id}`} className="text-[13px] font-bold hover:underline" style={{ color: "var(--text-1)" }}>{cName}</Link>
                    <span className="text-[11px]" style={{ color: "var(--text-3)" }}>{cTime}</span>
                    {isOwnComment && (
                      <button onClick={() => deleteComment(post.id, c.id)} className="opacity-0 group-hover:opacity-100 p-0.5 cursor-pointer" style={{ color: "var(--text-3)" }}>
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-2)" }}><MentionText text={c.content} /></p>
                </div>
              </div>
            );
          })}
          <div className="flex items-center gap-2 mt-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0 overflow-hidden" style={{ background: "var(--brand)" }}>
              {authProfile?.avatar_url ? <img src={authProfile.avatar_url} alt="" className="w-full h-full object-cover" /> : userInitials}
            </div>
            <input
              value={commentText}
              onChange={(e) => setCommentInputs((p) => ({ ...p, [post.id]: e.target.value }))}
              placeholder="Write a comment..."
              className="flex-1 h-9 rounded-xl px-3 text-[13px] outline-none"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-1)" }}
              onKeyDown={(e) => { if (e.key === "Enter" && commentText.trim()) submitComment(post.id); }}
            />
            <button
              onClick={() => submitComment(post.id)}
              className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer active:scale-95"
              style={{ background: commentText.trim() ? "var(--brand)" : "var(--surface-2)" }}
            >
              <Send className="w-3.5 h-3.5" style={{ color: commentText.trim() ? "white" : "var(--text-3)" }} />
            </button>
          </div>
        </div>
      )}
    </article>
  );
};

/* ─── RIGHT RAIL ─── */
const ActivityWidget = () => {
  const { profile } = useAuth();
  return (
    <aside className="glass-liquid rounded-2xl p-5 mb-4">
      <p className="micro-label mb-4">ACTIVITY THIS QUARTER</p>
      <div className="flex justify-center"><ActivityScoreRing score={profile?.activity_score || 0} size={100} strokeWidth={7} /></div>
    </aside>
  );
};

const OpportunitiesWidget = () => {
  const [opps, setOpps] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("opportunities").select("id, title, compensation, deadline").eq("is_open", true).order("created_at", { ascending: false }).limit(3).then(({ data }) => setOpps(data || []));
  }, []);
  if (opps.length === 0) return null;
  return (
    <aside className="glass-liquid rounded-2xl p-5 mb-4">
      <p className="micro-label mb-3">OPEN OPPORTUNITIES</p>
      <div className="space-y-0">
        {opps.map((ch, i) => (
          <Link key={ch.id} to="/app/opportunities" className="flex items-start gap-2.5 py-2.5 cursor-pointer" style={{ borderBottom: i < opps.length - 1 ? "1px solid var(--border)" : "none" }}>
            <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: "#F59E0B" }} />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold" style={{ color: "var(--text-1)" }}>{ch.title}</p>
              <div className="flex gap-1.5 text-[11px]" style={{ color: "var(--text-3)" }}>
                {ch.compensation && <span className="font-bold" style={{ color: "#F59E0B" }}>{ch.compensation}</span>}
                {ch.deadline && <><span>·</span><span>{ch.deadline}</span></>}
              </div>
            </div>
          </Link>
        ))}
      </div>
      <Link to="/app/opportunities" className="text-[13px] font-semibold mt-2 flex items-center gap-1" style={{ color: "var(--brand)" }}>View all <ArrowUpRight className="w-3 h-3" /></Link>
    </aside>
  );
};

const SuggestedWidget = () => {
  const { user } = useAuth();
  const [suggested, setSuggested] = useState<any[]>([]);
  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("id, full_name, role, avatar_url, institution_name").neq("id", user.id).eq("is_public", true).order("activity_score", { ascending: false }).limit(3).then(({ data }) => setSuggested(data || []));
  }, [user]);
  if (suggested.length === 0) return null;
  return (
    <aside className="glass-liquid rounded-2xl p-5">
      <p className="micro-label mb-3">SUGGESTED CONNECTIONS</p>
      <div className="space-y-3">
        {suggested.map(s => {
          const name = s.full_name || "User";
          const init = name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
          const color = roleColorMap[s.role || ""] || "#6B7280";
          return (
            <div key={s.id} className="flex items-center gap-2.5">
              <Link to={`/app/profile/${s.id}`}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold text-white overflow-hidden" style={{ backgroundColor: color }}>
                  {s.avatar_url ? <img src={s.avatar_url} alt="" className="w-full h-full object-cover" /> : init}
                </div>
              </Link>
              <div className="flex-1 min-w-0">
                <Link to={`/app/profile/${s.id}`} className="text-[13px] font-bold truncate block hover:underline" style={{ color: "var(--text-1)" }}>{name}</Link>
                <p className="text-[11px]" style={{ color: "var(--text-3)" }}>{s.institution_name || s.role || ""}</p>
              </div>
              <Button variant="secondary" size="sm" className="active:scale-95 text-[11px] h-7" onClick={() => { supabase.from("strands").insert({ requester_id: user!.id, receiver_id: s.id }); toast.success("Request sent"); }}>Connect</Button>
            </div>
          );
        })}
      </div>
      <Link to="/app/explore" className="text-[13px] font-semibold mt-3 flex items-center gap-1" style={{ color: "var(--brand)" }}>Find more <ArrowUpRight className="w-3 h-3" /></Link>
    </aside>
  );
};

/* ─── FEED PAGE ─── */
const Feed = () => {
  const feedNavigate = useNavigate();
  const { posts: livePosts, loading, loadingMore, hasMore, loadMore, refresh } = useFeedPosts();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const { profile, initials } = useAuth();
  const feedRef = useRef<HTMLDivElement>(null);

  // Batch like/comment hooks
  const postIds = useMemo(() => livePosts.map((p: any) => p.id), [livePosts]);
  const { counts: likeCounts, myLikes, toggle: toggleLike } = useLikes(postIds);
  const {
    all: commentsData, inputs: commentInputs, setInputs: setCommentInputs,
    open: commentsOpen, counts: commentCounts, toggleOpen: toggleComments,
    submit: submitComment, deleteComment, loadCounts: loadCommentCounts,
  } = useComments();

  // Load comment counts when posts change
  useEffect(() => {
    if (postIds.length) loadCommentCounts(postIds);
  }, [postIds.length]);

  // Handle post deletion from feed
  const handleDeletePost = (postId: string) => {
    // Remove immediately from local feed for instant feedback
    // (realtime DELETE event is backup)
  };

  // Pull-to-refresh
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const PULL_THRESHOLD = 80;

  const handleTouchStart = (e: React.TouchEvent) => { if (window.scrollY === 0) touchStartY.current = e.touches[0].clientY; };
  const handleTouchMove = (e: React.TouchEvent) => { if (refreshing || window.scrollY > 0) return; const dy = e.touches[0].clientY - touchStartY.current; if (dy > 0) setPullY(Math.min(dy * 0.4, 120)); };
  const handleTouchEnd = async () => { if (pullY >= PULL_THRESHOLD && !refreshing) { setRefreshing(true); setPullY(PULL_THRESHOLD); await refresh(); setRefreshing(false); } setPullY(0); };

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(entries => { if (entries[0].isIntersecting && hasMore && !loadingMore) loadMore(); }, { threshold: 0.1 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loadMore]);

  return (
    <main className="max-w-[960px] mx-auto px-4 md:px-6 py-7" ref={feedRef}
      onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
      {/* Pull-to-refresh */}
      <div className="md:hidden flex items-center justify-center overflow-hidden transition-all duration-200"
        style={{ height: pullY > 0 ? `${pullY}px` : 0, opacity: pullY > 20 ? 1 : 0 }}>
        <div className={`w-7 h-7 rounded-full border-2 border-t-transparent ${refreshing ? 'animate-spin' : ''}`}
          style={{ borderColor: "var(--brand)", borderTopColor: "transparent", transform: `rotate(${pullY * 3}deg)` }} />
      </div>
      <div className="flex gap-6">
        <div className="flex-1 min-w-0 max-w-[660px]">
          {/* Compose */}
          <div className="glass-liquid rounded-2xl md:rounded-3xl p-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold text-white shrink-0 overflow-hidden" style={{ backgroundColor: "var(--brand)" }}>
                {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : initials}
              </div>
              <button onClick={() => feedNavigate("/post/create")} className="flex-1 text-left text-[13px] h-10 glass-input px-4 cursor-pointer" style={{ color: "var(--text-3)" }}>
                What's on your mind?
              </button>
            </div>
          </div>

          {!loading && livePosts.length > 0 && (
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
              <span className="text-[11px] font-semibold px-4 py-1.5 rounded-full" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-2)" }}>
                Today · {livePosts.length} posts
              </span>
              <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
            </div>
          )}

          {loading && <SkeletonCard count={3} />}
          {!loading && livePosts.map((post: any) => (
            <LivePostCard
              key={post.id}
              post={post}
              likeCounts={likeCounts}
              myLikes={myLikes}
              toggleLike={toggleLike}
              commentCounts={commentCounts}
              commentsData={commentsData}
              commentsOpen={commentsOpen}
              commentInputs={commentInputs}
              setCommentInputs={setCommentInputs}
              toggleComments={toggleComments}
              submitComment={submitComment}
              deleteComment={deleteComment}
              onDelete={handleDeletePost}
            />
          ))}

          {!loading && livePosts.length === 0 && (
            <div className="glass-liquid rounded-2xl p-10 text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--text-3)" }} />
              <p className="text-[16px] font-bold mb-1" style={{ color: "var(--text-1)" }}>Nothing here yet</p>
              <p className="text-[13px] mb-4" style={{ color: "var(--text-3)" }}>Be the first to post something.</p>
              <Button onClick={() => feedNavigate("/post/create")} className="rounded-full">Write a post →</Button>
            </div>
          )}

          <div ref={sentinelRef} className="h-1" />
          {loadingMore && <SkeletonCard count={2} />}
          {!loading && !hasMore && livePosts.length > 0 && (
            <div className="flex items-center justify-center py-8">
              <span className="text-[12px] font-medium px-5 py-2 rounded-full" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-3)" }}>You're caught up ✓</span>
            </div>
          )}
        </div>
        <aside className="hidden lg:block w-[280px] shrink-0 sticky top-7 self-start space-y-0">
          <ActivityWidget />
          <OpportunitiesWidget />
          <SuggestedWidget />
        </aside>
      </div>
    </main>
  );
};

export default Feed;

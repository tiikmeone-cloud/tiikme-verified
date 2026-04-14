import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { PageSEO } from "@/hooks/usePageSEO";
import { storageImageUrl } from "@/lib/imageTransform";
import { Heart, MessageSquare, Repeat2, MoreHorizontal, Flag, Send, FileText, ChevronDown, ArrowUpRight, Trash2, Pencil, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import ImageGrid from "@/components/feed/ImageGrid";
import MentionText from "@/components/feed/MentionText";
import ActivityScoreRing from "@/components/ActivityScoreRing";
import SkeletonCard from "@/components/SkeletonCard";
import EditPostModal from "@/components/feed/EditPostModal";
import DeletePostDialog from "@/components/feed/DeletePostDialog";
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
  onEdit: (post: any) => void;
}

const LivePostCard = ({
  post, likeCounts, myLikes, toggleLike,
  commentCounts, commentsData, commentsOpen, commentInputs,
  setCommentInputs, toggleComments, submitComment, deleteComment, onDelete, onEdit,
}: PostCardProps) => {
  const [showMenu, setShowMenu] = useState(false);
  const { user, profile: authProfile, initials: userInitials } = useAuth();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showMenu]);

  const isOrgPost = !!post.posted_by_org && !!post.org;
  const author = post.author;

  const displayAvatar = isOrgPost ? post.org?.logo_url : author?.avatar_url;
  const displayName = isOrgPost ? post.org?.name : (author?.full_name || author?.username || "Unknown");
  const displayRole = isOrgPost ? post.org?.type : (author?.role || "user");
  const profileLink = isOrgPost ? `/org/${post.org?.slug}` : `/app/profile/${author?.id || ""}`;

  const viaName = isOrgPost && post.poster_profile?.full_name
    ? post.poster_profile.full_name
    : null;

  const initials = displayName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
  const roleColor = isOrgPost ? "#E8580A" : (roleColorMap[displayRole] || "#6B7280");
  const timeAgo = post.created_at ? getTimeAgo(new Date(post.created_at)) : "";
  const isOwn = user?.id === post.author_id;
  const isEdited = post.is_edited;

  const liked = myLikes[post.id] || false;
  const likeCount = likeCounts[post.id] || 0;
  const commentCount = commentCounts[post.id] || 0;
  const isOpen = commentsOpen.has(post.id);
  const comments = commentsData[post.id] || [];
  const commentText = commentInputs[post.id] || "";

  const isWorkspacePost = post.visibility === "workspace";
  const repostCount = post.repost_count || 0;

  // Username display
  const username = !isOrgPost && author?.username ? `@${author.username}` : null;

  // Company badge: show institution_name from author profile
  const companyName = !isOrgPost && author?.institution_name ? author.institution_name : null;

  const [confirmRepost, setConfirmRepost] = useState(false);
  const handleRepost = async () => {
    if (!user) return;
    if (!confirmRepost) { setConfirmRepost(true); return; }
    try {
      await supabase.from("posts").insert({
        author_id: user.id, content: post.content, repost_of: post.id,
        post_type: "thought", type: "thought", visibility: "everyone",
        image_urls: post.image_urls || [],
      } as any);
      await supabase.from("post_reposts").insert({ post_id: post.id, reposted_by: user.id });
      toast.success("Reposted");
    } catch (e) { console.warn("[Feed] repost failed:", e); }
    setConfirmRepost(false);
  };

  const isTownhall = post.post_type === "townhall";

  return (
    <article
      className="glass-light mb-3 overflow-hidden"
      style={{
        padding: 16,
        borderRadius: 24,
        borderLeft: isTownhall ? "4px solid var(--color-accent)" : undefined,
        transition: "all 0.3s ease",
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 12px 40px var(--glass-shadow-hover), inset 0 1px 0 var(--glass-highlight)`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
    >
      {isTownhall && (
        <div className="pb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--color-accent)" }}>TOWNHALL</span>
        </div>
      )}
      <div className="flex items-center gap-3 pb-1">
        <Link to={profileLink}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[13px] font-bold text-white shrink-0 hover:scale-105 transition-transform overflow-hidden"
            style={{ backgroundColor: roleColor, border: "2px solid rgba(255,255,255,0.25)" }}>
            {displayAvatar
              ? <img src={storageImageUrl(displayAvatar, "avatar")} alt="" className="w-full h-full object-cover" />
              : initials}
          </div>
        </Link>
        <div className="min-w-0 flex-1">
          {/* Line 1: Name · @username · timestamp · (edited) */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Link to={profileLink} className="font-semibold hover:underline" style={{ color: "var(--color-text)", fontSize: 15 }}>{displayName}</Link>
            {username && (
              <span className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>{username}</span>
            )}
            <span className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>·</span>
            <span style={{ color: "var(--color-text-secondary)", fontSize: 12 }}>{timeAgo}</span>
            {isEdited && (
              <span className="text-[11px] italic" style={{ color: "var(--color-text-muted)" }}>(edited)</span>
            )}
          </div>
          {/* Line 2: Company badge or via name */}
          {viaName ? (
            <span className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>via {viaName}</span>
          ) : companyName ? (
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 overflow-hidden" style={{ background: "rgba(232,115,58,0.15)" }}>
                <span className="text-[7px] font-bold" style={{ color: "var(--color-accent)" }}>
                  {companyName.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>{companyName}</span>
            </div>
          ) : null}
        </div>
        <div className="relative" ref={menuRef}>
          <button type="button" onClick={() => setShowMenu(!showMenu)} className="p-2 md:p-1.5 rounded-lg cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center" style={{ color: "var(--color-text-secondary)" }}
            onMouseEnter={e => { e.currentTarget.style.color = "var(--color-text)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "var(--color-text-secondary)"; }}>
            <MoreHorizontal className="w-4 h-4" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-8 glass-light rounded-xl p-1 min-w-[170px] z-10" style={{ borderRadius: 14 }}>
              <button type="button" onClick={() => { navigator.clipboard.writeText(window.location.origin + "/post/" + post.id); toast.success("Link copied!"); setShowMenu(false); }}
                className="flex items-center gap-2 w-full px-3 py-2 text-[12px] rounded-lg cursor-pointer" style={{ color: "var(--color-text-secondary)" }}>
                <Copy className="w-3 h-3" /> Copy link
              </button>
              <button type="button" onClick={() => {
                if (navigator.share) { navigator.share({ title: "Post on Tiikme", url: window.location.origin + "/post/" + post.id }); }
                else { navigator.clipboard.writeText(window.location.origin + "/post/" + post.id); toast.success("Link copied!"); }
                setShowMenu(false);
              }} className="flex items-center gap-2 w-full px-3 py-2 text-[12px] rounded-lg cursor-pointer" style={{ color: "var(--color-text-secondary)" }}>
                <Send className="w-3 h-3" /> Share via...
              </button>
              {isOwn ? (
                <>
                  <button type="button" onClick={() => { onEdit(post); setShowMenu(false); }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-[12px] rounded-lg cursor-pointer" style={{ color: "var(--color-text-secondary)" }}>
                    <Pencil className="w-3 h-3" /> Edit post
                  </button>
                  <button type="button" onClick={() => { onDelete(post.id); setShowMenu(false); }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-[12px] rounded-lg cursor-pointer" style={{ color: "#DC2626" }}>
                    <Trash2 className="w-3 h-3" /> Delete post
                  </button>
                </>
              ) : (
                <button type="button" onClick={() => { toast.info("Report submitted"); setShowMenu(false); }} className="flex items-center gap-2 w-full px-3 py-2 text-[12px] rounded-lg cursor-pointer" style={{ color: "var(--color-text-secondary)" }}>
                  <Flag className="w-3 h-3" /> Report
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="py-2.5" style={{ fontSize: 15, lineHeight: 1.5, color: "var(--color-text)" }}>
        <MentionText text={post.content} />
      </div>

      {post.image_urls?.length > 0 && (
        <div className="pb-2"><div className="rounded-xl overflow-hidden"><ImageGrid images={post.image_urls} /></div></div>
      )}

      {post.pdf_url && (
        <div className="mb-3">
          <a href={post.pdf_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 glass-medium rounded-xl p-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(220,38,38,0.1)" }}>
              <FileText className="w-5 h-5" style={{ color: "#DC2626" }} />
            </div>
            <p className="text-[13px] font-bold truncate flex-1" style={{ color: "var(--color-text)" }}>Attached PDF · Tap to open</p>
          </a>
        </div>
      )}

      {repostCount >= 2 && (
        <div className="pb-1">
          <p className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>
            {isOrgPost ? post.org?.name : displayName} and {repostCount - 1} other{repostCount > 2 ? "s" : ""} reposted
          </p>
        </div>
      )}

      {/* Like / Comment / Repost */}
      <div className="flex items-center gap-1 pt-2" style={{ borderTop: "1px solid var(--glass-border-subtle)" }}>
        <button type="button" onClick={() => toggleLike(post.id)}
          className="h-8 px-2.5 rounded-xl text-[13px] font-semibold flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
          style={{ background: "rgba(255,255,255,0.15)", borderRadius: 12, color: liked ? "var(--color-accent)" : "var(--color-text-secondary)" }}>
          <Heart className="w-4 h-4" style={{ fill: liked ? "var(--color-accent)" : "none", color: liked ? "var(--color-accent)" : "var(--color-text-secondary)" }} />
          {likeCount}
        </button>
        <button type="button" onClick={() => toggleComments(post.id)}
          className="h-8 px-2.5 rounded-xl text-[13px] font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
          style={{ background: "rgba(255,255,255,0.15)", borderRadius: 12, color: isOpen ? "var(--color-accent)" : "var(--color-text-secondary)" }}>
          <MessageSquare className="w-4 h-4" /> {commentCount}
        </button>
        {!isWorkspacePost && (
          <div className="relative">
            <button type="button" onClick={handleRepost}
              className="h-8 px-2.5 rounded-xl text-[13px] font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
              style={{ background: "rgba(255,255,255,0.15)", borderRadius: 12, color: "var(--color-text-secondary)" }}>
              <Repeat2 className="w-4 h-4" />
            </button>
            {confirmRepost && (
              <div className="absolute bottom-full left-0 mb-1 flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] whitespace-nowrap glass-light" style={{ zIndex: 10, borderRadius: 10 }}>
                <span style={{ color: "var(--color-text-secondary)" }}>Repost?</span>
                <button type="button" onClick={handleRepost} className="font-bold px-1.5 cursor-pointer" style={{ color: "var(--color-accent)" }}>Yes</button>
                <button type="button" onClick={() => setConfirmRepost(false)} className="px-1.5 cursor-pointer" style={{ color: "var(--color-text-muted)" }}>No</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Comments */}
      {isOpen && (
        <div className="pt-3 space-y-3" style={{ borderTop: "1px solid var(--glass-border-subtle)", marginTop: 8 }}>
          {comments.length === 0 && <p className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>No comments yet. Be the first!</p>}
          {comments.map((c: any) => {
            const cName = c.author?.full_name || "User";
            const cInitials = cName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
            const cColor = roleColorMap[c.author?.role || ""] || "#6B7280";
            const cTime = c.created_at ? getTimeAgo(new Date(c.created_at)) : "";
            const isOwnComment = user?.id === c.user_id;
            return (
              <div key={c.id} className="flex items-start gap-2 group">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shrink-0 overflow-hidden" style={{ backgroundColor: cColor }}>
                  {c.author?.avatar_url ? <img src={storageImageUrl(c.author.avatar_url, "avatar")} alt="" className="w-full h-full object-cover" /> : cInitials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link to={`/app/profile/${c.author?.id || c.user_id}`} className="text-[13px] font-bold hover:underline" style={{ color: "var(--color-text)" }}>{cName}</Link>
                    <span className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>{cTime}</span>
                    {isOwnComment && (
                      <button type="button" onClick={() => deleteComment(post.id, c.id)} className="opacity-0 group-hover:opacity-100 p-0.5 cursor-pointer" style={{ color: "var(--color-text-muted)" }}>
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <p className="text-[13px] leading-relaxed" style={{ color: "var(--color-text-secondary)" }}><MentionText text={c.content} /></p>
                </div>
              </div>
            );
          })}
          {user && (
            <div className="flex items-center gap-2 mt-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shrink-0 overflow-hidden" style={{ background: "var(--color-accent)" }}>
                {authProfile?.avatar_url ? <img src={storageImageUrl(authProfile.avatar_url, "avatar")} alt="" className="w-full h-full object-cover" /> : userInitials}
              </div>
              <input
                value={commentText}
                onChange={(e) => setCommentInputs((p) => ({ ...p, [post.id]: e.target.value }))}
                placeholder="Write a comment..."
                className="flex-1 h-9 rounded-xl px-3 text-[13px] outline-none glass-input"
                onKeyDown={(e) => { if (e.key === "Enter" && commentText.trim()) submitComment(post.id); }}
              />
              <button
                type="button"
                onClick={() => submitComment(post.id)}
                className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer active:scale-95"
                style={{ background: commentText.trim() ? "var(--color-accent)" : "var(--color-surface)" }}
              >
                <Send className="w-3.5 h-3.5" style={{ color: commentText.trim() ? "white" : "var(--color-text-muted)" }} />
              </button>
            </div>
          )}
        </div>
      )}
    </article>
  );
};

/* ─── RIGHT RAIL ─── */
const ActivityWidget = () => {
  const { profile } = useAuth();
  return (
    <aside className="glass-glow rounded-3xl p-5 mb-4">
      <p className="text-[11px] font-semibold uppercase tracking-wider mb-4" style={{ color: "var(--color-text-secondary)", letterSpacing: "0.05em" }}>ACTIVITY THIS QUARTER</p>
      <div className="flex justify-center"><ActivityScoreRing score={profile?.activity_score || 0} size={100} strokeWidth={7} /></div>
    </aside>
  );
};

const OpportunitiesWidget = () => {
  const [opps, setOpps] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("opportunities").select("id, title, compensation, deadline").eq("is_open", true).order("created_at", { ascending: false }).limit(3).then(({ data, error }) => { if (error) console.warn("[Feed] opps fetch failed:", error.message); setOpps(data || []); });
  }, []);
  if (opps.length === 0) return null;
  return (
    <aside className="glass-medium rounded-3xl p-5 mb-4">
      <p className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--color-text-secondary)", letterSpacing: "0.05em" }}>OPEN OPPORTUNITIES</p>
      <div className="space-y-0">
        {opps.map((ch, i) => (
          <Link key={ch.id} to="/app/opportunities" className="flex items-start gap-2.5 py-2.5 cursor-pointer" style={{ borderBottom: i < opps.length - 1 ? "1px solid rgba(255,255,255,0.15)" : "none" }}>
            <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: "#F59E0B" }} />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold" style={{ color: "var(--color-text)" }}>{ch.title}</p>
              <div className="flex gap-1.5 text-[11px]" style={{ color: "var(--color-text-muted)" }}>
                {ch.compensation && <span className="font-bold" style={{ color: "#F59E0B" }}>{ch.compensation}</span>}
                {ch.deadline && <><span>·</span><span>{ch.deadline}</span></>}
              </div>
            </div>
          </Link>
        ))}
      </div>
      <Link to="/app/opportunities" className="text-[13px] font-semibold mt-2 flex items-center gap-1" style={{ color: "var(--color-accent)" }}>View all <ArrowUpRight className="w-3 h-3" /></Link>
    </aside>
  );
};

const SuggestedWidget = () => {
  const { user } = useAuth();
  const [suggested, setSuggested] = useState<any[]>([]);
  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("id, full_name, role, avatar_url, institution_name").neq("id", user.id).eq("is_public", true).order("activity_score", { ascending: false }).limit(3).then(({ data, error }) => { if (error) console.warn("[Feed] suggested fetch failed:", error.message); setSuggested(data || []); });
  }, [user]);
  if (suggested.length === 0) return null;
  return (
    <aside className="glass-medium rounded-3xl p-5">
      <p className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--color-text-secondary)", letterSpacing: "0.05em" }}>SUGGESTED CONNECTIONS</p>
      <div className="space-y-3">
        {suggested.map(s => {
          const name = s.full_name || "User";
          const init = name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
          const color = roleColorMap[s.role || ""] || "#6B7280";
          return (
            <div key={s.id} className="flex items-center gap-2.5" style={{ paddingBottom: 10, borderBottom: "1px solid rgba(255,255,255,0.15)" }}>
              <Link to={`/app/profile/${s.id}`}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-bold text-white overflow-hidden" style={{ backgroundColor: color }}>
                  {s.avatar_url ? <img src={storageImageUrl(s.avatar_url, "avatar")} alt="" className="w-full h-full object-cover" /> : init}
                </div>
              </Link>
              <div className="flex-1 min-w-0">
                <Link to={`/app/profile/${s.id}`} className="text-[13px] font-bold truncate block hover:underline" style={{ color: "var(--color-text)" }}>{name}</Link>
                <p className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>{s.institution_name || s.role || ""}</p>
              </div>
              <button
                className="btn-glass-pill text-[12px] font-semibold active:scale-95"
                style={{ padding: "4px 12px", fontSize: 12 }}
                onClick={() => { supabase.from("strands").insert({ requester_id: user!.id, receiver_id: s.id }); toast.success("Request sent"); }}
              >Connect</button>
            </div>
          );
        })}
      </div>
      <Link to="/app/explore" className="text-[13px] font-semibold mt-3 flex items-center gap-1" style={{ color: "var(--color-accent)" }}>Find more <ArrowUpRight className="w-3 h-3" /></Link>
    </aside>
  );
};

/* ─── FEED PAGE ─── */
const Feed = () => {
  const feedNavigate = useNavigate();
  const { posts: livePosts, loading, loadingMore, hasMore, loadMore, refresh } = useFeedPosts();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const { user, profile, initials, displayName } = useAuth();
  const identityAvatar = profile?.avatar_url || null;
  const identityInitials = initials;
  const identityName = displayName;
  const feedRef = useRef<HTMLDivElement>(null);
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());

  // Edit/delete modals
  const [editingPost, setEditingPost] = useState<any | null>(null);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [editedPosts, setEditedPosts] = useState<Record<string, any>>({});

  const visiblePosts = useMemo(() =>
    livePosts
      .filter((p: any) => !deletedIds.has(p.id))
      .map((p: any) => editedPosts[p.id] ? { ...p, ...editedPosts[p.id] } : p),
    [livePosts, deletedIds, editedPosts]
  );

  const postIds = useMemo(() => visiblePosts.map((p: any) => p.id), [visiblePosts]);
  const postIdsKey = useMemo(() => postIds.join(","), [postIds]);
  const { counts: likeCounts, myLikes, toggle: toggleLike } = useLikes(postIds);
  const {
    all: commentsData, inputs: commentInputs, setInputs: setCommentInputs,
    open: commentsOpen, counts: commentCounts, toggleOpen: toggleComments,
    submit: submitComment, deleteComment, loadCounts: loadCommentCounts,
  } = useComments();

  useEffect(() => {
    loadCommentCounts(postIds);
  }, [postIdsKey, loadCommentCounts]);

  const handleDeletePost = (postId: string) => {
    setDeletingPostId(postId);
  };

  const handleDeleteConfirmed = (postId: string) => {
    setDeletedIds(prev => new Set(prev).add(postId));
    setDeletingPostId(null);
  };

  const handleEditSaved = (updated: any) => {
    setEditedPosts(prev => ({ ...prev, [updated.id]: { content: updated.content, is_edited: updated.is_edited, updated_at: updated.updated_at } }));
  };

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
    <main className="max-w-[960px] mx-auto px-3 md:px-6 py-4 md:py-7" ref={feedRef}
      onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
      <PageSEO
        title="Feed | Tiikme"
        description="Your professional feed — posts, updates, and insights from verified professionals and organizations on Tiikme."
        noIndex
      />
      <div className="md:hidden flex items-center justify-center overflow-hidden transition-all duration-200"
        style={{ height: pullY > 0 ? `${pullY}px` : 0, opacity: pullY > 20 ? 1 : 0 }}>
        <div className={`w-7 h-7 rounded-full border-2 border-t-transparent ${refreshing ? 'animate-spin' : ''}`}
          style={{ borderColor: "var(--color-accent)", borderTopColor: "transparent", transform: `rotate(${pullY * 3}deg)` }} />
      </div>
      <div className="flex gap-6">
        <div className="flex-1 min-w-0 max-w-[660px]">
          {/* Composer */}
          <div className="glass-light p-4 mb-4" style={{ borderRadius: 20 }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[12px] font-bold text-white shrink-0 overflow-hidden" style={{ backgroundColor: "var(--color-accent)", border: "2px solid rgba(255,255,255,0.30)" }}>
                {identityAvatar ? <img src={storageImageUrl(identityAvatar, "avatar")} alt="" className="w-full h-full object-cover" /> : identityInitials}
              </div>
              <button type="button" onClick={() => feedNavigate("/post/create")} className="flex-1 text-left text-[13px] h-10 glass-input px-4 cursor-pointer" style={{ color: "var(--color-text-muted)" }}>
                What's on your mind?
              </button>
            </div>
          </div>

          {/* Today badge */}
          {!loading && visiblePosts.length > 0 && (
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px" style={{ background: "var(--glass-border-subtle)" }} />
              <span className="text-[13px] font-semibold px-4 py-1.5 rounded-[20px]"
                style={{ background: "rgba(255, 255, 255, 0.20)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid rgba(255, 255, 255, 0.25)", color: "var(--color-text-secondary)" }}>
                Today · {visiblePosts.length} posts
              </span>
              <div className="flex-1 h-px" style={{ background: "var(--glass-border-subtle)" }} />
            </div>
          )}

          {loading && <SkeletonCard count={3} />}
          {!loading && visiblePosts.map((post: any) => (
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
              onEdit={setEditingPost}
            />
          ))}

          {!loading && visiblePosts.length === 0 && (
            <div className="glass-light rounded-3xl p-10 text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--color-text-muted)" }} />
              <p className="text-[16px] font-bold mb-1" style={{ color: "var(--color-text)" }}>Nothing here yet</p>
              <p className="text-[13px] mb-4" style={{ color: "var(--color-text-muted)" }}>Be the first to post something.</p>
              <button onClick={() => feedNavigate("/post/create")} className="btn-liquid-primary rounded-full">Write a post</button>
            </div>
          )}

          <div ref={sentinelRef} className="h-1" />
          {loadingMore && <SkeletonCard count={2} />}
          {!loading && !hasMore && visiblePosts.length > 0 && (
            <div className="flex items-center justify-center py-8">
              <span className="text-[12px] font-medium px-5 py-2 rounded-full" style={{ background: "rgba(255,255,255,0.20)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.25)", color: "var(--color-text-muted)" }}>You're caught up</span>
            </div>
          )}
        </div>
        <aside className="hidden lg:block w-[280px] shrink-0 sticky top-7 self-start space-y-0">
          <ActivityWidget />
          <OpportunitiesWidget />
          <SuggestedWidget />
        </aside>
      </div>

      {/* Edit modal */}
      {editingPost && (
        <EditPostModal
          post={editingPost}
          onClose={() => setEditingPost(null)}
          onSaved={handleEditSaved}
        />
      )}

      {/* Delete confirmation */}
      {deletingPostId && (
        <DeletePostDialog
          postId={deletingPostId}
          onClose={() => setDeletingPostId(null)}
          onDeleted={handleDeleteConfirmed}
        />
      )}
    </main>
  );
};

export default Feed;

import { useState, useEffect, useRef } from "react";
import { cleanUsername } from "@/lib/cleanUsername";
import AvatarSquare from "@/components/ui/AvatarSquare";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Heart, MessageSquare, Send, Trash2, MoreHorizontal, Pencil, Copy, Flag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { sendNotification } from "@/lib/notify";
import MentionText from "@/components/feed/MentionText";
import PostCarousel from "@/components/feed/PostCarousel";
import EditPostModal from "@/components/feed/EditPostModal";
import DeletePostDialog from "@/components/feed/DeletePostDialog";
import ShareModal from "@/components/feed/ShareModal";
import CommentLoveButton from "@/components/feed/CommentLoveButton";

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

const PostDetail = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [editingPost, setEditingPost] = useState<any | null>(null);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showMenu]);

  useEffect(() => {
    if (!postId) return;
    (async () => {
      try {
        const { data, error: postErr } = await supabase.from("posts")
          .select(`*, author:profiles!author_id (id, full_name, username, role, avatar_url, institution_name)`)
          .eq("id", postId).maybeSingle();
        if (postErr) console.warn("[PostDetail] post fetch failed:", postErr.message);
        setPost(data);

        const [reactionsRes, cmtsRes, myReactionRes] = await Promise.allSettled([
          supabase.from("post_reactions").select("id").eq("post_id", postId),
          supabase.from("post_comments").select("*, author:profiles!post_comments_user_id_fkey(id, full_name, avatar_url, role)").eq("post_id", postId).order("created_at", { ascending: true }).limit(50),
          user ? supabase.from("post_reactions").select("id").eq("post_id", postId).eq("user_id", user.id).maybeSingle() : Promise.resolve({ data: null }),
        ]);
        const reactions = reactionsRes.status === "fulfilled" ? (reactionsRes.value as any).data || [] : [];
        const cmts = cmtsRes.status === "fulfilled" ? (cmtsRes.value as any).data || [] : [];
        const myReaction = myReactionRes.status === "fulfilled" ? (myReactionRes.value as any).data : null;
        setLikeCount(reactions.length || 0);
        setLiked(!!myReaction);
        setComments(cmts);
      } catch (e) {
        console.warn("[PostDetail] exception:", e);
      }
      setLoading(false);
    })();
  }, [postId, user]);

  const toggleLike = async () => {
    if (!user || !postId) return;
    if (liked) {
      setLiked(false);
      setLikeCount(c => c - 1);
      await supabase.from("post_reactions").delete().eq("post_id", postId).eq("user_id", user.id);
    } else {
      setLiked(true);
      setLikeCount(c => c + 1);
      await supabase.from("post_reactions").insert({ post_id: postId, user_id: user.id, reaction_type: "like" });
      if (post?.author_id && post.author_id !== user.id) {
        sendNotification({
          userId: post.author_id,
          actorId: user.id,
          type: "like",
          title: `${profile?.full_name || "Someone"} liked your post`,
          actionUrl: `/post/${postId}`,
        });
      }
    }
  };

  const submitComment = async () => {
    if (!commentText.trim() || !user || !postId) return;
    const content = commentText.trim();
    setCommentText("");
    const { data } = await supabase.from("post_comments").insert({ post_id: postId, user_id: user.id, content }).select("*, author:profiles!post_comments_user_id_fkey(id, full_name, avatar_url, role)").single();
    if (data) {
      setComments(prev => [...prev, data]);
      // Notify post author
      if (post?.author_id && post.author_id !== user.id) {
        sendNotification({
          userId: post.author_id,
          actorId: user.id,
          type: "comment",
          title: `${profile?.full_name || "Someone"} commented on your post`,
          body: content.slice(0, 80),
          actionUrl: `/post/${postId}`,
        });
      }
    }
  };

  const deleteComment = async (commentId: string) => {
    setComments(prev => prev.filter(c => c.id !== commentId));
    await supabase.from("post_comments").delete().eq("id", commentId);
  };

  if (loading) return (
    <div className="max-w-[660px] mx-auto px-4 py-8">
      <div className="t-card p-6 animate-pulse h-48" />
    </div>
  );

  if (!post) return (
    <div className="max-w-[660px] mx-auto px-4 py-8 text-center">
      <p className="text-[16px] font-bold" style={{ color: "var(--text-1)" }}>Post not found</p>
      <button type="button" onClick={() => navigate("/app/feed")} className="text-[13px] mt-2" style={{ color: "var(--brand)" }}>Back to Feed</button>
    </div>
  );

  const author = post.author;
  const name = author?.full_name || "Unknown";
  const initials = name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
  const roleColor = roleColorMap[author?.role || ""] || "#6B7280";
  const userInitials = profile?.full_name?.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase() || "U";
  const isOwn = user?.id === post.author_id;
  const username = author?.username ? `@${cleanUsername(author.username)}` : null;
  const companyName = author?.institution_name || null;

  return (
    <main className="max-w-[660px] mx-auto px-4 py-4">
      <button type="button" onClick={() => navigate(-1)} className="flex items-center gap-2 text-[14px] font-semibold cursor-pointer min-h-[44px] mb-4" style={{ color: "var(--text-2)" }}>
        <ArrowLeft className="w-5 h-5" /> Back
      </button>

      <article className="glass-liquid rounded-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 pt-4 pb-2">
          <Link to={`/app/profile/${author?.id || ""}`}>
            <AvatarSquare src={author?.avatar_url} name={name} size={44} bgColor={roleColor} />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 overflow-hidden" style={{ lineHeight: "18px" }}>
              <Link to={`/app/profile/${author?.id || ""}`} className="text-[14px] font-bold hover:underline truncate shrink-0" style={{ color: "var(--text-1)", maxWidth: "40%" }}>{name}</Link>
              {username && <span className="text-[12px] shrink-0" style={{ color: "var(--text-3)" }}>{username}</span>}
              {companyName && (
                <>
                  <span className="text-[12px] shrink-0" style={{ color: "var(--text-3)" }}>·</span>
                  <span className="text-[12px] truncate" style={{ color: "var(--text-3)", maxWidth: "30%" }}>{companyName}</span>
                </>
              )}
              <span className="text-[12px] shrink-0" style={{ color: "var(--text-3)" }}>·</span>
              <span className="text-[11px] shrink-0" style={{ color: "var(--text-3)" }}>{post.created_at ? getTimeAgo(new Date(post.created_at)) : ""}</span>
              {post.is_edited && <span className="text-[11px] italic shrink-0" style={{ color: "var(--text-3)" }}>(edited)</span>}
            </div>
          </div>
          <div className="relative" ref={menuRef}>
            <button type="button" onClick={() => setShowMenu(!showMenu)} className="p-2 rounded-lg cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center" style={{ color: "var(--text-2)" }}>
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-8 glass-light rounded-xl p-1 min-w-[170px] z-10" style={{ borderRadius: 14 }}>
                <button type="button" onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Link copied!"); setShowMenu(false); }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-[12px] rounded-lg cursor-pointer" style={{ color: "var(--text-2)" }}>
                  <Copy className="w-3 h-3" /> Copy link
                </button>
                {isOwn ? (
                  <>
                    <button type="button" onClick={() => { setEditingPost(post); setShowMenu(false); }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-[12px] rounded-lg cursor-pointer" style={{ color: "var(--text-2)" }}>
                      <Pencil className="w-3 h-3" /> Edit post
                    </button>
                    <button type="button" onClick={() => { setDeletingPostId(post.id); setShowMenu(false); }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-[12px] rounded-lg cursor-pointer" style={{ color: "#DC2626" }}>
                      <Trash2 className="w-3 h-3" /> Delete post
                    </button>
                  </>
                ) : (
                  <button type="button" onClick={() => { toast.info("Report submitted"); setShowMenu(false); }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-[12px] rounded-lg cursor-pointer" style={{ color: "var(--text-2)" }}>
                    <Flag className="w-3 h-3" /> Report
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="px-4 py-2.5" style={{ fontSize: "14px", lineHeight: 1.75, color: "var(--text-1)" }}>
          <MentionText text={post.content} />
        </div>

        {post.image_urls?.length > 0 && (
          <div className="px-4 pb-2"><div className="rounded-xl overflow-hidden"><PostCarousel images={post.image_urls} /></div></div>
        )}

        <div className="flex items-center px-4 py-2" style={{ borderTop: "1px solid var(--border)" }}>
          <button type="button" onClick={toggleLike} className="h-9 px-3 rounded-xl text-[13px] font-semibold flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all" style={{ color: liked ? "var(--brand)" : "var(--text-2)" }}>
            <Heart className="w-4 h-4" style={{ fill: liked ? "var(--brand)" : "none" }} /> {likeCount}
          </button>
          <span className="h-9 px-3 rounded-xl text-[13px] font-semibold flex items-center gap-1.5" style={{ color: "var(--text-2)" }}>
            <MessageSquare className="w-4 h-4" /> {comments.length}
          </span>
          <button type="button" onClick={() => setShareOpen(true)} className="h-9 px-3 rounded-xl text-[13px] font-semibold flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all" style={{ color: "var(--text-2)" }}>
            <Send className="w-4 h-4" /> Share
          </button>
        </div>
        {shareOpen && postId && <ShareModal open postId={postId} onClose={() => setShareOpen(false)} />}

        {/* Comments */}
        <div className="px-4 pb-4 pt-3 space-y-3" style={{ borderTop: "1px solid var(--border)" }}>
          {comments.map((c: any) => {
            const cName = c.author?.full_name || "User";
            const cInit = cName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
            const cColor = roleColorMap[c.author?.role || ""] || "#6B7280";
            const isOwnComment = user?.id === c.user_id;
            return (
              <div key={c.id} className="flex items-start gap-2 group">
                <AvatarSquare src={c.author?.avatar_url} name={cName} size="xs" bgColor={cColor} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-bold" style={{ color: "var(--text-1)" }}>{cName}</span>
                    <span className="text-[11px]" style={{ color: "var(--text-3)" }}>{c.created_at ? getTimeAgo(new Date(c.created_at)) : ""}</span>
                    {isOwnComment && (
                      <button type="button" onClick={() => deleteComment(c.id)} className="opacity-0 group-hover:opacity-100 p-0.5 cursor-pointer" style={{ color: "var(--text-3)" }}>
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <p className="text-[13px]" style={{ color: "var(--text-2)" }}>{c.content}</p>
                </div>
                <CommentLoveButton commentId={c.id} userId={user?.id} />
              </div>
            );
          })}
          {user && (
            <div className="flex items-center gap-2 mt-2">
              <AvatarSquare src={profile?.avatar_url} name={profile?.full_name || "U"} size="xs" />
              <input value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Write a comment..."
                className="flex-1 h-9 rounded-xl px-3 text-[13px] outline-none"
                style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-1)" }}
                onKeyDown={e => { if (e.key === "Enter" && commentText.trim()) submitComment(); }} />
              <button type="button" onClick={submitComment} className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer active:scale-95" style={{ background: commentText.trim() ? "var(--brand)" : "var(--surface-2)" }}>
                <Send className="w-3.5 h-3.5" style={{ color: commentText.trim() ? "white" : "var(--text-3)" }} />
              </button>
            </div>
          )}
        </div>
      </article>

      {editingPost && (
        <EditPostModal
          post={editingPost}
          onClose={() => setEditingPost(null)}
          onSaved={(updated) => { setPost((p: any) => ({ ...p, content: updated.content, is_edited: true })); setEditingPost(null); }}
        />
      )}
      {deletingPostId && (
        <DeletePostDialog
          postId={deletingPostId}
          onClose={() => setDeletingPostId(null)}
          onDeleted={() => { navigate("/app/feed"); }}
        />
      )}
    </main>
  );
};

export default PostDetail;

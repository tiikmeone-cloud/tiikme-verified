import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import {
  Copy,
  Flag,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Repeat2,
  Send,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import AvatarSquare from "@/components/ui/AvatarSquare";
import MentionText from "@/components/feed/MentionText";
import ImageGrid from "@/components/feed/ImageGrid";
import ShareModal from "@/components/feed/ShareModal";
import VerifiedBadge from "@/components/VerifiedBadge";
import CommentPanel from "@/components/comments/CommentPanel";
import { sendNotification } from "@/lib/notify";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getDisplayFlags, formatRoleLine } from "@/utils/displayProfile";

const clampTwoLinesStyle: CSSProperties = {
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  overflowWrap: "anywhere",
  wordBreak: "break-word",
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

function formatCompactCount(value: number): string {
  if (value >= 1_000_000) {
    const compact = value >= 10_000_000 ? Math.round(value / 1_000_000) : Number((value / 1_000_000).toFixed(1));
    return `${compact}M`;
  }
  if (value >= 1_000) {
    const compact = value >= 10_000 ? Math.round(value / 1_000) : Number((value / 1_000).toFixed(1));
    return `${compact}K`;
  }
  return String(value);
}

export interface FeedPostCardProps {
  post: any;
  grouped?: boolean;
  connectionIds: Set<string>;
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

export function PostCard({
  post,
  grouped = false,
  connectionIds,
  likeCounts,
  myLikes,
  toggleLike,
  commentCounts,
  commentsData,
  commentsOpen,
  commentInputs,
  setCommentInputs,
  toggleComments,
  submitComment,
  deleteComment,
  onDelete,
  onEdit,
}: FeedPostCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [likeAnimating, setLikeAnimating] = useState(false);
  const [followState, setFollowState] = useState<"none" | "pending">("none");
  const [sharePostId, setSharePostId] = useState<string | null>(null);
  const { user, profile: authProfile } = useAuth();
  const menuRef = useRef<HTMLDivElement>(null);

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
  const authorFlags = getDisplayFlags(author);
  const displayAvatar = isOrgPost ? post.org?.logo_url : author?.avatar_url;
  const displayName = isOrgPost
    ? post.org?.name
    : (authorFlags.showName ? (author?.full_name || author?.username || "Unknown") : "Tiikme member");
  const profileLink = isOrgPost ? `/org/${post.org?.slug}` : `/app/profile/${author?.id || ""}`;
  const companyLine = !isOrgPost && authorFlags.showCompany
    ? (author?.currently_working_at || author?.institution_name || null)
    : null;
  const companyName = !isOrgPost && companyLine && post.show_company_badge !== false ? companyLine : null;
  const roleLine = !isOrgPost && authorFlags.showRole ? formatRoleLine(author) : null;
  const timeAgo = post.created_at ? getTimeAgo(new Date(post.created_at)) : "";
  const isOwn = !!user?.id && user.id === post.author_id;
  const isRepost = !!post.repost_of;
  const isEdited = post.is_edited;
  const isConnected = !isOrgPost && author?.id && connectionIds.has(author.id);
  const showFollow = !isOrgPost && !isOwn && !isConnected && author?.id;

  const liked = myLikes[post.id] || false;
  const likeCount = likeCounts[post.id] || 0;
  const commentCount = commentCounts[post.id] || 0;
  const isOpen = commentsOpen.has(post.id);
  const comments = commentsData[post.id] || [];
  const [localRepostCount, setLocalRepostCount] = useState(post.repost_count || 0);
  const [hasReposted, setHasReposted] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("post_reposts").select("id").eq("post_id", post.id).eq("reposted_by", user.id).maybeSingle()
      .then(({ data }) => setHasReposted(!!data));
  }, [post.id, user]);

  const sortedComments = useMemo(() => {
    const arr = [...comments];
    arr.sort((a, b) => {
      if (a.user_id === user?.id && b.user_id !== user?.id) return -1;
      if (a.user_id !== user?.id && b.user_id === user?.id) return 1;
      return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
    });
    return arr;
  }, [comments, user?.id]);

  const [reposting, setReposting] = useState(false);
  const handleRepost = async () => {
    if (!user || reposting) return;
    setReposting(true);
    try {
      if (hasReposted) {
        const { data: existing } = await supabase.from("posts").select("id").eq("repost_of", post.id).eq("author_id", user.id).maybeSingle();
        if (existing) await supabase.from("posts").delete().eq("id", existing.id);
        await supabase.from("post_reposts").delete().eq("post_id", post.id).eq("reposted_by", user.id);
        setLocalRepostCount((prev) => Math.max(0, prev - 1));
        setHasReposted(false);
        toast.success("Repost removed");
      } else {
        await supabase.from("posts").insert({
          author_id: user.id,
          content: post.content,
          repost_of: post.id,
          post_type: "thought",
          type: "thought",
          visibility: "everyone",
          image_urls: post.image_urls || [],
        } as any);
        await supabase.from("post_reposts").insert({ post_id: post.id, reposted_by: user.id });
        if (post.author_id && post.author_id !== user.id) {
          sendNotification({
            userId: post.author_id,
            actorId: user.id,
            type: "repost",
            title: `${authProfile?.full_name || "Someone"} reposted your post`,
            actionUrl: `/post/${post.id}`,
          });
        }
        setLocalRepostCount((prev) => prev + 1);
        setHasReposted(true);
        toast.success("Reposted");
      }
    } catch (e) {
      console.warn("[Feed] repost failed:", e);
    }
    setReposting(false);
  };

  const handleLike = () => {
    if (!liked) {
      setLikeAnimating(true);
      setTimeout(() => setLikeAnimating(false), 150);
    }
    toggleLike(post.id);
  };

  const handleFollow = async () => {
    if (!user || !author?.id) return;
    const { sendConnectionRequest } = await import("@/hooks/useConnectionStatus");
    const result = await sendConnectionRequest(user.id, author.id, authProfile?.full_name || "Someone");
    if (result === null) {
      setFollowState("pending");
      return;
    }
    setFollowState(result === "accepted" ? "none" : "pending");
    if (result === "accepted") toast.success("Connected!");
  };

  const handleReport = async () => {
    if (!user) return;
    await supabase.from("post_reports").insert({ post_id: post.id, reporter_id: user.id, reason: "reported" });
    const postUrl = `${window.location.origin}/app/post/${post.id}`;
    const subject = encodeURIComponent(`Report: Post ${post.id}`);
    const body = encodeURIComponent(`I am reporting the following post: ${postUrl}\n\nReason: \n\nReported by: ${authProfile?.full_name || "User"}`);
    window.location.href = `mailto:contact@tiikme.com?subject=${subject}&body=${body}`;
    toast.success("Report submitted");
    setShowMenu(false);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/app/post/${post.id}`);
    toast.success("Link copied!");
    setShowMenu(false);
  };

  const contentRef = useRef<HTMLDivElement>(null);
  const [needsClamp, setNeedsClamp] = useState(false);
  useEffect(() => {
    const el = contentRef.current;
    if (el) setNeedsClamp(el.scrollHeight > 100);
  }, [post.content]);

  const isTownhall = post.post_type === "townhall";

  return (
    <>
      <article
        id={`post-${post.id}`}
        style={{
          background: "#FFFFFF",
          border: grouped ? "none" : "1px solid #E8E8E8",
          borderRadius: grouped ? 0 : 16,
          boxShadow: grouped ? "none" : "0 1px 4px rgba(0,0,0,0.04)",
          padding: 20,
          marginBottom: grouped ? 0 : 16,
          borderLeft: isTownhall ? "4px solid #E8733A" : undefined,
          scrollMarginTop: 80,
        }}
      >
        {isTownhall && (
          <div style={{ paddingBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#E8733A" }}>TOWNHALL</span>
          </div>
        )}

        {!grouped && (
          <div className="flex items-start" style={{ gap: 10 }}>
            <Link to={profileLink} className="shrink-0">
              <AvatarSquare src={displayAvatar} name={displayName} size={40} />
            </Link>
            <div className="min-w-0 flex-1">
              <div className="flex items-start gap-1.5 min-w-0">
                <Link
                  to={profileLink}
                  className="hover:underline min-w-0"
                  style={{ fontSize: 14, fontWeight: 600, color: "#1A1A2E", lineHeight: "18px", ...clampTwoLinesStyle }}
                >
                  {displayName}
                </Link>
                {(author?.is_verified || post.org?.is_verified) && (
                  <span className="shrink-0" style={{ marginTop: 1 }}>
                    <VerifiedBadge size={14} />
                  </span>
                )}
              </div>
              <div className="flex items-center flex-wrap min-w-0" style={{ gap: "2px 6px", marginTop: 2, lineHeight: "18px" }}>
                {roleLine && <span style={{ fontSize: 12, color: "#6B7094", ...clampTwoLinesStyle }}>{roleLine}</span>}
                {companyName && (
                  <>
                    {roleLine && <span className="shrink-0" style={{ fontSize: 12, color: "#C0C4D8" }}>•</span>}
                    <span style={{ fontSize: 12, color: "#6B7094", ...clampTwoLinesStyle }}>{companyName}</span>
                  </>
                )}
                {(roleLine || companyName) && <span className="shrink-0" style={{ fontSize: 12, color: "#C0C4D8" }}>•</span>}
                <span className="shrink-0" style={{ fontSize: 12, color: "#9CA3C0" }}>{timeAgo}</span>
                {isEdited && <span className="shrink-0" style={{ fontSize: 11, fontStyle: "italic", color: "#9CA3C0" }}>(edited)</span>}
              </div>
            </div>

            <div className="relative shrink-0" ref={menuRef}>
              <button
                type="button"
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center justify-center cursor-pointer"
                style={{ width: 32, height: 32, color: "#9CA3C0" }}
              >
                <MoreHorizontal style={{ width: 16, height: 16 }} />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-8 z-[100]" style={{ width: 180, borderRadius: 12, padding: "8px 0", background: "#FFFFFF", border: "1px solid #E5E7EB", boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}>
                  <button type="button" onClick={handleCopyLink} className="flex items-center gap-2 w-full cursor-pointer hover:bg-[#F5F5F5]" style={{ padding: "10px 16px", fontSize: 14, color: "#1A1A2E" }}>
                    <Copy style={{ width: 14, height: 14 }} /> Copy Link
                  </button>
                  {isOwn ? (
                    <>
                      {!isRepost && (
                        <button type="button" onClick={() => { onEdit(post); setShowMenu(false); }} className="flex items-center gap-2 w-full cursor-pointer hover:bg-[#F5F5F5]" style={{ padding: "10px 16px", fontSize: 14, color: "#1A1A2E" }}>
                          <Pencil style={{ width: 14, height: 14 }} /> Edit Post
                        </button>
                      )}
                      <button type="button" onClick={() => { onDelete(post.id); setShowMenu(false); }} className="flex items-center gap-2 w-full cursor-pointer hover:bg-[#F5F5F5]" style={{ padding: "10px 16px", fontSize: 14, color: "#EF4444" }}>
                        <Trash2 style={{ width: 14, height: 14 }} /> {isRepost ? "Remove Repost" : "Delete Post"}
                      </button>
                    </>
                  ) : (
                    <button type="button" onClick={handleReport} className="flex items-center gap-2 w-full cursor-pointer hover:bg-[#F5F5F5]" style={{ padding: "10px 16px", fontSize: 14, color: "#1A1A2E" }}>
                      <Flag style={{ width: 14, height: 14 }} /> Report
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        <div style={{ marginTop: 12 }}>
          <div
            ref={contentRef}
            style={{
              fontSize: 15,
              fontWeight: 400,
              lineHeight: "22px",
              color: "#1A1A2E",
              ...((!expanded && needsClamp) ? { maxHeight: 100, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 5, WebkitBoxOrient: "vertical" as const } : {}),
            }}
          >
            <MentionText text={post.content} />
          </div>
          {needsClamp && !expanded && (
            <button type="button" onClick={() => setExpanded(true)} className="cursor-pointer" style={{ fontSize: 13, fontWeight: 600, color: "#E8733A", marginTop: 2 }}>
              See more
            </button>
          )}
        </div>

        {post.image_urls?.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <ImageGrid images={post.image_urls} />
          </div>
        )}

        {localRepostCount >= 2 && (
          <p style={{ fontSize: 12, color: "#9CA3C0", marginTop: 4 }}>
            {displayName} and {localRepostCount - 1} other{localRepostCount > 2 ? "s" : ""} reposted
          </p>
        )}

        <div className="flex items-center flex-wrap" style={{ marginTop: 12, gap: 6, borderTop: "1px solid #F0F0F0", paddingTop: 10 }}>
          <button
            type="button"
            onClick={handleLike}
            className="flex items-center cursor-pointer active:scale-95"
            style={{
              gap: 6,
              padding: "8px 10px",
              borderRadius: 10,
              minWidth: 84,
              flex: "1 1 0",
              justifyContent: "center",
              transform: likeAnimating ? "scale(1.2)" : "scale(1)",
              transition: "transform 150ms ease",
            }}
          >
            <Heart style={{ width: 15, height: 15, fill: liked ? "#E8733A" : "none", color: liked ? "#E8733A" : "#9CA3C0" }} />
            <span style={{ fontSize: 12, fontWeight: 500, color: liked ? "#E8733A" : "#9CA3C0" }}>
              {likeCount > 0 ? <span className="num">{formatCompactCount(likeCount)}</span> : "Like"}
            </span>
          </button>

          <button type="button" onClick={() => toggleComments(post.id)} className="flex items-center cursor-pointer" style={{ gap: 6, padding: "8px 10px", borderRadius: 10, minWidth: 84, flex: "1 1 0", justifyContent: "center" }}>
            <MessageCircle style={{ width: 15, height: 15, color: isOpen ? "#E8733A" : "#9CA3C0" }} />
            <span style={{ fontSize: 12, fontWeight: 500, color: isOpen ? "#E8733A" : "#9CA3C0" }}>
              {commentCount > 0 ? <span className="num">{formatCompactCount(commentCount)}</span> : "Comment"}
            </span>
          </button>

          <button type="button" onClick={handleRepost} disabled={reposting} className="flex items-center cursor-pointer" style={{ gap: 6, padding: "8px 10px", borderRadius: 10, minWidth: 84, flex: "1 1 0", justifyContent: "center", opacity: reposting ? 0.5 : 1 }}>
            <Repeat2 style={{ width: 15, height: 15, color: hasReposted ? "#E8733A" : "#9CA3C0" }} />
            <span style={{ fontSize: 12, fontWeight: 500, color: hasReposted ? "#E8733A" : "#9CA3C0" }}>
              {localRepostCount > 0 ? <span className="num">{formatCompactCount(localRepostCount)}</span> : "Repost"}
            </span>
          </button>

          <button type="button" onClick={() => setSharePostId(post.id)} className="flex items-center cursor-pointer" style={{ gap: 6, padding: "8px 10px", borderRadius: 10, minWidth: 84, flex: "1 1 0", justifyContent: "center" }}>
            <Send style={{ width: 15, height: 15, color: "#9CA3C0" }} />
            <span style={{ fontSize: 12, fontWeight: 500, color: "#9CA3C0" }}>Share</span>
          </button>
        </div>

        {isOpen && (
          <CommentPanel postId={post.id} table="post_comments" postAuthorId={post.author_id} postUrlPrefix="/app/post" />
        )}

        {showFollow && followState !== "pending" && (
          <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={handleFollow}
              className="cursor-pointer"
              style={{
                height: 32,
                padding: "0 14px",
                borderRadius: 999,
                background: "rgba(232,115,58,0.10)",
                color: "#E8733A",
                border: "1px solid rgba(232,115,58,0.25)",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              Follow
            </button>
          </div>
        )}
      </article>

      {sharePostId && <ShareModal open postId={sharePostId} onClose={() => setSharePostId(null)} />}
    </>
  );
}

export default PostCard;

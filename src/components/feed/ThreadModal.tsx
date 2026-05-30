import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Heart, Repeat2 } from "lucide-react";
import { Link } from "react-router-dom";
import AvatarSquare from "@/components/ui/AvatarSquare";
import MentionText from "@/components/feed/MentionText";
import ImageGrid from "@/components/feed/ImageGrid";
import CommentPanel from "@/components/comments/CommentPanel";
import { getDisplayFlags } from "@/utils/displayProfile";

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

interface ThreadModalProps {
  post: any;
  likeCount: number;
  commentCount: number;
  repostCount: number;
  liked: boolean;
  onClose: () => void;
}

export default function ThreadModal({ post, likeCount, commentCount, repostCount, liked, onClose }: ThreadModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const isOrgPost = !!post.posted_by_org && !!post.org;
  const author = post.author;
  const authorFlags = getDisplayFlags(author);
  const displayName = isOrgPost
    ? post.org?.name
    : (authorFlags.showName ? (author?.full_name || author?.username || "User") : "Tiikme member");
  const displayAvatar = isOrgPost ? post.org?.logo_url : author?.avatar_url;
  const profileLink = isOrgPost ? `/org/${post.org?.slug}` : `/app/profile/${author?.id || ""}`;
  const timeStr = post.created_at ? getTimeAgo(new Date(post.created_at)) : "";

  return createPortal(
    <div
      ref={backdropRef}
      className="fixed inset-0 z-[200] flex items-end md:items-center justify-center p-0 md:p-4"
      style={{ background: "rgba(0,0,0,0.60)", backdropFilter: "blur(4px)" }}
      onClick={e => { if (e.target === backdropRef.current) onClose(); }}
    >
      <div
        className="w-full md:max-w-[640px] flex flex-col"
        style={{
          background: "var(--bg-card)",
          borderRadius: 20,
          maxHeight: "92dvh",
          overflow: "hidden",
          boxShadow: "0 24px 64px rgba(0,0,0,0.25)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between shrink-0"
          style={{ padding: "14px 16px", borderBottom: "1px solid var(--hairline)" }}
        >
          <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)", fontFamily: "'Bricolage Grotesque', sans-serif" }}>
            Thread
          </p>
          <button
            type="button"
            onClick={onClose}
            style={{ width: 32, height: 32, borderRadius: 8, background: "var(--surface-2)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          >
            <X style={{ width: 16, height: 16, color: "var(--text-2)" }} />
          </button>
        </div>

        {/* Original post */}
        <div className="shrink-0" style={{ padding: "14px 16px", borderBottom: "1px solid var(--hairline)" }}>
          <div className="flex items-start" style={{ gap: 10 }}>
            <Link to={profileLink} className="shrink-0">
              <AvatarSquare src={displayAvatar} name={displayName} size={40} />
            </Link>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <Link to={profileLink} style={{ textDecoration: "none" }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)" }}>{displayName}</p>
                </Link>
                <span style={{ fontSize: 11, color: "var(--text-3)", flexShrink: 0 }}>{timeStr}</span>
              </div>
              {post.content && (
                <p style={{ fontSize: 14, color: "var(--text-1)", lineHeight: "22px", marginTop: 6, overflowWrap: "break-word", wordBreak: "break-word" }}>
                  <MentionText text={post.content} />
                </p>
              )}
              {post.image_urls?.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  <ImageGrid images={post.image_urls} />
                </div>
              )}
              {/* Engagement summary */}
              <div className="flex items-center" style={{ gap: 16, marginTop: 10 }}>
                <span className="flex items-center" style={{ gap: 4, fontSize: 12, color: liked ? "var(--like)" : "var(--text-3)" }}>
                  <Heart style={{ width: 13, height: 13, fill: liked ? "var(--like)" : "none", color: liked ? "var(--like)" : "var(--text-3)" }} />
                  {likeCount > 0 ? likeCount : "0"} likes
                </span>
                <span style={{ fontSize: 12, color: "var(--text-3)" }}>{commentCount} replies</span>
                {repostCount > 0 && (
                  <span className="flex items-center" style={{ gap: 4, fontSize: 12, color: "var(--text-3)" }}>
                    <Repeat2 style={{ width: 13, height: 13 }} />
                    {repostCount} recasts
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable comments */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <CommentPanel
            postId={post.id}
            table="post_comments"
            postAuthorId={post.author_id}
            postUrlPrefix="/app/post"
          />
        </div>
      </div>
    </div>,
    document.body
  );
}

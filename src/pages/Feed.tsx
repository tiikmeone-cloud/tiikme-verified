import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { PageSEO } from "@/hooks/usePageSEO";
import { cleanUsername } from "@/lib/cleanUsername";
import AvatarSquare from "@/components/ui/AvatarSquare";
import {
  Heart, MessageCircle, Repeat2, Send, SendHorizontal, MoreHorizontal,
  Trash2, Pencil, Copy, Flag, Paperclip, Loader2, X,
} from "lucide-react";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import ImageGrid from "@/components/feed/ImageGrid";
import MentionText from "@/components/feed/MentionText";
import ShareModal from "@/components/feed/ShareModal";
import { sendNotification } from "@/lib/notify";
import ActivityScoreRing from "@/components/ActivityScoreRing";
import SkeletonCard from "@/components/SkeletonCard";
import VerifiedBadge from "@/components/VerifiedBadge";
import EditPostModal from "@/components/feed/EditPostModal";
import DeletePostDialog from "@/components/feed/DeletePostDialog";
import { useFeedPosts } from "@/hooks/useFeedPosts";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useLikes } from "@/hooks/useLikes";
import { useComments } from "@/hooks/useComments";

/* ─── HELPERS ─── */
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

const extractHashtags = (text: string): string[] =>
  (text.match(/#\w+/g) || []).map(t => t.slice(1));

/* ─── INLINE COMPOSER ─── */
interface MentionSuggestion {
  id: string; display: string; username?: string; avatar_url?: string | null; type: "user" | "page";
}

const FeedComposer = ({ onPublished }: { onPublished: () => void }) => {
  const { user, profile } = useAuth();
  const [content, setContent] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [attachPreviews, setAttachPreviews] = useState<{ url: string; name: string; type: string; size: number }[]>([]);
  const [attachFiles, setAttachFiles] = useState<File[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mention state
  const [suggestions, setSuggestions] = useState<MentionSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mentionStart, setMentionStart] = useState(-1);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.max(40, Math.min(el.scrollHeight, 160)) + "px";
    }
  }, []);

  useEffect(() => { autoResize(); }, [content, autoResize]);

  const searchMentions = useCallback(async (query: string) => {
    if (query.length < 1) { setSuggestions([]); return; }
    const results: MentionSuggestion[] = [];
    const [profilesRes, pagesRes] = await Promise.allSettled([
      supabase.from("profiles").select("id, full_name, username, avatar_url").neq("id", user?.id || "").or(`full_name.ilike.%${query}%,username.ilike.%${query}%`).limit(5),
      supabase.from("pages").select("id, name, slug, logo_url").ilike("name", `%${query}%`).limit(3),
    ]);
    if (profilesRes.status === "fulfilled" && profilesRes.value.data) {
      for (const p of profilesRes.value.data) results.push({ id: p.id, display: p.full_name || p.username || "User", username: p.username || undefined, avatar_url: p.avatar_url, type: "user" });
    }
    if (pagesRes.status === "fulfilled" && pagesRes.value.data) {
      for (const p of pagesRes.value.data) results.push({ id: p.id, display: p.name, username: p.slug, avatar_url: p.logo_url, type: "page" });
    }
    setSuggestions(results);
    setSelectedIdx(0);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value.slice(0, 3000);
    setContent(newVal);
    const cursorPos = e.target.selectionStart || 0;
    const textBefore = newVal.slice(0, cursorPos);
    const atMatch = textBefore.match(/@(\w*)$/);
    if (atMatch) {
      setMentionStart(cursorPos - atMatch[0].length);
      setShowSuggestions(true);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => searchMentions(atMatch[1]), 200);
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  };

  const insertMention = (s: MentionSuggestion) => {
    const before = content.slice(0, mentionStart);
    const after = content.slice(textareaRef.current?.selectionStart || mentionStart);
    const mentionText = `@${s.username || s.display.replace(/\s+/g, "")} `;
    setContent(before + mentionText + after);
    setShowSuggestions(false);
    setSuggestions([]);
    setTimeout(() => {
      const el = textareaRef.current;
      if (el) { const pos = before.length + mentionText.length; el.focus(); el.setSelectionRange(pos, pos); }
    }, 10);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIdx(prev => (prev + 1) % suggestions.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIdx(prev => (prev - 1 + suggestions.length) % suggestions.length); }
    else if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); insertMention(suggestions[selectedIdx]); }
    else if (e.key === "Escape") { setShowSuggestions(false); }
  };

  const handleAttach = () => {
    if (attachPreviews.length >= 10) { toast.info("Maximum 10 files"); return; }
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).slice(0, 10 - attachPreviews.length).forEach(file => {
      if (file.size > 10 * 1024 * 1024) { toast.error("File must be under 10MB"); return; }
      const isImage = file.type.startsWith("image/");
      setAttachPreviews(prev => [...prev, {
        url: isImage ? URL.createObjectURL(file) : "",
        name: file.name,
        type: file.type,
        size: file.size,
      }].slice(0, 10));
      setAttachFiles(prev => [...prev, file].slice(0, 10));
    });
    e.target.value = "";
  };

  const removeAttach = (idx: number) => {
    setAttachPreviews(prev => prev.filter((_, i) => i !== idx));
    setAttachFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const handlePublish = async () => {
    if (!content.trim() && attachFiles.length === 0) return;
    if (!user) return;
    setPublishing(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of attachFiles) {
        if (!file.type.startsWith("image/")) continue;
        const safeName = file.name.replace(/[^a-z0-9.]/gi, "_");
        const path = `${user.id}/${Date.now()}-${safeName}`;
        const { data: uploadData, error: uploadError } = await supabase.storage.from("post-images").upload(path, file, { upsert: false, contentType: file.type });
        if (uploadError) { toast.error("Image upload failed"); continue; }
        const { data: urlData } = supabase.storage.from("post-images").getPublicUrl(uploadData.path);
        if (urlData?.publicUrl) uploadedUrls.push(urlData.publicUrl);
      }

      const { error } = await supabase.from("posts").insert({
        author_id: user.id, content: content.trim(), post_type: "thought", type: "thought",
        visibility: "everyone", hashtags: extractHashtags(content),
        image_urls: uploadedUrls.length > 0 ? uploadedUrls : [],
      } as any).select().single();
      if (error) throw error;
      setContent(""); setAttachPreviews([]); setAttachFiles([]);
      toast.success("Posted");
      onPublished();
    } catch (err) { toast.error("Failed to post"); console.error(err); }
    finally { setPublishing(false); }
  };

  if (!user) return null;

  return (
    <div style={{ padding: 12, borderRadius: 16, marginBottom: 12, background: "rgba(255,255,255,0.35)", border: "1px solid rgba(255,255,255,0.50)", backdropFilter: "blur(20px)", boxShadow: "0 8px 32px rgba(26,26,78,0.08)" }}>
      <div className="flex" style={{ gap: 10, alignItems: "flex-start" }}>
        <AvatarSquare src={profile?.avatar_url} name={profile?.full_name || "You"} size={40} />
        <div className="flex-1 min-w-0 relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="What's on your mind?"
            className="w-full resize-none outline-none"
            style={{
              minHeight: 40, maxHeight: 160,
              background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.20)", borderRadius: 10,
              padding: "10px 12px", fontSize: 14, fontWeight: 400, lineHeight: "20px",
              color: "var(--text-primary)",
            }}
            onFocus={e => { e.currentTarget.style.borderColor = "rgba(232,115,58,0.50)"; }}
            onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.20)"; }}
          />

          {/* Mention suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute left-0 z-30 overflow-y-auto" style={{ top: "100%", marginTop: 4, width: 280, maxHeight: 200, padding: 4, borderRadius: 10, background: "var(--bg-card)", border: "1px solid var(--border-glass)", boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }}>
              {suggestions.map((s, idx) => (
                <button key={s.id} type="button" onClick={() => insertMention(s)}
                  className="flex items-center gap-2 w-full text-left cursor-pointer"
                  style={{ padding: 8, borderRadius: 6, background: idx === selectedIdx ? "var(--bg-card-hover)" : "transparent" }}>
                  <AvatarSquare src={s.avatar_url} name={s.display} size={32} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate" style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{s.display}</p>
                    {s.username && <p style={{ fontSize: 12, color: "var(--text-muted)" }}>@{cleanUsername(s.username)}</p>}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Attachment previews */}
          {attachPreviews.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {attachPreviews.map((att, i) => (
                <div key={i} className="relative" style={{ borderRadius: 6, overflow: "hidden", border: "1px solid var(--border-subtle)" }}>
                  {att.type.startsWith("image/") ? (
                    <img src={att.url} alt="" style={{ height: 80, width: "auto", maxWidth: 120, objectFit: "cover", borderRadius: 6 }} />
                  ) : (
                    <div className="flex items-center gap-2" style={{ height: 36, padding: "0 10px", background: "var(--bg-input)", fontSize: 12, color: "var(--text-secondary)" }}>
                      <Paperclip style={{ width: 14, height: 14 }} />
                      <span className="truncate" style={{ maxWidth: 100 }}>{att.name}</span>
                      <span style={{ color: "var(--text-muted)" }}>{(att.size / 1024).toFixed(0)}KB</span>
                    </div>
                  )}
                  <button type="button" onClick={() => removeAttach(i)} className="absolute top-1 right-1 cursor-pointer flex items-center justify-center" style={{ width: 16, height: 16, borderRadius: 8, background: "rgba(0,0,0,0.5)" }}>
                    <X style={{ width: 10, height: 10, color: "white" }} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Action bar */}
          <div className="flex items-center justify-between" style={{ marginTop: 8 }}>
            <button type="button" onClick={handleAttach} className="cursor-pointer p-1" style={{ color: "#9CA3C0" }}>
              <Paperclip style={{ width: 20, height: 20 }} />
            </button>
            <button type="button" onClick={handlePublish} disabled={publishing || (!content.trim() && attachFiles.length === 0)}
              className="btn-primary-sm disabled:opacity-50 cursor-pointer" style={{ fontSize: 13, fontWeight: 600 }}>
              {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Post"}
            </button>
          </div>
        </div>
      </div>
      <input ref={fileInputRef} type="file" accept="image/*,.pdf,.doc,.docx" multiple className="hidden" onChange={handleFileChange} />
    </div>
  );
};

/* ─── POST CARD ─── */
interface PostCardProps {
  post: any;
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

const PostCard = ({
  post, connectionIds, likeCounts, myLikes, toggleLike,
  commentCounts, commentsData, commentsOpen, commentInputs,
  setCommentInputs, toggleComments, submitComment, deleteComment, onDelete, onEdit,
}: PostCardProps) => {
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
  const displayAvatar = isOrgPost ? post.org?.logo_url : author?.avatar_url;
  const displayName = isOrgPost ? post.org?.name : (author?.full_name || author?.username || "Unknown");
  const profileLink = isOrgPost ? `/org/${post.org?.slug}` : `/app/profile/${author?.id || ""}`;
  const viaName = isOrgPost && post.poster_profile?.full_name ? post.poster_profile.full_name : null;
  const companyName = !isOrgPost && author?.institution_name && post.show_company_badge !== false ? author.institution_name : null;
  const timeAgo = post.created_at ? getTimeAgo(new Date(post.created_at)) : "";
  const isOwn = user?.id === post.author_id;
  const isEdited = post.is_edited;
  const isConnected = !isOrgPost && author?.id && connectionIds.has(author.id);
  const showFollow = !isOrgPost && !isOwn && !isConnected && author?.id;

  const liked = myLikes[post.id] || false;
  const likeCount = likeCounts[post.id] || 0;
  const commentCount = commentCounts[post.id] || 0;
  const isOpen = commentsOpen.has(post.id);
  const comments = commentsData[post.id] || [];
  const commentText = commentInputs[post.id] || "";
  const repostCount = post.repost_count || 0;

  const sortedComments = useMemo(() => {
    const arr = [...comments];
    arr.sort((a, b) => {
      if (a.user_id === user?.id && b.user_id !== user?.id) return -1;
      if (a.user_id !== user?.id && b.user_id === user?.id) return 1;
      return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
    });
    return arr;
  }, [comments, user?.id]);

  const [showAllComments, setShowAllComments] = useState(false);
  const visibleComments = showAllComments ? sortedComments : sortedComments.slice(0, 3);

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
      if (post.author_id) {
        sendNotification({
          userId: post.author_id, actorId: user.id, type: "repost",
          title: `${authProfile?.full_name || "Someone"} reposted your post`,
          actionUrl: `/post/${post.id}`,
        });
      }
      toast.success("Reposted");
    } catch (e) { console.warn("[Feed] repost failed:", e); }
    setConfirmRepost(false);
  };

  const handleLike = () => {
    if (!liked) { setLikeAnimating(true); setTimeout(() => setLikeAnimating(false), 150); }
    toggleLike(post.id);
  };

  const handleFollow = async () => {
    if (!user || !author?.id) return;
    const { sendConnectionRequest } = await import("@/hooks/useConnectionStatus");
    const result = await sendConnectionRequest(user.id, author.id, authProfile?.full_name || "Someone");
    if (result === null) { setFollowState("pending"); return; }
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

  // Content clamp
  const contentRef = useRef<HTMLDivElement>(null);
  const [needsClamp, setNeedsClamp] = useState(false);
  useEffect(() => {
    const el = contentRef.current;
    if (el) setNeedsClamp(el.scrollHeight > 100);
  }, [post.content]);

  const isTownhall = post.post_type === "townhall";

  return (
    <>
      <article className="glass-card" style={{ padding: 12, borderRadius: 16, marginBottom: 8, borderLeft: isTownhall ? "4px solid var(--accent)" : undefined }}>
        {isTownhall && (
          <div style={{ paddingBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--accent)" }}>TOWNHALL</span>
          </div>
        )}

        {/* HEADER — single row */}
        <div className="flex items-center" style={{ gap: 10 }}>
          <Link to={profileLink} className="shrink-0">
            <AvatarSquare src={displayAvatar} name={displayName} size={40} />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1 overflow-hidden" style={{ lineHeight: "18px" }}>
              <Link to={profileLink} className="hover:underline truncate shrink-0" style={{ fontSize: 14, fontWeight: 600, color: "#1A1A2E", maxWidth: "40%" }}>{displayName}</Link>
              {(author?.is_verified || post.org?.is_verified) && <VerifiedBadge size={14} />}
              {(viaName || companyName) && (
                <>
                  <span className="shrink-0" style={{ fontSize: 12, color: "#9CA3C0" }}>·</span>
                  <span className="truncate" style={{ fontSize: 12, color: "#6B7094", maxWidth: "30%" }}>
                    {viaName ? `via ${viaName}` : companyName}
                  </span>
                </>
              )}
              <span className="shrink-0" style={{ fontSize: 12, color: "#9CA3C0" }}>·</span>
              <span className="shrink-0" style={{ fontSize: 12, color: "#9CA3C0" }}>{timeAgo}</span>
              {isEdited && <span className="shrink-0" style={{ fontSize: 11, fontStyle: "italic", color: "#9CA3C0" }}>(edited)</span>}
            </div>
          </div>

          {/* Connect button */}
          {showFollow && followState === "none" && (
            <button type="button" onClick={handleFollow} className="cursor-pointer shrink-0"
              style={{ fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 6, background: "linear-gradient(135deg, #E8733A, #FF6B9D)", color: "#fff", border: "none", whiteSpace: "nowrap" }}>
              + Connect
            </button>
          )}
          {showFollow && followState === "pending" && (
            <span className="shrink-0" style={{ fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 6, background: "rgba(255,184,0,0.10)", color: "#FFB800", border: "1px solid rgba(255,184,0,0.25)", whiteSpace: "nowrap" }}>Requested</span>
          )}

          {/* Three-dot menu */}
          <div className="relative shrink-0" ref={menuRef}>
            <button type="button" onClick={() => setShowMenu(!showMenu)}
              className="flex items-center justify-center cursor-pointer"
              style={{ width: 32, height: 32, color: "#9CA3C0" }}>
              <MoreHorizontal style={{ width: 16, height: 16 }} />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-8 z-20" style={{ width: 170, borderRadius: 10, padding: 4, background: "var(--bg-card)", border: "1px solid var(--border-glass)", boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }}>
                <button type="button" onClick={handleCopyLink}
                  className="flex items-center gap-2 w-full cursor-pointer" style={{ padding: "8px 12px", fontSize: 13, color: "#6B7094", borderRadius: 6 }}>
                  <Copy style={{ width: 14, height: 14 }} /> Copy Link
                </button>
                {isOwn ? (
                  <>
                    <button type="button" onClick={() => { onEdit(post); setShowMenu(false); }}
                      className="flex items-center gap-2 w-full cursor-pointer" style={{ padding: "8px 12px", fontSize: 13, color: "#6B7094", borderRadius: 6 }}>
                      <Pencil style={{ width: 14, height: 14 }} /> Edit Post
                    </button>
                    <button type="button" onClick={() => { onDelete(post.id); setShowMenu(false); }}
                      className="flex items-center gap-2 w-full cursor-pointer" style={{ padding: "8px 12px", fontSize: 13, color: "#EF4444", borderRadius: 6 }}>
                      <Trash2 style={{ width: 14, height: 14 }} /> Delete Post
                    </button>
                  </>
                ) : (
                  <button type="button" onClick={handleReport}
                    className="flex items-center gap-2 w-full cursor-pointer" style={{ padding: "8px 12px", fontSize: 13, color: "#6B7094", borderRadius: 6 }}>
                    <Flag style={{ width: 14, height: 14 }} /> Report
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* CONTENT */}
        <div style={{ marginTop: 8 }}>
          <div ref={contentRef}
            style={{
              fontSize: 14, fontWeight: 400, lineHeight: "20px", color: "#1A1A2E",
              ...((!expanded && needsClamp) ? { maxHeight: 100, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 5, WebkitBoxOrient: "vertical" as any } : {}),
            }}>
            <MentionText text={post.content} />
          </div>
          {needsClamp && !expanded && (
            <button type="button" onClick={() => setExpanded(true)} className="cursor-pointer" style={{ fontSize: 13, fontWeight: 600, color: "#E8733A", marginTop: 2 }}>
              See more
            </button>
          )}
        </div>

        {/* IMAGES — use raw URLs, no transform */}
        {post.image_urls?.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <ImageGrid images={post.image_urls} />
          </div>
        )}

        {/* Repost info */}
        {repostCount >= 2 && (
          <p style={{ fontSize: 12, color: "#9CA3C0", marginTop: 4 }}>
            {displayName} and {repostCount - 1} other{repostCount > 2 ? "s" : ""} reposted
          </p>
        )}

        {/* REACTION BAR */}
        <div className="flex items-center" style={{ marginTop: 8, gap: 4 }}>
          <button type="button" onClick={handleLike}
            className="flex items-center cursor-pointer active:scale-95"
            style={{ gap: 4, padding: "6px 10px", borderRadius: 8, background: "rgba(255,255,255,0.10)", transform: likeAnimating ? "scale(1.2)" : "scale(1)", transition: "transform 150ms ease" }}>
            <Heart style={{ width: 16, height: 16, fill: liked ? "#E8733A" : "none", color: liked ? "#E8733A" : "#9CA3C0" }} />
            <span style={{ fontSize: 12, color: liked ? "#E8733A" : "#9CA3C0" }}>{likeCount || ""}</span>
          </button>

          <button type="button" onClick={() => toggleComments(post.id)}
            className="flex items-center cursor-pointer"
            style={{ gap: 4, padding: "6px 10px", borderRadius: 8, background: "rgba(255,255,255,0.10)" }}>
            <MessageCircle style={{ width: 16, height: 16, color: isOpen ? "#E8733A" : "#9CA3C0" }} />
            <span style={{ fontSize: 12, color: isOpen ? "#E8733A" : "#9CA3C0" }}>{commentCount || ""}</span>
          </button>

          <div className="relative">
            <button type="button" onClick={handleRepost}
              className="flex items-center cursor-pointer"
              style={{ gap: 4, padding: "6px 10px", borderRadius: 8, background: "rgba(255,255,255,0.10)" }}>
              <Repeat2 style={{ width: 16, height: 16, color: "#9CA3C0" }} />
              {repostCount > 0 && <span style={{ fontSize: 12, color: "#9CA3C0" }}>{repostCount}</span>}
            </button>
            {confirmRepost && (
              <div className="absolute bottom-full left-0 mb-1 flex items-center gap-1 px-2 py-1 z-10" style={{ borderRadius: 8, whiteSpace: "nowrap", background: "var(--bg-card)", border: "1px solid var(--border-glass)", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
                <span style={{ fontSize: 11, color: "#6B7094" }}>Repost?</span>
                <button type="button" onClick={handleRepost} className="cursor-pointer" style={{ fontSize: 11, fontWeight: 700, color: "#E8733A", padding: "0 4px" }}>Yes</button>
                <button type="button" onClick={() => setConfirmRepost(false)} className="cursor-pointer" style={{ fontSize: 11, color: "#9CA3C0", padding: "0 4px" }}>No</button>
              </div>
            )}
          </div>

          <button type="button" onClick={() => setSharePostId(post.id)}
            className="flex items-center cursor-pointer"
            style={{ padding: "6px 10px", borderRadius: 8, background: "rgba(255,255,255,0.10)" }}>
            <Send style={{ width: 16, height: 16, color: "#9CA3C0" }} />
          </button>
        </div>

        {/* COMMENT SECTION */}
        {isOpen && (
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.15)" }}>
            {visibleComments.length === 0 && <p style={{ fontSize: 12, color: "#9CA3C0", padding: "4px 0" }}>No comments yet. Be the first!</p>}
            {visibleComments.map((c: any) => {
              const cName = c.author?.full_name || "User";
              const cTime = c.created_at ? getTimeAgo(new Date(c.created_at)) : "";
              const isOwnComment = user?.id === c.user_id;
              return (
                <div key={c.id} className="flex group" style={{ gap: 8, padding: "6px 0", alignItems: "flex-start" }}>
                  <div className="shrink-0" style={{ marginTop: 2 }}>
                    <AvatarSquare src={c.author?.avatar_url} name={cName} size="sm" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center" style={{ gap: 6 }}>
                      <Link to={`/app/profile/${c.author?.id || c.user_id}`} className="hover:underline" style={{ fontSize: 13, fontWeight: 600, color: "#1A1A2E" }}>{cName}</Link>
                      <span style={{ fontSize: 12, color: "#9CA3C0" }}>·</span>
                      <span style={{ fontSize: 12, color: "#9CA3C0" }}>{cTime}</span>
                      {isOwnComment && (
                        <button type="button" onClick={() => deleteComment(post.id, c.id)}
                          className="opacity-0 group-hover:opacity-100 cursor-pointer"
                          style={{ color: "#EF4444", marginLeft: 2 }}>
                          <Trash2 style={{ width: 12, height: 12 }} />
                        </button>
                      )}
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 400, color: "#1A1A2E", lineHeight: "18px", marginTop: 2 }}><MentionText text={c.content} /></p>
                  </div>
                </div>
              );
            })}
            {sortedComments.length > 3 && !showAllComments && (
              <button type="button" onClick={() => setShowAllComments(true)} className="cursor-pointer" style={{ fontSize: 12, fontWeight: 500, color: "#E8733A", padding: "4px 0" }}>
                View more comments
              </button>
            )}

            {/* Comment input */}
            {user && (
              <div className="flex items-center" style={{ gap: 8, marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.15)" }}>
                <AvatarSquare src={authProfile?.avatar_url} name={authProfile?.full_name || "You"} size="sm" />
                <input
                  value={commentText}
                  onChange={(e) => setCommentInputs((p) => ({ ...p, [post.id]: e.target.value }))}
                  placeholder="Write a comment..."
                  className="flex-1 outline-none"
                  style={{ height: 36, borderRadius: 18, padding: "0 12px", fontSize: 13, background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.20)", color: "#1A1A2E" }}
                  onKeyDown={(e) => { if (e.key === "Enter" && commentText.trim()) submitComment(post.id); }}
                />
                <button type="button" onClick={() => { if (commentText.trim()) submitComment(post.id); }}
                  className="cursor-pointer" style={{ color: commentText.trim() ? "#E8733A" : "#9CA3C0" }}
                  disabled={!commentText.trim()}>
                  <SendHorizontal style={{ width: 16, height: 16 }} />
                </button>
              </div>
            )}
          </div>
        )}
      </article>

      {/* Share modal */}
      {sharePostId && <ShareModal open postId={sharePostId} onClose={() => setSharePostId(null)} />}
    </>
  );
};

/* ─── RIGHT SIDEBAR WIDGETS ─── */
const ActivityWidget = () => {
  const { profile } = useAuth();
  const score = profile?.activity_score || 0;
  return (
    <div className="glass-glow" style={{ padding: 12, borderRadius: 16, marginBottom: 12 }}>
      <div className="flex items-center gap-3">
        <div className="relative" style={{ width: 48, height: 48 }}>
          <svg width={48} height={48} className="-rotate-90">
            <circle cx={24} cy={24} r={21} fill="none" stroke="var(--border-subtle)" strokeWidth={3} />
            <circle cx={24} cy={24} r={21} fill="none" stroke="#E8733A" strokeWidth={3}
              strokeDasharray={2 * Math.PI * 21} strokeDashoffset={2 * Math.PI * 21 * (1 - Math.min(score, 100) / 100)}
              strokeLinecap="round" className="transition-all duration-700" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{score}</span>
          </div>
        </div>
        <div>
          <p style={{ fontSize: 28, fontWeight: 700, color: "var(--text-primary)", lineHeight: "32px" }}>{score}</p>
          <p style={{ fontSize: 11, fontWeight: 500, color: "#E8733A" }}>
            {score >= 500 ? "Tiiked Elite" : score >= 301 ? "Trailblazer" : score >= 151 ? "Achiever" : score >= 51 ? "Builder" : "Explorer"}
          </p>
        </div>
      </div>
      <p style={{ fontSize: 11, color: "#9CA3C0", marginTop: 6 }}>Post more, get verified, connect with others</p>
    </div>
  );
};

const SuggestedWidget = ({ connectionIds }: { connectionIds: Set<string> }) => {
  const { user, profile } = useAuth();
  const [suggested, setSuggested] = useState<any[]>([]);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("id, full_name, role, avatar_url, institution_name, designation, role_metadata")
      .neq("id", user.id).order("activity_score", { ascending: false }).limit(20)
      .then(({ data }) => {
        const filtered = (data || []).filter(p => !connectionIds.has(p.id));
        setSuggested(filtered.slice(0, 3));
      });
  }, [user, connectionIds]);

  if (suggested.length === 0) return null;

  const handleConnect = async (targetId: string) => {
    if (!user) return;
    const { sendConnectionRequest } = await import("@/hooks/useConnectionStatus");
    const result = await sendConnectionRequest(user.id, targetId, profile?.full_name || "Someone");
    if (result === null) { toast.info("Request already exists"); return; }
    if (result === "accepted") {
      toast.success("Connected!");
    } else {
      setSentIds(prev => new Set(prev).add(targetId));
      toast.success("Request sent");
    }
    setSuggested(prev => prev.filter(s => s.id !== targetId));
  };

  return (
    <div className="glass-card" style={{ padding: 12, borderRadius: 16 }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#1A1A2E" }}>Suggested</span>
        <Link to="/app/explore" style={{ fontSize: 12, color: "#E8733A" }}>See all</Link>
      </div>
      {suggested.map((s, i) => (
        <div key={s.id} className="flex items-center" style={{ gap: 8, padding: "6px 0", borderBottom: i < suggested.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
          <Link to={`/app/profile/${s.id}`}>
            <AvatarSquare src={s.avatar_url} name={s.full_name || "User"} size={40} bgColor={roleColorMap[s.role || ""] || "#6B7280"} />
          </Link>
          <div className="flex-1 min-w-0">
            <Link to={`/app/profile/${s.id}`} className="hover:underline truncate block" style={{ fontSize: 13, fontWeight: 500, color: "#1A1A2E" }}>{s.full_name || "User"}</Link>
            <p className="truncate" style={{ fontSize: 12, color: "#9CA3C0" }}>{s.designation || (s.role_metadata as any)?.jobTitle || s.role || ""}</p>
          </div>
          <button className="btn-glass-pill cursor-pointer" style={{ fontSize: 12, fontWeight: 500, padding: "4px 10px" }}
            onClick={() => handleConnect(s.id)}>Connect</button>
        </div>
      ))}
    </div>
  );
};

/* ─── FEED PAGE ─── */
const Feed = () => {
  const { posts: livePosts, loading, loadingMore, hasMore, loadMore, refresh } = useFeedPosts();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const { user, profile } = useAuth();
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [editingPost, setEditingPost] = useState<any | null>(null);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [editedPosts, setEditedPosts] = useState<Record<string, any>>({});
  const [connectionIds, setConnectionIds] = useState<Set<string>>(new Set());

  // Load connection IDs
  useEffect(() => {
    if (!user) return;
    supabase.from("strands")
      .select("requester_id, receiver_id")
      .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .eq("status", "accepted")
      .then(({ data }) => {
        const ids = new Set<string>();
        (data || []).forEach(s => {
          if (s.requester_id !== user.id) ids.add(s.requester_id!);
          if (s.receiver_id !== user.id) ids.add(s.receiver_id!);
        });
        setConnectionIds(ids);
      });
  }, [user]);

  const visiblePosts = useMemo(() =>
    livePosts.filter((p: any) => !deletedIds.has(p.id)).map((p: any) => editedPosts[p.id] ? { ...p, ...editedPosts[p.id] } : p),
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

  useEffect(() => { loadCommentCounts(postIds); }, [postIdsKey, loadCommentCounts]);

  // Infinite scroll
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loadingMore) loadMore();
    }, { threshold: 0.1, rootMargin: "200px" });
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loadMore]);

  return (
    <main className="feed-main" style={{ maxWidth: 960, margin: "0 auto", padding: 16 }}>
      <PageSEO title="Feed | Tiikme" description="Your professional feed — posts, updates, and insights from verified professionals and organizations on Tiikme." noIndex />

      <div className="flex" style={{ gap: 16 }}>
        <div className="flex-1 min-w-0">
          <FeedComposer onPublished={refresh} />

          {loading && <SkeletonCard count={3} />}
          {!loading && visiblePosts.map((post: any) => (
            <PostCard
              key={post.id} post={post} connectionIds={connectionIds}
              likeCounts={likeCounts} myLikes={myLikes} toggleLike={toggleLike}
              commentCounts={commentCounts} commentsData={commentsData}
              commentsOpen={commentsOpen} commentInputs={commentInputs}
              setCommentInputs={setCommentInputs} toggleComments={toggleComments}
              submitComment={submitComment} deleteComment={deleteComment}
              onDelete={(id) => setDeletingPostId(id)} onEdit={setEditingPost}
            />
          ))}

          {!loading && visiblePosts.length === 0 && (
            <div className="glass-card text-center" style={{ padding: 20, borderRadius: 16 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#1A1A2E", marginBottom: 4 }}>Nothing here yet</p>
              <p style={{ fontSize: 13, color: "#9CA3C0" }}>Be the first to post something.</p>
            </div>
          )}

          <div ref={sentinelRef} className="h-1" />
          {loadingMore && (
            <div className="flex justify-center" style={{ margin: 16 }}>
              <Loader2 className="animate-spin" style={{ width: 24, height: 24, color: "#E8733A" }} />
            </div>
          )}
          {!loading && !hasMore && visiblePosts.length > 0 && (
            <div className="glass-card text-center" style={{ padding: 20, borderRadius: 16, marginTop: 8 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#1A1A2E" }}>You're all caught up!</p>
            </div>
          )}
        </div>

        <aside className="hidden lg:block shrink-0 sticky top-4 self-start" style={{ width: 280 }}>
          <ActivityWidget />
          <SuggestedWidget connectionIds={connectionIds} />
        </aside>
      </div>

      {editingPost && <EditPostModal post={editingPost} onClose={() => setEditingPost(null)} onSaved={(updated) => { setEditedPosts(prev => ({ ...prev, [updated.id]: { content: updated.content, is_edited: updated.is_edited, updated_at: updated.updated_at } })); }} />}
      {deletingPostId && <DeletePostDialog postId={deletingPostId} onClose={() => setDeletingPostId(null)} onDeleted={(id) => { setDeletedIds(prev => new Set(prev).add(id)); setDeletingPostId(null); }} />}
    </main>
  );
};

export default Feed;

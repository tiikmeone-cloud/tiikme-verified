import { useState, useEffect, useRef, useMemo, useCallback, type CSSProperties } from "react";
import { PageSEO } from "@/hooks/usePageSEO";
import AvatarSquare from "@/components/ui/AvatarSquare";
import {
  Heart, MessageCircle, Repeat2, Send, SendHorizontal, MoreHorizontal,
  Trash2, Pencil, Copy, Flag, Paperclip, Loader2, X, Settings2,
} from "lucide-react";
import { toast } from "sonner";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import useEmblaCarousel from "embla-carousel-react";
import ImageGrid from "@/components/feed/ImageGrid";
import MentionText from "@/components/feed/MentionText";
import ShareModal from "@/components/feed/ShareModal";
import { sendNotification } from "@/lib/notify";
import { ActivityWidget } from "@/components/ActivityScoreRing";
import SkeletonCard from "@/components/SkeletonCard";
import EditPostModal from "@/components/feed/EditPostModal";
import DeletePostDialog from "@/components/feed/DeletePostDialog";
import { PostCard as SharedFeedPostCard } from "@/components/feed/PostCard";
import { useFeedPosts } from "@/hooks/useFeedPosts";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useLikes } from "@/hooks/useLikes";
import { useComments } from "@/hooks/useComments";
import PrimaryTabs from "@/components/filters/PrimaryTabs";
import FilterBar, { useScrollPastThreshold } from "@/components/filters/FilterBar";
import BottomSheet from "@/components/ui/BottomSheet";
import { getDisplayFlags, formatRoleLine } from "@/utils/displayProfile";
import { getPrimaryRoleLine, sanitizeIdentityText } from "@/lib/profileUtils";

/* ─── HELPERS ─── */
const roleColorMap: Record<string, string> = {
  student: "#FF5A1F", working: "#C44A1F", professional: "#C44A1F",
  healthcare: "#2D7A4F", doctor: "#2D7A4F", educator: "#166534",
  government: "#166534", gig_worker: "#C2410C", founder: "#92400E", creator: "#B7640A",
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

const clampTwoLinesStyle: CSSProperties = {
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

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

const extractHashtags = (text: string): string[] =>
  (text.match(/#\w+/g) || []).map(t => t.slice(1));

type FeedRenderItem =
  | { kind: "post"; post: any; id: string }
  | { kind: "post-group"; posts: any[]; id: string };

function groupConsecutivePosts(items: any[]): FeedRenderItem[] {
  const out: FeedRenderItem[] = [];
  let bucket: any[] = [];

  const flush = () => {
    if (bucket.length >= 2) out.push({ kind: "post-group", posts: bucket, id: `group-${bucket[0].id}` });
    else if (bucket.length === 1) out.push({ kind: "post", post: bucket[0], id: bucket[0].id });
    bucket = [];
  };

  for (const post of items) {
    if (post.repost_of) { flush(); out.push({ kind: "post", post, id: post.id }); continue; }
    const last = bucket[bucket.length - 1];
    const sameAuthor = !!last && last.author_id === post.author_id;
    const within6h = !!last && Math.abs(new Date(last.created_at || 0).getTime() - new Date(post.created_at || 0).getTime()) < 6 * 3600 * 1000;
    if (sameAuthor && within6h) bucket.push(post);
    else { flush(); bucket = [post]; }
  }
  flush();
  return out;
}

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const { validateUpload } = await import("@/lib/uploadValidation");
    Array.from(files).slice(0, 10 - attachPreviews.length).forEach(file => {
      const err = validateUpload(file, { maxBytes: 10 * 1024 * 1024, allowImages: true, allowPdf: true, allowOffice: true });
      if (err) { toast.error(err); return; }
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
    setAttachPreviews(prev => {
      const item = prev[idx];
      if (item?.url) URL.revokeObjectURL(item.url);
      return prev.filter((_, i) => i !== idx);
    });
    setAttachFiles(prev => prev.filter((_, i) => i !== idx));
  };

  // Revoke all blob URLs on unmount
  useEffect(() => () => { attachPreviews.forEach(a => { if (a.url) URL.revokeObjectURL(a.url); }); }, []);

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

      const trimmed = content.trim();
      const { data: newPost, error } = await supabase.from("posts").insert({
        author_id: user.id, content: trimmed, post_type: "thought", type: "thought",
        visibility: "everyone", hashtags: extractHashtags(content),
        image_urls: uploadedUrls.length > 0 ? uploadedUrls : [],
      } as any).select("id").single();
      if (error) throw error;

      // Process @mentions — notify mentioned users/pages
      const mentionUsernames = (trimmed.match(/@(\w[\w.]*)/g) || []).map(m => m.slice(1));
      if (mentionUsernames.length > 0 && newPost) {
        const [{ data: mentionedUsers }, { data: mentionedPages }] = await Promise.all([
          supabase.from("profiles").select("id, username").in("username", mentionUsernames),
          supabase.from("pages").select("id, slug").in("slug", mentionUsernames),
        ]);
        const mentionInserts: any[] = [];
        for (const mu of mentionedUsers || []) {
          if (mu.id === user.id) continue;
          mentionInserts.push({ post_id: newPost.id, mentioned_user_id: mu.id });
          sendNotification({ userId: mu.id, actorId: user.id, type: "mention", title: "Mentioned you in a post", body: trimmed.slice(0, 80), actionUrl: `/post/${newPost.id}`, data: { post_id: newPost.id } });
        }
        for (const mp of mentionedPages || []) {
          mentionInserts.push({ post_id: newPost.id, mentioned_page_id: mp.id });
        }
        if (mentionInserts.length > 0) await supabase.from("post_mentions").insert(mentionInserts);
      }

      await supabase.rpc("increment_score" as any, { uid: user.id, amount: 5 }).then(() => {});
      setContent(""); setAttachPreviews([]); setAttachFiles([]);
      toast.success("Posted");
      onPublished();
    } catch (err) { toast.error("Failed to post"); console.error(err); }
    finally { setPublishing(false); }
  };

  if (!user) return null;

  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-glass)", borderRadius: 16, boxShadow: "var(--shadow-sm)", padding: "12px 16px", marginBottom: 16 }}>
      <div className="flex items-center" style={{ gap: 10 }}>
        <AvatarSquare src={profile?.avatar_url} name={profile?.full_name || "You"} size={36} />
        <div className="flex-1 min-w-0 relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="What's on your mind? Use @ to mention"
            className="w-full outline-none resize-none"
            style={{
              minHeight: 40, maxHeight: 160, overflow: "hidden",
              background: "var(--surface-2)", border: "1px solid var(--border-glass)", borderRadius: 10,
              padding: "10px 12px", fontSize: 14, color: "var(--text-1)", lineHeight: "1.4",
            }}
            onFocus={e => { e.currentTarget.style.borderColor = "rgba(255,90,31,0.50)"; }}
            onBlur={e => { e.currentTarget.style.borderColor = "var(--border-glass)"; }}
          />
          {/* Mention suggestions dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 z-20 rounded-xl overflow-hidden"
              style={{ top: "100%", marginTop: 4, background: "var(--bg-card)", border: "1px solid var(--border-glass)", boxShadow: "var(--shadow-lg)" }}>
              {suggestions.map((s, idx) => (
                <button key={s.id} type="button" onClick={() => insertMention(s)}
                  className="flex items-center gap-2.5 w-full px-3 py-2.5 text-left cursor-pointer"
                  style={{ background: idx === selectedIdx ? "rgba(255,90,31,0.08)" : "transparent", borderBottom: idx < suggestions.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
                  <AvatarSquare src={s.avatar_url} name={s.display} size={28} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold truncate" style={{ color: "var(--text-1)" }}>{s.display}</p>
                    {s.username && <p className="text-[11px]" style={{ color: "#9CA3AF" }}>@{s.username} · {s.type === "page" ? "Page" : "User"}</p>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        <button type="button" onClick={handleAttach} className="cursor-pointer shrink-0 flex items-center justify-center" style={{ width: 36, height: 36, color: "var(--text-muted)" }}>
          <Paperclip style={{ width: 18, height: 18 }} />
        </button>
        <button type="button" onClick={handlePublish} disabled={publishing || (!content.trim() && attachFiles.length === 0)}
          className="shrink-0 disabled:opacity-50 cursor-pointer"
          style={{ fontSize: 13, fontWeight: 600, height: 36, padding: "0 16px", borderRadius: 10, background: "#FF5A1F", color: "#fff", border: "none" }}>
          {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Post"}
        </button>
      </div>

      {/* Attachment previews */}
      {attachPreviews.length > 0 && (
        <div className="flex flex-wrap gap-2" style={{ marginTop: 8 }}>
          {attachPreviews.map((att, i) => (
            <div key={`${att.name}-${att.size}-${i}`} className="relative" style={{ borderRadius: 6, overflow: "hidden", border: "1px solid var(--border-glass)" }}>
              {att.type.startsWith("image/") ? (
                <img src={att.url} alt="" loading="lazy" style={{ height: 80, width: "auto", maxWidth: 120, objectFit: "cover", borderRadius: 6 }} />
              ) : (
                <div className="flex items-center gap-2" style={{ height: 36, padding: "0 10px", background: "var(--surface-2)", fontSize: 12, color: "var(--text-3)" }}>
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
      <input ref={fileInputRef} type="file" accept="image/*,.pdf,.doc,.docx" multiple className="hidden" onChange={handleFileChange} />
    </div>
  );
};

const PostGroupCard = ({
  posts, connectionIds, likeCounts, myLikes, toggleLike,
  commentCounts, commentsData, commentsOpen, commentInputs,
  setCommentInputs, toggleComments, submitComment, deleteComment, onDelete, onEdit,
}: { posts: any[] } & Record<string, any>) => {
  const [carouselRef, api] = useEmblaCarousel({ align: "start" });
  const [idx, setIdx] = useState(0);
  const first = posts[0];
  const isOrgPost = !!first.posted_by_org && !!first.org;
  const author = first.author;
  const authorFlags = getDisplayFlags(author);
  const displayAvatar = isOrgPost ? first.org?.logo_url : author?.avatar_url;
  const displayName = isOrgPost ? first.org?.name : (authorFlags.showName ? (author?.full_name || author?.username || "Unknown") : "Tiikme member");
  const profileLink = isOrgPost ? `/org/${first.org?.slug}` : `/app/profile/${author?.id || ""}`;

  useEffect(() => {
    if (!api) return;
    const update = () => setIdx(api.selectedScrollSnap());
    update();
    api.on("select", update);
    api.on("reInit", update);
    return () => { api.off("select", update); api.off("reInit", update); };
  }, [api]);

  return (
    <article className="overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border-glass)", borderRadius: 16, boxShadow: "var(--shadow-sm)", marginBottom: 16 }}>
      <header className="flex items-start" style={{ gap: 10, padding: 16, borderBottom: "1px solid var(--border-subtle)" }}>
        <Link to={profileLink} className="shrink-0"><AvatarSquare src={displayAvatar} name={displayName} size={40} /></Link>
        <div className="min-w-0 flex-1">
          <Link
            to={profileLink}
            className="hover:underline block"
            style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)", lineHeight: "18px", ...clampTwoLinesStyle }}
          >
            {displayName}
          </Link>
          <div className="flex items-center flex-wrap" style={{ gap: "2px 6px", marginTop: 3, fontSize: 12, color: "var(--text-muted)" }}>
            <span>Posted <span className="num">{posts.length}</span> updates</span>
            <span style={{ color: "var(--border-subtle)" }}>•</span>
            <span>{first.created_at ? getTimeAgo(new Date(first.created_at)) : ""}</span>
          </div>
        </div>
        <div className="num shrink-0" style={{ fontSize: 12, color: "var(--text-muted)" }}>{idx + 1}/{posts.length}</div>
      </header>
      <div ref={carouselRef} className="overflow-hidden">
        <div className="flex">
          {posts.map((post) => (
            <div key={post.id} className="min-w-0 shrink-0 grow-0 basis-full">
              <SharedFeedPostCard
                post={post} grouped connectionIds={connectionIds}
                likeCounts={likeCounts} myLikes={myLikes} toggleLike={toggleLike}
                commentCounts={commentCounts} commentsData={commentsData}
                commentsOpen={commentsOpen} commentInputs={commentInputs}
                setCommentInputs={setCommentInputs} toggleComments={toggleComments}
                submitComment={submitComment} deleteComment={deleteComment}
                onDelete={onDelete} onEdit={onEdit}
              />
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-center" style={{ gap: 6, padding: "0 0 10px" }}>
        {posts.map((_, i) => (
          <button key={i} type="button" aria-label={`Go to post ${i + 1}`} onClick={() => api?.scrollTo(i)} style={{ width: i === idx ? 24 : 6, height: 6, borderRadius: 999, background: i === idx ? "#FF5A1F" : "#D1D5DB", transition: "width 150ms ease" }} />
        ))}
      </div>
    </article>
  );
};

/* ─── RIGHT SIDEBAR WIDGETS ─── */
const SuggestedWidget = ({ connectionIds }: { connectionIds: Set<string> }) => {
  const { user, profile } = useAuth();
  const [suggested, setSuggested] = useState<any[]>([]);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("id, full_name, role, role_subtype, headline, avatar_url, institution_name, currently_working_at, designation, role_metadata")
      .neq("id", user.id).order("activity_score", { ascending: false }).limit(20)
      .then(({ data }) => {
        const filtered = (data || []).filter(p => {
          if (connectionIds.has(p.id)) return false;
          const priv = (p.privacy as any) || {};
          if (priv.show_in_explore === false) return false;
          return true;
        });
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
        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)" }}>Suggested</span>
        <Link to="/app/explore" style={{ fontSize: 12, color: "#FF5A1F" }}>See all</Link>
      </div>
      {suggested.map((s, i) => (
        <div key={s.id} className="flex items-center" style={{ gap: 8, padding: "6px 0", borderBottom: i < suggested.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
          <Link to={`/app/profile/${s.id}`}>
            <AvatarSquare src={s.avatar_url} name={s.full_name || "User"} size={40} bgColor={roleColorMap[s.role || ""] || "#6B7280"} />
          </Link>
          <div className="flex-1 min-w-0">
            <Link
              to={`/app/profile/${s.id}`}
              className="hover:underline block"
              style={{ fontSize: 13, fontWeight: 500, color: "var(--text-1)", lineHeight: "17px", ...clampTwoLinesStyle }}
            >
              {s.full_name || "User"}
            </Link>
            <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: "16px", ...clampTwoLinesStyle }}>
              {sanitizeIdentityText(getPrimaryRoleLine(s))}
            </p>
          </div>
          <button type="button" className="btn-glass-pill cursor-pointer" style={{ fontSize: 12, fontWeight: 500, padding: "4px 10px" }}
            onClick={() => handleConnect(s.id)}>Connect</button>
        </div>
      ))}
    </div>
  );
};

/* ─── CIRCLES DISCOVERY WIDGET ─── */
/* ─── OPPORTUNITIES TEASER WIDGET ─── */
const OpportunitiesWidget = () => {
  const { user, profile } = useAuth();
  const [opps, setOpps] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("opportunities")
      .select("id, title, company_name, location, type")
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(3)
      .then(({ data }) => setOpps(data || []));
  }, [user]);

  if (!opps.length) return null;

  return (
    <div className="glass-card" style={{ padding: 12, borderRadius: 16, marginTop: 12 }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)" }}>Open Roles</span>
        <Link to="/app/opportunities" style={{ fontSize: 12, color: "#FF5A1F" }}>See all</Link>
      </div>
      {opps.map((o, i) => (
        <Link
          key={o.id}
          to={`/app/opportunities?opp=${o.id}`}
          className="flex flex-col hover:opacity-80 transition-opacity"
          style={{ padding: "7px 0", borderBottom: i < opps.length - 1 ? "1px solid var(--border-subtle)" : "none", textDecoration: "none" }}
        >
          <p className="truncate" style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>{o.title}</p>
          <p className="truncate" style={{ fontSize: 12, color: "var(--text-3)" }}>
            {[o.company_name, o.location].filter(Boolean).join(" · ")}
          </p>
          {o.type && (
            <span style={{ marginTop: 3, fontSize: 11, fontWeight: 500, padding: "1px 6px", borderRadius: 4, background: "rgba(255,90,31,0.10)", color: "#FF5A1F", alignSelf: "flex-start" }}>
              {o.type}
            </span>
          )}
        </Link>
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
  const [followedOrgIds, setFollowedOrgIds] = useState<Set<string>>(new Set());
  const [feedMode, setFeedMode] = useState<"for_you" | "following">("for_you");
  const [showPrefs, setShowPrefs] = useState(false);
  const [feedPrefs, setFeedPrefs] = useState({
    hideOrgPosts: false,
    hideSharedPosts: false,
  });
  const [searchParams] = useSearchParams();
  const targetPostId = searchParams.get("post");
  const scrolledRef = useRef(false);
  const [hideOrgPosts, setHideOrgPosts] = useState(() => localStorage.getItem("feed_hide_org") === "1");

  // Load connection IDs and followed org IDs for "Following" tab filter
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
    supabase.from("org_followers").select("org_id").eq("user_id", user.id)
      .then(({ data }) => {
        setFollowedOrgIds(new Set((data || []).map((r: any) => r.org_id)));
      });
  }, [user]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("tiikme-feed-preferences");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      setFeedPrefs(prev => ({
        hideOrgPosts: !!parsed.hideOrgPosts,
        hideSharedPosts: !!parsed.hideSharedPosts,
        ...prev,
      }));
    } catch {
      // ignore malformed local state
    }
  }, []);

  const updateFeedPref = (key: "hideOrgPosts" | "hideSharedPosts", value: boolean) => {
    setFeedPrefs(prev => {
      const next = { ...prev, [key]: value };
      localStorage.setItem("tiikme-feed-preferences", JSON.stringify(next));
      return next;
    });
  };

  const visiblePosts = useMemo(() => {
    let posts = livePosts
      .filter((p: any) => !deletedIds.has(p.id))
      .filter((p: any) => !(hideOrgPosts && p.posted_as_org_id))

      .filter((p: any) => !feedPrefs.hideOrgPosts || !p.posted_by_org)
      .filter((p: any) => !feedPrefs.hideSharedPosts || !(p.visibility === "workspace" || p.is_shared_to_feed))
      .map((p: any) => editedPosts[p.id] ? { ...p, ...editedPosts[p.id] } : p);

    if (feedMode === "following") {
      posts = posts.filter((p: any) =>
        connectionIds.has(p.author_id) ||
        (p.posted_by_org && followedOrgIds.has(p.posted_by_org))
      );
      // Chronological for "Following" tab
      posts = [...posts].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }

    return posts;
  }, [livePosts, deletedIds, editedPosts, hideOrgPosts, feedPrefs, feedMode, connectionIds, followedOrgIds]);

  const postIds = useMemo(() => visiblePosts.map((p: any) => p.id), [visiblePosts]);
  const feedItems = useMemo(() => groupConsecutivePosts(visiblePosts), [visiblePosts]);
  const postIdsKey = useMemo(() => postIds.join(","), [postIds]);
  const { counts: likeCounts, myLikes, toggle: toggleLike } = useLikes(postIds);
  const {
    all: commentsData, inputs: commentInputs, setInputs: setCommentInputs,
    open: commentsOpen, counts: commentCounts, toggleOpen: toggleComments,
    submit: submitComment, deleteComment, loadCounts: loadCommentCounts,
  } = useComments();

  useEffect(() => { loadCommentCounts(postIds); }, [postIdsKey, loadCommentCounts]);

  // Scroll to ?post=<id> when present and post is loaded
  useEffect(() => {
    if (!targetPostId || scrolledRef.current) return;
    if (!visiblePosts.some((p: any) => p.id === targetPostId)) {
      // Post not yet in loaded set — try to load more
      if (hasMore && !loadingMore && !loading) loadMore();
      return;
    }
    const el = document.getElementById(`post-${targetPostId}`);
    if (el) {
      requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        el.style.transition = "box-shadow 600ms";
        el.style.boxShadow = "0 0 0 2px #FF5A1F, 0 1px 4px rgba(0,0,0,0.04)";
        setTimeout(() => { el.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)"; }, 1800);
      });
      scrolledRef.current = true;
    }
  }, [targetPostId, visiblePosts, hasMore, loadingMore, loading, loadMore]);

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
    <main className="feed-main" style={{ maxWidth: 960, width: "100%", margin: "0 auto", padding: "0 16px" }}>
      <PageSEO title="Feed | Tiikme" description="Your professional feed — posts, updates, and insights from verified professionals and organizations on Tiikme." noIndex />

      <div className="flex" style={{ gap: 20 }}>
        <div style={{ flex: 1, minWidth: 0, maxWidth: 640 }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
            <p style={{ fontSize: 22, fontWeight: 700, color: "var(--text-1)", fontFamily: "var(--font-display, 'Bricolage Grotesque', sans-serif)" }}>Feed</p>
            <button
              type="button"
              onClick={() => setShowPrefs(v => !v)}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-glass)", color: "var(--text-1)" }}
            >
              <Settings2 size={15} />
              Settings
            </button>
          </div>

          <PrimaryTabs
            tabs={[
              { key: "for_you", label: "For you" },
              { key: "following", label: "Following" },
            ]}
            active={feedMode}
            onChange={setFeedMode}
          />

          {showPrefs && (
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-glass)", borderRadius: 16, boxShadow: "var(--shadow-sm)", padding: 14, marginBottom: 12 }}>
              <div className="space-y-3">
                <label className="flex items-center justify-between gap-3">
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>Hide organization posts</p>
                    <p style={{ fontSize: 12, color: "var(--text-3)" }}>Show only people-first posts in your main feed.</p>
                  </div>
                  <input type="checkbox" checked={feedPrefs.hideOrgPosts} onChange={(e) => updateFeedPref("hideOrgPosts", e.target.checked)} />
                </label>

              </div>
            </div>
          )}

          <FeedComposer onPublished={refresh} />

          {loading && !visiblePosts.length && <SkeletonCard count={3} />}
          {feedItems.map((item) => item.kind === "post" ? (
            <SharedFeedPostCard
              key={item.id} post={item.post} connectionIds={connectionIds}
              likeCounts={likeCounts} myLikes={myLikes} toggleLike={toggleLike}
              commentCounts={commentCounts} commentsData={commentsData}
              commentsOpen={commentsOpen} commentInputs={commentInputs}
              setCommentInputs={setCommentInputs} toggleComments={toggleComments}
              submitComment={submitComment} deleteComment={deleteComment}
              onDelete={(id) => setDeletingPostId(id)} onEdit={setEditingPost}
            />
          ) : (
            <PostGroupCard
              key={item.id} posts={item.posts} connectionIds={connectionIds}
              likeCounts={likeCounts} myLikes={myLikes} toggleLike={toggleLike}
              commentCounts={commentCounts} commentsData={commentsData}
              commentsOpen={commentsOpen} commentInputs={commentInputs}
              setCommentInputs={setCommentInputs} toggleComments={toggleComments}
              submitComment={submitComment} deleteComment={deleteComment}
              onDelete={(id) => setDeletingPostId(id)} onEdit={setEditingPost}
            />
          ))}

          {!loading && !visiblePosts.length && (
            <div className="text-center" style={{ padding: 32, borderRadius: 16, background: "var(--bg-card)", border: "1px solid var(--border-glass)" }}>
              {feedMode === "following" ? (
                <>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)", marginBottom: 6 }}>Nothing from your network yet</p>
                  <p style={{ fontSize: 13, color: "var(--text-3)" }}>Connect with people and follow organizations to see their posts here.</p>
                </>
              ) : (
                <>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)", marginBottom: 4 }}>Nothing here yet</p>
                  <p style={{ fontSize: 13, color: "var(--text-3)" }}>Be the first to post something.</p>
                </>
              )}
            </div>
          )}

          <div ref={sentinelRef} className="h-1" />
          {loadingMore && (
            <div className="flex justify-center" style={{ margin: 16 }}>
              <Loader2 className="animate-spin" style={{ width: 24, height: 24, color: "#FF5A1F" }} />
            </div>
          )}
          {!loading && !hasMore && visiblePosts.length > 0 && !loadingMore && (
            <div className="text-center" style={{ padding: 20, borderRadius: 16, marginTop: 8, background: "var(--bg-card)", border: "1px solid var(--border-glass)" }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)" }}>You're all caught up!</p>
            </div>
          )}
        </div>

        <aside className="hidden md:block shrink-0 sticky top-4 self-start" style={{ width: 280 }}>
          <ActivityWidget score={profile?.activity_score || 0} />
          <SuggestedWidget connectionIds={connectionIds} />
          <OpportunitiesWidget />
        </aside>
      </div>

      {editingPost && <EditPostModal post={editingPost} onClose={() => setEditingPost(null)} onSaved={(updated) => { setEditedPosts(prev => ({ ...prev, [updated.id]: { content: updated.content, is_edited: updated.is_edited, updated_at: updated.updated_at } })); }} />}
      {deletingPostId && <DeletePostDialog postId={deletingPostId} onClose={() => setDeletingPostId(null)} onDeleted={(id) => { setDeletedIds(prev => new Set(prev).add(id)); setDeletingPostId(null); }} />}
    </main>
  );
};

export default Feed;

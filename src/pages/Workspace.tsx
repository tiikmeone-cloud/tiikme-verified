import { useState, useEffect, useCallback, useRef } from "react";
import { storageImageUrl } from "@/lib/imageTransform";
import {
  Users, Plus, Shield, Copy, Search, FileText, Briefcase, CheckCircle, XCircle,
  Clock, UserPlus, Send, Building2, Lock, Trash2, ChevronRight, MessageCircle,
  AlertTriangle, Hash, Megaphone, FolderKanban, Paperclip, X, Settings,
  Heart, MoreHorizontal, Image as ImageIcon, Loader2, Globe, Eye, EyeOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import GlassBox from "@/components/ui/GlassBox";
import { Link, useNavigate } from "react-router-dom";
import ImageGrid from "@/components/feed/ImageGrid";
import MentionText from "@/components/feed/MentionText";

/* ── Constants ── */
const ROLE_LABELS: Record<string, string> = {
  owner: "Owner", admin: "Admin", hr_admin: "HR Admin", recruiter: "Recruiter",
  verifier: "Verifier", poster: "Poster", team_lead: "Team Lead / HOD", member: "Member",
};
const ROLE_COLORS: Record<string, string> = {
  owner: "#E8580A", admin: "#2563EB", hr_admin: "#7C3AED", recruiter: "#0E7490",
  verifier: "#059669", poster: "#F59E0B", team_lead: "#C2410C", member: "#6B7280",
};
const ACCESS_TYPES = [
  { value: "post_jobs", label: "Post Opportunities" },
  { value: "verify_members", label: "Verify Members" },
  { value: "manage_team", label: "Manage Team" },
  { value: "post_content", label: "Post Content" },
  { value: "issue_certificates", label: "Issue Certificates" },
];
const AVATAR_COLORS = ["#E8733A", "#4A90D9", "#34C759", "#FF6B9D", "#8B5CF6", "#FFB800"];
const hashColor = (s: string) => AVATAR_COLORS[Math.abs([...s].reduce((a, c) => a + c.charCodeAt(0), 0)) % AVATAR_COLORS.length];
const initials = (name: string) => name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";
const CHANNEL_ICONS: Record<string, any> = { group: Hash, announcement: Megaphone, project: FolderKanban };
const POST_TYPE_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  announcement: { label: "Announcement", color: "#DC2626", bg: "rgba(220,38,38,0.10)" },
  meeting: { label: "Meeting", color: "#2563EB", bg: "rgba(37,99,235,0.10)" },
  update: { label: "Update", color: "#059669", bg: "rgba(5,150,105,0.10)" },
  townhall: { label: "Townhall", color: "#E8580A", bg: "rgba(232,88,10,0.10)" },
};
const formatTime = (d: string) => {
  const date = new Date(d);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
};
const formatDateSep = (d: string) => {
  const date = new Date(d);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) return "Today";
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
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

/* ── Workspace Feed Post Card ── */
interface WsFeedPostProps {
  post: any;
  userId?: string;
  orgName?: string;
  members: any[];
  onDelete: (id: string) => void;
}
const WsFeedPost = ({ post, userId, orgName, members, onDelete }: WsFeedPostProps) => {
  const author = post.author;
  const authorName = author?.full_name || "Team Member";
  const authorInitials = initials(authorName);
  const memberEntry = members.find(m => m.user_id === post.author_id);
  const roleAtOrg = memberEntry ? (ROLE_LABELS[memberEntry.role] || memberEntry.role) : null;
  const titleAtOrg = memberEntry?.title;
  const roleColor = memberEntry ? (ROLE_COLORS[memberEntry.role] || "#6B7280") : "#6B7280";
  const timeAgo = post.created_at ? getTimeAgo(new Date(post.created_at)) : "";
  const postTypeStyle = POST_TYPE_STYLES[post.post_type];
  const isOwn = userId === post.author_id;
  const isSharedToFeed = post.is_shared_to_feed;

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");
  const [commentCount, setCommentCount] = useState(post.comment_count || 0);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    if (!userId) return;
    supabase.from("post_reactions").select("id").eq("post_id", post.id).eq("user_id", userId).maybeSingle()
      .then(({ data }) => setLiked(!!data));
    supabase.from("post_reactions").select("id", { count: "exact", head: true }).eq("post_id", post.id)
      .then(({ count }) => setLikeCount(count || 0));
  }, [post.id, userId]);

  const toggleLike = async () => {
    if (!userId) return;
    if (liked) {
      await supabase.from("post_reactions").delete().eq("post_id", post.id).eq("user_id", userId);
      setLiked(false); setLikeCount(p => Math.max(0, p - 1));
    } else {
      await supabase.from("post_reactions").insert({ post_id: post.id, user_id: userId, reaction_type: "useful" });
      setLiked(true); setLikeCount(p => p + 1);
    }
  };

  const loadComments = async () => {
    const { data } = await supabase.from("post_comments").select("*, author:profiles!post_comments_user_id_fkey(id, full_name, avatar_url, role)")
      .eq("post_id", post.id).order("created_at", { ascending: true }).limit(50);
    setComments(data || []);
    setCommentCount(data?.length || 0);
  };

  const toggleComments = () => {
    if (!commentsOpen) loadComments();
    setCommentsOpen(!commentsOpen);
  };

  const submitComment = async () => {
    if (!commentText.trim() || !userId) return;
    await supabase.from("post_comments").insert({ post_id: post.id, user_id: userId, content: commentText.trim() });
    setCommentText("");
    loadComments();
  };

  const handleDelete = async () => {
    onDelete(post.id);
    await supabase.from("posts").delete().eq("id", post.id);
    toast.success("Post deleted");
    setShowMenu(false);
  };

  return (
    <article className="glass-light mb-3 overflow-hidden" style={{
      padding: 16, borderRadius: 24,
      borderLeft: postTypeStyle ? `4px solid ${postTypeStyle.color}` : undefined,
    }}>
      {/* Post type badge */}
      {postTypeStyle && (
        <div className="pb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
            style={{ background: postTypeStyle.bg, color: postTypeStyle.color }}>
            {postTypeStyle.label}
          </span>
        </div>
      )}

      {/* Author header */}
      <div className="flex items-center gap-3 pb-1">
        <Link to={`/app/profile/${post.author_id || ""}`}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[13px] font-bold text-white shrink-0 overflow-hidden"
            style={{ backgroundColor: roleColor, border: "2px solid rgba(255,255,255,0.25)" }}>
            {author?.avatar_url
              ? <img src={storageImageUrl(author.avatar_url, "avatar")} alt="" className="w-full h-full object-cover" />
              : authorInitials}
          </div>
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Link to={`/app/profile/${post.author_id || ""}`} className="font-semibold hover:underline" style={{ color: "var(--color-text)", fontSize: 14 }}>{authorName}</Link>
            {roleAtOrg && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${roleColor}1A`, color: roleColor }}>
                {roleAtOrg}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--color-text-muted)" }}>
            {titleAtOrg && <span>{titleAtOrg} · </span>}
            <span>{timeAgo}</span>
            <span className="flex items-center gap-0.5 ml-1">
              {isSharedToFeed ? <><Globe className="w-3 h-3" /> Public</> : <><Lock className="w-3 h-3" /> Workspace</>}
            </span>
          </div>
        </div>
        <div className="relative">
          <button type="button" onClick={() => setShowMenu(!showMenu)} className="p-2 rounded-lg cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
            style={{ color: "var(--color-text-secondary)" }}>
            <MoreHorizontal className="w-4 h-4" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-8 glass-light rounded-xl p-1 min-w-[140px] z-10" style={{ borderRadius: 14 }}>
              {isOwn && (
                <button type="button" onClick={handleDelete} className="flex items-center gap-2 w-full px-3 py-2 text-[12px] rounded-lg cursor-pointer" style={{ color: "#DC2626" }}>
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              )}
              <button type="button" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`); toast.success("Link copied"); setShowMenu(false); }}
                className="flex items-center gap-2 w-full px-3 py-2 text-[12px] rounded-lg cursor-pointer" style={{ color: "var(--color-text-secondary)" }}>
                <Copy className="w-3 h-3" /> Copy link
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="py-2.5" style={{ fontSize: 15, lineHeight: 1.6, color: "var(--color-text)" }}>
        <MentionText text={post.content} />
      </div>

      {/* Images */}
      {post.image_urls?.length > 0 && (
        <div className="pb-2"><div className="rounded-xl overflow-hidden"><ImageGrid images={post.image_urls} /></div></div>
      )}

      {/* PDF */}
      {post.pdf_url && (
        <div className="mb-3">
          <a href={post.pdf_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 glass-medium rounded-xl p-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(220,38,38,0.1)" }}>
              <FileText className="w-5 h-5" style={{ color: "#DC2626" }} />
            </div>
            <p className="text-[13px] font-bold truncate flex-1" style={{ color: "var(--color-text)" }}>Attached PDF ↗</p>
          </a>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 pt-2" style={{ borderTop: "1px solid var(--glass-border-subtle)" }}>
        <button type="button" onClick={toggleLike}
          className="h-8 px-2.5 rounded-xl text-[13px] font-semibold flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
          style={{ background: "rgba(255,255,255,0.15)", borderRadius: 12, color: liked ? "var(--color-accent)" : "var(--color-text-secondary)" }}>
          <Heart className="w-4 h-4" style={{ fill: liked ? "var(--color-accent)" : "none" }} /> {likeCount}
        </button>
        <button type="button" onClick={toggleComments}
          className="h-8 px-2.5 rounded-xl text-[13px] font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
          style={{ background: "rgba(255,255,255,0.15)", borderRadius: 12, color: "var(--color-text-secondary)" }}>
          <MessageCircle className="w-4 h-4" /> {commentCount}
        </button>
      </div>

      {/* Comments */}
      {commentsOpen && (
        <div className="pt-3 space-y-3" style={{ borderTop: "1px solid var(--glass-border-subtle)", marginTop: 8 }}>
          {comments.length === 0 && <p className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>No comments yet</p>}
          {comments.map(c => {
            const cName = c.author?.full_name || "User";
            const cInit = initials(cName);
            const cTime = c.created_at ? getTimeAgo(new Date(c.created_at)) : "";
            return (
              <div key={c.id} className="flex items-start gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-bold text-white overflow-hidden shrink-0"
                  style={{ background: hashColor(c.user_id || "") }}>
                  {c.author?.avatar_url ? <img src={storageImageUrl(c.author.avatar_url, "avatar")} alt="" className="w-full h-full object-cover" /> : cInit}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-bold" style={{ color: "var(--color-text)" }}>{cName}</span>
                    <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>{cTime}</span>
                  </div>
                  <p className="text-[12px]" style={{ color: "var(--color-text-secondary)" }}><MentionText text={c.content} /></p>
                </div>
              </div>
            );
          })}
          <div className="flex items-center gap-2">
            <input value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Write a comment..."
              className="flex-1 h-8 rounded-xl px-3 text-[12px] outline-none glass-input"
              onKeyDown={e => { if (e.key === "Enter" && commentText.trim()) submitComment(); }} />
            <button type="button" onClick={submitComment}
              className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer active:scale-95"
              style={{ background: commentText.trim() ? "var(--color-accent)" : "var(--glass-bg)" }}>
              <Send className="w-3.5 h-3.5" style={{ color: commentText.trim() ? "white" : "var(--color-text-muted)" }} />
            </button>
          </div>
        </div>
      )}
    </article>
  );
};

/* ── Workspace Post Composer ── */
interface WsComposerProps {
  userId: string;
  orgId: string;
  orgName: string;
  workspaceId: string | null;
  isAdmin: boolean;
  profile: any;
  onPosted: () => void;
}
const WsComposer = ({ userId, orgId, orgName, workspaceId, isAdmin, profile, onPosted }: WsComposerProps) => {
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState<"thought" | "announcement" | "meeting" | "update">("thought");
  const [shareToFeed, setShareToFeed] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const imgRef = useRef<HTMLInputElement>(null);
  const pdfRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const valid: File[] = []; const previews: string[] = [];
    for (const f of files.slice(0, 10 - imageFiles.length)) {
      if (!f.type.startsWith("image/") || f.size > 10 * 1024 * 1024) continue;
      valid.push(f); previews.push(URL.createObjectURL(f));
    }
    setImageFiles(prev => [...prev, ...valid]);
    setImagePreviews(prev => [...prev, ...previews]);
    e.target.value = "";
  };

  const removeImage = (idx: number) => {
    URL.revokeObjectURL(imagePreviews[idx]);
    setImageFiles(prev => prev.filter((_, i) => i !== idx));
    setImagePreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const handlePdfSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f && f.type === "application/pdf" && f.size <= 25 * 1024 * 1024) setPdfFile(f);
    else if (f) toast.error("Only PDF files under 25MB");
    e.target.value = "";
  };

  const publish = async () => {
    if (!content.trim() && imageFiles.length === 0 && !pdfFile) { toast.error("Write something"); return; }
    if (postType === "announcement" && !isAdmin) { toast.error("Only admins can post announcements"); return; }
    setPublishing(true);
    try {
      let imageUrls: string[] = [];
      for (const file of imageFiles) {
        const path = `${userId}/${Date.now()}-${file.name.replace(/[^a-z0-9.]/gi, "_")}`;
        const { data: ud, error } = await supabase.storage.from("post-images").upload(path, file, { upsert: false, contentType: file.type });
        if (error) { toast.error("Image upload failed"); setPublishing(false); return; }
        const { data: url } = supabase.storage.from("post-images").getPublicUrl(ud.path);
        if (url?.publicUrl) imageUrls.push(url.publicUrl);
      }
      let pdfUrl: string | null = null;
      if (pdfFile) {
        const path = `${userId}/${Date.now()}-${pdfFile.name.replace(/[^a-z0-9.]/gi, "_")}`;
        const { data: ud, error } = await supabase.storage.from("message-attachments").upload(path, pdfFile, { contentType: "application/pdf" });
        if (error) { toast.error("PDF upload failed"); setPublishing(false); return; }
        const { data: url } = supabase.storage.from("message-attachments").getPublicUrl(ud.path);
        pdfUrl = url?.publicUrl || null;
      }

      const { error } = await supabase.from("posts").insert({
        author_id: userId,
        content: content.trim(),
        post_type: postType,
        type: postType,
        visibility: "workspace",
        is_shared_to_feed: shareToFeed,
        posted_by_org: orgId,
        posted_by_user_id: userId,
        workspace_id: workspaceId,
        workspace_name: orgName,
        image_urls: imageUrls,
        pdf_url: pdfUrl,
        hashtags: (content.match(/#\w+/g) || []).map(t => t.slice(1)),
        show_company_badge: true,
      } as any);
      if (error) throw error;
      await supabase.rpc("increment_score", { uid: userId, amount: 3 });
      toast.success("Posted to workspace");
      setContent(""); setPostType("thought"); setShareToFeed(false);
      setImageFiles([]); setImagePreviews([]); setPdfFile(null);
      onPosted();
    } catch (err: any) {
      toast.error("Failed to post");
      console.error(err);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="glass-light rounded-3xl p-4 mb-4" style={{ boxShadow: "inset 0 1px 0 var(--glass-highlight)" }}>
      {/* Header indicator */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-bold text-white overflow-hidden shrink-0"
          style={{ background: "var(--color-accent)" }}>
          {profile?.avatar_url ? <img src={storageImageUrl(profile.avatar_url, "avatar")} alt="" className="w-full h-full object-cover" /> : initials(profile?.full_name || "")}
        </div>
        <div className="flex-1">
          <p className="text-[12px] font-semibold" style={{ color: "var(--color-text)" }}>{profile?.full_name}</p>
          <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>Posting to {orgName}</p>
        </div>
      </div>

      {/* Textarea */}
      <textarea value={content} onChange={e => setContent(e.target.value.slice(0, 3000))}
        placeholder="Share something with your team..."
        className="w-full min-h-[100px] px-3 py-2.5 text-[14px] resize-none outline-none rounded-xl"
        style={{ background: "var(--surface-2)", border: "1px solid var(--border-2)", color: "var(--color-text)", lineHeight: 1.6 }} />

      {/* Image previews */}
      {imagePreviews.length > 0 && (
        <div className="flex gap-2 mt-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {imagePreviews.map((p, i) => (
            <div key={i} className="relative shrink-0 w-16 h-16 rounded-xl overflow-hidden" style={{ background: "var(--surface-2)" }}>
              <img src={p} alt="" className="w-full h-full object-cover" />
              <button type="button" onClick={() => removeImage(i)} className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center cursor-pointer">
                <X className="w-2.5 h-2.5 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* PDF preview */}
      {pdfFile && (
        <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-xl" style={{ background: "var(--surface-2)", border: "1px solid var(--border-2)" }}>
          <FileText className="w-4 h-4" style={{ color: "#DC2626" }} />
          <span className="text-[12px] flex-1 truncate" style={{ color: "var(--color-text)" }}>{pdfFile.name}</span>
          <button onClick={() => setPdfFile(null)} className="cursor-pointer"><X className="w-3.5 h-3.5" style={{ color: "var(--color-text-muted)" }} /></button>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-2 mt-3 flex-wrap">
        {/* Post type */}
        <div className="flex gap-1">
          {(["thought", "announcement", "meeting", "update"] as const).map(t => {
            if (t === "announcement" && !isAdmin) return null;
            const isActive = postType === t;
            const style = POST_TYPE_STYLES[t];
            return (
              <button key={t} onClick={() => setPostType(t)}
                className="px-2 py-1 rounded-lg text-[10px] font-bold capitalize cursor-pointer"
                style={{
                  background: isActive ? (style?.bg || "rgba(232,115,58,0.10)") : "transparent",
                  color: isActive ? (style?.color || "var(--color-accent)") : "var(--color-text-muted)",
                  border: isActive ? `1px solid ${style?.color || "var(--color-accent)"}33` : "1px solid transparent",
                }}>
                {t === "thought" ? "Regular" : t}
              </button>
            );
          })}
        </div>

        <div className="flex-1" />

        {/* Privacy toggle */}
        <button onClick={() => setShareToFeed(!shareToFeed)}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer"
          style={{
            background: shareToFeed ? "rgba(5,150,105,0.10)" : "transparent",
            color: shareToFeed ? "#059669" : "var(--color-text-muted)",
            border: `1px solid ${shareToFeed ? "rgba(5,150,105,0.2)" : "var(--glass-border-color)"}`,
          }}>
          {shareToFeed ? <><Globe className="w-3 h-3" /> Public</> : <><Lock className="w-3 h-3" /> Workspace</>}
        </button>

        {/* Attach buttons */}
        <button onClick={() => imgRef.current?.click()} className="p-1.5 rounded-lg cursor-pointer" style={{ color: "var(--color-text-muted)" }}>
          <ImageIcon className="w-4 h-4" />
        </button>
        <button onClick={() => pdfRef.current?.click()} className="p-1.5 rounded-lg cursor-pointer" style={{ color: "var(--color-text-muted)" }}>
          <FileText className="w-4 h-4" />
        </button>

        <button onClick={publish} disabled={publishing || (!content.trim() && imageFiles.length === 0 && !pdfFile)}
          className="btn-liquid-primary px-4 py-1.5 rounded-xl text-[12px] font-bold cursor-pointer disabled:opacity-50">
          {publishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Post"}
        </button>
      </div>

      <input ref={imgRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect} />
      <input ref={pdfRef} type="file" accept=".pdf" className="hidden" onChange={handlePdfSelect} />
    </div>
  );
};

/* ════════════════════════════════════════ */

export default function Workspace() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const isInstitution = profile?.account_type === "institution" && !!profile?.org_id;

  // For regular users: find their org membership
  const [resolvedOrgId, setResolvedOrgId] = useState<string | null>(profile?.org_id || null);
  const [hasOrgAccess, setHasOrgAccess] = useState<boolean | null>(null);

  useEffect(() => {
    if (isInstitution && profile?.org_id) {
      setResolvedOrgId(profile.org_id);
      setHasOrgAccess(true);
      return;
    }
    if (!user) { setHasOrgAccess(false); return; }
    // Check if user is member of any org
    supabase.from("org_members").select("org_id").eq("user_id", user.id).eq("is_current", true).limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setResolvedOrgId(data[0].org_id);
          setHasOrgAccess(true);
        } else {
          setHasOrgAccess(false);
        }
      });
  }, [user, isInstitution, profile?.org_id]);

  const orgId = resolvedOrgId;

  const [org, setOrg] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [accessRules, setAccessRules] = useState<any[]>([]);
  const [verifRequests, setVerifRequests] = useState<any[]>([]);
  const [itemVerifRequests, setItemVerifRequests] = useState<any[]>([]);
  const [wsPosts, setWsPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [myRole, setMyRole] = useState<string>("member");
  const [search, setSearch] = useState("");

  const [selectedPanel, setSelectedPanel] = useState<"feed" | "team" | "access" | "verifications" | "invites" | "groups">("feed");

  // Groups/Channels state
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [channels, setChannels] = useState<any[]>([]);
  const [activeChannel, setActiveChannel] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [msgInput, setMsgInput] = useState("");
  const [msgLoading, setMsgLoading] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState<{ file: File; url: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Create group modal
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [newGroupType, setNewGroupType] = useState<"group" | "announcement" | "project">("group");
  const [newGroupPrivate, setNewGroupPrivate] = useState(false);

  // Modals
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviteDept, setInviteDept] = useState("");
  const [showAccess, setShowAccess] = useState(false);
  const [accessMemberId, setAccessMemberId] = useState("");
  const [accessType, setAccessType] = useState("post_jobs");
  const [accessDept, setAccessDept] = useState("");

  const isOwnerOrAdmin = myRole === "owner" || myRole === "admin";

  /* ── Data fetching ── */
  const fetchData = useCallback(async () => {
    if (!orgId || !user) { setLoading(false); return; }
    setLoading(true);
    const [orgRes, membersRes, accessRes, verifRes, myRoleRes, itemVerifRes] = await Promise.allSettled([
      supabase.from("organizations").select("*").eq("id", orgId).maybeSingle(),
      supabase.from("org_members").select("*, profile:profiles!org_members_user_id_fkey(id, full_name, avatar_url, role, headline)")
        .eq("org_id", orgId).order("joined_at", { ascending: true }),
      supabase.from("org_access_rules").select("*, member:profiles!org_access_rules_member_id_fkey(full_name, avatar_url)")
        .eq("org_id", orgId),
      supabase.from("org_verif_requests").select("*, requester:profiles!org_verif_requests_user_id_fkey(full_name, avatar_url, role)")
        .eq("org_id", orgId).eq("status", "pending").order("created_at", { ascending: false }),
      supabase.from("org_members").select("role").eq("org_id", orgId).eq("user_id", user.id).maybeSingle(),
      supabase.from("item_verification_requests").select("*")
        .eq("org_id", orgId).eq("status", "pending").order("created_at", { ascending: false }),
    ]);
    if (orgRes.status === "fulfilled") setOrg(orgRes.value.data);
    if (membersRes.status === "fulfilled") setMembers(membersRes.value.data || []);
    if (accessRes.status === "fulfilled") setAccessRules(accessRes.value.data || []);
    if (verifRes.status === "fulfilled") setVerifRequests(verifRes.value.data || []);
    if (myRoleRes.status === "fulfilled") setMyRole(myRoleRes.value.data?.role || "member");

    // Hydrate item verif requests
    if (itemVerifRes.status === "fulfilled") {
      const rawReqs = itemVerifRes.value.data || [];
      if (rawReqs.length > 0) {
        const requesterIds = [...new Set(rawReqs.map((r: any) => r.requester_id).filter(Boolean))];
        const workItemIds = [...new Set(rawReqs.map((r: any) => r.work_item_id).filter(Boolean))];
        const [profilesRes, workItemsRes] = await Promise.allSettled([
          supabase.from("profiles").select("id, full_name, avatar_url, role").in("id", requesterIds as string[]),
          supabase.from("work_items").select("id, title, job_title, company_name, institution_name_edu, item_type, start_date, end_date, is_current").in("id", workItemIds as string[]),
        ]);
        const profiles = profilesRes.status === "fulfilled" ? profilesRes.value.data || [] : [];
        const workItems = workItemsRes.status === "fulfilled" ? workItemsRes.value.data || [] : [];
        setItemVerifRequests(rawReqs.map((r: any) => ({
          ...r,
          requester: profiles.find((p: any) => p.id === r.requester_id),
          work_item: workItems.find((w: any) => w.id === r.work_item_id),
        })));
      } else {
        setItemVerifRequests([]);
      }
    }

    // Load workspace & channels
    let wsId: string | null = null;
    const { data: ws } = await supabase.from("workspaces").select("id").eq("institution_id", orgId).maybeSingle();
    if (ws) {
      wsId = ws.id;
    } else if (isInstitution) {
      const { data: newWs } = await supabase.from("workspaces").insert({
        name: orgRes.status === "fulfilled" ? orgRes.value.data?.name || "Workspace" : "Workspace",
        type: "organization",
        institution_id: orgId,
        created_by: user.id,
      }).select("id").maybeSingle();
      if (newWs) wsId = newWs.id;
    }
    setWorkspaceId(wsId);
    if (wsId) {
      const { data: ch } = await supabase.from("workspace_channels").select("*").eq("workspace_id", wsId).order("created_at", { ascending: true });
      setChannels(ch || []);
    }

    setLoading(false);
  }, [orgId, user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ── Fetch workspace posts ── */
  const fetchWsPosts = useCallback(async () => {
    if (!orgId) return;
    const { data } = await supabase.from("posts")
      .select("*, author:profiles!posts_author_id_fkey(id, full_name, avatar_url, role, headline)")
      .eq("posted_by_org", orgId)
      .order("created_at", { ascending: false })
      .limit(50);
    setWsPosts(data || []);
  }, [orgId]);

  useEffect(() => { fetchWsPosts(); }, [fetchWsPosts]);

  /* ── Channel messages ── */
  const loadMessages = useCallback(async (channelId: string) => {
    setMsgLoading(true);
    const { data } = await supabase.from("workspace_messages")
      .select("*")
      .eq("channel_id", channelId)
      .order("created_at", { ascending: true })
      .limit(200);
    if (data && data.length > 0) {
      const senderIds = [...new Set(data.map(m => m.sender_id).filter(Boolean))];
      const { data: profiles } = await supabase.from("profiles").select("id, full_name, avatar_url").in("id", senderIds as string[]);
      const profMap = new Map((profiles || []).map(p => [p.id, p]));
      setMessages(data.map(m => ({ ...m, sender: profMap.get(m.sender_id!) })));
    } else {
      setMessages([]);
    }
    setMsgLoading(false);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }, []);

  const openChannel = (ch: any) => {
    setActiveChannel(ch);
    setSelectedPanel("groups");
    loadMessages(ch.id);
  };

  // Realtime subscription for messages
  useEffect(() => {
    if (!activeChannel) return;
    const sub = supabase.channel(`ws-msgs-${activeChannel.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "workspace_messages", filter: `channel_id=eq.${activeChannel.id}` },
        async (payload) => {
          const msg = payload.new as any;
          const { data: prof } = await supabase.from("profiles").select("id, full_name, avatar_url").eq("id", msg.sender_id).maybeSingle();
          setMessages(prev => [...prev, { ...msg, sender: prof }]);
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
        })
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [activeChannel]);

  /* ── Send message ── */
  const sendMessage = async () => {
    if ((!msgInput.trim() && !pendingAttachment) || !activeChannel || !user) return;
    let attachUrl: string | undefined;
    let attachType: string | undefined;
    let attachName: string | undefined;

    if (pendingAttachment) {
      const file = pendingAttachment.file;
      const path = `${user.id}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("message-attachments").upload(path, file);
      if (error) { toast.error("Upload failed"); return; }
      const { data: urlData } = supabase.storage.from("message-attachments").getPublicUrl(path);
      attachUrl = urlData.publicUrl;
      attachType = file.type;
      attachName = file.name;
    }

    const { error } = await supabase.from("workspace_messages").insert({
      channel_id: activeChannel.id,
      sender_id: user.id,
      content: msgInput.trim() || (attachName ? `📎 ${attachName}` : ""),
      attachment_url: attachUrl,
      attachment_type: attachType,
      attachment_name: attachName,
    });
    if (error) { toast.error("Failed to send"); return; }
    setMsgInput("");
    setPendingAttachment(null);
  };

  /* ── Delete message ── */
  const deleteMessage = async (msgId: string) => {
    await supabase.from("workspace_messages").update({ is_deleted: true, deleted_at: new Date().toISOString(), content: "This message was deleted" }).eq("id", msgId);
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, is_deleted: true, content: "This message was deleted" } : m));
  };

  /* ── Create group ── */
  const createGroup = async () => {
    if (!newGroupName.trim() || !workspaceId || !user) return;
    const { data: ch, error } = await supabase.from("workspace_channels").insert({
      workspace_id: workspaceId,
      name: newGroupName.trim(),
      description: newGroupDesc.trim() || null,
      channel_type: newGroupType,
      is_private: newGroupPrivate,
      created_by: user.id,
    }).select("*").maybeSingle();
    if (error) { toast.error(error.message); return; }
    if (ch) {
      await supabase.from("workspace_channel_members").insert({ channel_id: ch.id, user_id: user.id, role: "admin" });
      setChannels(prev => [...prev, ch]);
      toast.success(`#${ch.name} created`);
    }
    setShowCreateGroup(false);
    setNewGroupName(""); setNewGroupDesc(""); setNewGroupType("group"); setNewGroupPrivate(false);
  };

  /* ── File attachment ── */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPendingAttachment({ file, url });
    e.target.value = "";
  };

  /* ── Existing handlers ── */
  const handleInvite = async () => {
    if (!inviteEmail.trim() || !orgId || !user) return;
    const { data: found } = await supabase.from("profiles")
      .select("id, full_name").ilike("full_name", `%${inviteEmail}%`).limit(1).maybeSingle();
    if (found) {
      const { error } = await supabase.from("org_members").insert({
        org_id: orgId, user_id: found.id, role: inviteRole,
        department: inviteDept || null, granted_by: user.id,
        approval_status: isOwnerOrAdmin ? "approved" : "pending",
      });
      if (error) { toast.error(error.message); return; }
      toast.success(`${found.full_name} added as ${ROLE_LABELS[inviteRole]}`);
      await supabase.from("alerts").insert({
        user_id: found.id, type: "org_invite",
        title: `You've been added to ${org?.name}`,
        body: `Role: ${ROLE_LABELS[inviteRole]}${inviteDept ? ` · ${inviteDept}` : ""}`,
        action_url: `/app/workspace`,
      });
    } else {
      toast.info("User not found. Copy the invite link to share.");
    }
    setShowInvite(false); setInviteEmail(""); fetchData();
  };
  const handleGrantAccess = async () => {
    if (!accessMemberId || !orgId || !user) return;
    const { error } = await supabase.from("org_access_rules").insert({
      org_id: orgId, member_id: accessMemberId, access_type: accessType,
      department_scope: accessDept || null, created_by: user.id,
      access_scope: "general", delegation_approved: isOwnerOrAdmin ? true : null,
      delegated_by: !isOwnerOrAdmin ? user.id : null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Access granted"); setShowAccess(false); fetchData();
  };
  const handleRemoveAccess = async (ruleId: string) => {
    await supabase.from("org_access_rules").delete().eq("id", ruleId);
    toast.success("Access removed"); fetchData();
  };
  const handleApproveDelegation = async (ruleId: string, approved: boolean) => {
    await supabase.from("org_access_rules").update({ delegation_approved: approved }).eq("id", ruleId);
    toast.success(approved ? "Approved" : "Rejected"); fetchData();
  };
  const handleVerifAction = async (reqId: string, status: "approved" | "rejected", requesterId: string) => {
    await supabase.from("org_verif_requests").update({ status, reviewed_by: user?.id, reviewed_at: new Date().toISOString() }).eq("id", reqId);
    if (status === "approved") {
      await supabase.from("org_members").update({ is_verified: true, verified_at: new Date().toISOString() })
        .eq("org_id", orgId).eq("user_id", requesterId);
      if (user) await supabase.rpc("increment_score", { uid: requesterId, amount: 25 });
    }
    await supabase.from("alerts").insert({
      user_id: requesterId, type: "verification",
      title: status === "approved" ? "Verification approved" : "Verification request declined",
      body: `Your verification at ${org?.name} has been ${status}.`,
      action_url: "/app/profile",
    });
    toast.success(`Request ${status}`); fetchData();
  };
  const handleItemVerifAction = async (reqId: string, action: "approved" | "rejected", requesterId: string, workItemId: string) => {
    await supabase.from("item_verification_requests").update({ status: action, verifier_id: user?.id } as any).eq("id", reqId);
    if (action === "approved") {
      await supabase.from("work_items").update({ verification_status: "verified", verified_by_user: user?.id, verified_at: new Date().toISOString(), is_tiiked: true } as any).eq("id", workItemId);
      if (user) await supabase.rpc("increment_score", { uid: requesterId, amount: 15 });
    } else {
      await supabase.from("work_items").update({ verification_status: "rejected" } as any).eq("id", workItemId);
    }
    await supabase.from("alerts").insert({
      user_id: requesterId, type: "verification",
      title: action === "approved" ? `Your ${org?.name || "work"} experience verified! ✓` : "Verification declined",
      body: action === "approved"
        ? `${profile?.full_name || "Someone"} verified your experience at ${org?.name}`
        : `Your verification request at ${org?.name} was declined.`,
      action_url: "/app/profile",
    });
    toast.success(action === "approved" ? "Verified ✓" : "Declined"); fetchData();
  };
  const handleRemoveMember = async (memberId: string) => {
    await supabase.from("org_members").delete().eq("id", memberId);
    toast.success("Member removed"); fetchData();
  };
  const copyInviteLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/join-as-institution?ref=${org?.slug || ""}`);
    toast.success("Invite link copied");
  };

  const handleDeletePost = (postId: string) => {
    setWsPosts(prev => prev.filter(p => p.id !== postId));
  };

  const filteredMembers = members.filter(m => !search.trim() || m.profile?.full_name?.toLowerCase().includes(search.toLowerCase()));

  /* ── Empty state ── */
  if (hasOrgAccess === null) return (
    <div className="max-w-[1200px] mx-auto px-4 py-8">
      <div className="animate-pulse space-y-4">
        <div className="h-10 w-1/3 rounded-xl" style={{ background: "var(--glass-bg)" }} />
        <div className="h-64 rounded-xl" style={{ background: "var(--glass-bg)" }} />
      </div>
    </div>
  );

  if (!hasOrgAccess) {
    return (
      <div className="max-w-[960px] mx-auto px-4 py-16 flex items-center justify-center">
        <div className="glass-light text-center" style={{ padding: 40, borderRadius: 24, maxWidth: 480, boxShadow: "inset 0 1px 0 var(--glass-highlight)" }}>
          <Users className="w-16 h-16 mx-auto mb-3" style={{ color: "var(--color-text-muted)" }} />
          <h1 className="text-[24px] font-bold mb-2" style={{ color: "var(--color-text)" }}>Workspace</h1>
          <p className="text-[15px] mb-6 mx-auto" style={{ color: "var(--color-text-secondary)", maxWidth: 400 }}>Join or create an organisation to access your workspace.</p>
          <button type="button" onClick={() => window.location.href = "/join-as-institution"}
            className="btn-liquid-primary h-12 px-8 rounded-2xl text-[14px] font-bold cursor-pointer">
            Register Organisation
          </button>
        </div>
      </div>
    );
  }

  if (loading) return (
    <div className="max-w-[1200px] mx-auto px-4 py-8">
      <div className="animate-pulse space-y-4">
        <div className="h-10 w-1/3 rounded-xl" style={{ background: "var(--glass-bg)" }} />
        <div className="h-64 rounded-xl" style={{ background: "var(--glass-bg)" }} />
      </div>
    </div>
  );

  const verifCount = verifRequests.length + itemVerifRequests.length;

  /* ── NAV ── */
  const NAV_ITEMS = [
    { key: "feed" as const, label: "Feed", icon: FileText, count: wsPosts.length },
    { key: "verifications" as const, label: "Verifications", icon: Shield, count: verifCount },
    { key: "groups" as const, label: "Groups", icon: Hash, count: channels.length },
    { key: "team" as const, label: "Members", icon: Users, count: members.length },
    { key: "access" as const, label: "Access", icon: Lock, count: accessRules.length },
    { key: "invites" as const, label: "Invites", icon: UserPlus },
  ];

  /* ── Chat view inside Groups panel ── */
  const renderChatView = () => {
    if (!activeChannel) return null;
    const ChannelIcon = CHANNEL_ICONS[activeChannel.channel_type] || Hash;
    const isAnnouncement = activeChannel.channel_type === "announcement";
    const canPost = !isAnnouncement || isOwnerOrAdmin;

    let lastDateSep = "";

    return (
      <div className="flex flex-col h-[calc(100vh-200px)] min-h-[400px]">
        <div className="glass-light rounded-2xl px-4 py-3 mb-3 flex items-center justify-between" style={{ boxShadow: "inset 0 1px 0 var(--glass-highlight)" }}>
          <div className="flex items-center gap-2">
            <button onClick={() => setActiveChannel(null)} className="text-[12px] cursor-pointer mr-1" style={{ color: "var(--color-text-muted)" }}>←</button>
            <ChannelIcon className="w-4 h-4" style={{ color: "var(--color-accent)" }} />
            <span className="text-[14px] font-bold" style={{ color: "var(--color-text)" }}>{activeChannel.name}</span>
            {activeChannel.is_private && <Lock className="w-3 h-3" style={{ color: "var(--color-text-muted)" }} />}
          </div>
          {activeChannel.description && (
            <span className="text-[11px] hidden md:inline" style={{ color: "var(--color-text-muted)" }}>{activeChannel.description}</span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 px-1 pb-2">
          {msgLoading ? (
            <div className="text-center py-8"><div className="w-6 h-6 rounded-full mx-auto animate-pulse" style={{ background: "var(--glass-bg)" }} /></div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              <ChannelIcon className="w-10 h-10 mx-auto mb-2" style={{ color: "var(--color-text-muted)" }} />
              <p className="text-[14px] font-semibold" style={{ color: "var(--color-text)" }}>Welcome to #{activeChannel.name}</p>
              <p className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>This is the start of the conversation.</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isOwn = msg.sender_id === user?.id;
              const dateSep = formatDateSep(msg.created_at);
              let showSep = false;
              if (dateSep !== lastDateSep) { showSep = true; lastDateSep = dateSep; }
              return (
                <div key={msg.id}>
                  {showSep && (
                    <div className="flex items-center gap-3 my-3">
                      <div className="flex-1 h-px" style={{ background: "var(--glass-border-color, rgba(255,255,255,0.12))" }} />
                      <span className="text-[10px] font-bold shrink-0" style={{ color: "var(--color-text-muted)" }}>{dateSep}</span>
                      <div className="flex-1 h-px" style={{ background: "var(--glass-border-color, rgba(255,255,255,0.12))" }} />
                    </div>
                  )}
                  <div className={`flex gap-2 group ${isOwn ? "flex-row-reverse" : ""}`}>
                    {!isOwn && (
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-bold text-white overflow-hidden shrink-0 mt-0.5"
                        style={{ background: hashColor(msg.sender_id || "") }}>
                        {msg.sender?.avatar_url
                          ? <img src={storageImageUrl(msg.sender.avatar_url, "avatar")} alt="" className="w-full h-full object-cover" />
                          : initials(msg.sender?.full_name || "")}
                      </div>
                    )}
                    <div className={`max-w-[75%] ${isOwn ? "items-end" : ""}`}>
                      {!isOwn && (
                        <p className="text-[11px] font-bold mb-0.5" style={{ color: "var(--color-text-secondary)" }}>{msg.sender?.full_name || "User"}</p>
                      )}
                      <div className={`rounded-2xl px-3 py-2 relative ${msg.is_deleted ? "opacity-50" : ""}`}
                        style={{
                          background: isOwn ? "rgba(232,115,58,0.12)" : "var(--glass-bg)",
                          border: `1px solid ${isOwn ? "rgba(232,115,58,0.2)" : "var(--glass-border-color, rgba(255,255,255,0.12))"}`,
                        }}>
                        {msg.is_deleted ? (
                          <p className="text-[12px] italic" style={{ color: "var(--color-text-muted)" }}>This message was deleted</p>
                        ) : (
                          <>
                            <p className="text-[13px] whitespace-pre-wrap" style={{ color: "var(--color-text)" }}>{msg.content}</p>
                            {msg.attachment_url && !msg.is_deleted && (
                              <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1.5 mt-1.5 text-[11px] font-semibold" style={{ color: "var(--color-accent)" }}>
                                <Paperclip className="w-3 h-3" /> {msg.attachment_name || "Attachment"}
                              </a>
                            )}
                          </>
                        )}
                        {isOwn && !msg.is_deleted && (
                          <button onClick={() => deleteMessage(msg.id)}
                            className="absolute -top-2 -right-2 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border-color)" }}>
                            <Trash2 className="w-3 h-3" style={{ color: "#DC2626" }} />
                          </button>
                        )}
                      </div>
                      <p className={`text-[9px] mt-0.5 ${isOwn ? "text-right" : ""}`} style={{ color: "var(--color-text-muted)" }}>{formatTime(msg.created_at)}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {canPost ? (
          <div className="mt-2">
            {pendingAttachment && (
              <div className="glass-light rounded-xl px-3 py-2 mb-2 flex items-center gap-2" style={{ boxShadow: "inset 0 1px 0 var(--glass-highlight)" }}>
                <Paperclip className="w-3.5 h-3.5" style={{ color: "var(--color-accent)" }} />
                <span className="text-[12px] flex-1 truncate" style={{ color: "var(--color-text)" }}>{pendingAttachment.file.name}</span>
                <button onClick={() => setPendingAttachment(null)} className="cursor-pointer"><X className="w-3.5 h-3.5" style={{ color: "var(--color-text-muted)" }} /></button>
              </div>
            )}
            <div className="flex items-center gap-2">
              <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} />
              <button onClick={() => fileInputRef.current?.click()}
                className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer transition-all hover:-translate-y-0.5"
                style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border-color)" }}>
                <Paperclip className="w-4 h-4" style={{ color: "var(--color-text-muted)" }} />
              </button>
              <Input value={msgInput} onChange={e => setMsgInput(e.target.value)} placeholder="Type a message..."
                className="flex-1 rounded-xl"
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} />
              <button onClick={sendMessage}
                className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer btn-liquid-primary">
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-3 text-[12px]" style={{ color: "var(--color-text-muted)" }}>
            <Megaphone className="w-4 h-4 inline mr-1" /> Only admins can post in announcement channels
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-6" style={{ minHeight: "100vh" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0 flex items-center justify-center text-[12px] font-bold text-white"
            style={{ background: org?.logo_url ? "var(--glass-bg)" : hashColor(orgId || ""), border: "1.5px solid var(--glass-border-color)" }}>
            {org?.logo_url ? <img src={storageImageUrl(org.logo_url, "thumbnail")} alt="" className="w-full h-full object-cover" /> : initials(org?.name || "")}
          </div>
          <div>
            <h1 className="text-[20px] font-extrabold" style={{ color: "var(--color-text)" }}>{org?.name || "Workspace"}</h1>
            <p className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>{members.length} members{verifCount > 0 ? ` · ${verifCount} pending` : ""}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="rounded-xl" onClick={copyInviteLink}><Copy className="w-3.5 h-3.5 mr-1" /> Link</Button>
          {isOwnerOrAdmin && (
            <Button size="sm" className="rounded-xl" onClick={() => setShowInvite(true)}><UserPlus className="w-3.5 h-3.5 mr-1" /> Add</Button>
          )}
        </div>
      </div>

      {/* Layout */}
      <div className="flex gap-4" style={{ minHeight: "calc(100vh - 160px)" }}>
        {/* Left nav */}
        <div className="w-[220px] shrink-0 hidden md:flex flex-col gap-1">
          {NAV_ITEMS.map(item => (
            <button key={item.key} type="button" onClick={() => { setSelectedPanel(item.key); if (item.key !== "groups") setActiveChannel(null); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left cursor-pointer transition-all"
              style={{
                background: selectedPanel === item.key ? "rgba(232,115,58,0.08)" : "transparent",
                color: selectedPanel === item.key ? "var(--color-accent)" : "var(--color-text-secondary)",
                fontWeight: selectedPanel === item.key ? 700 : 500,
              }}>
              <item.icon className="w-4 h-4" />
              <span className="text-[13px] flex-1">{item.label}</span>
              {item.count !== undefined && item.count > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: selectedPanel === item.key ? "var(--color-accent)" : "var(--glass-bg)", color: selectedPanel === item.key ? "#fff" : "var(--color-text-muted)" }}>
                  {item.count}
                </span>
              )}
            </button>
          ))}

          {selectedPanel === "groups" && (
            <div className="ml-4 mt-1 space-y-0.5">
              {channels.map(ch => {
                const Icon = CHANNEL_ICONS[ch.channel_type] || Hash;
                return (
                  <button key={ch.id} onClick={() => openChannel(ch)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left cursor-pointer transition-all"
                    style={{
                      background: activeChannel?.id === ch.id ? "rgba(232,115,58,0.12)" : "transparent",
                      color: activeChannel?.id === ch.id ? "var(--color-accent)" : "var(--color-text-secondary)",
                    }}>
                    <Icon className="w-3.5 h-3.5" />
                    <span className="text-[12px] flex-1 truncate">{ch.name}</span>
                    {ch.is_private && <Lock className="w-3 h-3" style={{ color: "var(--color-text-muted)" }} />}
                  </button>
                );
              })}
              {isOwnerOrAdmin && (
                <button onClick={() => setShowCreateGroup(true)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left cursor-pointer transition-all text-[12px]"
                  style={{ color: "var(--color-accent)" }}>
                  <Plus className="w-3.5 h-3.5" /> Create Group
                </button>
              )}
            </div>
          )}
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Mobile nav */}
          <div className="flex md:hidden gap-1 mb-4 overflow-x-auto pb-1 scrollbar-hide">
            {NAV_ITEMS.map(item => (
              <button key={item.key} type="button" onClick={() => { setSelectedPanel(item.key); if (item.key !== "groups") setActiveChannel(null); }}
                className="px-3 py-2 rounded-xl text-[12px] font-bold whitespace-nowrap cursor-pointer shrink-0"
                style={{
                  background: selectedPanel === item.key ? "var(--color-accent)" : "var(--glass-bg)",
                  color: selectedPanel === item.key ? "#fff" : "var(--color-text-secondary)",
                  border: selectedPanel === item.key ? "none" : "1px solid var(--glass-border-color)",
                }}>
                {item.label}{item.key === "verifications" && verifCount > 0 ? ` (${verifCount})` : ""}
              </button>
            ))}
          </div>

          {/* ═══ GROUPS PANEL ═══ */}
          {selectedPanel === "groups" && (
            activeChannel ? renderChatView() : (
              <div className="space-y-3">
                <div className="md:hidden space-y-1">
                  {channels.map(ch => {
                    const Icon = CHANNEL_ICONS[ch.channel_type] || Hash;
                    return (
                      <button key={ch.id} onClick={() => openChannel(ch)}
                        className="w-full glass-light rounded-2xl p-3 flex items-center gap-3 cursor-pointer transition-all hover:-translate-y-0.5"
                        style={{ boxShadow: "inset 0 1px 0 var(--glass-highlight)" }}>
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(232,115,58,0.1)" }}>
                          <Icon className="w-4 h-4" style={{ color: "var(--color-accent)" }} />
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <p className="text-[13px] font-semibold truncate" style={{ color: "var(--color-text)" }}>{ch.name}</p>
                          {ch.description && <p className="text-[11px] truncate" style={{ color: "var(--color-text-muted)" }}>{ch.description}</p>}
                        </div>
                        {ch.is_private && <Lock className="w-3.5 h-3.5" style={{ color: "var(--color-text-muted)" }} />}
                        <ChevronRight className="w-4 h-4" style={{ color: "var(--color-text-muted)" }} />
                      </button>
                    );
                  })}
                  {isOwnerOrAdmin && (
                    <button onClick={() => setShowCreateGroup(true)}
                      className="w-full glass-light rounded-2xl p-3 flex items-center gap-3 cursor-pointer"
                      style={{ boxShadow: "inset 0 1px 0 var(--glass-highlight)" }}>
                      <Plus className="w-4 h-4" style={{ color: "var(--color-accent)" }} />
                      <span className="text-[13px] font-semibold" style={{ color: "var(--color-accent)" }}>Create Group</span>
                    </button>
                  )}
                </div>
                <div className="hidden md:block">
                  {channels.length === 0 ? (
                    <div className="glass-light rounded-2xl p-8 text-center" style={{ boxShadow: "inset 0 1px 0 var(--glass-highlight)" }}>
                      <Hash className="w-10 h-10 mx-auto mb-2" style={{ color: "var(--color-text-muted)" }} />
                      <p className="text-[14px] font-semibold" style={{ color: "var(--color-text)" }}>No groups yet</p>
                      <p className="text-[12px] mb-3" style={{ color: "var(--color-text-muted)" }}>Create a group to start collaborating</p>
                      {isOwnerOrAdmin && (
                        <button onClick={() => setShowCreateGroup(true)} className="btn-liquid-primary px-4 py-2 rounded-xl text-[13px] font-bold cursor-pointer">
                          <Plus className="w-3.5 h-3.5 inline mr-1" /> Create Group
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="glass-light rounded-2xl p-6 text-center" style={{ boxShadow: "inset 0 1px 0 var(--glass-highlight)" }}>
                      <MessageCircle className="w-10 h-10 mx-auto mb-2" style={{ color: "var(--color-text-muted)" }} />
                      <p className="text-[14px] font-semibold" style={{ color: "var(--color-text)" }}>Select a group</p>
                      <p className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>Choose a group from the sidebar to start chatting</p>
                    </div>
                  )}
                </div>
              </div>
            )
          )}

          {/* ═══ FEED PANEL ═══ */}
          {selectedPanel === "feed" && (
            <div>
              {/* Composer */}
              {user && orgId && (
                <WsComposer
                  userId={user.id}
                  orgId={orgId}
                  orgName={org?.name || "Workspace"}
                  workspaceId={workspaceId}
                  isAdmin={isOwnerOrAdmin}
                  profile={profile}
                  onPosted={fetchWsPosts}
                />
              )}

              {/* Posts */}
              {wsPosts.length === 0 ? (
                <div className="glass-light rounded-2xl p-8 text-center" style={{ boxShadow: "inset 0 1px 0 var(--glass-highlight)" }}>
                  <FileText className="w-10 h-10 mx-auto mb-2" style={{ color: "var(--color-text-muted)" }} />
                  <p className="text-[14px] font-bold" style={{ color: "var(--color-text)" }}>No workspace posts yet</p>
                  <p className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>Share updates, announcements, and news with your team</p>
                </div>
              ) : (
                wsPosts.map(p => (
                  <WsFeedPost
                    key={p.id}
                    post={p}
                    userId={user?.id}
                    orgName={org?.name}
                    members={members}
                    onDelete={handleDeletePost}
                  />
                ))
              )}
            </div>
          )}

          {/* ═══ TEAM PANEL ═══ */}
          {selectedPanel === "team" && (
            <div>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--color-text-muted)" }} />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search members..." className="pl-9 rounded-xl" />
              </div>
              <div className="space-y-2">
                {filteredMembers.map(m => {
                  const roleColor = ROLE_COLORS[m.role] || "#6B7280";
                  return (
                    <div key={m.id} className="glass-light rounded-2xl p-3 flex items-center gap-3"
                      style={{ boxShadow: "inset 0 1px 0 var(--glass-highlight)" }}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[12px] font-bold text-white overflow-hidden shrink-0" style={{ background: roleColor }}>
                        {m.profile?.avatar_url ? <img src={storageImageUrl(m.profile.avatar_url, "avatar")} alt="" className="w-full h-full object-cover" /> : initials(m.profile?.full_name || "")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold truncate" style={{ color: "var(--color-text)" }}>{m.profile?.full_name || "Member"}</p>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${roleColor}1A`, color: roleColor }}>
                            {ROLE_LABELS[m.role] || m.role}
                          </span>
                          {m.department && <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>{m.department}</span>}
                          {m.is_verified && <Shield className="w-3 h-3" style={{ color: "#FFB800" }} />}
                        </div>
                      </div>
                      {isOwnerOrAdmin && m.role !== "owner" && (
                        <button type="button" onClick={() => handleRemoveMember(m.id)} className="p-2 rounded-lg cursor-pointer" style={{ color: "var(--color-text-muted)" }}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
                {filteredMembers.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="w-10 h-10 mx-auto mb-2" style={{ color: "var(--color-text-muted)" }} />
                    <p className="text-[14px] font-bold" style={{ color: "var(--color-text)" }}>No members found</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══ ACCESS PANEL ═══ */}
          {selectedPanel === "access" && (
            <div>
              {isOwnerOrAdmin && (
                <Button size="sm" className="mb-4 rounded-xl" onClick={() => setShowAccess(true)}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Grant Access
                </Button>
              )}
              {accessRules.length === 0 ? (
                <div className="glass-light rounded-2xl p-8 text-center" style={{ boxShadow: "inset 0 1px 0 var(--glass-highlight)" }}>
                  <Lock className="w-10 h-10 mx-auto mb-2" style={{ color: "var(--color-text-muted)" }} />
                  <p className="text-[14px] font-bold" style={{ color: "var(--color-text)" }}>No access rules</p>
                  <p className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>Grant specific permissions to team members</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {accessRules.map(r => (
                    <div key={r.id} className="glass-light rounded-2xl p-3 flex items-center gap-3"
                      style={{ boxShadow: "inset 0 1px 0 var(--glass-highlight)" }}>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-bold text-white overflow-hidden shrink-0" style={{ background: "#64748B" }}>
                        {r.member?.avatar_url ? <img src={storageImageUrl(r.member.avatar_url, "avatar")} alt="" className="w-full h-full object-cover" /> : initials(r.member?.full_name || "")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold truncate" style={{ color: "var(--color-text)" }}>{r.member?.full_name || "Member"}</p>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(232,115,58,0.1)", color: "var(--color-accent)" }}>
                            {ACCESS_TYPES.find(a => a.value === r.access_type)?.label || r.access_type}
                          </span>
                          {r.department_scope && <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>{r.department_scope}</span>}
                          {r.delegation_approved === null && r.delegated_by && (
                            <>
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(234,88,12,0.1)", color: "#EA580C" }}>Pending</span>
                              {isOwnerOrAdmin && (
                                <div className="flex gap-1 ml-1">
                                  <button type="button" onClick={() => handleApproveDelegation(r.id, true)} className="p-1 rounded cursor-pointer" style={{ color: "#059669" }}><CheckCircle className="w-4 h-4" /></button>
                                  <button type="button" onClick={() => handleApproveDelegation(r.id, false)} className="p-1 rounded cursor-pointer" style={{ color: "#DC2626" }}><XCircle className="w-4 h-4" /></button>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                      {isOwnerOrAdmin && (
                        <button type="button" onClick={() => handleRemoveAccess(r.id)} className="p-2 rounded-lg cursor-pointer" style={{ color: "var(--color-text-muted)" }}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══ VERIFICATIONS PANEL ═══ */}
          {selectedPanel === "verifications" && (
            <div className="space-y-4">
              {itemVerifRequests.length > 0 && (
                <div>
                  <p className="text-[13px] font-bold mb-2" style={{ color: "var(--color-text)" }}>
                    <Briefcase className="w-4 h-4 inline mr-1" style={{ color: "#FFB800" }} />
                    Work Item Verifications ({itemVerifRequests.length})
                  </p>
                  <div className="space-y-2">
                    {itemVerifRequests.map(r => {
                      const wi = r.work_item;
                      const itemLabel = wi?.job_title || wi?.title || "Work item";
                      const companyLabel = wi?.company_name || wi?.institution_name_edu || "";
                      const typeLabel = wi?.item_type === "education" ? "Education" : wi?.item_type === "project" ? "Project" : "Experience";
                      return (
                        <div key={r.id} className="glass-light rounded-2xl p-4" style={{ boxShadow: "inset 0 1px 0 var(--glass-highlight)" }}>
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[12px] font-bold text-white overflow-hidden shrink-0"
                              style={{ background: "linear-gradient(135deg, #FFB800, #FF8C00)" }}>
                              {r.requester?.avatar_url ? <img src={storageImageUrl(r.requester.avatar_url, "avatar")} alt="" className="w-full h-full object-cover" /> : initials(r.requester?.full_name || "")}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-bold" style={{ color: "var(--color-text)" }}>{r.requester?.full_name || "User"}</p>
                              <p className="text-[11px] mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
                                Claims: <span className="font-semibold">{itemLabel}</span>{companyLabel ? ` at ${companyLabel}` : ""}
                              </p>
                              <span className="inline-block text-[9px] font-bold px-2 py-0.5 rounded-full mt-1" style={{ background: "rgba(74,144,217,0.10)", color: "#4A90D9" }}>{typeLabel}</span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0 pt-1">
                              <Button size="sm" onClick={() => handleItemVerifAction(r.id, "approved", r.requester_id, r.work_item_id)}
                                className="h-8 text-[11px] rounded-xl" style={{ background: "#059669", border: "none" }}>
                                <CheckCircle className="w-3 h-3 mr-1" /> Verify
                              </Button>
                              <Button variant="destructive" size="sm" onClick={() => handleItemVerifAction(r.id, "rejected", r.requester_id, r.work_item_id)}
                                className="h-8 text-[11px] rounded-xl">
                                <XCircle className="w-3 h-3 mr-1" /> Decline
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {verifRequests.length > 0 && (
                <div>
                  <p className="text-[13px] font-bold mb-2" style={{ color: "var(--color-text)" }}>
                    <Shield className="w-4 h-4 inline mr-1" style={{ color: "#059669" }} />
                    Membership Verifications ({verifRequests.length})
                  </p>
                  <div className="space-y-2">
                    {verifRequests.map(r => (
                      <div key={r.id} className="glass-light rounded-2xl p-4" style={{ boxShadow: "inset 0 1px 0 var(--glass-highlight)" }}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[12px] font-bold text-white overflow-hidden shrink-0" style={{ background: "#F59E0B" }}>
                            {r.requester?.avatar_url ? <img src={storageImageUrl(r.requester.avatar_url, "avatar")} alt="" className="w-full h-full object-cover" /> : initials(r.requester?.full_name || "")}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-bold" style={{ color: "var(--color-text)" }}>{r.requester?.full_name || "User"}</p>
                            <div className="flex items-center gap-2 flex-wrap">
                              {r.title_at_org && <span className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>{r.title_at_org}</span>}
                              {r.member_type && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                  style={{ background: r.member_type === "ex" ? "rgba(220,38,38,0.1)" : "rgba(5,150,105,0.1)", color: r.member_type === "ex" ? "#DC2626" : "#059669" }}>
                                  {r.member_type === "ex" ? "Alumni" : "Current"}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Button size="sm" onClick={() => handleVerifAction(r.id, "approved", r.user_id)}
                              className="h-8 text-[11px] rounded-xl" style={{ background: "#059669", border: "none" }}>
                              <CheckCircle className="w-3 h-3 mr-1" /> Approve
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleVerifAction(r.id, "rejected", r.user_id)}
                              className="h-8 text-[11px] rounded-xl">
                              <XCircle className="w-3 h-3 mr-1" /> Decline
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {verifRequests.length === 0 && itemVerifRequests.length === 0 && (
                <div className="glass-light rounded-2xl p-8 text-center" style={{ boxShadow: "inset 0 1px 0 var(--glass-highlight)" }}>
                  <Shield className="w-10 h-10 mx-auto mb-2" style={{ color: "var(--color-text-muted)" }} />
                  <p className="text-[14px] font-bold" style={{ color: "var(--color-text)" }}>No pending verifications</p>
                  <p className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>Requests from users will appear here</p>
                </div>
              )}
            </div>
          )}

          {/* ═══ INVITES PANEL ═══ */}
          {selectedPanel === "invites" && (
            <div className="space-y-4">
              <div className="glass-light rounded-2xl p-4" style={{ boxShadow: "inset 0 1px 0 var(--glass-highlight)" }}>
                <h3 className="text-[14px] font-bold mb-2" style={{ color: "var(--color-text)" }}>Share Invite Link</h3>
                <p className="text-[12px] mb-3" style={{ color: "var(--color-text-muted)" }}>Share this link with people you want to invite</p>
                <div className="flex gap-2">
                  <Input value={`${window.location.origin}/join-as-institution?ref=${org?.slug || ""}`} readOnly className="flex-1 text-[12px] rounded-xl" />
                  <Button variant="outline" className="rounded-xl" onClick={copyInviteLink}><Copy className="w-4 h-4" /></Button>
                </div>
              </div>
              <div className="glass-light rounded-2xl p-4" style={{ boxShadow: "inset 0 1px 0 var(--glass-highlight)" }}>
                <h3 className="text-[14px] font-bold mb-2" style={{ color: "var(--color-text)" }}>WhatsApp Invite</h3>
                <Button variant="outline" className="rounded-xl" onClick={() => {
                  const msg = `Join ${org?.name} on Tiikme! ${window.location.origin}/join-as-institution?ref=${org?.slug || ""}`;
                  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
                }}>
                  <Send className="w-4 h-4 mr-1" /> Send via WhatsApp
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right info panel (desktop) */}
        <div className="w-[240px] shrink-0 hidden lg:block space-y-4">
          <div className="glass-light rounded-2xl p-4" style={{ boxShadow: "inset 0 1px 0 var(--glass-highlight)" }}>
            <h3 className="text-[13px] font-bold mb-3" style={{ color: "var(--color-text)" }}>Quick Info</h3>
            <div className="space-y-2 text-[12px]">
              {[
                ["Members", members.length],
                ["Pending Verif.", verifCount],
                ["Groups", channels.length],
                ["Access Rules", accessRules.length],
                ["Posts", wsPosts.length],
              ].map(([label, val]) => (
                <div key={label as string} className="flex justify-between">
                  <span style={{ color: "var(--color-text-muted)" }}>{label}</span>
                  <span className="font-bold" style={{ color: "var(--color-text)" }}>{val}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-light rounded-2xl p-4" style={{ boxShadow: "inset 0 1px 0 var(--glass-highlight)" }}>
            <h3 className="text-[13px] font-bold mb-3" style={{ color: "var(--color-text)" }}>Recent Members</h3>
            <div className="space-y-2">
              {members.slice(-5).reverse().map(m => (
                <div key={m.id} className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-bold text-white overflow-hidden shrink-0" style={{ background: ROLE_COLORS[m.role] || "#6B7280" }}>
                    {m.profile?.avatar_url ? <img src={storageImageUrl(m.profile.avatar_url, "avatar")} alt="" className="w-full h-full object-cover" /> : initials(m.profile?.full_name || "")}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold truncate" style={{ color: "var(--color-text)" }}>{m.profile?.full_name || "Member"}</p>
                    <p className="text-[9px]" style={{ color: "var(--color-text-muted)" }}>{ROLE_LABELS[m.role] || m.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ══ MODALS ══ */}

      {/* Create Group Modal */}
      {showCreateGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(13,13,30,0.6)", backdropFilter: "blur(8px)" }} onClick={() => setShowCreateGroup(false)}>
          <div className="w-full max-w-[440px] glass-dark rounded-3xl p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-[18px] font-bold mb-4" style={{ color: "#F0F2F7" }}>Create Group</h2>
            <div className="space-y-3">
              <div>
                <label className="text-[12px] font-bold block mb-1" style={{ color: "#9CA3C0" }}>Group Name</label>
                <Input value={newGroupName} onChange={e => setNewGroupName(e.target.value)} placeholder="e.g. Engineering" className="glass-input-dark rounded-xl" />
              </div>
              <div>
                <label className="text-[12px] font-bold block mb-1" style={{ color: "#9CA3C0" }}>Description (optional)</label>
                <Input value={newGroupDesc} onChange={e => setNewGroupDesc(e.target.value)} placeholder="What's this group about?" className="glass-input-dark rounded-xl" />
              </div>
              <div>
                <label className="text-[12px] font-bold block mb-1" style={{ color: "#9CA3C0" }}>Type</label>
                <div className="flex gap-2">
                  {(["group", "announcement", "project"] as const).map(t => {
                    const Icon = CHANNEL_ICONS[t];
                    return (
                      <button key={t} onClick={() => setNewGroupType(t)}
                        className="flex-1 py-2 rounded-xl text-[12px] font-semibold cursor-pointer flex items-center justify-center gap-1.5 capitalize"
                        style={{
                          background: newGroupType === t ? "rgba(232,115,58,0.2)" : "rgba(255,255,255,0.06)",
                          color: newGroupType === t ? "#F08050" : "#9CA3C0",
                          border: `1px solid ${newGroupType === t ? "rgba(232,115,58,0.3)" : "rgba(255,255,255,0.1)"}`,
                        }}>
                        <Icon className="w-3.5 h-3.5" /> {t}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="private" checked={newGroupPrivate} onChange={e => setNewGroupPrivate(e.target.checked)} className="rounded" />
                <label htmlFor="private" className="text-[12px]" style={{ color: "#9CA3C0" }}>Private group (invite-only)</label>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="ghost" className="flex-1 rounded-xl" onClick={() => setShowCreateGroup(false)}>Cancel</Button>
                <button onClick={createGroup} className="flex-1 btn-liquid-primary rounded-xl py-2.5 text-[13px] font-bold cursor-pointer">Create</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(13,13,30,0.6)", backdropFilter: "blur(8px)" }} onClick={() => setShowInvite(false)}>
          <div className="w-full max-w-[440px] glass-dark rounded-3xl p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-[18px] font-bold mb-4" style={{ color: "#F0F2F7" }}>Add Team Member</h2>
            <div className="space-y-3">
              <div>
                <label className="text-[12px] font-bold block mb-1" style={{ color: "#9CA3C0" }}>Search by name</label>
                <Input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="Enter name to search..." className="glass-input-dark rounded-xl" />
              </div>
              <div>
                <label className="text-[12px] font-bold block mb-1" style={{ color: "#9CA3C0" }}>Role</label>
                <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
                  className="w-full h-10 rounded-xl px-3 text-[13px] outline-none" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#F0F2F7" }}>
                  <option value="admin">Admin</option>
                  <option value="hr_admin">HR Admin</option>
                  <option value="recruiter">Recruiter</option>
                  <option value="verifier">Verifier</option>
                  <option value="team_lead">Team Lead / HOD</option>
                  <option value="member">Member</option>
                </select>
              </div>
              <div>
                <label className="text-[12px] font-bold block mb-1" style={{ color: "#9CA3C0" }}>Department (optional)</label>
                <Input value={inviteDept} onChange={e => setInviteDept(e.target.value)} placeholder="e.g. Engineering" className="glass-input-dark rounded-xl" />
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="ghost" className="flex-1 rounded-xl" onClick={() => setShowInvite(false)}>Cancel</Button>
                <button onClick={handleInvite} className="flex-1 btn-liquid-primary rounded-xl py-2.5 text-[13px] font-bold cursor-pointer">Add Member</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Access Modal */}
      {showAccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(13,13,30,0.6)", backdropFilter: "blur(8px)" }} onClick={() => setShowAccess(false)}>
          <div className="w-full max-w-[440px] glass-dark rounded-3xl p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-[18px] font-bold mb-4" style={{ color: "#F0F2F7" }}>Grant Access</h2>
            <div className="space-y-3">
              <div>
                <label className="text-[12px] font-bold block mb-1" style={{ color: "#9CA3C0" }}>Member</label>
                <select value={accessMemberId} onChange={e => setAccessMemberId(e.target.value)}
                  className="w-full h-10 rounded-xl px-3 text-[13px] outline-none" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#F0F2F7" }}>
                  <option value="">Select member</option>
                  {members.filter(m => m.role !== "owner").map(m => (
                    <option key={m.user_id} value={m.user_id}>{m.profile?.full_name || "Member"}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[12px] font-bold block mb-1" style={{ color: "#9CA3C0" }}>Access type</label>
                <select value={accessType} onChange={e => setAccessType(e.target.value)}
                  className="w-full h-10 rounded-xl px-3 text-[13px] outline-none" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#F0F2F7" }}>
                  {ACCESS_TYPES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[12px] font-bold block mb-1" style={{ color: "#9CA3C0" }}>Department scope (optional)</label>
                <Input value={accessDept} onChange={e => setAccessDept(e.target.value)} placeholder="e.g. Computer Science" className="glass-input-dark rounded-xl" />
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="ghost" className="flex-1 rounded-xl" onClick={() => setShowAccess(false)}>Cancel</Button>
                <button onClick={handleGrantAccess} className="flex-1 btn-liquid-primary rounded-xl py-2.5 text-[13px] font-bold cursor-pointer">Grant</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
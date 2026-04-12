import { useState, useMemo, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Image, FileText, Briefcase, Megaphone, Heart, MessageSquare, Send, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLikes } from "@/hooks/useLikes";
import { useComments } from "@/hooks/useComments";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import { storageImageUrl } from "@/lib/imageTransform";
import MentionText from "@/components/feed/MentionText";
import PostOpportunityModal from "@/components/opportunities/PostOpportunityModal";

interface HomeTabProps {
  org: any;
  posts: any[];
  isAdmin: boolean;
  onPostCreated: (post: any) => void;
}

export default function HomeTab({ org, posts, isAdmin, onPostCreated }: HomeTabProps) {
  const { user, profile: authProfile, initials: userInitials } = useAuth();
  const navigate = useNavigate();
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showOppModal, setShowOppModal] = useState(false);

  // Photo/document upload state
  const photoRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Townhall form state
  const [showTownhall, setShowTownhall] = useState(false);
  const [thTitle, setThTitle] = useState("");
  const [thDate, setThDate] = useState("");
  const [thFormat, setThFormat] = useState("text");
  const [thLink, setThLink] = useState("");
  const [thDesc, setThDesc] = useState("");
  const [thVis, setThVis] = useState("all");

  const postIds = useMemo(() => posts.map(p => p.id), [posts]);
  const postIdsKey = useMemo(() => postIds.join(","), [postIds]);
  const { counts: likeCounts, myLikes, toggle: toggleLike } = useLikes(postIds);
  const {
    all: commentsData, inputs: commentInputs, setInputs: setCommentInputs,
    open: commentsOpen, counts: commentCounts, toggleOpen: toggleComments,
    submit: submitComment, deleteComment, loadCounts: loadCommentCounts,
  } = useComments();

  useEffect(() => { loadCommentCounts(postIds); }, [postIdsKey, loadCommentCounts]);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const valid = files.filter(f => f.type.startsWith("image/") && f.size <= 10 * 1024 * 1024).slice(0, 10);
    setImageFiles(prev => [...prev, ...valid]);
    setImagePreviews(prev => [...prev, ...valid.map(f => URL.createObjectURL(f))]);
    e.target.value = "";
  };

  const handleDocSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) { toast.error("Max 20MB for documents"); return; }
    setDocFile(file);
    e.target.value = "";
  };

  const handlePost = async () => {
    if (!user || (!content.trim() && imageFiles.length === 0 && !docFile)) return;
    setSubmitting(true);
    try {
      let imageUrls: string[] = [];
      let pdfUrl: string | null = null;

      if (imageFiles.length > 0) {
        setUploading(true);
        for (const file of imageFiles) {
          const safeName = file.name.replace(/[^a-z0-9.]/gi, "_");
          const path = `${user.id}/${Date.now()}-${safeName}`;
          const { data: upData, error: upErr } = await supabase.storage.from("post-images").upload(path, file, { upsert: false, contentType: file.type });
          if (upErr) { toast.error("Upload failed"); setSubmitting(false); setUploading(false); return; }
          const { data: urlData } = supabase.storage.from("post-images").getPublicUrl(upData.path);
          if (urlData?.publicUrl) imageUrls.push(urlData.publicUrl);
        }
        setUploading(false);
      }

      if (docFile) {
        setUploading(true);
        const safeName = docFile.name.replace(/[^a-z0-9.]/gi, "_");
        const path = `${user.id}/${Date.now()}-${safeName}`;
        const { data: upData, error: upErr } = await supabase.storage.from("post-images").upload(path, docFile, { upsert: false, contentType: docFile.type });
        if (upErr) { toast.error("Document upload failed"); setSubmitting(false); setUploading(false); return; }
        const { data: urlData } = supabase.storage.from("post-images").getPublicUrl(upData.path);
        pdfUrl = urlData?.publicUrl || null;
        setUploading(false);
      }

      const { data, error } = await supabase.from("posts").insert({
        author_id: user.id, content: content.trim() || (docFile ? `📄 ${docFile.name}` : ""),
        post_type: "post", visibility: "everyone",
        workspace_name: `org:${org.id}`,
        posted_by_org: org.id,
        posted_by_user_id: user.id,
        image_urls: imageUrls,
        pdf_url: pdfUrl,
      } as any).select("*, author:profiles!posts_author_id_fkey(id, full_name, avatar_url, username)").single();
      if (!error && data) {
        onPostCreated(data);
        setContent("");
        setImageFiles([]);
        setImagePreviews([]);
        setDocFile(null);
      }
    } catch (e) { console.warn("[HomeTab] post failed:", e); }
    setSubmitting(false);
  };

  const handleTownhallPost = async () => {
    if (!user || !thTitle.trim()) return;
    setSubmitting(true);
    try {
      const townhallContent = `📢 Townhall: ${thTitle}\n${thDate ? `📅 ${new Date(thDate).toLocaleString()}\n` : ""}${thDesc}${thLink ? `\n🔗 ${thLink}` : ""}`;
      const { data, error } = await supabase.from("posts").insert({
        author_id: user.id, content: townhallContent,
        post_type: "townhall", visibility: thVis === "all" ? "everyone" : "workspace",
        workspace_name: `org:${org.id}`,
        posted_by_org: org.id,
        posted_by_user_id: user.id,
      } as any).select("*, author:profiles!posts_author_id_fkey(id, full_name, avatar_url, username)").single();
      if (!error && data) {
        onPostCreated(data);
        setShowTownhall(false);
        setThTitle(""); setThDate(""); setThFormat("text"); setThLink(""); setThDesc(""); setThVis("all");
        toast.success("Townhall posted!");
      }
    } catch (e) { console.warn("[HomeTab] townhall failed:", e); }
    setSubmitting(false);
  };

  const orgInitials = (org.name || "").slice(0, 2).toUpperCase();

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <div className="flex-1 min-w-0 space-y-4">
        {isAdmin && !showTownhall && (
          <div className="rounded-xl p-4" style={{ background: "#fff", border: "1px solid #F0E8E0" }}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0 overflow-hidden"
                style={{ background: org.logo_url ? "#fff" : "#E8580A", color: "#fff", border: org.logo_url ? "1px solid #F0E8E0" : "none" }}>
                {org.logo_url ? <img src={org.logo_url} alt="" className="w-full h-full object-cover" /> : orgInitials}
              </div>
              <Textarea value={content} onChange={e => setContent(e.target.value)}
                placeholder={`Share an update as ${org.name}...`}
                className="flex-1 min-h-[60px] resize-none border-0 bg-transparent text-[14px] p-0 focus-visible:ring-0"
                style={{ color: "#1A1A1A" }} />
            </div>

            {/* Image previews */}
            {imagePreviews.length > 0 && (
              <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                {imagePreviews.map((p, i) => (
                  <div key={i} className="relative shrink-0 w-16 h-16 rounded-lg overflow-hidden">
                    <img src={p} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => { setImageFiles(prev => prev.filter((_, idx) => idx !== i)); setImagePreviews(prev => prev.filter((_, idx) => idx !== i)); }}
                      className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/50 flex items-center justify-center">
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Document preview */}
            {docFile && (
              <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg" style={{ background: "#FFF3EC", border: "1px solid #F0E8E0" }}>
                <FileText className="w-4 h-4" style={{ color: "#E8580A" }} />
                <span className="text-[13px] font-medium flex-1 truncate" style={{ color: "#1A1A1A" }}>{docFile.name}</span>
                <button type="button" onClick={() => setDocFile(null)} className="cursor-pointer"><X className="w-4 h-4" style={{ color: "#9CA3AF" }} /></button>
              </div>
            )}

            {uploading && (
              <div className="flex items-center gap-2 mt-2 text-[12px]" style={{ color: "#9CA3AF" }}>
                <Loader2 className="w-3 h-3 animate-spin" /> Uploading...
              </div>
            )}

            <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: "1px solid #F0E8E0" }}>
              <div className="flex gap-1">
                <button type="button" className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[12px] font-medium hover:bg-gray-50 cursor-pointer" style={{ color: "#6B6B6B" }}
                  onClick={() => photoRef.current?.click()}>
                  <Image className="w-4 h-4" /> Photo
                </button>
                <button type="button" className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[12px] font-medium hover:bg-gray-50 cursor-pointer" style={{ color: "#6B6B6B" }}
                  onClick={() => docRef.current?.click()}>
                  <FileText className="w-4 h-4" /> Document
                </button>
                <button type="button" className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[12px] font-medium hover:bg-gray-50 cursor-pointer" style={{ color: "#6B6B6B" }}
                  onClick={() => setShowOppModal(true)}>
                  <Briefcase className="w-4 h-4" /> Opportunity
                </button>
                <button type="button" className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[12px] font-medium hover:bg-gray-50 cursor-pointer" style={{ color: "#6B6B6B" }}
                  onClick={() => setShowTownhall(true)}>
                  <Megaphone className="w-4 h-4" /> Townhall
                </button>
              </div>
              <Button size="sm" onClick={handlePost} disabled={(!content.trim() && imageFiles.length === 0 && !docFile) || submitting || uploading}
                style={{ background: "#E8580A", color: "#fff" }}>
                {submitting ? "Posting..." : "Post"}
              </Button>
            </div>

            <input ref={photoRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handlePhotoSelect} />
            <input ref={docRef} type="file" accept=".pdf,.doc,.docx,.ppt,.pptx" className="hidden" onChange={handleDocSelect} />
          </div>
        )}

        {/* Townhall composer */}
        {isAdmin && showTownhall && (
          <div className="rounded-xl p-5 space-y-3" style={{ background: "#fff", border: "1px solid #F0E8E0", borderLeft: "4px solid #E8580A" }}>
            <div className="flex items-center justify-between">
              <h3 className="text-[16px] font-bold" style={{ color: "#1A1A1A" }}>📢 Post a Townhall</h3>
              <button type="button" onClick={() => setShowTownhall(false)} className="cursor-pointer"><X className="w-5 h-5" style={{ color: "#9CA3AF" }} /></button>
            </div>
            <input value={thTitle} onChange={e => setThTitle(e.target.value)} placeholder="Townhall title..."
              className="w-full h-12 rounded-xl px-4 text-[15px] font-semibold outline-none"
              style={{ background: "#FAFAFA", border: "1.5px solid #F0E8E0", color: "#1A1A1A" }} />
            <input type="datetime-local" value={thDate} onChange={e => setThDate(e.target.value)}
              className="w-full h-12 rounded-xl px-4 text-[14px] outline-none"
              style={{ background: "#FAFAFA", border: "1.5px solid #F0E8E0", color: "#1A1A1A" }} />
            <div className="flex gap-2">
              {["text", "video", "meeting"].map(f => (
                <button key={f} type="button" onClick={() => setThFormat(f)}
                  className="px-4 py-2 text-[13px] font-semibold rounded-full capitalize cursor-pointer"
                  style={{ background: thFormat === f ? "#E8580A" : "#F3F4F6", color: thFormat === f ? "#fff" : "#374151" }}>
                  {f}
                </button>
              ))}
            </div>
            {(thFormat === "video" || thFormat === "meeting") && (
              <input value={thLink} onChange={e => setThLink(e.target.value)} placeholder="Paste video or meeting link..."
                className="w-full h-12 rounded-xl px-4 text-[14px] outline-none"
                style={{ background: "#FAFAFA", border: "1.5px solid #F0E8E0", color: "#1A1A1A" }} />
            )}
            <textarea value={thDesc} onChange={e => setThDesc(e.target.value)} placeholder="Description..."
              rows={3} className="w-full rounded-xl p-4 text-[14px] outline-none resize-none"
              style={{ background: "#FAFAFA", border: "1.5px solid #F0E8E0", color: "#1A1A1A" }} />
            <div className="flex gap-2">
              {[{ v: "all", l: "All members" }, { v: "leadership", l: "Leadership only" }].map(o => (
                <button key={o.v} type="button" onClick={() => setThVis(o.v)}
                  className="px-4 py-2 text-[13px] font-semibold rounded-full cursor-pointer"
                  style={{ background: thVis === o.v ? "#E8580A" : "#F3F4F6", color: thVis === o.v ? "#fff" : "#374151" }}>
                  {o.l}
                </button>
              ))}
            </div>
            <Button className="w-full" onClick={handleTownhallPost} disabled={!thTitle.trim() || submitting}
              style={{ height: 52, background: "#E8580A", color: "#fff", borderRadius: 12 }}>
              {submitting ? "Posting..." : "Post Townhall"}
            </Button>
          </div>
        )}

        {posts.length === 0 && (
          <div className="rounded-xl p-12 text-center" style={{ background: "#fff", border: "1px solid #F0E8E0" }}>
            <FileText className="w-10 h-10 mx-auto mb-2" style={{ color: "#9CA3AF" }} />
            <p className="text-[14px] font-semibold" style={{ color: "#1A1A1A" }}>No posts yet</p>
            <p className="text-[12px] mt-1" style={{ color: "#9CA3AF" }}>Updates will appear here</p>
          </div>
        )}

        {posts.map(post => {
          const liked = myLikes[post.id] || false;
          const likeCount = likeCounts[post.id] || 0;
          const commentCount = commentCounts[post.id] || 0;
          const isOpen = commentsOpen.has(post.id);
          const comments = commentsData[post.id] || [];
          const commentText = commentInputs[post.id] || "";
          const isTownhall = post.post_type === "townhall";

          return (
            <div key={post.id} className="rounded-xl overflow-hidden" style={{ background: "#fff", border: "1px solid #F0E8E0", borderLeft: isTownhall ? "4px solid #E8580A" : undefined }}>
              {isTownhall && (
                <div className="px-4 pt-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "#E8580A" }}>📢 TOWNHALL</span>
                </div>
              )}
              <div className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Link to={`/org/${org.slug}`}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 overflow-hidden"
                      style={{ background: org.logo_url ? "#fff" : "#E8580A", color: "#fff", border: org.logo_url ? "1px solid #F0E8E0" : "none" }}>
                      {org.logo_url ? <img src={org.logo_url} alt="" className="w-full h-full object-cover" /> : orgInitials}
                    </div>
                  </Link>
                  <div>
                    <Link to={`/org/${org.slug}`} className="text-[15px] font-bold hover:underline" style={{ color: "#1A1A1A" }}>{org.name}</Link>
                    {post.author?.full_name && (
                      <p className="text-[13px]" style={{ color: "#9CA3AF" }}>
                        via <Link to={`/app/profile/${post.author.id}`} className="hover:underline">{post.author.full_name}</Link> · {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-[14px] whitespace-pre-wrap" style={{ color: "#1A1A1A" }}>
                  <MentionText text={post.content} />
                </div>
                {post.image_urls?.length > 0 && (
                  <div className="mt-3 rounded-xl overflow-hidden">
                    <img src={storageImageUrl(post.image_urls[0], "feed")} alt="" className="w-full max-h-[400px] object-cover" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  </div>
                )}
                {post.pdf_url && (
                  <a href={post.pdf_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 mt-3 rounded-xl p-3" style={{ background: "#FFF3EC", border: "1px solid #F0E8E0" }}>
                    <FileText className="w-5 h-5" style={{ color: "#E8580A" }} />
                    <span className="text-[13px] font-bold" style={{ color: "#1A1A1A" }}>Document · Tap to open ↗</span>
                  </a>
                )}
              </div>

              <div className="flex items-center px-4 py-2" style={{ borderTop: "1px solid #F0E8E0" }}>
                <button type="button" onClick={() => toggleLike(post.id)}
                  className="h-9 px-3 rounded-xl text-[13px] font-semibold flex items-center gap-1.5 cursor-pointer active:scale-95"
                  style={{ color: liked ? "#E8580A" : "#6B6B6B" }}>
                  <Heart className="w-4 h-4" style={{ fill: liked ? "#E8580A" : "none", color: liked ? "#E8580A" : "#6B6B6B" }} />
                  {likeCount > 0 && likeCount}
                </button>
                <button type="button" onClick={() => toggleComments(post.id)}
                  className="h-9 px-3 rounded-xl text-[13px] font-semibold flex items-center gap-1.5 cursor-pointer hover:bg-gray-50"
                  style={{ color: "#6B6B6B" }}>
                  <MessageSquare className="w-4 h-4" /> {commentCount > 0 && commentCount}
                </button>
              </div>

              {isOpen && (
                <div className="px-4 pb-4 pt-2 space-y-2" style={{ borderTop: "1px solid #F0E8E0" }}>
                  {comments.length === 0 && <p className="text-[12px]" style={{ color: "#9CA3AF" }}>No comments yet</p>}
                  {comments.map((c: any) => {
                    const cName = c.author?.full_name || "User";
                    const cInitials = cName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
                    return (
                      <div key={c.id} className="flex items-start gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0 overflow-hidden" style={{ backgroundColor: "#6B7280" }}>
                          {c.author?.avatar_url ? <img src={storageImageUrl(c.author.avatar_url, "avatar")} alt="" className="w-full h-full object-cover" /> : cInitials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Link to={`/app/profile/${c.author?.id || c.user_id}`} className="text-[12px] font-bold hover:underline" style={{ color: "#1A1A1A" }}>{cName}</Link>
                            <span className="text-[10px]" style={{ color: "#9CA3AF" }}>{c.created_at ? formatDistanceToNow(new Date(c.created_at), { addSuffix: true }) : ""}</span>
                          </div>
                          <p className="text-[12px]" style={{ color: "#6B6B6B" }}><MentionText text={c.content} /></p>
                        </div>
                      </div>
                    );
                  })}
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0 overflow-hidden" style={{ background: "#E8580A" }}>
                      {authProfile?.avatar_url ? <img src={storageImageUrl(authProfile.avatar_url, "avatar")} alt="" className="w-full h-full object-cover" /> : userInitials}
                    </div>
                    <input value={commentText}
                      onChange={e => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                      placeholder="Write a comment..."
                      className="flex-1 h-8 rounded-lg px-3 text-[12px] outline-none"
                      style={{ background: "#FAFAFA", border: "1px solid #F0E8E0", color: "#1A1A1A" }}
                      onKeyDown={e => { if (e.key === "Enter" && commentText.trim()) submitComment(post.id); }} />
                    <button type="button" onClick={() => submitComment(post.id)}
                      className="w-7 h-7 rounded-full flex items-center justify-center cursor-pointer active:scale-95"
                      style={{ background: commentText.trim() ? "#E8580A" : "#F3F4F6" }}>
                      <Send className="w-3 h-3" style={{ color: commentText.trim() ? "white" : "#9CA3AF" }} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Right sidebar */}
      <div className="hidden md:block w-[280px] shrink-0 space-y-4">
        {org.description && (
          <div className="rounded-xl p-4" style={{ background: "#fff", border: "1px solid #F0E8E0" }}>
            <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: "#9CA3AF" }}>About</p>
            <p className="text-[13px] leading-relaxed line-clamp-6" style={{ color: "#6B6B6B" }}>{org.description}</p>
          </div>
        )}
        <div className="rounded-xl p-4" style={{ background: "#fff", border: "1px solid #F0E8E0" }}>
          <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: "#9CA3AF" }}>Recent Opportunities</p>
          <p className="text-[13px]" style={{ color: "#9CA3AF" }}>No open roles</p>
        </div>
      </div>

      {/* Opportunity modal */}
      {showOppModal && <PostOpportunityModal open={showOppModal} onClose={() => setShowOppModal(false)} onCreated={() => {}} />}
    </div>
  );
}

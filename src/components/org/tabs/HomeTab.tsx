import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Image, FileText, Briefcase, Megaphone, Heart, MessageSquare, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLikes } from "@/hooks/useLikes";
import { useComments } from "@/hooks/useComments";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { storageImageUrl } from "@/lib/imageTransform";
import MentionText from "@/components/feed/MentionText";

interface HomeTabProps {
  org: any;
  posts: any[];
  isAdmin: boolean;
  onPostCreated: (post: any) => void;
}

export default function HomeTab({ org, posts, isAdmin, onPostCreated }: HomeTabProps) {
  const { user, profile: authProfile, initials: userInitials } = useAuth();
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const postIds = useMemo(() => posts.map(p => p.id), [posts]);
  const postIdsKey = useMemo(() => postIds.join(","), [postIds]);
  const { counts: likeCounts, myLikes, toggle: toggleLike } = useLikes(postIds);
  const {
    all: commentsData, inputs: commentInputs, setInputs: setCommentInputs,
    open: commentsOpen, counts: commentCounts, toggleOpen: toggleComments,
    submit: submitComment, deleteComment, loadCounts: loadCommentCounts,
  } = useComments();

  useEffect(() => { loadCommentCounts(postIds); }, [postIdsKey, loadCommentCounts]);

  const handlePost = async () => {
    if (!user || !content.trim()) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.from("posts").insert({
        author_id: user.id, content: content.trim(),
        post_type: "post", visibility: "everyone",
        workspace_name: `org:${org.id}`,
        posted_by_org: org.id,
        posted_by_user_id: user.id,
      } as any).select("*, author:profiles!posts_author_id_fkey(id, full_name, avatar_url, username)").single();
      if (!error && data) { onPostCreated(data); setContent(""); }
    } catch (e) { console.warn("[HomeTab] post failed:", e); }
    setSubmitting(false);
  };

  const initials = (org.name || "").slice(0, 2).toUpperCase();

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <div className="flex-1 min-w-0 space-y-4">
        {isAdmin && (
          <div className="rounded-xl p-4" style={{ background: "#fff", border: "1px solid #F0E8E0" }}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0 overflow-hidden"
                style={{ background: org.logo_url ? "#fff" : "#E8580A", color: "#fff", border: org.logo_url ? "1px solid #F0E8E0" : "none" }}>
                {org.logo_url ? <img src={org.logo_url} alt="" className="w-full h-full object-cover" /> : initials}
              </div>
              <Textarea value={content} onChange={e => setContent(e.target.value)}
                placeholder={`Share an update as ${org.name}...`}
                className="flex-1 min-h-[60px] resize-none border-0 bg-transparent text-[14px] p-0 focus-visible:ring-0"
                style={{ color: "#1A1A1A" }} />
            </div>
            <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: "1px solid #F0E8E0" }}>
              <div className="flex gap-1">
                {[{ icon: Image, label: "Photo" }, { icon: FileText, label: "Document" }, { icon: Briefcase, label: "Opportunity" }, { icon: Megaphone, label: "Townhall" }].map(({ icon: Icon, label }) => (
                  <button key={label} type="button" className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[12px] font-medium hover:bg-gray-50" style={{ color: "#6B6B6B" }}
                    onClick={() => toast.info("This feature is coming soon. Stay Tiiked!")}>
                    <Icon className="w-4 h-4" /> {label}
                  </button>
                ))}
              </div>
              <Button size="sm" onClick={handlePost} disabled={!content.trim() || submitting}
                style={{ background: "#E8580A", color: "#fff" }}>
                {submitting ? "Posting..." : "Post"}
              </Button>
            </div>
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

          return (
            <div key={post.id} className="rounded-xl overflow-hidden" style={{ background: "#fff", border: "1px solid #F0E8E0" }}>
              <div className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Link to={`/org/${org.slug}`}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 overflow-hidden"
                      style={{ background: org.logo_url ? "#fff" : "#E8580A", color: "#fff", border: org.logo_url ? "1px solid #F0E8E0" : "none" }}>
                      {org.logo_url ? <img src={org.logo_url} alt="" className="w-full h-full object-cover" /> : initials}
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
              </div>

              {/* Engagement bar */}
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

              {/* Comments section */}
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
    </div>
  );
}

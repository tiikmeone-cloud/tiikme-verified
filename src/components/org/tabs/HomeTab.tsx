import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Image, FileText, Briefcase, Megaphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface HomeTabProps {
  org: any;
  posts: any[];
  isAdmin: boolean;
  onPostCreated: (post: any) => void;
}

export default function HomeTab({ org, posts, isAdmin, onPostCreated }: HomeTabProps) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handlePost = async () => {
    if (!user || !content.trim()) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.from("posts").insert({
        author_id: user.id, content: content.trim(),
        post_type: "post", visibility: "everyone",
        workspace_name: `org:${org.id}`,
      }).select("*, author:profiles!posts_author_id_fkey(id, full_name, avatar_url, username)").single();
      if (!error && data) { onPostCreated(data); setContent(""); }
    } catch (e) { console.warn("[HomeTab] post failed:", e); }
    setSubmitting(false);
  };

  const initials = (org.name || "").slice(0, 2).toUpperCase();

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Main feed */}
      <div className="flex-1 min-w-0 space-y-4">
        {isAdmin && (
          <div className="rounded-xl p-4" style={{ background: "#fff", border: "1px solid #F0E8E0" }}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0"
                style={{ background: "#E8580A", color: "#fff" }}>{initials}</div>
              <Textarea value={content} onChange={e => setContent(e.target.value)}
                placeholder={`Share an update, post a job...`}
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

        {posts.map(post => (
          <div key={post.id} className="rounded-xl p-4" style={{ background: "#fff", border: "1px solid #F0E8E0" }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 overflow-hidden"
                style={{ background: org.logo_url ? "#fff" : "#E8580A", color: "#fff" }}>
                {org.logo_url ? <img src={org.logo_url} alt="" className="w-full h-full object-cover" /> : initials}
              </div>
              <div>
                <p className="text-[15px] font-bold" style={{ color: "#1A1A1A" }}>{org.name}</p>
                {post.author?.full_name && (
                  <p className="text-[13px]" style={{ color: "#9CA3AF" }}>
                    via {post.author.full_name} · {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                  </p>
                )}
              </div>
            </div>
            <p className="text-[14px] whitespace-pre-wrap" style={{ color: "#1A1A1A" }}>{post.content}</p>
          </div>
        ))}
      </div>

      {/* Right sidebar — desktop only */}
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
import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import CommentPanel from "@/components/comments/CommentPanel";
import AvatarSquare from "@/components/ui/AvatarSquare";
import MentionText from "@/components/feed/MentionText";
import { safeDisplayName } from "@/utils/displayProfile";
import { PageSEO } from "@/hooks/usePageSEO";

function timeAgo(d?: string | null): string {
  if (!d) return "";
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60); if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h`;
  const dy = Math.floor(h / 24); if (dy < 7) return `${dy}d`;
  return new Date(d).toLocaleDateString();
}

export default function CirclePostDetail() {
  const { circleSlug, postId } = useParams<{ circleSlug: string; postId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState<any>(null);
  const [circle, setCircle] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!postId || !circleSlug) return;
    (async () => {
      setLoading(true);
      const [{ data: p }, { data: c }] = await Promise.all([
        supabase.from("circle_posts")
          .select("*, author:profiles!circle_posts_author_id_fkey(id, full_name, avatar_url, role), posted_org:organizations!circle_posts_posted_as_org_id_fkey(id, name, logo_url, slug)")
          .eq("id", postId)
          .maybeSingle(),
        supabase.from("circles").select("id, name, slug").eq("slug", circleSlug).maybeSingle(),
      ]);
      setPost(p);
      setCircle(c);
      setLoading(false);
    })();
  }, [postId, circleSlug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <Loader2 className="animate-spin" style={{ width: 24, height: 24, color: "var(--brand)" }} />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: "var(--bg)" }}>
        <p style={{ color: "var(--text-3)", fontSize: 14 }}>Post not found.</p>
        <button type="button" onClick={() => navigate(`/app/circles/${circleSlug || ""}`)}
          className="cursor-pointer" style={{ color: "var(--brand)", fontSize: 13, fontWeight: 600, background: "none", border: "none" }}>
          Back to circle
        </button>
      </div>
    );
  }

  const author = post.author;
  const body = post.body || post.content || "";

  return (
    <>
      <PageSEO
        title={`${safeDisplayName(author, "Tiikme member")} in ${circle?.name || circleSlug} · Tiikme`}
        description={body.slice(0, 160)}
        canonical={`/app/circles/${circleSlug}/${postId}`}
      />
      <div className="min-h-screen" style={{ background: "var(--bg)" }}>
        {/* Top nav */}
        <div className="sticky top-0 z-10 flex items-center gap-3" style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)", padding: "12px 16px" }}>
          <button type="button" onClick={() => navigate(-1)}
            className="flex items-center gap-1 cursor-pointer"
            style={{ background: "none", border: "none", color: "var(--text-2)", fontSize: 13, fontWeight: 600 }}>
            <ArrowLeft style={{ width: 16, height: 16 }} />
            Back
          </button>
          {circle && (
            <Link to={`/app/circles/${circle.slug}`} style={{ fontSize: 13, color: "var(--brand)", fontWeight: 700 }}>
              {circle.name}
            </Link>
          )}
        </div>

        <div className="mx-auto" style={{ maxWidth: 680, padding: "16px 16px 80px" }}>
          {/* Post body */}
          <article style={{ background: "#fff", borderRadius: 16, border: "1px solid rgba(0,0,0,0.06)", padding: 20, marginBottom: 12 }}>
            <div className="flex items-center gap-2" style={{ marginBottom: 12 }}>
              <AvatarSquare src={author?.avatar_url} name={safeDisplayName(author)} size={36} />
              <div>
                <Link to={`/app/profile/${author?.id}`} style={{ fontSize: 14, fontWeight: 700, color: "#1A1A2E" }}>
                  {safeDisplayName(author, "Tiikme member")}
                </Link>
                <p style={{ fontSize: 11, color: "#9CA3C0", marginTop: 1 }}>{timeAgo(post.created_at)}</p>
              </div>
            </div>
            {post.title && (
              <h1 style={{ fontSize: 17, fontWeight: 700, color: "#1A1A2E", marginBottom: 8 }}>{post.title}</h1>
            )}
            <div style={{ fontSize: 14, color: "#1A1A2E", lineHeight: "22px", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              <MentionText text={body} />
            </div>
          </article>

          {/* Comments — always expanded on detail page */}
          <CommentPanel
            postId={post.id}
            table="circle_post_comments"
            postAuthorId={post.author_id}
            postUrlPrefix={`/app/circles/${circleSlug}`}
            treeMode
          />
        </div>
      </div>
    </>
  );
}

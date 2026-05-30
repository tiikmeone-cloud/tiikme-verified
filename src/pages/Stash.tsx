import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Bookmark, BookmarkX, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import AvatarSquare from "@/components/ui/AvatarSquare";
import MentionText from "@/components/feed/MentionText";

const getTimeAgo = (d: Date) => {
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
};

interface StashedPost {
  bookmark_id: string;
  bookmarked_at: string;
  id: string;
  content: string;
  image_urls: string[] | null;
  created_at: string;
  author_id: string;
  author: { full_name: string | null; username: string | null; avatar_url: string | null; role: string | null } | null;
}

function SkeletonCard() {
  return (
    <div className="glass-card" style={{ padding: 16, borderRadius: 16, marginBottom: 12 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: "var(--surface-2)", flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ height: 13, width: "40%", background: "var(--surface-2)", borderRadius: 6, marginBottom: 6 }} />
          <div style={{ height: 11, width: "25%", background: "var(--surface-2)", borderRadius: 6 }} />
        </div>
      </div>
      <div style={{ marginTop: 10 }}>
        <div style={{ height: 13, background: "var(--surface-2)", borderRadius: 6, marginBottom: 5 }} />
        <div style={{ height: 13, width: "80%", background: "var(--surface-2)", borderRadius: 6 }} />
      </div>
    </div>
  );
}

export default function Stash() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<StashedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await (supabase
      .from("post_bookmarks" as any)
      .select(`
        id,
        post_id,
        created_at,
        post:posts!post_bookmarks_post_id_fkey(
          id, content, image_urls, created_at, author_id,
          author:profiles!posts_author_id_fkey(full_name, username, avatar_url, role)
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50) as any);

    if (error) { toast.error("Couldn't load stash"); setLoading(false); return; }
    const mapped: StashedPost[] = (data || [])
      .filter((r: any) => r.post)
      .map((r: any) => ({
        bookmark_id: r.id,
        bookmarked_at: r.created_at,
        ...r.post,
        author: r.post.author,
      }));
    setPosts(mapped);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const removeBookmark = async (bookmarkId: string, postId: string) => {
    setRemoving(prev => new Set(prev).add(postId));
    const { error } = await (supabase.from("post_bookmarks" as any).delete().eq("id", bookmarkId) as any);
    if (error) { toast.error("Couldn't remove"); setRemoving(prev => { const n = new Set(prev); n.delete(postId); return n; }); return; }
    setPosts(prev => prev.filter(p => p.id !== postId));
    toast.success("Removed from Stash");
  };

  return (
    <main className="mx-auto max-w-2xl px-4 pt-4 pb-24 md:pb-12">
      {/* Header */}
      <div className="flex items-center gap-3" style={{ marginBottom: 20 }}>
        <Link to="/app/feed" className="md:hidden flex items-center justify-center" style={{ width: 36, height: 36, borderRadius: 10, background: "var(--surface-2)" }}>
          <ArrowLeft style={{ width: 16, height: 16, color: "var(--text-1)" }} />
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,90,31,0.10)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Bookmark style={{ width: 18, height: 18, color: "#FF5A1F" }} />
          </div>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-1)", fontFamily: "'Bricolage Grotesque', sans-serif" }}>Stash</h1>
            <p style={{ fontSize: 12, color: "var(--text-3)" }}>Your saved posts</p>
          </div>
        </div>
        {posts.length > 0 && (
          <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--text-3)", background: "var(--surface-2)", padding: "3px 10px", borderRadius: 999 }}>
            {posts.length} saved
          </span>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <>{[1, 2, 3].map(i => <SkeletonCard key={i} />)}</>
      ) : posts.length === 0 ? (
        <div className="glass-card" style={{ padding: 40, textAlign: "center", borderRadius: 20 }}>
          <Bookmark style={{ width: 40, height: 40, color: "var(--text-3)", margin: "0 auto 12px" }} />
          <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text-1)" }}>Nothing stashed yet</p>
          <p style={{ fontSize: 13, color: "var(--text-3)", marginTop: 4 }}>Tap the bookmark icon on any post to save it here.</p>
          <Link to="/app/feed" style={{ display: "inline-block", marginTop: 16, padding: "8px 20px", borderRadius: 999, background: "#FF5A1F", color: "#fff", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
            Browse Feed
          </Link>
        </div>
      ) : (
        <div>
          {posts.map(post => {
            const name = post.author?.full_name || post.author?.username || "User";
            const initials = name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase() || "U";
            const isRemoving = removing.has(post.id);
            return (
              <article
                key={post.id}
                className="glass-card"
                style={{
                  padding: 16, borderRadius: 16, marginBottom: 12,
                  opacity: isRemoving ? 0.4 : 1,
                  transition: "opacity 200ms",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <Link to={`/app/profile/${post.author_id}`}>
                    <AvatarSquare
                      src={post.author?.avatar_url || null}
                      initials={initials}
                      size={38}
                      radius={10}
                    />
                  </Link>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Link to={`/app/profile/${post.author_id}`} style={{ textDecoration: "none" }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>{name}</p>
                    </Link>
                    <p style={{ fontSize: 11, color: "var(--text-3)" }}>
                      {post.author?.role || ""}{post.author?.role ? " · " : ""}saved {getTimeAgo(new Date(post.bookmarked_at))} ago
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeBookmark(post.bookmark_id, post.id)}
                    disabled={isRemoving}
                    className="cursor-pointer"
                    style={{ width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,90,31,0.08)", border: "none", flexShrink: 0 }}
                    title="Remove from Stash"
                  >
                    <BookmarkX style={{ width: 14, height: 14, color: "#FF5A1F" }} />
                  </button>
                </div>

                <Link to={`/app/post/${post.id}`} style={{ textDecoration: "none" }}>
                  <div style={{ marginTop: 10 }}>
                    {post.content && (
                      <p style={{ fontSize: 13, color: "var(--text-1)", lineHeight: "20px", display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        <MentionText text={post.content} />
                      </p>
                    )}
                    {post.image_urls && post.image_urls.length > 0 && (
                      <div style={{ marginTop: 8, borderRadius: 12, overflow: "hidden", maxHeight: 200 }}>
                        <img
                          src={post.image_urls[0]}
                          alt=""
                          style={{ width: "100%", height: 200, objectFit: "cover" }}
                          loading="lazy"
                        />
                        {post.image_urls.length > 1 && (
                          <span style={{ fontSize: 11, color: "var(--text-3)", marginTop: 4, display: "block" }}>
                            +{post.image_urls.length - 1} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}

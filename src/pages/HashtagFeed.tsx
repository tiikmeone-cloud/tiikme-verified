import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageSEO } from "@/hooks/usePageSEO";
import AvatarSquare from "@/components/ui/AvatarSquare";
import MentionText from "@/components/feed/MentionText";
import SkeletonCard from "@/components/SkeletonCard";

const BASE_URL = "https://tiikme.com";

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return `${Math.max(1, Math.floor(diff / 60000))}m`;
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default function HashtagFeed() {
  const { tag = "" } = useParams<{ tag: string }>();
  const normalTag = tag.toLowerCase();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!normalTag) return;
    setLoading(true);
    supabase
      .from("posts")
      .select(`id, content, created_at, image_urls, reactions, comment_count, repost_count,
        author:profiles!posts_author_id_fkey(id, full_name, username, avatar_url, is_verified, designation, institution_name)`)
      .contains("hashtags", [normalTag])
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => { setPosts(data || []); setLoading(false); });
  }, [normalTag]);

  const reactionTotal = (r: any) => (r?.useful || 0) + (r?.inspiring || 0) + (r?.insightful || 0);

  return (
    <main className="max-w-[680px] mx-auto px-4 py-6">
      <PageSEO
        title={`#${tag} posts on Tiikme`}
        description={`Explore posts tagged #${tag} on Tiikme — India's verified professional network.`}
        canonical={`${BASE_URL}/tag/${normalTag}`}
        ogType="website"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: `#${tag} on Tiikme`,
          description: `Posts tagged #${tag} on Tiikme`,
          url: `${BASE_URL}/tag/${normalTag}`,
        }}
      />

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold"
            style={{ background: "rgba(232,115,58,0.10)", color: "#E8733A" }}>#</div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "#1A1A2E" }}>#{tag}</h1>
            {!loading && (
              <p className="text-sm" style={{ color: "#9CA3AF" }}>
                {posts.length} post{posts.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Posts */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">#</p>
          <p className="text-lg font-semibold" style={{ color: "#1A1A2E" }}>No posts yet for #{tag}</p>
          <p className="text-sm mt-1" style={{ color: "#9CA3AF" }}>Be the first to post with this hashtag.</p>
          <Link to="/post/create"
            className="inline-block mt-4 px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: "#E8733A" }}>
            Create Post
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map(post => {
            const author = post.author;
            const name = author?.full_name || author?.username || "User";
            return (
              <article key={post.id}
                className="bg-white rounded-2xl p-4"
                style={{ border: "1px solid #E8E8E8", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                {/* Author row */}
                <div className="flex items-start gap-3 mb-3">
                  <Link to={`/app/profile/${author?.id}`}>
                    <AvatarSquare src={author?.avatar_url} name={name} size={40} />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/app/profile/${author?.id}`}
                      className="font-semibold text-sm hover:underline"
                      style={{ color: "#1A1A2E" }}>{name}</Link>
                    {(author?.designation || author?.institution_name) && (
                      <p className="text-xs truncate" style={{ color: "#9CA3AF" }}>
                        {[author.designation, author.institution_name].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                  <span className="text-xs shrink-0" style={{ color: "#9CA3AF" }}>{timeAgo(post.created_at)}</span>
                </div>

                {/* Content */}
                <Link to={`/post/${post.id}`} className="block">
                  <p className="text-sm leading-relaxed" style={{ color: "#1A1A2E" }}>
                    <MentionText text={post.content} />
                  </p>
                  {(post.image_urls || []).length > 0 && (
                    <img src={post.image_urls[0]} alt="" loading="lazy"
                      className="w-full mt-3 rounded-xl object-cover"
                      style={{ maxHeight: 320 }}
                      onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  )}
                </Link>

                {/* Stats */}
                <div className="flex items-center gap-4 mt-3 pt-3" style={{ borderTop: "1px solid #F0F0F0" }}>
                  <span className="text-xs" style={{ color: "#9CA3AF" }}>
                    <span className="num font-medium" style={{ color: "#6B6B8A" }}>{reactionTotal(post.reactions)}</span> likes
                  </span>
                  <span className="text-xs" style={{ color: "#9CA3AF" }}>
                    <span className="num font-medium" style={{ color: "#6B6B8A" }}>{post.comment_count || 0}</span> comments
                  </span>
                  <Link to={`/post/${post.id}`} className="ml-auto text-xs font-medium hover:underline" style={{ color: "#E8733A" }}>
                    View post →
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}

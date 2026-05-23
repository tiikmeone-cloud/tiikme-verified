import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Grid2X2, List, MessageCircle, Repeat2, Heart } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { PostPreviewCard } from "@/components/profile/ProfileSections";
import { fixStorageUrl } from "@/components/ui/AvatarSquare";
import MentionText from "@/components/feed/MentionText";
import { PageSEO } from "@/hooks/usePageSEO";

type ViewMode = "grid" | "list";

const PAGE_SIZE = 24;
const POST_SELECT = "id, author_id, content, type, image_urls, comment_count, repost_count, reactions, is_edited, repost_of, created_at, updated_at, post_reactions(count), post_comments(count)";

const formatCount = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n || 0);
};

const getLikeCount = (post: any) => {
  if (Array.isArray(post.post_reactions) && post.post_reactions.length > 0) return post.post_reactions[0]?.count || 0;
  const r = post.reactions;
  if (!r || typeof r !== "object") return 0;
  return (r.useful || 0) + (r.inspiring || 0) + (r.insightful || 0) + (r.like || 0);
};

const getCommentCount = (post: any) => {
  if (Array.isArray(post.post_comments) && post.post_comments.length > 0) return post.post_comments[0]?.count || 0;
  return post.comment_count || 0;
};

const FullPostCard = ({ post }: { post: any }) => {
  const firstImage = post.image_urls?.[0] ? fixStorageUrl(post.image_urls[0]) : null;

  return (
    <Link to={`/app/post/${post.id}`} className="block rounded-xl border border-border bg-card p-4 transition hover:border-primary/40">
      <div className="text-sm leading-6 text-card-foreground">
        <MentionText text={post.content || ""} />
      </div>
      {firstImage && <img src={firstImage} alt={post.content ? post.content.slice(0, 80) : "Post media"} loading="lazy" className="mt-3 max-h-[360px] w-full rounded-lg object-cover" />}
      <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" /><span className="num">{formatCount(getLikeCount(post))}</span></span>
        <span className="flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" /><span className="num">{formatCount(getCommentCount(post))}</span></span>
        <span className="flex items-center gap-1"><Repeat2 className="h-3.5 w-3.5" /><span className="num">{formatCount(post.repost_count || 0)}</span></span>
      </div>
    </Link>
  );
};

const ProfilePosts = () => {
  const { username = "" } = useParams<{ username: string }>();
  const [view, setView] = useState<ViewMode>(() => (localStorage.getItem("profile-posts-view") === "list" ? "list" : "grid"));
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    localStorage.setItem("profile-posts-view", view);
  }, [view]);

  const cleanUsername = username.replace(/^@/, "");
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanUsername);

  const { data, isLoading } = useQuery({
    queryKey: ["profile-posts-page", cleanUsername],
    queryFn: async () => {
      const query = isUUID
        ? supabase.from("profiles").select("id, full_name, username").eq("id", cleanUsername).maybeSingle()
        : supabase.from("profiles").select("id, full_name, username").eq("username", cleanUsername).maybeSingle();
      const { data: profile, error: profileError } = await query;
      if (profileError) throw profileError;
      if (!profile) return { profile: null, posts: [], total: 0 };

      const { data: posts, error, count } = await supabase
        .from("posts")
        .select(POST_SELECT, { count: "exact" })
        .eq("author_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return { profile, posts: posts || [], total: count || 0 };
    },
    refetchInterval: 30_000,
  });

  const posts = data?.posts || [];
  const visiblePosts = useMemo(() => posts.slice(0, visibleCount), [posts, visibleCount]);
  const total = data?.total || 0;
  const displayName = data?.profile?.full_name || cleanUsername;
  const hasMore = visibleCount < posts.length;

  if (isLoading) return <div className="mx-auto max-w-6xl px-4 py-8"><div className="h-40 animate-pulse rounded-xl bg-muted" /></div>;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 pb-24 pt-6 md:px-6">
      <PageSEO
        title={`${displayName} — Posts | Tiikme`}
        description={`All posts by ${displayName} on Tiikme. Verified professional insights, updates, and industry knowledge.`}
        canonical={`https://tiikme.com/${cleanUsername}/posts`}
        ogType="profile"
      />
      <header className="flex items-center justify-between gap-4">
        <div>
          <Link to={`/${cleanUsername}`} className="text-sm text-muted-foreground hover:text-foreground">← {displayName}</Link>
          <h1 className="mt-1 text-2xl font-semibold text-foreground">Posts <span className="num text-muted-foreground">{total}</span></h1>
        </div>
        <div className="flex rounded-lg border border-border bg-card p-1">
          <button type="button" onClick={() => setView("grid")} aria-label="Grid view" className="flex h-9 w-9 items-center justify-center rounded-md transition" style={{ background: view === "grid" ? "var(--brand-dim)" : "transparent", color: view === "grid" ? "var(--brand)" : "var(--text-2)" }}>
            <Grid2X2 className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => setView("list")} aria-label="List view" className="flex h-9 w-9 items-center justify-center rounded-md transition" style={{ background: view === "list" ? "var(--brand-dim)" : "transparent", color: view === "list" ? "var(--brand)" : "var(--text-2)" }}>
            <List className="h-4 w-4" />
          </button>
        </div>
      </header>

      {posts.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">No posts yet</div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {visiblePosts.map((p: any) => <PostPreviewCard key={p.id} post={p} />)}
        </div>
      ) : (
        <div className="max-w-2xl space-y-4">
          {visiblePosts.map((p: any) => <FullPostCard key={p.id} post={p} />)}
        </div>
      )}

      {hasMore && <Button type="button" variant="outline" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>Load more</Button>}
    </div>
  );
};

export default ProfilePosts;

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const POSTS_PER_PAGE = 20;

interface FeedPost {
  id: string;
  content: string;
  type: string | null;
  created_at: string | null;
  reactions: any;
  comment_count: number | null;
  hashtags: string[] | null;
  pdf_url: string | null;
  image_urls: string[] | null;
  visibility: string | null;
  author_id: string | null;
  posted_by_org: string | null;
  posted_by_user_id: string | null;
  repost_count: number | null;
  author?: {
    id: string;
    username: string;
    full_name: string | null;
    role: string | null;
    avatar_url: string | null;
    institution_name: string | null;
    activity_score: number | null;
  };
  org?: {
    id: string;
    name: string;
    logo_url: string | null;
    type: string;
    slug: string;
  } | null;
  poster_profile?: {
    id: string;
    full_name: string | null;
  } | null;
  _score?: number;
}

const FEED_SELECT = `*, author:profiles!posts_author_id_fkey(id, username, full_name, role, avatar_url, institution_name, activity_score), org:organizations!posts_posted_by_org_fkey(id, name, logo_url, type, slug), poster_profile:profiles!posts_posted_by_user_id_fkey(id, full_name)`;

function getRecencyWeight(createdAt: string | null): number {
  if (!createdAt) return 0.1;
  const hoursAgo = (Date.now() - new Date(createdAt).getTime()) / 3600000;
  if (hoursAgo < 0.5) return 1.5;
  if (hoursAgo < 2) return 1.2;
  if (hoursAgo < 6) return 1.0;
  if (hoursAgo < 24) return 0.7;
  if (hoursAgo < 72) return 0.4;
  return 0.1;
}

function getEngagementWeight(reactions: any, commentCount: number | null): number {
  const total =
    (reactions?.insightful || 0) +
    (reactions?.useful || 0) +
    (reactions?.inspiring || 0) +
    (commentCount || 0);
  if (total > 50) return 1.5;
  if (total > 20) return 1.0;
  if (total > 5) return 0.7;
  if (total > 0) return 0.3;
  return 0;
}

function scorePost(
  post: FeedPost,
  userRole: string | null,
  userInstitution: string | null,
  strandIds: Set<string>,
  seenIds: Set<string>
): number {
  let score = 0;
  const author = post.author;
  if (strandIds.has(post.author_id || "")) score += 2.0;
  if (author?.institution_name && author.institution_name === userInstitution) score += 1.5;
  if (author?.role === userRole) score += 2.0;
  else if (author?.role) score += 0.5;
  score += getRecencyWeight(post.created_at);
  score += getEngagementWeight(post.reactions, post.comment_count);
  if (!seenIds.has(post.id)) score += Math.random() * 0.5;
  return score;
}

export function useFeedPosts() {
  const { user, profile, isReady } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(0);
  const mountedRef = useRef(true);
  const seenIds = useRef<Set<string>>(
    new Set(JSON.parse(sessionStorage.getItem("tiikme-seen-posts") || "[]"))
  );
  const [strandIds, setStrandIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!isReady || !user) return;
    supabase
      .from("strands")
      .select("requester_id, receiver_id")
      .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .eq("status", "accepted")
      .then(({ data, error }) => {
        if (error) { console.warn("[useFeedPosts] strands fetch failed:", error.message); return; }
        if (!mountedRef.current) return;
        const ids = new Set<string>();
        (data || []).forEach(s => {
          if (s.requester_id !== user.id) ids.add(s.requester_id!);
          if (s.receiver_id !== user.id) ids.add(s.receiver_id!);
        });
        setStrandIds(ids);
      });
  }, [isReady, user]);

  const loadPosts = useCallback(
    async (pageNum: number, append = false) => {
      if (append) setLoadingMore(true);
      else setLoading(true);

      try {
        const { data, error } = await supabase
          .from("posts")
          .select(FEED_SELECT)
          .eq("visibility", "everyone")
          .order("created_at", { ascending: false })
          .range(pageNum * POSTS_PER_PAGE, (pageNum + 1) * POSTS_PER_PAGE - 1);

        if (!mountedRef.current) return;
        if (error) throw error;

        const userRole = profile?.role || null;
        const userInst = profile?.institution_name || null;

        const scored = (data || [])
          .map((post: any) => ({
            ...post,
            _score: scorePost(post, userRole, userInst, strandIds, seenIds.current),
          }))
          .sort((a: any, b: any) => b._score - a._score);

        scored.forEach((p: any) => seenIds.current.add(p.id));
        try {
          sessionStorage.setItem("tiikme-seen-posts", JSON.stringify([...seenIds.current].slice(-200)));
        } catch {}

        if (append) setPosts(prev => [...prev, ...scored]);
        else setPosts(scored);
        setHasMore((data || []).length === POSTS_PER_PAGE);
      } catch (err) {
        console.error("Failed to load posts:", err);
      } finally {
        if (mountedRef.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [profile?.role, profile?.institution_name, strandIds]
  );

  useEffect(() => {
    if (!isReady) return;
    loadPosts(0);
  }, [isReady, loadPosts]);

  useEffect(() => {
    if (!isReady) return;
    const channel = supabase
      .channel("feed-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "posts" }, async (payload) => {
        const newPost = payload.new as any;
        if (newPost.visibility !== "everyone") return;

        const { data } = await supabase
          .from("posts")
          .select(FEED_SELECT)
          .eq("id", newPost.id)
          .single();

        if (data && mountedRef.current) {
          setPosts(prev => {
            if (prev.some(p => p.id === data.id)) return prev;
            return [data as any, ...prev];
          });
        }
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "posts" }, (payload) => {
        const deletedId = (payload.old as any).id;
        if (mountedRef.current) setPosts(prev => prev.filter(p => p.id !== deletedId));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isReady]);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    const next = pageRef.current + 1;
    pageRef.current = next;
    loadPosts(next, true);
  }, [loadPosts, loadingMore, hasMore]);

  const refresh = useCallback(() => {
    pageRef.current = 0;
    loadPosts(0);
  }, [loadPosts]);

  return { posts, loading, loadingMore, hasMore, loadMore, refresh };
}

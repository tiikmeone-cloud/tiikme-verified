import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

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
  visibility: string | null;
  author_id: string | null;
  author?: {
    id: string;
    username: string;
    full_name: string | null;
    role: string | null;
    avatar_url: string | null;
    institution_name: string | null;
    activity_score: number | null;
  };
  _score?: number;
}

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

  // Trust weight (2.5x)
  const author = post.author;
  if (strandIds.has(post.author_id || "")) score += 2.0;
  if (author?.institution_name && author.institution_name === userInstitution)
    score += 1.5;

  // Relevance weight (2.0x) — simplified domain matching via role
  if (author?.role === userRole) score += 2.0;
  else if (author?.role) score += 0.5;

  // Recency weight (1.5x)
  score += getRecencyWeight(post.created_at);

  // Engagement weight (1.0x)
  score += getEngagementWeight(post.reactions, post.comment_count);

  // Freshness boost (0.5x)
  if (!seenIds.has(post.id)) score += Math.random() * 0.5;

  return score;
}

export function useFeedPosts() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(0);
  const seenIds = useRef<Set<string>>(
    new Set(JSON.parse(sessionStorage.getItem("tiikme-seen-posts") || "[]"))
  );
  const [userMeta, setUserMeta] = useState<{
    role: string | null;
    institution: string | null;
    strandIds: Set<string>;
  }>({ role: null, institution: null, strandIds: new Set() });

  // Load user context
  useEffect(() => {
    const loadUserContext = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const [profileRes, strandsRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("role, institution_name")
          .eq("id", user.id)
          .single(),
        supabase
          .from("strands")
          .select("requester_id, receiver_id")
          .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .eq("status", "accepted"),
      ]);

      const strandIds = new Set<string>();
      (strandsRes.data || []).forEach((s) => {
        if (s.requester_id !== user.id) strandIds.add(s.requester_id!);
        if (s.receiver_id !== user.id) strandIds.add(s.receiver_id!);
      });

      setUserMeta({
        role: profileRes.data?.role || null,
        institution: profileRes.data?.institution_name || null,
        strandIds,
      });
    };
    loadUserContext();
  }, []);

  const loadPosts = useCallback(
    async (pageNum: number, append = false) => {
      if (append) setLoadingMore(true);
      else setLoading(true);

      try {
        const { data, error } = await supabase
          .from("posts")
          .select(
            `*, author:profiles!author_id (id, username, full_name, role, avatar_url, institution_name, activity_score)`
          )
          .eq("visibility", "everyone")
          .order("created_at", { ascending: false })
          .range(
            pageNum * POSTS_PER_PAGE,
            (pageNum + 1) * POSTS_PER_PAGE - 1
          );

        if (error) throw error;

        const scored = (data || [])
          .map((post: any) => ({
            ...post,
            _score: scorePost(
              post,
              userMeta.role,
              userMeta.institution,
              userMeta.strandIds,
              seenIds.current
            ),
          }))
          .sort((a: any, b: any) => b._score - a._score);

        // Mark as seen
        scored.forEach((p: any) => seenIds.current.add(p.id));
        sessionStorage.setItem(
          "tiikme-seen-posts",
          JSON.stringify([...seenIds.current])
        );

        if (append) {
          setPosts((prev) => [...prev, ...scored]);
        } else {
          setPosts(scored);
        }

        setHasMore((data || []).length === POSTS_PER_PAGE);
      } catch (err) {
        console.error("Failed to load posts:", err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [userMeta]
  );

  // Initial load
  useEffect(() => {
    loadPosts(0);
  }, [loadPosts]);

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

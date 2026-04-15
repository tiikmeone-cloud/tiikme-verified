import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { calculateFeedScore, applyFeedDiversity } from "@/lib/algorithms";

const POSTS_PER_PAGE = 20;

interface FeedPost {
  id: string;
  content: string;
  type: string | null;
  post_type: string | null;
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
  show_company_badge: boolean | null;
  is_edited: boolean | null;
  author?: {
    id: string;
    username: string;
    full_name: string | null;
    role: string | null;
    avatar_url: string | null;
    institution_name: string | null;
    activity_score: number | null;
    sector: string | null;
    is_verified: boolean | null;
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

const FEED_SELECT = `*, author:profiles!posts_author_id_fkey(id, username, full_name, role, avatar_url, institution_name, activity_score, sector, is_verified), org:organizations!posts_posted_by_org_fkey(id, name, logo_url, type, slug), poster_profile:profiles!posts_posted_by_user_id_fkey(id, full_name)`;

export function useFeedPosts() {
  const { user, profile, isReady } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(0);
  const mountedRef = useRef(true);
  const [connectionIds, setConnectionIds] = useState<Set<string>>(new Set());
  const [followedOrgIds, setFollowedOrgIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Load connections and followed orgs
  useEffect(() => {
    if (!isReady || !user) return;

    // Connections
    supabase
      .from("strands")
      .select("requester_id, receiver_id")
      .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .eq("status", "accepted")
      .then(({ data }) => {
        if (!mountedRef.current) return;
        const ids = new Set<string>();
        (data || []).forEach(s => {
          if (s.requester_id !== user.id) ids.add(s.requester_id!);
          if (s.receiver_id !== user.id) ids.add(s.receiver_id!);
        });
        setConnectionIds(ids);
      });

    // Followed orgs
    supabase
      .from("org_followers")
      .select("org_id")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (!mountedRef.current) return;
        setFollowedOrgIds(new Set((data || []).map(f => f.org_id)));
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
          .or("visibility.eq.everyone,and(visibility.eq.workspace,is_shared_to_feed.eq.true)")
          .order("created_at", { ascending: false })
          .range(pageNum * POSTS_PER_PAGE, (pageNum + 1) * POSTS_PER_PAGE - 1);

        if (!mountedRef.current) return;
        if (error) throw error;

        // Calculate reaction counts from the reactions JSON
        const scored = (data || []).map((post: any) => {
          const reactions = post.reactions || {};
          const reactionCount = (reactions.useful || 0) + (reactions.inspiring || 0) + (reactions.insightful || 0);

          const score = calculateFeedScore({
            post: {
              id: post.id,
              created_at: post.created_at,
              author_id: post.author_id,
              posted_by_org: post.posted_by_org,
              author_sector: post.author?.sector || null,
              author_is_verified: post.author?.is_verified || false,
              image_urls: post.image_urls,
              mention_count: 0, // not stored directly
              reaction_count: reactionCount,
              comment_count: post.comment_count || 0,
              repost_count: post.repost_count || 0,
              post_type: post.post_type,
            },
            currentUser: { sector: profile?.sector || null },
            connectionIds,
            followedOrgIds,
          });

          return { ...post, _score: score } as FeedPost;
        });

        // Apply diversity rules
        const diversified = applyFeedDiversity(
          scored as Array<{ id: string; author_id: string | null; _score: number }>,
          connectionIds
        ) as unknown as FeedPost[];

        if (append) setPosts(prev => [...prev, ...diversified]);
        else setPosts(diversified);
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
    [profile?.sector, connectionIds, followedOrgIds]
  );

  useEffect(() => {
    if (!isReady) return;
    loadPosts(0);
  }, [isReady, loadPosts]);

  // Realtime
  useEffect(() => {
    if (!isReady) return;
    const channel = supabase
      .channel("feed-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "posts" }, async (payload) => {
        const newPost = payload.new as any;
        if (newPost.visibility !== "everyone") return;
        const { data } = await supabase.from("posts").select(FEED_SELECT).eq("id", newPost.id).single();
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

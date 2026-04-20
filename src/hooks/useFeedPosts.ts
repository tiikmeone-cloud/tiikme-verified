import { useCallback, useEffect, useRef, useState } from "react";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
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

const FEED_SELECT = `*, repost_of, author:profiles!posts_author_id_fkey(id, username, full_name, role, role_subtype, headline, designation, avatar_url, institution_name, currently_working_at, display_preference, activity_score, sector, is_verified), org:organizations!posts_posted_by_org_fkey(id, name, logo_url, type, slug), poster_profile:profiles!posts_posted_by_user_id_fkey(id, full_name, display_preference)`;

async function fetchFeedPage(pageParam: number, sector: string | null, connectionIds: Set<string>, followedOrgIds: Set<string>) {
  const { data, error } = await supabase
    .from("posts")
    .select(FEED_SELECT)
    .or("visibility.eq.everyone,and(visibility.eq.workspace,is_shared_to_feed.eq.true)")
    .order("created_at", { ascending: false })
    .range(pageParam * POSTS_PER_PAGE, (pageParam + 1) * POSTS_PER_PAGE - 1);

  if (error) throw error;

  const scored = (data || []).map((post: any) => {
    const reactions = post.reactions || {};
    const reactionCount = (reactions.useful || 0) + (reactions.inspiring || 0) + (reactions.insightful || 0);
    const score = calculateFeedScore({
      post: {
        id: post.id, created_at: post.created_at, author_id: post.author_id,
        posted_by_org: post.posted_by_org, author_sector: post.author?.sector || null,
        author_is_verified: post.author?.is_verified || false,
        image_urls: post.image_urls, mention_count: 0,
        reaction_count: reactionCount, comment_count: post.comment_count || 0,
        repost_count: post.repost_count || 0, post_type: post.post_type,
      },
      currentUser: { sector: sector || null },
      connectionIds,
      followedOrgIds,
    });
    return { ...post, _score: score } as FeedPost;
  });

  const diversified = applyFeedDiversity(
    scored as Array<{ id: string; author_id: string | null; _score: number }>,
    connectionIds
  ) as unknown as FeedPost[];

  return { posts: diversified, hasMore: (data || []).length === POSTS_PER_PAGE, page: pageParam };
}

export function useFeedPosts() {
  const { user, profile, isReady } = useAuth();
  const queryClient = useQueryClient();
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Cache connections & followed orgs with useQuery
  const { data: connectionIds = new Set<string>() } = useQuery({
    queryKey: ["feed-connections", user?.id],
    queryFn: async () => {
      if (!user) return new Set<string>();
      const { data } = await supabase.from("strands")
        .select("requester_id, receiver_id")
        .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .eq("status", "accepted");
      const ids = new Set<string>();
      (data || []).forEach(s => {
        if (s.requester_id !== user.id) ids.add(s.requester_id!);
        if (s.receiver_id !== user.id) ids.add(s.receiver_id!);
      });
      return ids;
    },
    enabled: isReady && !!user,
    staleTime: 10 * 60 * 1000,
  });

  const { data: followedOrgIds = new Set<string>() } = useQuery({
    queryKey: ["feed-followed-orgs", user?.id],
    queryFn: async () => {
      if (!user) return new Set<string>();
      const { data } = await supabase.from("org_followers").select("org_id").eq("user_id", user.id);
      return new Set((data || []).map(f => f.org_id));
    },
    enabled: isReady && !!user,
    staleTime: 10 * 60 * 1000,
  });

  const {
    data,
    isLoading: loading,
    isFetchingNextPage: loadingMore,
    hasNextPage: hasMore,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["feed", user?.id],
    queryFn: ({ pageParam = 0 }) => fetchFeedPage(pageParam, profile?.sector || null, connectionIds, followedOrgIds),
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.page + 1 : undefined,
    initialPageParam: 0,
    enabled: isReady,
    staleTime: 2 * 60 * 1000,
  });

  const posts = data?.pages.flatMap(p => p.posts) ?? [];

  // Realtime — append new posts and remove deleted ones
  useEffect(() => {
    if (!isReady) return;
    const channel = supabase
      .channel("feed-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "posts" }, async (payload) => {
        const newPost = payload.new as any;
        if (newPost.visibility !== "everyone") return;
        const { data: full } = await supabase.from("posts").select(FEED_SELECT).eq("id", newPost.id).single();
        if (full && mountedRef.current) {
          queryClient.setQueryData(["feed", user?.id], (old: any) => {
            if (!old?.pages?.length) return old;
            const firstPage = old.pages[0];
            if (firstPage.posts.some((p: any) => p.id === full.id)) return old;
            return {
              ...old,
              pages: [{ ...firstPage, posts: [full as any, ...firstPage.posts] }, ...old.pages.slice(1)],
            };
          });
        }
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "posts" }, (payload) => {
        const deletedId = (payload.old as any).id;
        if (mountedRef.current) {
          queryClient.setQueryData(["feed", user?.id], (old: any) => {
            if (!old?.pages) return old;
            return {
              ...old,
              pages: old.pages.map((page: any) => ({
                ...page,
                posts: page.posts.filter((p: any) => p.id !== deletedId),
              })),
            };
          });
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isReady, user?.id, queryClient]);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) fetchNextPage();
  }, [loadingMore, hasMore, fetchNextPage]);

  const refresh = useCallback(() => {
    refetch();
  }, [refetch]);

  return { posts, loading, loadingMore, hasMore: !!hasMore, loadMore, refresh };
}

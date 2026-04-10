import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export function usePostReactions(
  postId: string,
  userId: string | undefined,
  initialCounts?: Record<string, number> | null
) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Derive initial like count from old reaction format or new
  useEffect(() => {
    const total = (initialCounts?.insightful || 0) + (initialCounts?.useful || 0) + (initialCounts?.inspiring || 0) + (initialCounts?.like || 0);
    setLikeCount(total);
  }, [initialCounts, postId]);

  // Check if user has liked
  useEffect(() => {
    if (!postId || !userId) {
      setLiked(false);
      setLoaded(true);
      return;
    }
    let cancelled = false;
    setLoaded(false);
    supabase
      .from("post_reactions")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setLiked(!!data);
        setLoaded(true);
      });
    return () => { cancelled = true; };
  }, [postId, userId]);

  // Realtime
  useEffect(() => {
    if (!postId) return;
    const channel = supabase
      .channel(`likes-${postId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "post_reactions", filter: `post_id=eq.${postId}` }, async () => {
        const { count } = await supabase
          .from("post_reactions")
          .select("*", { count: "exact", head: true })
          .eq("post_id", postId);
        if (mountedRef.current) setLikeCount(count || 0);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [postId]);

  const toggleLike = useCallback(async () => {
    if (!userId) return;
    if (liked) {
      setLiked(false);
      setLikeCount(p => Math.max(0, p - 1));
      await supabase.from("post_reactions").delete().eq("post_id", postId).eq("user_id", userId);
    } else {
      setLiked(true);
      setLikeCount(p => p + 1);
      await supabase.from("post_reactions").insert({ post_id: postId, user_id: userId, reaction_type: "like" });
    }
  }, [postId, userId, liked]);

  return { liked, likeCount, toggleLike, loaded };
}

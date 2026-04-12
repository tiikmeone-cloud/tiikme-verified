import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export function usePostReactions(
  postId: string,
  userId: string | undefined,
  _initialCounts?: Record<string, number> | null
) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Load REAL like count from post_reactions table — NOT from cached JSON
  useEffect(() => {
    if (!postId) { setLoaded(true); return; }
    let cancelled = false;

    (async () => {
      try {
        const [countRes, likedRes] = await Promise.all([
          supabase.from("post_reactions").select("*", { count: "exact", head: true }).eq("post_id", postId),
          userId
            ? supabase.from("post_reactions").select("id").eq("post_id", postId).eq("user_id", userId).maybeSingle()
            : Promise.resolve({ data: null }),
        ]);

        if (cancelled || !mountedRef.current) return;
        if (countRes.error) console.warn("[usePostReactions] count failed:", countRes.error.message);
        if (likedRes.error) console.warn("[usePostReactions] liked check failed:", (likedRes as any).error.message);
        setLikeCount(countRes.count || 0);
        setLiked(!!likedRes.data);
      } catch (e) {
        if (cancelled || !mountedRef.current) return;
        console.warn("[usePostReactions] exception:", e);
        setLikeCount(0);
        setLiked(false);
      }
      setLoaded(true);
    })();

    return () => { cancelled = true; };
  }, [postId, userId]);

  // Realtime
  useEffect(() => {
    if (!postId) return;
    const channel = supabase
      .channel(`likes-${postId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "post_reactions", filter: `post_id=eq.${postId}` }, (payload) => {
        if (!mountedRef.current) return;
        if (payload.eventType === "INSERT") {
          setLikeCount(p => p + 1);
          if ((payload.new as any).user_id === userId) setLiked(true);
        } else if (payload.eventType === "DELETE") {
          setLikeCount(p => Math.max(0, p - 1));
          if ((payload.old as any).user_id === userId) setLiked(false);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [postId, userId]);

  const toggleLike = useCallback(async () => {
    if (!userId) return;
    if (liked) {
      setLiked(false);
      setLikeCount(p => Math.max(0, p - 1));
      const { error } = await supabase.from("post_reactions").delete().eq("post_id", postId).eq("user_id", userId);
      if (error) { setLiked(true); setLikeCount(p => p + 1); }
    } else {
      setLiked(true);
      setLikeCount(p => p + 1);
      const { error } = await supabase.from("post_reactions")
        .insert({ post_id: postId, user_id: userId, reaction_type: "like" });
      if (error) { setLiked(false); setLikeCount(p => Math.max(0, p - 1)); }
    }
  }, [postId, userId, liked]);

  return { liked, likeCount, toggleLike, loaded };
}

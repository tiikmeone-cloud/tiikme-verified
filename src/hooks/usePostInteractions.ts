import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function usePostInteractions(postIds: string[]) {
  const { user } = useAuth();
  const [likes, setLikes] = useState<Record<string, number>>({});
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const mountedRef = useRef(true);
  const idsKey = postIds.join(",");

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Load all likes for given post IDs
  useEffect(() => {
    if (!postIds.length) return;
    (async () => {
      const { data } = await supabase
        .from("post_reactions")
        .select("post_id, user_id")
        .in("post_id", postIds);
      if (!data || !mountedRef.current) return;

      const countMap: Record<string, number> = {};
      const likedMap: Record<string, boolean> = {};
      for (const r of data) {
        countMap[r.post_id] = (countMap[r.post_id] || 0) + 1;
        if (r.user_id === user?.id) likedMap[r.post_id] = true;
      }
      setLikes(countMap);
      setLiked(likedMap);
    })();
  }, [idsKey, user?.id]);

  const toggleLike = useCallback(async (postId: string) => {
    if (!user) return;
    const isLiked = liked[postId] || false;

    // Optimistic
    setLiked(prev => ({ ...prev, [postId]: !isLiked }));
    setLikes(prev => ({ ...prev, [postId]: Math.max(0, (prev[postId] || 0) + (isLiked ? -1 : 1)) }));

    if (isLiked) {
      const { error } = await supabase.from("post_reactions").delete().eq("post_id", postId).eq("user_id", user.id);
      if (error) {
        setLiked(prev => ({ ...prev, [postId]: true }));
        setLikes(prev => ({ ...prev, [postId]: (prev[postId] || 0) + 1 }));
      }
    } else {
      const { error } = await supabase.from("post_reactions").upsert(
        { post_id: postId, user_id: user.id, reaction_type: "useful" },
        { onConflict: "post_id,user_id" }
      );
      if (error) {
        setLiked(prev => ({ ...prev, [postId]: false }));
        setLikes(prev => ({ ...prev, [postId]: Math.max(0, (prev[postId] || 0) - 1) }));
      }
    }
  }, [user, liked]);

  // Realtime
  useEffect(() => {
    if (!user || !postIds.length) return;
    const channel = supabase
      .channel("reactions-" + postIds.slice(0, 3).join("-"))
      .on("postgres_changes", { event: "*", schema: "public", table: "post_reactions" }, (payload) => {
        const postId = (payload.new as any)?.post_id || (payload.old as any)?.post_id;
        if (!postId || !postIds.includes(postId)) return;

        if (payload.eventType === "INSERT") {
          setLikes(prev => ({ ...prev, [postId]: (prev[postId] || 0) + 1 }));
          if ((payload.new as any).user_id === user.id) setLiked(prev => ({ ...prev, [postId]: true }));
        } else if (payload.eventType === "DELETE") {
          setLikes(prev => ({ ...prev, [postId]: Math.max(0, (prev[postId] || 0) - 1) }));
          if ((payload.old as any).user_id === user.id) setLiked(prev => ({ ...prev, [postId]: false }));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, idsKey]);

  return { likes, liked, toggleLike };
}

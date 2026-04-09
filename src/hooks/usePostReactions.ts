import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export function usePostReactions(postId: string, userId: string | undefined) {
  const [userReaction, setUserReaction] = useState<string | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({ insightful: 0, useful: 0, inspiring: 0 });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!postId) return;
    // Fetch counts
    supabase
      .from("post_reactions")
      .select("reaction_type")
      .eq("post_id", postId)
      .then(({ data }) => {
        const c: Record<string, number> = { insightful: 0, useful: 0, inspiring: 0 };
        (data || []).forEach(r => { c[r.reaction_type] = (c[r.reaction_type] || 0) + 1; });
        setCounts(c);
        // Find user's reaction
        if (userId) {
          const mine = (data || []).find((r: any) => false); // can't filter by user from this query
        }
        setLoaded(true);
      });
    // Fetch user's own reaction separately
    if (userId) {
      supabase
        .from("post_reactions")
        .select("reaction_type")
        .eq("post_id", postId)
        .eq("user_id", userId)
        .maybeSingle()
        .then(({ data }) => {
          setUserReaction(data?.reaction_type || null);
        });
    }
  }, [postId, userId]);

  const toggleReaction = useCallback(async (reactionType: string) => {
    if (!userId) return;
    if (userReaction === reactionType) {
      // Remove
      setUserReaction(null);
      setCounts(p => ({ ...p, [reactionType]: Math.max(0, (p[reactionType] || 0) - 1) }));
      await supabase.from("post_reactions").delete().eq("post_id", postId).eq("user_id", userId);
    } else {
      // Remove old if exists
      if (userReaction) {
        setCounts(p => ({ ...p, [userReaction!]: Math.max(0, (p[userReaction!] || 0) - 1) }));
        await supabase.from("post_reactions").delete().eq("post_id", postId).eq("user_id", userId);
      }
      // Add new
      setUserReaction(reactionType);
      setCounts(p => ({ ...p, [reactionType]: (p[reactionType] || 0) + 1 }));
      await supabase.from("post_reactions").insert({ post_id: postId, user_id: userId, reaction_type: reactionType });
    }
  }, [postId, userId, userReaction]);

  return { userReaction, counts, toggleReaction, loaded };
}

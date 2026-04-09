import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const emptyCounts = { insightful: 0, useful: 0, inspiring: 0 };

function normalizeCounts(source?: Record<string, number> | null) {
  return {
    insightful: source?.insightful || 0,
    useful: source?.useful || 0,
    inspiring: source?.inspiring || 0,
  };
}

export function usePostReactions(
  postId: string,
  userId: string | undefined,
  initialCounts?: Record<string, number> | null
) {
  const [userReaction, setUserReaction] = useState<string | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>(normalizeCounts(initialCounts));
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setCounts(normalizeCounts(initialCounts));
  }, [initialCounts, postId]);

  useEffect(() => {
    if (!postId || !userId) {
      setUserReaction(null);
      setLoaded(true);
      return;
    }

    let cancelled = false;
    setLoaded(false);

    supabase
      .from("post_reactions")
      .select("reaction_type")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setUserReaction(data?.reaction_type || null);
        setLoaded(true);
      });

    return () => {
      cancelled = true;
    };
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

  return { userReaction, counts: counts || emptyCounts, toggleReaction, loaded };
}

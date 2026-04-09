import { useState, useEffect, useCallback, useRef } from "react";
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
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

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

    return () => { cancelled = true; };
  }, [postId, userId]);

  // Realtime reaction count sync
  useEffect(() => {
    if (!postId) return;
    const channel = supabase
      .channel(`reactions-${postId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "post_reactions", filter: `post_id=eq.${postId}` }, async () => {
        // Re-fetch actual counts from DB
        const { data } = await supabase
          .from("post_reactions")
          .select("reaction_type")
          .eq("post_id", postId);
        if (!mountedRef.current || !data) return;
        const fresh: Record<string, number> = { insightful: 0, useful: 0, inspiring: 0 };
        data.forEach(r => { fresh[r.reaction_type] = (fresh[r.reaction_type] || 0) + 1; });
        setCounts(fresh);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [postId]);

  const toggleReaction = useCallback(async (reactionType: string) => {
    if (!userId) return;
    if (userReaction === reactionType) {
      setUserReaction(null);
      setCounts(p => ({ ...p, [reactionType]: Math.max(0, (p[reactionType] || 0) - 1) }));
      await supabase.from("post_reactions").delete().eq("post_id", postId).eq("user_id", userId);
    } else {
      if (userReaction) {
        setCounts(p => ({ ...p, [userReaction!]: Math.max(0, (p[userReaction!] || 0) - 1) }));
        await supabase.from("post_reactions").delete().eq("post_id", postId).eq("user_id", userId);
      }
      setUserReaction(reactionType);
      setCounts(p => ({ ...p, [reactionType]: (p[reactionType] || 0) + 1 }));
      await supabase.from("post_reactions").insert({ post_id: postId, user_id: userId, reaction_type: reactionType });
    }
  }, [postId, userId, userReaction]);

  return { userReaction, counts: counts || emptyCounts, toggleReaction, loaded };
}

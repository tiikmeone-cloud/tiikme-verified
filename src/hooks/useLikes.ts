import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useLikes(postIds: string[]) {
  const { user } = useAuth();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [myLikes, setMyLikes] = useState<Record<string, boolean>>({});

  // Stable key that doesn't mutate the source array
  const key = useMemo(() => [...postIds].sort().join(","), [postIds]);

  // Load initial like data from DB
  useEffect(() => {
    if (!postIds.length) {
      setCounts({});
      setMyLikes({});
      return;
    }

    supabase
      .from("post_reactions")
      .select("post_id, user_id")
      .in("post_id", postIds)
      .then(({ data }) => {
        const c: Record<string, number> = {};
        const l: Record<string, boolean> = {};
        for (const r of data || []) {
          c[r.post_id] = (c[r.post_id] || 0) + 1;
          if (r.user_id === user?.id) l[r.post_id] = true;
        }
        setCounts(c);
        setMyLikes(l);
      });
  }, [key, user?.id]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    let ch: ReturnType<typeof supabase.channel> | null = null;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      supabase.realtime.setAuth(session.access_token);

      ch = supabase
        .channel("likes-batch-" + user.id)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "post_reactions" },
          (payload) => {
            const pid = (payload.new as any)?.post_id || (payload.old as any)?.post_id;
            if (!pid) return;

            if (payload.eventType === "INSERT") {
              setCounts((prev) => ({ ...prev, [pid]: (prev[pid] || 0) + 1 }));
              if ((payload.new as any).user_id === user.id)
                setMyLikes((prev) => ({ ...prev, [pid]: true }));
            } else if (payload.eventType === "DELETE") {
              setCounts((prev) => ({
                ...prev,
                [pid]: Math.max(0, (prev[pid] || 0) - 1),
              }));
              if ((payload.old as any).user_id === user.id)
                setMyLikes((prev) => ({ ...prev, [pid]: false }));
            }
          }
        )
        .subscribe();
    });

    return () => {
      if (ch) supabase.removeChannel(ch);
    };
  }, [user?.id]);

  const toggle = useCallback(
    async (postId: string) => {
      if (!user) return;
      const isLiked = myLikes[postId] || false;

      // Optimistic
      setMyLikes((p) => ({ ...p, [postId]: !isLiked }));
      setCounts((p) => ({
        ...p,
        [postId]: Math.max(0, (p[postId] || 0) + (isLiked ? -1 : 1)),
      }));

      if (isLiked) {
        const { error } = await supabase
          .from("post_reactions")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id);
        if (error) {
          setMyLikes((p) => ({ ...p, [postId]: true }));
          setCounts((p) => ({ ...p, [postId]: (p[postId] || 0) + 1 }));
        }
      } else {
        const { error } = await supabase
          .from("post_reactions")
          .upsert(
            { post_id: postId, user_id: user.id, reaction_type: "useful" },
            { onConflict: "post_id,user_id", ignoreDuplicates: true }
          );
        if (error) {
          setMyLikes((p) => ({ ...p, [postId]: false }));
          setCounts((p) => ({
            ...p,
            [postId]: Math.max(0, (p[postId] || 0) - 1),
          }));
        }
      }
    },
    [user, myLikes]
  );

  return { counts, myLikes, toggle };
}

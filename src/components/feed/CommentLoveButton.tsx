import { useState, useEffect, useCallback } from "react";
import { Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  commentId: string;
  userId?: string;
}

export default function CommentLoveButton({ commentId, userId }: Props) {
  const [loved, setLoved] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!commentId) return;
    let cancelled = false;
    (async () => {
      const [countRes, lovedRes] = await Promise.all([
        supabase.from("comment_reactions").select("*", { count: "exact", head: true }).eq("comment_id", commentId),
        userId
          ? supabase.from("comment_reactions").select("id").eq("comment_id", commentId).eq("user_id", userId).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);
      if (cancelled) return;
      setCount(countRes.count || 0);
      setLoved(!!lovedRes.data);
    })();
    return () => { cancelled = true; };
  }, [commentId, userId]);

  const toggle = useCallback(async () => {
    if (!userId) return;
    if (loved) {
      setLoved(false);
      setCount(p => Math.max(0, p - 1));
      const { error } = await supabase.from("comment_reactions").delete().eq("comment_id", commentId).eq("user_id", userId);
      if (error) { setLoved(true); setCount(p => p + 1); }
    } else {
      setLoved(true);
      setCount(p => p + 1);
      const { error } = await supabase.from("comment_reactions").insert({ comment_id: commentId, user_id: userId, reaction_type: "love" } as any);
      if (error) { setLoved(false); setCount(p => Math.max(0, p - 1)); }
    }
  }, [commentId, userId, loved]);

  return (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex items-center gap-1 cursor-pointer active:scale-95 shrink-0"
      style={{ background: "none", border: "none", padding: "2px 4px", borderRadius: 6 }}
    >
      <Heart
        style={{
          width: 13,
          height: 13,
          color: loved ? "#EF4444" : "#9CA3C0",
          fill: loved ? "#EF4444" : "none",
          transition: "all 150ms ease",
        }}
      />
      {count > 0 && (
        <span style={{ fontSize: 11, fontWeight: 600, color: loved ? "#EF4444" : "#9CA3C0" }}>
          {count}
        </span>
      )}
    </button>
  );
}

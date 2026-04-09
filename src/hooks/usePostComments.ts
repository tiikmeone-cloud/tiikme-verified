import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Comment {
  id: string;
  content: string;
  created_at: string | null;
  user_id: string;
  parent_id: string | null;
  post_id: string;
  author?: {
    id: string;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
    role: string | null;
  };
}

export function usePostComments(postId: string, enabled: boolean) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const fetchComments = useCallback(async () => {
    if (!enabled || !postId) return;
    setLoading(true);
    const { data } = await supabase
      .from("post_comments")
      .select("*, author:profiles!user_id(id, full_name, username, avatar_url, role)")
      .eq("post_id", postId)
      .order("created_at", { ascending: true })
      .limit(50);
    if (mountedRef.current) {
      setComments((data as any[]) || []);
      setLoading(false);
    }
  }, [postId, enabled]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  // Realtime subscription for new comments on this post
  useEffect(() => {
    if (!enabled || !postId) return;
    const channel = supabase
      .channel(`comments-${postId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "post_comments", filter: `post_id=eq.${postId}` }, async (payload) => {
        const newComment = payload.new as any;
        // Fetch with author join
        const { data } = await supabase
          .from("post_comments")
          .select("*, author:profiles!user_id(id, full_name, username, avatar_url, role)")
          .eq("id", newComment.id)
          .single();
        if (data && mountedRef.current) {
          setComments(prev => {
            if (prev.some(c => c.id === data.id)) return prev;
            return [...prev, data as any];
          });
        }
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "post_comments", filter: `post_id=eq.${postId}` }, (payload) => {
        const deletedId = (payload.old as any).id;
        if (mountedRef.current) setComments(prev => prev.filter(c => c.id !== deletedId));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [postId, enabled]);

  const addComment = useCallback(async (userId: string, content: string) => {
    const { data, error } = await supabase
      .from("post_comments")
      .insert({ post_id: postId, user_id: userId, content })
      .select("*, author:profiles!user_id(id, full_name, username, avatar_url, role)")
      .single();
    if (!error && data && mountedRef.current) {
      setComments(prev => {
        if (prev.some(c => c.id === (data as any).id)) return prev;
        return [...prev, data as any];
      });
    }
    return { data, error };
  }, [postId]);

  return { comments, loading, addComment, refetch: fetchComments };
}

import { useState, useEffect, useCallback } from "react";
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

  const fetchComments = useCallback(async () => {
    if (!enabled || !postId) return;
    setLoading(true);
    const { data } = await supabase
      .from("post_comments")
      .select("*, author:profiles!user_id(id, full_name, username, avatar_url, role)")
      .eq("post_id", postId)
      .order("created_at", { ascending: true })
      .limit(50);
    setComments((data as any[]) || []);
    setLoading(false);
  }, [postId, enabled]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  const addComment = useCallback(async (userId: string, content: string) => {
    const { data, error } = await supabase
      .from("post_comments")
      .insert({ post_id: postId, user_id: userId, content })
      .select("*, author:profiles!user_id(id, full_name, username, avatar_url, role)")
      .single();
    if (!error && data) {
      setComments(prev => [...prev, data as any]);
      // Update comment count on post
      await supabase.rpc("award_power" as any, {}).catch(() => {}); // ignore
    }
    return { data, error };
  }, [postId]);

  return { comments, loading, addComment, refetch: fetchComments };
}

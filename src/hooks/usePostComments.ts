import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

// Helper: fetch profiles for comment authors
async function attachCommentAuthors(comments: any[]): Promise<any[]> {
  if (!comments.length) return comments;
  const uids = [...new Set(comments.map((c) => c.user_id).filter(Boolean))];
  if (!uids.length) return comments;
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, username, avatar_url, role")
    .in("id", uids);
  const map: Record<string, any> = {};
  for (const p of profiles || []) map[p.id] = p;
  return comments.map((c) => ({ ...c, author: map[c.user_id] || null }));
}

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
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true })
      .limit(50);
    if (mountedRef.current) {
      const withAuthors = await attachCommentAuthors((data as any[]) || []);
      setComments(withAuthors);
      setLoading(false);
    }
  }, [postId, enabled]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  // Realtime subscription for new/deleted comments
  useEffect(() => {
    if (!enabled || !postId) return;
    const channel = supabase
      .channel(`comments-${postId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "post_comments", filter: `post_id=eq.${postId}` }, async (payload) => {
        const newComment = payload.new as any;
        // Fetch with author join
        const { data } = await supabase
          .from("post_comments")
          .select("*")
          .eq("id", newComment.id)
          .single();
        if (data && mountedRef.current) {
          const withAuthor = await attachCommentAuthors([data]);
          setComments(prev => {
            if (prev.some(c => c.id === data.id)) return prev;
            return [...prev, ...withAuthor];
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

  const addComment = useCallback(async (userId: string, content: string, profile?: { full_name?: string; avatar_url?: string; role?: string }) => {
    // Optimistic add
    const tempId = `temp-${Date.now()}`;
    const optimistic: Comment = {
      id: tempId,
      post_id: postId,
      user_id: userId,
      content,
      created_at: new Date().toISOString(),
      parent_id: null,
      author: {
        id: userId,
        full_name: profile?.full_name || "You",
        username: null,
        avatar_url: profile?.avatar_url || null,
        role: profile?.role || null,
      },
    };
    setComments(prev => [...prev, optimistic]);

    const { data, error } = await supabase
      .from("post_comments")
      .insert({ post_id: postId, user_id: userId, content })
      .select("*")
      .single();

    if (!error && data && mountedRef.current) {
      const enriched = {
        ...data,
        author: {
          id: userId,
          full_name: profile?.full_name || "You",
          username: null,
          avatar_url: profile?.avatar_url || null,
          role: profile?.role || null,
        },
      };
      // Replace optimistic with real
      setComments(prev => prev.map(c => c.id === tempId ? (enriched as any) : c));
    } else if (error && mountedRef.current) {
      // Remove optimistic on error
      setComments(prev => prev.filter(c => c.id !== tempId));
    }
    return { data, error };
  }, [postId]);

  return { comments, loading, addComment, refetch: fetchComments };
}

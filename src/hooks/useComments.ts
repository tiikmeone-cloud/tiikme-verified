import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { sendNotification } from "@/lib/notify";

// Helper: fetch profiles for a list of user IDs and attach as `author`
async function attachAuthors(comments: any[]): Promise<any[]> {
  if (!comments.length) return comments;
  const uids = [...new Set(comments.map((c) => c.user_id).filter(Boolean))];
  if (!uids.length) return comments;
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, role")
    .in("id", uids);
  const map: Record<string, any> = {};
  for (const p of profiles || []) map[p.id] = p;
  return comments.map((c) => ({ ...c, author: map[c.user_id] || null }));
}

export function useComments() {
  const { user, profile } = useAuth();
  const [all, setAll] = useState<Record<string, any[]>>({});
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [counts, setCounts] = useState<Record<string, number>>({});
  const openRef = useRef(open);
  openRef.current = open;

  const loadCounts = useCallback(async (postIds: string[]) => {
    if (!postIds.length) {
      setCounts({});
      return;
    }
    const { data } = await supabase
      .from("post_comments")
      .select("post_id")
      .in("post_id", postIds);
    const c: Record<string, number> = {};
    for (const pid of postIds) c[pid] = 0;
    for (const r of data || []) c[r.post_id] = (c[r.post_id] || 0) + 1;
    setCounts(c);
  }, []);

  const toggleOpen = useCallback((postId: string) => {
    setOpen((prev) => {
      const s = new Set(prev);
      if (s.has(postId)) {
        s.delete(postId);
      } else {
        s.add(postId);
        // Load comments for this post
        supabase
          .from("post_comments")
          .select("id, post_id, user_id, content, created_at, parent_id")
          .eq("post_id", postId)
          .order("created_at", { ascending: true })
          .then(async ({ data }) => {
            const withAuthors = await attachAuthors(data || []);
            setAll((prev) => ({ ...prev, [postId]: withAuthors }));
          });
      }
      return s;
    });
  }, []);

  const submit = useCallback(
    async (postId: string) => {
      const content = inputs[postId]?.trim();
      if (!content || !user) return;

      setInputs((p) => ({ ...p, [postId]: "" }));

      const temp = {
        id: "tmp-" + Date.now(),
        post_id: postId,
        user_id: user.id,
        content,
        created_at: new Date().toISOString(),
        parent_id: null,
        author: {
          id: user.id,
          full_name: profile?.full_name || "You",
          avatar_url: profile?.avatar_url || null,
          role: profile?.role || null,
        },
      };

      setAll((p) => ({ ...p, [postId]: [...(p[postId] || []), temp] }));
      setCounts((p) => ({ ...p, [postId]: (p[postId] || 0) + 1 }));

      const { data, error } = await supabase
        .from("post_comments")
        .insert({ post_id: postId, user_id: user.id, content })
        .select("*")
        .single();

      if (error) {
        setAll((p) => ({
          ...p,
          [postId]: (p[postId] || []).filter((c) => c.id !== temp.id),
        }));
        setCounts((p) => ({
          ...p,
          [postId]: Math.max(0, (p[postId] || 0) - 1),
        }));
        setInputs((p) => ({ ...p, [postId]: content }));
        return;
      }

      // Attach author info from our own profile
      const enriched = {
        ...data,
        author: {
          id: user.id,
          full_name: profile?.full_name || "You",
          avatar_url: profile?.avatar_url || null,
          role: profile?.role || null,
        },
      };
      setAll((p) => ({
        ...p,
        [postId]: (p[postId] || []).some((c) => c.id === temp.id)
          ? (p[postId] || []).map((c) => (c.id === temp.id ? enriched : c))
          : [...(p[postId] || []), enriched],
      }));

      // Send notification to post author
      supabase.from("posts").select("author_id").eq("id", postId).maybeSingle()
        .then(({ data: post }) => {
          if (post?.author_id) {
            sendNotification({
              userId: post.author_id,
              actorId: user.id,
              type: "comment",
              title: `${profile?.full_name || "Someone"} commented on your post`,
              body: content.slice(0, 80),
              actionUrl: `/post/${postId}`,
            });
          }
        });
    },
    [inputs, user, profile]
  );

  const deleteComment = useCallback(
    async (postId: string, commentId: string) => {
      setAll((p) => ({
        ...p,
        [postId]: (p[postId] || []).filter((c) => c.id !== commentId),
      }));
      setCounts((p) => ({
        ...p,
        [postId]: Math.max(0, (p[postId] || 0) - 1),
      }));
      await supabase.from("post_comments").delete().eq("id", commentId);
    },
    []
  );

  // Realtime comments
  useEffect(() => {
    if (!user) return;
    let ch: ReturnType<typeof supabase.channel> | null = null;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      supabase.realtime.setAuth(session.access_token);

      ch = supabase
        .channel("comments-batch-" + user.id)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "post_comments" },
          async (payload) => {
            const newComment = payload.new as any;
            if (newComment.user_id === user.id) return;

            const pid = newComment.post_id;
            setCounts((prev) => ({ ...prev, [pid]: (prev[pid] || 0) + 1 }));

            if (!openRef.current.has(pid)) return;

            const { data } = await supabase
              .from("post_comments")
              .select("*")
              .eq("id", newComment.id)
              .single();

            if (data) {
              const withAuthor = await attachAuthors([data]);
              setAll((prev) => {
                const ex = prev[pid] || [];
                if (ex.some((c: any) => c.id === data.id)) return prev;
                return { ...prev, [pid]: [...ex, ...withAuthor] };
              });
            }
          }
        )
        .on(
          "postgres_changes",
          { event: "DELETE", schema: "public", table: "post_comments" },
          (payload) => {
            const old = payload.old as any;
            if (old.post_id) {
              setCounts((prev) => ({
                ...prev,
                [old.post_id]: Math.max(0, (prev[old.post_id] || 0) - 1),
              }));
              setAll((prev) => ({
                ...prev,
                [old.post_id]: (prev[old.post_id] || []).filter(
                  (c) => c.id !== old.id
                ),
              }));
            }
          }
        )
        .subscribe();
    });

    return () => {
      if (ch) supabase.removeChannel(ch);
    };
  }, [user?.id]);

  return {
    all,
    inputs,
    setInputs,
    open,
    counts,
    toggleOpen,
    submit,
    deleteComment,
    loadCounts,
  };
}

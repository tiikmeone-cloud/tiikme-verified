// src/components/shared/CommentPanel.tsx
// Inline comment thread. Works for feed, circle, and opportunity posts.

import { useState, useEffect, useRef } from "react";
import { Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import AvatarSquare from "@/components/ui/AvatarSquare";

type PostSource = "feed" | "circle" | "opportunity";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  author?: { full_name: string | null; avatar_url: string | null; username: string | null };
}

interface CommentPanelProps {
  postId: string;
  source: PostSource;
}

export function CommentPanel({ postId, source }: CommentPanelProps) {
  const { user, profile } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Determine table names based on source
  const commentTable =
    source === "feed" ? "post_comments"
    : source === "circle" ? "circle_post_comments"
    : "opportunity_comments";

  const idField =
    source === "feed" ? "post_id"
    : source === "circle" ? "post_id"
    : "opportunity_id";

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    async function load() {
      const { data, error } = await supabase
        .from(commentTable as any)
        .select(`
          id, content, created_at, user_id,
          author:profiles!${commentTable}_user_id_fkey(full_name, avatar_url, username)
        `)
        .eq(idField, postId)
        .is("parent_id", null)
        .order("created_at", { ascending: true })
        .limit(50);

      if (!cancelled) {
        if (!error && data) {
          // Type coerce
          const typed = (data as any[]).map(d => ({
            id: d.id,
            content: d.content,
            created_at: d.created_at,
            user_id: d.user_id,
            author: Array.isArray(d.author) ? d.author[0] : d.author,
          }));
          setComments(typed);
        }
        setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [postId, source, commentTable, idField]);

  const submit = async () => {
    const content = text.trim();
    if (!content || !user) return;
    if (content.length > 1000) { toast.error("Comment too long (max 1000 chars)"); return; }

    setSubmitting(true);
    const tempId = `temp-${Date.now()}`;

    // Optimistic
    const optimistic: Comment = {
      id: tempId,
      content,
      created_at: new Date().toISOString(),
      user_id: user.id,
      author: {
        full_name: profile?.full_name ?? null,
        avatar_url: profile?.avatar_url ?? null,
        username: profile?.username ?? null,
      },
    };
    setComments(prev => [...prev, optimistic]);
    setText("");

    try {
      const insertData: any = {
        [idField]: postId,
        user_id: user.id,
        content,
      };

      const { data, error } = await supabase
        .from(commentTable as any)
        .insert(insertData)
        .select("id")
        .single();

      if (error) throw error;

      // Replace temp
      setComments(prev =>
        prev.map(c => (c.id === tempId ? { ...c, id: (data as any).id } : c))
      );
    } catch {
      // Rollback
      setComments(prev => prev.filter(c => c.id !== tempId));
      setText(content);
      toast.error("Could not post comment. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  if (loading) {
    return (
      <div className="px-4 py-3 space-y-3">
        {[1, 2].map(i => (
          <div key={i} className="flex gap-2 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex-shrink-0" />
            <div className="flex-1 space-y-1">
              <div className="h-3 bg-gray-100 rounded w-1/4" />
              <div className="h-3 bg-gray-100 rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="border-t border-gray-100">
      {/* Comments list */}
      {comments.length > 0 && (
        <div className="px-4 py-2 space-y-3 max-h-64 overflow-y-auto">
          {comments.map(c => (
            <div key={c.id} className="flex gap-2">
              <AvatarSquare
                src={c.author?.avatar_url}
                name={c.author?.full_name || "User"}
                size={32}
              />
              <div className="flex-1 min-w-0">
                <div className="bg-gray-50 rounded-xl px-3 py-2">
                  <p className="text-xs font-medium text-gray-800 mb-0.5">
                    {c.author?.full_name || "User"}
                  </p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                    {c.content}
                  </p>
                </div>
                <div className="flex items-center gap-3 mt-1 px-1">
                  <span className="text-xs text-gray-400">
                    {formatRelTime(c.created_at)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {comments.length === 0 && (
        <p className="text-center text-sm text-gray-400 py-4">
          No comments yet. Be the first!
        </p>
      )}

      {/* Input */}
      {user && (
        <div className="flex gap-2 px-4 py-3 border-t border-gray-100">
          <AvatarSquare
            src={profile?.avatar_url}
            name={profile?.full_name || "Me"}
            size={32}
          />
          <div className="flex-1 flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
            <textarea
              ref={inputRef}
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Write a comment..."
              className="flex-1 bg-transparent text-sm resize-none outline-none text-gray-700 placeholder-gray-400 max-h-20"
              rows={1}
              style={{ height: "auto", minHeight: "20px" }}
            />
            <button
              type="button"
              onClick={submit}
              disabled={!text.trim() || submitting}
              className="text-[#E8733A] disabled:opacity-30 hover:scale-110 transition-transform"
            >
              {submitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function formatRelTime(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(ts).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

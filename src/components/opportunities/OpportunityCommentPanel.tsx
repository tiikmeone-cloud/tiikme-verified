import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, MessageCircle, SendHorizontal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AvatarSquare from "@/components/ui/AvatarSquare";
import { safeDisplayName } from "@/utils/displayProfile";
import { toast } from "sonner";

interface OpportunityCommentPanelProps {
  opportunityId: string;
  onCountChange?: (delta: number) => void;
}

interface Author {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface OpportunityComment {
  id: string;
  opportunity_id: string;
  user_id: string;
  content: string;
  created_at: string | null;
  parent_id: string | null;
  reply_count?: number;
  author?: Author | null;
  __optimistic?: boolean;
}

const PAGE_SIZE = 20;
const REPLY_PAGE_SIZE = 10;

function timeAgo(d?: string | null): string {
  if (!d) return "";
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

async function attachAuthors(rows: OpportunityComment[]): Promise<OpportunityComment[]> {
  if (!rows.length) return rows;
  const ids = [...new Set(rows.map(row => row.user_id).filter(Boolean))];
  if (!ids.length) return rows;
  const { data } = await supabase.from("profiles").select("id, full_name, avatar_url").in("id", ids);
  const map: Record<string, Author> = {};
  for (const row of data || []) map[row.id] = row as Author;
  return rows.map(row => ({ ...row, author: map[row.user_id] || null }));
}

async function attachReplyCounts(opportunityId: string, rows: OpportunityComment[]): Promise<OpportunityComment[]> {
  const parentIds = rows.map(row => row.id);
  if (!parentIds.length) return rows;
  const { data } = await supabase.from("opportunity_comments")
    .select("parent_id")
    .eq("opportunity_id", opportunityId)
    .in("parent_id", parentIds);
  const counts = new Map<string, number>();
  for (const row of data || []) {
    const parentId = row.parent_id;
    if (!parentId) continue;
    counts.set(parentId, (counts.get(parentId) || 0) + 1);
  }
  return rows.map(row => ({ ...row, reply_count: counts.get(row.id) || 0 }));
}

export default function OpportunityCommentPanel({ opportunityId, onCountChange }: OpportunityCommentPanelProps) {
  const { user, profile } = useAuth();
  const [comments, setComments] = useState<OpportunityComment[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [input, setInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [expandedReplies, setExpandedReplies] = useState<Record<string, OpportunityComment[]>>({});
  const [replyVisibleCount, setReplyVisibleCount] = useState<Record<string, number>>({});
  const [sortMode, setSortMode] = useState<"top" | "newest">("top");

  const loadTopLevelComments = useCallback(async () => {
    setLoading(true);
    const [{ count }, { data }] = await Promise.all([
      supabase.from("opportunity_comments").select("id", { count: "exact", head: true }).eq("opportunity_id", opportunityId).is("parent_id", null),
      supabase.from("opportunity_comments")
        .select("id, opportunity_id, user_id, content, created_at, parent_id")
        .eq("opportunity_id", opportunityId)
        .is("parent_id", null)
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE),
    ]);
    const rows = ((data as any[]) || []).reverse() as OpportunityComment[];
    const withCounts = await attachReplyCounts(opportunityId, rows);
    const withAuthors = await attachAuthors(withCounts);
    setComments(withAuthors);
    setTotalCount(count || 0);
    setHasMore((count || 0) > withAuthors.length);
    setLoading(false);
  }, [opportunityId]);

  useEffect(() => { loadTopLevelComments(); }, [loadTopLevelComments]);

  const orderedComments = useMemo(() => {
    const rows = [...comments];
    if (sortMode === "newest") {
      return rows.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    }
    return rows.sort((a, b) => {
      const replyDiff = (b.reply_count || 0) - (a.reply_count || 0);
      if (replyDiff !== 0) return replyDiff;
      return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
    });
  }, [comments, sortMode]);

  const loadOlder = useCallback(async () => {
    if (loadingMore || !comments.length) return;
    setLoadingMore(true);
    const earliest = comments[0]?.created_at;
    const { data } = await supabase.from("opportunity_comments")
      .select("id, opportunity_id, user_id, content, created_at, parent_id")
      .eq("opportunity_id", opportunityId)
      .is("parent_id", null)
      .lt("created_at", earliest as any)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);
    const rows = ((data as any[]) || []).reverse() as OpportunityComment[];
    const withCounts = await attachReplyCounts(opportunityId, rows);
    const withAuthors = await attachAuthors(withCounts);
    setComments(prev => [...withAuthors, ...prev]);
    setHasMore((data?.length || 0) === PAGE_SIZE);
    setLoadingMore(false);
  }, [comments, loadingMore, opportunityId]);

  const toggleReplies = useCallback(async (parentId: string) => {
    if (expandedReplies[parentId]) {
      setExpandedReplies(prev => {
        const clone = { ...prev };
        delete clone[parentId];
        return clone;
      });
      return;
    }
    const { data } = await supabase.from("opportunity_comments")
      .select("id, opportunity_id, user_id, content, created_at, parent_id")
      .eq("opportunity_id", opportunityId)
      .eq("parent_id", parentId)
      .order("created_at", { ascending: true })
      .limit(100);
    const withAuthors = await attachAuthors(((data as any[]) || []) as OpportunityComment[]);
    setExpandedReplies(prev => ({ ...prev, [parentId]: withAuthors }));
    setReplyVisibleCount(prev => ({ ...prev, [parentId]: REPLY_PAGE_SIZE }));
  }, [expandedReplies, opportunityId]);

  const submitComment = useCallback(async (parentId: string | null, text: string) => {
    const content = text.trim();
    if (!user || !content || submitting) return;
    setSubmitting(true);
    const tempId = `temp-${Date.now()}`;
    const optimistic: OpportunityComment = {
      id: tempId,
      opportunity_id: opportunityId,
      user_id: user.id,
      content,
      created_at: new Date().toISOString(),
      parent_id: parentId,
      author: { id: user.id, full_name: profile?.full_name || "You", avatar_url: profile?.avatar_url || null },
      __optimistic: true,
    };

    if (parentId) {
      setExpandedReplies(prev => ({ ...prev, [parentId]: [...(prev[parentId] || []), optimistic] }));
      setComments(prev => prev.map(comment => comment.id === parentId ? { ...comment, reply_count: (comment.reply_count || 0) + 1 } : comment));
      setReplyText("");
      setReplyingTo(null);
    } else {
      setComments(prev => [...prev, optimistic]);
      setInput("");
      setTotalCount(prev => prev + 1);
    }
    onCountChange?.(1);

    const { data, error } = await supabase.from("opportunity_comments")
      .insert({ opportunity_id: opportunityId, user_id: user.id, content, parent_id: parentId } as any)
      .select("id, opportunity_id, user_id, content, created_at, parent_id")
      .single();

    setSubmitting(false);

    if (error || !data) {
      toast.error("Failed to post comment");
      if (parentId) {
        setExpandedReplies(prev => ({ ...prev, [parentId]: (prev[parentId] || []).filter(comment => comment.id !== tempId) }));
        setComments(prev => prev.map(comment => comment.id === parentId ? { ...comment, reply_count: Math.max(0, (comment.reply_count || 1) - 1) } : comment));
      } else {
        setComments(prev => prev.filter(comment => comment.id !== tempId));
        setTotalCount(prev => Math.max(0, prev - 1));
        setInput(content);
      }
      onCountChange?.(-1);
      return;
    }

    const enriched: OpportunityComment = {
      ...(data as any),
      author: optimistic.author,
    };
    if (parentId) {
      setExpandedReplies(prev => ({ ...prev, [parentId]: (prev[parentId] || []).map(comment => comment.id === tempId ? enriched : comment) }));
    } else {
      setComments(prev => prev.map(comment => comment.id === tempId ? enriched : comment));
    }
  }, [onCountChange, opportunityId, profile?.avatar_url, profile?.full_name, submitting, user]);

  const deleteComment = useCallback(async (comment: OpportunityComment) => {
    if (!user || user.id !== comment.user_id) return;
    if (comment.parent_id) {
      setExpandedReplies(prev => ({ ...prev, [comment.parent_id!]: (prev[comment.parent_id!] || []).filter(row => row.id !== comment.id) }));
      setComments(prev => prev.map(row => row.id === comment.parent_id ? { ...row, reply_count: Math.max(0, (row.reply_count || 1) - 1) } : row));
    } else {
      setComments(prev => prev.filter(row => row.id !== comment.id));
      setTotalCount(prev => Math.max(0, prev - 1));
    }
    onCountChange?.(-1);
    const { error } = await supabase.from("opportunity_comments").delete().eq("id", comment.id).eq("user_id", user.id);
    if (error) toast.error("Failed to delete");
  }, [onCountChange, user]);

  const renderRow = (comment: OpportunityComment, isReply = false) => {
    const replies = expandedReplies[comment.id];
    const visible = replyVisibleCount[comment.id] || REPLY_PAGE_SIZE;
    const shownReplies = replies?.slice(0, visible) || [];
    const isOwn = user?.id === comment.user_id;

    return (
      <div key={comment.id} className="flex" style={{ gap: 8, padding: "6px 0", paddingLeft: isReply ? 36 : 0, alignItems: "flex-start" }}>
        <AvatarSquare src={comment.author?.avatar_url} name={safeDisplayName(comment.author)} size={isReply ? 24 : 28} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link to={`/app/profile/${comment.user_id}`} className="hover:underline" style={{ fontSize: 12, fontWeight: 700, color: "var(--text-1)" }}>
              {safeDisplayName(comment.author, "Tiikme member")}
            </Link>
            <span style={{ fontSize: 11, color: "var(--text-3)" }}>{timeAgo(comment.created_at)}</span>
          </div>
          <p style={{ fontSize: 12, lineHeight: "17px", color: "var(--text-2)", marginTop: 2, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {comment.content}
          </p>
          <div className="flex items-center flex-wrap" style={{ gap: 10, marginTop: 4 }}>
            {!isReply && (
              <button type="button" onClick={() => { setReplyingTo(replyingTo === comment.id ? null : comment.id); setReplyText(""); }}
                className="cursor-pointer" style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", background: "none", border: "none", padding: 0 }}>
                Reply
              </button>
            )}
            {isOwn && !comment.__optimistic && (
              <button type="button" onClick={() => deleteComment(comment)}
                className="cursor-pointer" style={{ fontSize: 11, fontWeight: 700, color: "#EF4444", background: "none", border: "none", padding: 0 }}>
                Delete
              </button>
            )}
          </div>

          {!isReply && replyingTo === comment.id && user && (
            <div className="flex items-center mt-2" style={{ gap: 6 }}>
              <AvatarSquare src={profile?.avatar_url} name={profile?.full_name || "You"} size={22} />
              <input
                value={replyText}
                onChange={event => setReplyText(event.target.value.slice(0, 1000))}
                placeholder="Write a reply..."
                className="flex-1 outline-none"
                style={{ height: 30, borderRadius: 14, padding: "0 10px", fontSize: 12, background: "var(--surface-2)", border: "1px solid var(--border)" }}
                onKeyDown={event => {
                  if (event.key === "Enter" && replyText.trim()) submitComment(comment.id, replyText);
                }}
              />
              <button
                type="button"
                onClick={() => submitComment(comment.id, replyText)}
                disabled={!replyText.trim()}
                className="cursor-pointer disabled:opacity-50"
                style={{ color: replyText.trim() ? "#E8733A" : "var(--text-3)", background: "none", border: "none" }}
              >
                <SendHorizontal className="w-4 h-4" />
              </button>
            </div>
          )}

          {!isReply && (() => {
            const replyCount = comment.reply_count || 0;
            if (!replies && replyCount > 0) {
              return (
                <button
                  type="button"
                  onClick={() => toggleReplies(comment.id)}
                  className="cursor-pointer"
                  style={{ marginTop: 4, fontSize: 11, fontWeight: 700, color: "#E8733A", background: "none", border: "none", padding: 0 }}
                >
                  View {replyCount} {replyCount === 1 ? "reply" : "replies"}
                </button>
              );
            }
            if (!replies) return null;
            return (
              <div style={{ marginTop: 4 }}>
                {shownReplies.map(reply => renderRow(reply, true))}
                {replies.length > visible && (
                  <button
                    type="button"
                    onClick={() => setReplyVisibleCount(prev => ({ ...prev, [comment.id]: visible + REPLY_PAGE_SIZE }))}
                    className="cursor-pointer"
                    style={{ fontSize: 11, fontWeight: 700, color: "#E8733A", background: "none", border: "none", paddingLeft: 36 }}
                  >
                    Show {Math.min(REPLY_PAGE_SIZE, replies.length - visible)} more {replies.length - visible === 1 ? "reply" : "replies"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => toggleReplies(comment.id)}
                  className="cursor-pointer"
                  style={{ fontSize: 11, fontWeight: 500, color: "var(--text-3)", background: "none", border: "none", paddingLeft: 36 }}
                >
                  Hide replies
                </button>
              </div>
            );
          })()}
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        marginTop: 10,
        borderTop: "1px solid var(--border)",
        background: "rgba(250,250,251,0.92)",
        borderRadius: 12,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        maxHeight: typeof window !== "undefined" && window.innerWidth < 640 ? "60vh" : 420,
      }}
    >
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 12px", minHeight: 80 }}>
        {loading ? (
          <div className="flex justify-center items-center" style={{ padding: 20 }}>
            <Loader2 className="animate-spin w-4 h-4" style={{ color: "var(--text-3)" }} />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center" style={{ padding: 18 }}>
            <MessageCircle className="w-4 h-4 mx-auto mb-2" style={{ color: "var(--text-3)" }} />
            <p style={{ fontSize: 12, color: "var(--text-3)" }}>No comments yet. Start the conversation.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between" style={{ gap: 12, padding: "4px 0 8px" }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-1)" }}>
                {totalCount > 0 ? `${totalCount} ${totalCount === 1 ? "comment" : "comments"}` : "Comments"}
              </p>
              <div className="flex items-center gap-1" style={{ background: "#FFFFFF", borderRadius: 999, padding: 2, border: "1px solid var(--border)" }}>
                {[
                  { key: "top", label: "Top" },
                  { key: "newest", label: "Newest" },
                ].map(option => {
                  const active = sortMode === option.key;
                  return (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => setSortMode(option.key as "top" | "newest")}
                      className="cursor-pointer"
                      style={{
                        height: 24,
                        padding: "0 10px",
                        borderRadius: 999,
                        border: "none",
                        background: active ? "#F5E8E1" : "transparent",
                        color: active ? "#E8733A" : "#6B7094",
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
            {hasMore && (
              <button
                type="button"
                onClick={loadOlder}
                disabled={loadingMore}
                className="cursor-pointer disabled:opacity-50"
                style={{ width: "100%", fontSize: 12, fontWeight: 700, color: "#E8733A", background: "none", border: "none", padding: "6px 0" }}
              >
                {loadingMore ? "Loading..." : `Show ${Math.min(PAGE_SIZE, totalCount - comments.length)} more comments`}
              </button>
            )}
            {orderedComments.map(comment => renderRow(comment))}
          </>
        )}
      </div>

      {user && (
        <div className="flex items-end" style={{ gap: 8, padding: "8px 12px", borderTop: "1px solid var(--border)", background: "#FFFFFF" }}>
          <AvatarSquare src={profile?.avatar_url} name={profile?.full_name || "You"} size={28} />
          <textarea
            value={input}
            onChange={event => setInput(event.target.value.slice(0, 1000))}
            placeholder="Add a comment..."
            rows={1}
            className="flex-1 outline-none"
            style={{ minHeight: 36, maxHeight: 72, resize: "none", borderRadius: 14, padding: "8px 12px", fontSize: 13, background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-1)", lineHeight: "20px" }}
            onKeyDown={event => {
              if (event.key === "Enter" && !event.shiftKey && input.trim()) {
                event.preventDefault();
                submitComment(null, input);
              }
            }}
          />
          <button
            type="button"
            onClick={() => submitComment(null, input)}
            disabled={!input.trim() || submitting}
            className="cursor-pointer disabled:opacity-50"
            style={{ width: 36, height: 36, color: input.trim() ? "#E8733A" : "var(--text-3)", background: "none", border: "none" }}
          >
            {submitting ? <Loader2 className="animate-spin w-4 h-4" /> : <SendHorizontal className="w-4 h-4" />}
          </button>
        </div>
      )}
    </div>
  );
}

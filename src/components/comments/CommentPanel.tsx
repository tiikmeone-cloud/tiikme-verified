import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { SendHorizontal, MoreHorizontal, Pencil, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import AvatarSquare from "@/components/ui/AvatarSquare";
import MentionText from "@/components/feed/MentionText";
import { sendNotification } from "@/lib/notify";
import { safeDisplayName } from "@/utils/displayProfile";

type CommentTable = "post_comments" | "circle_post_comments";

interface Author {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string | null;
  display_preference?: string | null;
}

interface CommentRow {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  parent_id: string | null;
  created_at: string | null;
  author?: Author | null;
  __optimistic?: boolean;
}

interface CommentPanelProps {
  postId: string;
  table: CommentTable;
  postAuthorId?: string | null;
  postUrlPrefix?: string;
  onCountChange?: (delta: number) => void;
}

const PAGE_SIZE = 20;
const REPLY_PAGE_SIZE = 10;

function timeAgo(d?: string | null): string {
  if (!d) return "";
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60); if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h`;
  const dy = Math.floor(h / 24); if (dy < 7) return `${dy}d`;
  return new Date(d).toLocaleDateString();
}

async function attachAuthors(rows: CommentRow[]): Promise<CommentRow[]> {
  if (!rows.length) return rows;
  const ids = [...new Set(rows.map(r => r.user_id).filter(Boolean))];
  if (!ids.length) return rows;
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, role, display_preference")
    .in("id", ids);
  const map: Record<string, Author> = {};
  for (const p of data || []) map[p.id] = p as Author;
  return rows.map(r => ({ ...r, author: map[r.user_id] || null }));
}

function groupReplies(rows: CommentRow[]): Record<string, CommentRow[]> {
  return rows.reduce<Record<string, CommentRow[]>>((acc, row) => {
    if (!row.parent_id) return acc;
    if (!acc[row.parent_id]) acc[row.parent_id] = [];
    acc[row.parent_id].push(row);
    return acc;
  }, {});
}

const CommentPanel = ({ postId, table, postAuthorId, postUrlPrefix = "/app/post", onCountChange }: CommentPanelProps) => {
  const { user, profile } = useAuth();
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [repliesByParent, setRepliesByParent] = useState<Record<string, CommentRow[]>>({});
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});
  const [replyVisibleCount, setReplyVisibleCount] = useState<Record<string, number>>({});
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [input, setInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const taRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const loadRepliesForParents = useCallback(async (parentIds: string[]) => {
    if (!parentIds.length) return;
    const { data } = await supabase
      .from(table)
      .select("id, post_id, user_id, content, parent_id, created_at")
      .eq("post_id", postId)
      .in("parent_id", parentIds)
      .order("created_at", { ascending: true })
      .limit(500);
    const enriched = await attachAuthors(((data as any[]) || []) as CommentRow[]);
    const grouped = groupReplies(enriched);
    setRepliesByParent(prev => {
      const next = { ...prev };
      parentIds.forEach(id => { next[id] = grouped[id] || []; });
      return next;
    });
  }, [postId, table]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const [{ count }, { data }] = await Promise.all([
        supabase.from(table).select("id", { count: "exact", head: true }).eq("post_id", postId).is("parent_id", null),
        supabase.from(table)
          .select("id, post_id, user_id, content, parent_id, created_at")
          .eq("post_id", postId)
          .is("parent_id", null)
          .order("created_at", { ascending: false })
          .limit(PAGE_SIZE),
      ]);
      if (!alive) return;
      const rows = ((data as any[]) || []).reverse() as CommentRow[];
      const enriched = await attachAuthors(rows);
      if (!alive) return;
      setTotalCount(count || 0);
      setComments(enriched);
      setHasMore((count || 0) > enriched.length);
      setLoading(false);
      await loadRepliesForParents(enriched.map(r => r.id));
    })();
    return () => { alive = false; };
  }, [postId, table, loadRepliesForParents]);

  useEffect(() => {
    if (!openMenuId) return;
    const fn = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenMenuId(null);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [openMenuId]);

  const loadOlder = useCallback(async () => {
    if (loadingMore || !comments.length) return;
    setLoadingMore(true);
    const earliest = comments[0]?.created_at;
    const { data } = await supabase.from(table)
      .select("id, post_id, user_id, content, parent_id, created_at")
      .eq("post_id", postId)
      .is("parent_id", null)
      .lt("created_at", earliest as any)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);
    const rows = ((data as any[]) || []).reverse() as CommentRow[];
    const enriched = await attachAuthors(rows);
    setComments(prev => [...enriched, ...prev]);
    setHasMore((data?.length || 0) === PAGE_SIZE);
    setLoadingMore(false);
    await loadRepliesForParents(enriched.map(r => r.id));
  }, [comments, loadingMore, postId, table, loadRepliesForParents]);

  const submit = useCallback(async (parentId: string | null, text: string) => {
    const content = text.trim();
    if (!content || !user || submitting) return;
    setSubmitting(true);
    const tempId = `tmp-${Date.now()}`;
    const optimistic: CommentRow = {
      id: tempId,
      post_id: postId,
      user_id: user.id,
      content,
      parent_id: parentId,
      created_at: new Date().toISOString(),
      author: { id: user.id, full_name: profile?.full_name || "You", avatar_url: profile?.avatar_url || null, role: profile?.role || null },
      __optimistic: true,
    };

    if (parentId) {
      setRepliesByParent(prev => ({ ...prev, [parentId]: [...(prev[parentId] || []), optimistic] }));
      setExpandedReplies(prev => ({ ...prev, [parentId]: true }));
      setReplyVisibleCount(prev => ({ ...prev, [parentId]: Math.max(prev[parentId] || REPLY_PAGE_SIZE, (repliesByParent[parentId]?.length || 0) + 1) }));
      setReplyText("");
      setReplyingTo(null);
    } else {
      setComments(prev => [...prev, optimistic]);
      setInput("");
      setTotalCount(c => c + 1);
      onCountChange?.(1);
      requestAnimationFrame(() => {
        if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
      });
    }

    const { data, error } = await supabase.from(table)
      .insert({ post_id: postId, user_id: user.id, content, parent_id: parentId } as any)
      .select("id, post_id, user_id, content, parent_id, created_at")
      .single();

    setSubmitting(false);

    if (error || !data) {
      toast.error("Failed to post comment");
      if (parentId) {
        setRepliesByParent(prev => ({ ...prev, [parentId]: (prev[parentId] || []).filter(c => c.id !== tempId) }));
      } else {
        setComments(prev => prev.filter(c => c.id !== tempId));
        setTotalCount(c => Math.max(0, c - 1));
        onCountChange?.(-1);
      }
      return;
    }

    const enriched: CommentRow = { ...(data as any), author: optimistic.author };
    if (parentId) {
      setRepliesByParent(prev => ({ ...prev, [parentId]: (prev[parentId] || []).map(c => c.id === tempId ? enriched : c) }));
    } else {
      setComments(prev => prev.map(c => c.id === tempId ? enriched : c));
    }

    if (!parentId && postAuthorId && postAuthorId !== user.id) {
      sendNotification({
        userId: postAuthorId,
        actorId: user.id,
        type: "comment",
        title: `${profile?.full_name || "Someone"} commented on your post`,
        body: content.slice(0, 80),
        actionUrl: `${postUrlPrefix}/${postId}`,
      });
    }
  }, [user, profile, postId, table, submitting, postAuthorId, postUrlPrefix, onCountChange, repliesByParent]);

  const remove = useCallback(async (c: CommentRow) => {
    if (!user || c.user_id !== user.id) return;
    const isReply = !!c.parent_id;
    if (isReply) {
      setRepliesByParent(prev => ({ ...prev, [c.parent_id!]: (prev[c.parent_id!] || []).filter(r => r.id !== c.id) }));
    } else {
      setComments(prev => prev.filter(r => r.id !== c.id));
      setTotalCount(n => Math.max(0, n - 1));
      onCountChange?.(-1);
    }
    const { error } = await supabase.from(table).delete().eq("id", c.id).eq("user_id", user.id);
    if (error) toast.error("Failed to delete");
  }, [user, table, onCountChange]);

  const saveEdit = useCallback(async (c: CommentRow) => {
    const text = editText.trim();
    if (!text || !user) return;
    const { error } = await supabase.from(table).update({ content: text }).eq("id", c.id).eq("user_id", user.id);
    if (error) { toast.error("Failed to save"); return; }
    if (c.parent_id) {
      setRepliesByParent(prev => ({ ...prev, [c.parent_id!]: (prev[c.parent_id!] || []).map(r => r.id === c.id ? { ...r, content: text } : r) }));
    } else {
      setComments(prev => prev.map(r => r.id === c.id ? { ...r, content: text } : r));
    }
    setEditingId(null);
    setEditText("");
  }, [editText, user, table]);

  const renderRow = (c: CommentRow, isReply = false) => {
    const isOwn = user?.id === c.user_id;
    const isEditing = editingId === c.id;
    const replies = repliesByParent[c.id] || [];
    const repliesOpen = !!expandedReplies[c.id];
    const visible = replyVisibleCount[c.id] || REPLY_PAGE_SIZE;
    const shownReplies = replies.slice(0, visible);

    return (
      <div key={c.id} className="flex group" style={{ gap: 8, padding: "6px 0", paddingLeft: isReply ? 36 : 0, alignItems: "flex-start" }}>
        <div className="shrink-0" style={{ marginTop: 2 }}>
          <AvatarSquare src={c.author?.avatar_url} name={safeDisplayName(c.author)} size={isReply ? 24 : 28} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center" style={{ gap: 6 }}>
            <Link to={`/app/profile/${c.user_id}`} className="hover:underline truncate" style={{ fontSize: 13, fontWeight: 600, color: "#1A1A2E", maxWidth: 180 }}>
              {safeDisplayName(c.author, "Tiikme member")}
            </Link>
            <span style={{ fontSize: 11, color: "#9CA3C0" }}>·</span>
            <span style={{ fontSize: 11, color: "#9CA3C0", flexShrink: 0 }}>{timeAgo(c.created_at)}</span>
          </div>

          {isEditing ? (
            <div className="flex items-center gap-2 mt-1">
              <textarea value={editText} onChange={e => setEditText(e.target.value.slice(0, 1000))}
                rows={2} autoFocus className="flex-1 outline-none"
                style={{ fontSize: 13, padding: "6px 10px", borderRadius: 10, background: "#F5F5F5", border: "1px solid #E8E8E8", resize: "vertical" }} />
              <button type="button" onClick={() => saveEdit(c)} disabled={!editText.trim()}
                className="cursor-pointer disabled:opacity-50" style={{ fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 8, background: "#E8733A", color: "#fff", border: "none" }}>Save</button>
              <button type="button" onClick={() => { setEditingId(null); setEditText(""); }} className="cursor-pointer" style={{ fontSize: 12, fontWeight: 500, padding: "4px 8px", color: "#6B7094", background: "none", border: "none" }}>Cancel</button>
            </div>
          ) : (
            <p style={{ fontSize: 13, lineHeight: "18px", color: "#1A1A2E", marginTop: 2, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              <MentionText text={c.content} />
            </p>
          )}

          {!isReply && !isEditing && (
            <div className="flex items-center gap-3" style={{ marginTop: 2 }}>
              <button type="button" onClick={() => { setReplyingTo(replyingTo === c.id ? null : c.id); setReplyText(""); }} className="cursor-pointer" style={{ fontSize: 11, fontWeight: 600, color: "#6B7094", background: "none", border: "none", padding: 0 }}>Reply</button>
              {replies.length > 0 && (
                <button type="button" onClick={() => setExpandedReplies(prev => ({ ...prev, [c.id]: !prev[c.id] }))}
                  className="cursor-pointer" style={{ fontSize: 11, fontWeight: 600, color: "#E8733A", background: "none", border: "none", padding: 0 }}>
                  {repliesOpen ? "Hide replies" : `View ${replies.length} ${replies.length === 1 ? "reply" : "replies"}`}
                </button>
              )}
            </div>
          )}

          {!isReply && replyingTo === c.id && user && (
            <div className="flex items-center mt-2" style={{ gap: 6 }}>
              <AvatarSquare src={profile?.avatar_url} name={profile?.full_name || "You"} size={22} />
              <input value={replyText} onChange={e => setReplyText(e.target.value.slice(0, 1000))}
                placeholder="Write a reply..." autoFocus className="flex-1 outline-none"
                style={{ height: 30, borderRadius: 14, padding: "0 10px", fontSize: 12, background: "#F5F5F5", border: "1px solid #E8E8E8" }}
                onKeyDown={e => { if (e.key === "Enter" && replyText.trim()) submit(c.id, replyText); }} />
              <button type="button" onClick={() => submit(c.id, replyText)} disabled={!replyText.trim()}
                className="cursor-pointer disabled:opacity-50" style={{ color: replyText.trim() ? "#E8733A" : "#9CA3C0", background: "none", border: "none" }}>
                <SendHorizontal style={{ width: 14, height: 14 }} />
              </button>
            </div>
          )}

          {!isReply && repliesOpen && replies.length > 0 && (
            <div style={{ marginTop: 4 }}>
              {shownReplies.map(r => renderRow(r, true))}
              {replies.length > visible && (
                <button type="button" onClick={() => setReplyVisibleCount(p => ({ ...p, [c.id]: visible + REPLY_PAGE_SIZE }))}
                  className="cursor-pointer" style={{ fontSize: 11, fontWeight: 600, color: "#E8733A", background: "none", border: "none", paddingLeft: 36 }}>
                  Show {Math.min(REPLY_PAGE_SIZE, replies.length - visible)} more replies
                </button>
              )}
            </div>
          )}
        </div>

        {isOwn && !isEditing && !c.__optimistic && (
          <div className="relative shrink-0" ref={openMenuId === c.id ? menuRef : null}>
            <button type="button" onClick={() => setOpenMenuId(openMenuId === c.id ? null : c.id)}
              className="opacity-0 group-hover:opacity-100 cursor-pointer flex items-center justify-center" style={{ width: 24, height: 24, color: "#9CA3C0", background: "none", border: "none" }}>
              <MoreHorizontal style={{ width: 14, height: 14 }} />
            </button>
            {openMenuId === c.id && (
              <div className="absolute right-0 z-[60]" style={{ top: 26, width: 140, borderRadius: 10, padding: "6px 0", background: "#FFFFFF", border: "1px solid #E5E7EB", boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}>
                <button type="button" onClick={() => { setEditingId(c.id); setEditText(c.content); setOpenMenuId(null); }} className="flex items-center gap-2 w-full cursor-pointer hover:bg-[#F5F5F5]" style={{ padding: "8px 12px", fontSize: 13, color: "#1A1A2E", background: "none", border: "none" }}>
                  <Pencil style={{ width: 12, height: 12 }} /> Edit
                </button>
                <button type="button" onClick={() => { remove(c); setOpenMenuId(null); }} className="flex items-center gap-2 w-full cursor-pointer hover:bg-[#F5F5F5]" style={{ padding: "8px 12px", fontSize: 13, color: "#EF4444", background: "none", border: "none" }}>
                  <Trash2 style={{ width: 12, height: 12 }} /> Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="comment-panel" style={{ marginTop: 8, borderTop: "1px solid #F0F0F0", background: "#FAFAFB", borderRadius: 12, overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: typeof window !== "undefined" && window.innerWidth < 640 ? "60vh" : 420, transition: "max-height 200ms ease" }}>
      <div ref={listRef} style={{ flex: 1, overflowY: "auto", padding: "8px 12px", minHeight: 80 }}>
        {loading ? (
          <div className="flex justify-center items-center" style={{ padding: 20 }}><Loader2 className="animate-spin" style={{ width: 18, height: 18, color: "#9CA3C0" }} /></div>
        ) : comments.length === 0 ? (
          <p style={{ fontSize: 12, color: "#9CA3C0", textAlign: "center", padding: 16 }}>No comments yet. Be the first!</p>
        ) : (
          <>
            {hasMore && (
              <button type="button" onClick={loadOlder} disabled={loadingMore} className="w-full cursor-pointer disabled:opacity-50" style={{ fontSize: 12, fontWeight: 600, color: "#E8733A", padding: "6px 0", background: "none", border: "none" }}>
                {loadingMore ? "Loading..." : `Show ${Math.min(PAGE_SIZE, totalCount - comments.length)} more comments`}
              </button>
            )}
            {comments.map(c => renderRow(c))}
          </>
        )}
      </div>

      {user && (
        <div className="flex items-end" style={{ gap: 8, padding: "8px 12px", borderTop: "1px solid #F0F0F0", background: "#FFFFFF" }}>
          <AvatarSquare src={profile?.avatar_url} name={profile?.full_name || "You"} size={28} />
          <textarea ref={taRef} value={input} onChange={e => {
            const v = e.target.value.slice(0, 1000);
            setInput(v);
            const el = taRef.current;
            if (el) { el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 72) + "px"; }
          }} placeholder="Write a comment..." rows={1} className="flex-1 outline-none" style={{ minHeight: 36, maxHeight: 72, resize: "none", borderRadius: 14, padding: "8px 12px", fontSize: 13, background: "#F5F5F5", border: "1px solid #E8E8E8", color: "#1A1A2E", lineHeight: "20px" }} onKeyDown={e => {
            if (e.key === "Enter" && !e.shiftKey && input.trim()) {
              e.preventDefault();
              submit(null, input);
              if (taRef.current) taRef.current.style.height = "auto";
            }
          }} />
          <button type="button" onClick={() => { submit(null, input); if (taRef.current) taRef.current.style.height = "auto"; }} disabled={!input.trim() || submitting} className="cursor-pointer disabled:opacity-50 flex items-center justify-center" style={{ width: 36, height: 36, color: input.trim() ? "#E8733A" : "#9CA3C0", background: "none", border: "none" }}>
            {submitting ? <Loader2 className="animate-spin" style={{ width: 16, height: 16 }} /> : <SendHorizontal style={{ width: 18, height: 18 }} />}
          </button>
        </div>
      )}
    </div>
  );
};

export default CommentPanel;

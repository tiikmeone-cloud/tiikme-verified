import { useState, useEffect } from "react";
import { X, Search, Check, Copy, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { sendNotification } from "@/lib/notify";
import { toast } from "sonner";
import AvatarSquare from "@/components/ui/AvatarSquare";

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  postId: string;
}

const ShareModal = ({ open, onClose, postId }: ShareModalProps) => {
  const { user, profile } = useAuth();
  const [connections, setConnections] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [sentTo, setSentTo] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !user) return;
    (async () => {
      const { data: strands } = await supabase
        .from("strands")
        .select("requester_id, receiver_id")
        .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .eq("status", "accepted");
      if (!strands?.length) return;
      const ids = strands.map(s => s.requester_id === user.id ? s.receiver_id : s.requester_id).filter(Boolean) as string[];
      if (!ids.length) return;
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, role")
        .in("id", ids);
      setConnections(profiles || []);
    })();
  }, [open, user]);

  if (!open) return null;

  const filtered = search
    ? connections.filter(c => c.full_name?.toLowerCase().includes(search.toLowerCase()))
    : connections;

  const handleSend = async (receiverId: string, receiverName: string) => {
    if (!user) return;
    setSending(receiverId);
    try {
      // Insert post_share
      await supabase.from("post_shares").insert({
        post_id: postId, sender_id: user.id, receiver_id: receiverId,
      });

      // Find or create conversation
      const { data: existingConv } = await supabase
        .from("conversations")
        .select("id")
        .or(`and(participant_1.eq.${user.id},participant_2.eq.${receiverId}),and(participant_1.eq.${receiverId},participant_2.eq.${user.id})`)
        .maybeSingle();

      let convId = existingConv?.id;
      if (!convId) {
        const { data: newConv } = await supabase
          .from("conversations")
          .insert({ participant_1: user.id, participant_2: receiverId })
          .select("id")
          .single();
        convId = newConv?.id;
      }

      if (convId) {
        const postUrl = `${window.location.origin}/app/post/${postId}`;
        await supabase.from("pings").insert({
          conversation_id: convId,
          sender_id: user.id,
          content: `Shared a post: ${postUrl}`,
        });
      }

      sendNotification({
        userId: receiverId, actorId: user.id, type: "share",
        title: `${profile?.full_name || "Someone"} shared a post with you`,
        actionUrl: `/app/post/${postId}`,
      });

      setSentTo(prev => new Set(prev).add(receiverId));
      toast.success(`Shared with ${receiverName}`);
    } catch (e) {
      console.error("Share failed:", e);
      toast.error("Failed to share");
    }
    setSending(null);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/app/post/${postId}`);
    toast.success("Link copied!");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(26,26,78,0.40)", backdropFilter: "blur(8px)" }} onClick={onClose}>
      <div className="w-[90vw] max-w-[420px] max-h-[70vh] flex flex-col" style={{ background: "var(--bg-card)", borderRadius: 16, border: "1px solid var(--border-glass)", boxShadow: "0 8px 32px rgba(26,26,78,0.12)" }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between" style={{ padding: "14px 16px", borderBottom: "1px solid var(--border-subtle)" }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>Share with</h3>
          <button type="button" onClick={onClose} className="cursor-pointer" style={{ color: "var(--text-muted)" }}><X style={{ width: 18, height: 18 }} /></button>
        </div>

        {/* Search */}
        <div style={{ padding: "8px 16px" }}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2" style={{ width: 16, height: 16, color: "var(--text-muted)" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search connections..."
              className="w-full outline-none"
              style={{ height: 36, borderRadius: 10, paddingLeft: 36, paddingRight: 12, fontSize: 13, background: "var(--bg-input)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }} />
          </div>
        </div>

        {/* Connection list */}
        <div className="flex-1 overflow-y-auto" style={{ padding: "0 16px" }}>
          {filtered.length === 0 && (
            <p style={{ fontSize: 13, color: "var(--text-muted)", padding: "16px 0", textAlign: "center" }}>
              {connections.length === 0 ? "Connect with people to share posts" : "No results"}
            </p>
          )}
          {filtered.map(c => (
            <div key={c.id} className="flex items-center" style={{ gap: 10, padding: "8px 0", borderBottom: "1px solid var(--border-subtle)" }}>
              <AvatarSquare src={c.avatar_url} name={c.full_name || "User"} size={36} />
              <span className="flex-1 min-w-0 truncate" style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{c.full_name || "User"}</span>
              {sentTo.has(c.id) ? (
                <span className="flex items-center gap-1" style={{ fontSize: 12, color: "#34C759" }}><Check style={{ width: 14, height: 14 }} /> Sent</span>
              ) : (
                <button type="button" onClick={() => handleSend(c.id, c.full_name || "User")}
                  disabled={sending === c.id}
                  className="btn-primary-sm cursor-pointer" style={{ fontSize: 12, fontWeight: 600, padding: "4px 12px" }}>
                  {sending === c.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Send"}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Copy link */}
        <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border-subtle)" }}>
          <button type="button" onClick={handleCopyLink} className="flex items-center gap-2 w-full cursor-pointer justify-center"
            style={{ fontSize: 13, fontWeight: 500, color: "var(--accent)", padding: "8px 0" }}>
            <Copy style={{ width: 14, height: 14 }} /> Copy Link
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;

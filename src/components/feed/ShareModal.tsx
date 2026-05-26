import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Search, Check, Copy, Loader2, Users } from "lucide-react";
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
  const [groups, setGroups] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [sentTo, setSentTo] = useState<Set<string>>(new Set());
  const [sentGroups, setSentGroups] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !user) return;
    (async () => {
      // Fetch connections
      const { data: strands } = await supabase
        .from("strands")
        .select("requester_id, receiver_id")
        .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .eq("status", "accepted");
      if (strands?.length) {
        const ids = strands.map(s => s.requester_id === user.id ? s.receiver_id : s.requester_id).filter(Boolean) as string[];
        if (ids.length) {
          const { data: profiles } = await supabase.from("profiles").select("id, full_name, avatar_url, role").in("id", ids);
          setConnections(profiles || []);
        }
      }

      // Fetch user's groups
      const { data: memberships } = await supabase
        .from("workspace_members")
        .select("workspace_id")
        .eq("user_id", user.id)
        .eq("invitation_status", "accepted");
      if (memberships?.length) {
        const wsIds = memberships.map(m => m.workspace_id).filter(Boolean) as string[];
        const { data: workspaces } = await supabase
          .from("workspaces")
          .select("id, name, avatar_url")
          .in("id", wsIds)
          .eq("workspace_type", "group")
          .eq("is_active", true);

        // Get default channels
        if (workspaces?.length) {
          const { data: channels } = await supabase
            .from("workspace_channels")
            .select("id, workspace_id")
            .in("workspace_id", wsIds)
            .order("created_at", { ascending: true });
          const chMap = new Map<string, string>();
          (channels || []).forEach(ch => { if (!chMap.has(ch.workspace_id!)) chMap.set(ch.workspace_id!, ch.id); });
          setGroups((workspaces || []).map(ws => ({ ...ws, channel_id: chMap.get(ws.id) })));
        }
      }
    })();
  }, [open, user]);

  if (!open) return null;

  const filtered = search
    ? connections.filter(c => c.full_name?.toLowerCase().includes(search.toLowerCase()))
    : connections;

  const filteredGroups = search
    ? groups.filter(g => g.name?.toLowerCase().includes(search.toLowerCase()))
    : groups;

  const handleSend = async (receiverId: string, receiverName: string) => {
    if (!user) return;
    setSending(receiverId);
    try {
      await supabase.from("post_shares").insert({ post_id: postId, sender_id: user.id, receiver_id: receiverId });
      sendNotification({ userId: receiverId, actorId: user.id, type: "share", title: `${profile?.full_name || "Someone"} shared a post with you`, actionUrl: `/app/post/${postId}` });
      setSentTo(prev => new Set(prev).add(receiverId));
      toast.success(`Shared with ${receiverName}`);
    } catch { toast.error("Failed to share"); }
    setSending(null);
  };

  const handleSendToGroup = async (group: any) => {
    if (!user || !group.channel_id) return;
    setSending(`group-${group.id}`);
    try {
      const postUrl = `${window.location.origin}/app/post/${postId}`;
      await supabase.from("workspace_messages").insert({
        channel_id: group.channel_id, sender_id: user.id,
        content: `Shared a post: ${postUrl}`,
      });
      await supabase.from("workspaces").update({ last_message_at: new Date().toISOString() } as any).eq("id", group.id);
      setSentGroups(prev => new Set(prev).add(group.id));
      toast.success(`Shared to ${group.name}`);
    } catch { toast.error("Failed to share"); }
    setSending(null);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/app/post/${postId}`);
    toast.success("Link copied!");
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center md:pl-[230px]" style={{ background: "rgba(0,0,0,0.40)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }} onClick={onClose} onKeyDown={e => { if (e.key === "Escape") onClose(); }}>
      <div className="w-[90vw] max-w-[480px] max-h-[70vh] flex flex-col" style={{ background: "#FFFFFF", borderRadius: 20, border: "1px solid #E5E7EB", boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between" style={{ padding: "14px 16px", borderBottom: "1px solid var(--border-subtle)" }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>Share with</h3>
          <button type="button" onClick={onClose} className="cursor-pointer" style={{ color: "var(--text-muted)" }}><X style={{ width: 18, height: 18 }} /></button>
        </div>

        {/* Search */}
        <div style={{ padding: "8px 16px" }}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2" style={{ width: 16, height: 16, color: "var(--text-muted)" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search connections or groups..."
              className="w-full outline-none"
              style={{ height: 36, borderRadius: 10, paddingLeft: 36, paddingRight: 12, fontSize: 13, background: "var(--bg-input)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }} />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto" style={{ padding: "0 16px" }}>
          {filtered.length === 0 && filteredGroups.length === 0 && (
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

          {/* Groups section */}
          {filteredGroups.length > 0 && (
            <>
              <p className="text-[11px] font-semibold uppercase mt-3 mb-1" style={{ color: "var(--text-muted)" }}>Groups</p>
              {filteredGroups.map(g => (
                <div key={g.id} className="flex items-center" style={{ gap: 10, padding: "8px 0", borderBottom: "1px solid var(--border-subtle)" }}>
                  <div className="w-9 h-9 flex items-center justify-center shrink-0" style={{ borderRadius: 0, background: "#E8733A", color: "#fff", fontSize: 13, fontWeight: 700 }}>
                    {g.avatar_url ? <img src={g.avatar_url} alt="" loading="lazy" className="w-full h-full object-cover" /> :
                      <Users style={{ width: 16, height: 16 }} />}
                  </div>
                  <span className="flex-1 min-w-0 truncate" style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{g.name}</span>
                  {sentGroups.has(g.id) ? (
                    <span className="flex items-center gap-1" style={{ fontSize: 12, color: "#34C759" }}><Check style={{ width: 14, height: 14 }} /> Sent</span>
                  ) : (
                    <button type="button" onClick={() => handleSendToGroup(g)}
                      disabled={sending === `group-${g.id}`}
                      className="btn-primary-sm cursor-pointer" style={{ fontSize: 12, fontWeight: 600, padding: "4px 12px" }}>
                      {sending === `group-${g.id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : "Send"}
                    </button>
                  )}
                </div>
              ))}
            </>
          )}
        </div>

        {/* Copy link */}
        <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border-subtle)" }}>
          <button type="button" onClick={handleCopyLink} className="flex items-center gap-2 w-full cursor-pointer justify-center"
            style={{ fontSize: 13, fontWeight: 500, color: "var(--accent)", padding: "8px 0" }}>
            <Copy style={{ width: 14, height: 14 }} /> Copy Link
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ShareModal;

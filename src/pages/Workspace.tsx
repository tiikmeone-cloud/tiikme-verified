import { PageSEO } from "@/hooks/usePageSEO";
import { useState, useEffect, useCallback, useRef } from "react";
import SubscriptionGate from "@/components/SubscriptionGate";
import AvatarSquare from "@/components/ui/AvatarSquare";
import {
  Users, Plus, Search, Send, Trash2, X, Settings, Paperclip,
  ChevronLeft, Check, XCircle, Loader2, UserPlus, MessageCircle,
  Image as ImageIcon, ArrowLeft
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useWorkspaces, type WorkspaceGroup, type GroupMember, type GroupMessage } from "@/hooks/useWorkspaces";
import GlassModal from "@/components/ui/GlassModal";
import { cleanUsername } from "@/lib/cleanUsername";
import { resolveMessageAttachmentUrl, safeAttachmentPath } from "@/lib/privateAttachments";

/* ── Helpers ── */
const AVATAR_COLORS = ["#E8733A", "#2D7A4F", "#C44A1F", "#7E22CE", "#166534", "#B7640A"];
const hashColor = (s: string) => AVATAR_COLORS[Math.abs([...s].reduce((a, c) => a + c.charCodeAt(0), 0)) % AVATAR_COLORS.length];
const initials = (name: string) => name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";
const formatTime = (d: string) => {
  const date = new Date(d);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
};
const formatDateSep = (d: string) => {
  const date = new Date(d);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) return "Today";
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
};

const URL_RE = /(https?:\/\/[^\s<]+)/g;

/* Renders text with clickable URLs */
const ChatMessageContent = ({ text }: { text: string }) => {
  if (!text) return null;
  const parts = text.split(URL_RE);
  return (
    <>
      {parts.map((part, i) => {
        if (URL_RE.test(part)) {
          URL_RE.lastIndex = 0;
          let url = part;
          let trailing = "";
          const trailingMatch = url.match(/[.,;:!?)]+$/);
          if (trailingMatch) { trailing = trailingMatch[0]; url = url.slice(0, -trailing.length); }
          return (
            <span key={i}>
              <a href={url} target="_blank" rel="noopener noreferrer"
                className="font-medium hover:underline" style={{ color: "#E8733A" }}>
                {url.replace(/^https?:\/\/(www\.)?/, "").slice(0, 40)}
                {url.replace(/^https?:\/\/(www\.)?/, "").length > 40 ? "..." : ""}
              </a>
              {trailing}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
};

const WorkspaceAttachment = ({ msg }: { msg: GroupMessage }) => {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setUrl(null);
    if (!msg.attachment_url) return;

    resolveMessageAttachmentUrl(msg.attachment_url)
      .then((resolved) => { if (alive) setUrl(resolved); })
      .catch(() => { if (alive) setUrl(null); });

    return () => { alive = false; };
  }, [msg.attachment_url]);

  if (!msg.attachment_url) return null;

  return msg.attachment_type?.startsWith("image/") ? (
    <img
      src={url || ""}
      alt=""
      loading="lazy"
      className="mt-1 rounded-md cursor-pointer"
      style={{ maxWidth: 240, maxHeight: 200, objectFit: "cover" }}
      onClick={() => url && window.open(url, "_blank", "noopener,noreferrer")}
    />
  ) : (
    <a
      href={url || undefined}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1 mt-1 text-[11px] font-semibold"
      style={{ color: "#E8733A" }}
      onClick={(event) => { if (!url) event.preventDefault(); }}
    >
      <Paperclip className="w-3 h-3" /> {msg.attachment_name || "Download"}
    </a>
  );
};


/* ══════════════════════════════════════════════════════════════ */
/*  AVATAR COMPONENT                                             */
/* ══════════════════════════════════════════════════════════════ */
const SquareAvatar = ({ url, name, size = 48, color }: { url?: string | null; name: string; size?: number; color?: string }) => {
  const fixUrl = (u: string) => u.replace("/storage/v1/render/image/", "/storage/v1/object/public/");
  return (
    <div className="flex items-center justify-center overflow-hidden shrink-0"
      style={{
        width: size, height: size, borderRadius: 0,
        background: url ? "transparent" : (color || hashColor(name)),
        border: "2px solid rgba(255,255,255,0.30)",
        fontSize: Math.max(size * 0.3, 10), fontWeight: 700, color: "#fff",
      }}>
      {url ? <img src={fixUrl(url)} alt="" loading="lazy" className="w-full h-full object-cover" /> : initials(name)}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════ */
/*  CREATE GROUP MODAL                                           */
/* ══════════════════════════════════════════════════════════════ */
interface CreateGroupModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  onCreate: (name: string, desc: string, avatar: string | null, memberIds: string[]) => Promise<any>;
}

const CreateGroupModal = ({ open, onClose, userId, onCreate }: CreateGroupModalProps) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [search, setSearch] = useState("");
  const [connections, setConnections] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  // Fetch connections
  useEffect(() => {
    if (!open || step !== 2) return;
    (async () => {
      const { data: strands } = await supabase.from("strands")
        .select("requester_id, receiver_id")
        .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)
        .eq("status", "accepted");

      if (!strands || strands.length === 0) { setConnections([]); return; }

      const ids = strands.map(s => s.requester_id === userId ? s.receiver_id : s.requester_id).filter(Boolean) as string[];
      const uniqueIds = [...new Set(ids)];

      const { data: profiles } = await supabase.from("profiles")
        .select("id, full_name, avatar_url, role, username")
        .in("id", uniqueIds);

      setConnections(profiles || []);
    })();
  }, [open, step, userId]);

  const filteredConnections = connections.filter(c =>
    !search.trim() || c.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async () => {
    if (!name.trim()) { toast.error("Group name is required"); return; }
    setCreating(true);
    try {
      const result = await onCreate(name.trim(), desc.trim(), null, selectedIds);
      if (result) {
        toast.success("Group created");
        setStep(1); setName(""); setDesc(""); setSelectedIds([]);
        onClose();
      } else {
        toast.error("Failed to create group — check console for details");
      }
    } catch (e: any) {
      console.error("Group creation error:", e);
      toast.error("Failed to create group: " + (e?.message || "Unknown error"));
    }
    setCreating(false);
  };

  if (!open) return null;

  return (
    <GlassModal open={open} onClose={onClose} title="Create Group" icon={Users} accentColor="#E8733A">
      {step === 1 ? (
        <div className="space-y-4">
          <div>
            <label className="text-[12px] font-semibold mb-1 block" style={{ color: "rgba(255,255,255,0.7)" }}>Group Name *</label>
            <input value={name} onChange={e => setName(e.target.value.slice(0, 60))}
              placeholder="Group name"
              className="w-full h-10 rounded-[10px] px-3 text-[14px] outline-none"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)", color: "#fff" }} />
          </div>
          <div>
            <label className="text-[12px] font-semibold mb-1 block" style={{ color: "rgba(255,255,255,0.7)" }}>Description</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value.slice(0, 200))}
              placeholder="What's this group about?"
              className="w-full min-h-[60px] rounded-[10px] px-3 py-2 text-[14px] outline-none resize-none"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)", color: "#fff" }} />
          </div>
          <button type="button" onClick={() => { if (!name.trim()) { toast.error("Enter a group name"); return; } setStep(2); }}
            className="w-full h-10 rounded-[10px] text-[14px] font-semibold cursor-pointer"
            style={{ background: "linear-gradient(135deg, #E8733A, #FF9A62)", color: "#fff" }}>
            Next: Add Members
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <button type="button" onClick={() => setStep(1)} className="flex items-center gap-1 text-[12px] cursor-pointer" style={{ color: "rgba(255,255,255,0.6)" }}>
            <ArrowLeft className="w-3 h-3" /> Back
          </button>

          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search people to add..."
            className="w-full h-10 rounded-[10px] px-3 text-[13px] outline-none"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)", color: "#fff" }} />

          {/* Selected chips */}
          {selectedIds.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {selectedIds.map(id => {
                const p = connections.find(c => c.id === id);
                return (
                  <span key={id} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px]"
                    style={{ background: "rgba(232,115,58,0.20)", color: "#FF9A62" }}>
                    {p?.full_name?.split(" ")[0] || "User"}
                    <button type="button" onClick={() => setSelectedIds(prev => prev.filter(x => x !== id))} className="cursor-pointer">
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                );
              })}
            </div>
          )}

          {/* Connection list */}
          <div className="max-h-[200px] overflow-y-auto space-y-1">
            {filteredConnections.length === 0 ? (
              <p className="text-[12px] text-center py-4" style={{ color: "rgba(255,255,255,0.5)" }}>
                {connections.length === 0 ? "No connections yet" : "No results"}
              </p>
            ) : filteredConnections.map(c => {
              const selected = selectedIds.includes(c.id);
              return (
                <div key={c.id} className="flex items-center gap-2 py-2 px-2 rounded-lg"
                  style={{ background: selected ? "rgba(232,115,58,0.10)" : "transparent" }}>
                  <SquareAvatar url={c.avatar_url} name={c.full_name || "?"} size={32} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold truncate" style={{ color: "#fff" }}>{c.full_name}</p>
                    <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.5)" }}>{c.role || ""}</p>
                  </div>
                  <button type="button"
                    onClick={() => setSelectedIds(prev => selected ? prev.filter(x => x !== c.id) : [...prev, c.id])}
                    className="h-7 px-3 rounded-lg text-[11px] font-semibold cursor-pointer"
                    style={{
                      background: selected ? "rgba(220,38,38,0.15)" : "rgba(232,115,58,0.15)",
                      color: selected ? "#EF4444" : "#E8733A",
                      border: `1px solid ${selected ? "rgba(220,38,38,0.25)" : "rgba(232,115,58,0.25)"}`,
                    }}>
                    {selected ? "Remove" : "Add"}
                  </button>
                </div>
              );
            })}
          </div>

          <button type="button" onClick={handleCreate}
            disabled={creating}
            className="w-full h-10 rounded-[10px] text-[14px] font-semibold cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg, #E8733A, #FF9A62)", color: "#fff" }}>
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : `Create Group (${selectedIds.length + 1} ${selectedIds.length + 1 === 1 ? "member" : "members"})`}
          </button>
        </div>
      )}
    </GlassModal>
  );
};

/* ══════════════════════════════════════════════════════════════ */
/*  GROUP CHAT VIEW                                              */
/* ══════════════════════════════════════════════════════════════ */
interface GroupChatProps {
  group: WorkspaceGroup;
  userId: string;
  onBack: () => void;
  onSendMessage: (channelId: string, content: string, attachment?: { url: string; type: string; name: string }) => Promise<void>;
  onDeleteMessage: (msgId: string) => Promise<void>;
  fetchMessages: (channelId: string) => Promise<GroupMessage[]>;
  fetchMembers: (wsId: string) => Promise<GroupMember[]>;
  onLeave: (wsId: string) => Promise<void>;
}

const GroupChat = ({ group, userId, onBack, onSendMessage, onDeleteMessage, fetchMessages, fetchMembers, onLeave }: GroupChatProps) => {
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [msgInput, setMsgInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState<{ file: File; url: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelId = group.default_channel_id;

  // Load messages and members
  useEffect(() => {
    if (!channelId) return;
    setLoading(true);
    Promise.all([fetchMessages(channelId), fetchMembers(group.id)])
      .then(([msgs, mems]) => { setMessages(msgs); setMembers(mems); })
      .finally(() => setLoading(false));
  }, [channelId, group.id, fetchMessages, fetchMembers]);

  // Scroll to bottom
  useEffect(() => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }, [messages.length]);

  // Realtime
  useEffect(() => {
    if (!channelId) return;
    const sub = supabase.channel(`ws-msgs-${channelId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "workspace_messages", filter: `channel_id=eq.${channelId}` },
        async (payload) => {
          const msg = payload.new as any;
          const { data: prof } = await supabase.from("profiles").select("id, full_name, avatar_url").eq("id", msg.sender_id).maybeSingle();
          setMessages(prev => [...prev, { ...msg, sender: prof }]);
        })
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [channelId]);

  const handleSend = async () => {
    if ((!msgInput.trim() && !pendingAttachment) || !channelId) return;
    setSending(true);
    try {
      let attachment: { url: string; type: string; name: string } | undefined;
      if (pendingAttachment) {
        const file = pendingAttachment.file;
        const { validateUpload } = await import("@/lib/uploadValidation");
        const verr = validateUpload(file, { maxBytes: 25 * 1024 * 1024, allowImages: true, allowPdf: true, allowOffice: true });
        if (verr) { toast.error(verr); setSending(false); return; }
        const path = safeAttachmentPath(userId, file.name);
        const { error } = await supabase.storage.from("message-attachments").upload(path, file);
        if (error) { toast.error("Upload failed"); setSending(false); return; }
        attachment = { url: path, type: file.type, name: file.name };
      }
      await onSendMessage(channelId, msgInput.trim(), attachment);
      setMsgInput("");
      setPendingAttachment(null);
    } catch {
      toast.error("Failed to send");
    }
    setSending(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingAttachment({ file, url: URL.createObjectURL(file) });
    e.target.value = "";
  };

  const handleDeleteMsg = async (msgId: string) => {
    await onDeleteMessage(msgId);
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, is_deleted: true, content: "This message was deleted", attachment_url: null } : m));
  };

  const acceptedMembers = members.filter(m => m.invitation_status === "accepted");
  const isAdmin = members.find(m => m.user_id === userId)?.role === "admin";

  let lastDateSep = "";

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
        <button type="button" onClick={onBack} className="cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
          style={{ color: "#9CA3C0" }}>
          <ChevronLeft className="w-5 h-5" />
        </button>
        <SquareAvatar url={group.avatar_url} name={group.name} size={40} />
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-semibold truncate" style={{ color: "#1A1A2E" }}>{group.name}</p>
          <p className="text-[11px]" style={{ color: "#9CA3C0" }}>{acceptedMembers.length} members</p>
        </div>
        <button type="button" onClick={() => setShowSettings(!showSettings)}
          className="cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center" style={{ color: "#9CA3C0" }}>
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="px-4 py-3 space-y-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)" }}>
          <p className="text-[12px] font-semibold" style={{ color: "#6B7094" }}>Members ({acceptedMembers.length})</p>
          <div className="max-h-[150px] overflow-y-auto space-y-1">
            {acceptedMembers.map(m => (
              <div key={m.id} className="flex items-center gap-2 py-1">
                <SquareAvatar url={m.profile?.avatar_url} name={m.profile?.full_name || "?"} size={24} />
                <span className="text-[12px] flex-1" style={{ color: "#1A1A2E" }}>{m.profile?.full_name}</span>
                <span className="text-[10px] font-semibold" style={{ color: m.role === "admin" ? "#E8733A" : "#9CA3C0" }}>
                  {m.role === "admin" ? "Admin" : "Member"}
                </span>
              </div>
            ))}
          </div>
          <button type="button" onClick={async () => { await onLeave(group.id); onBack(); toast.success("Left group"); }}
            className="w-full h-8 rounded-lg text-[12px] font-semibold cursor-pointer"
            style={{ background: "rgba(220,38,38,0.08)", color: "#EF4444", border: "1px solid rgba(220,38,38,0.15)" }}>
            Leave Group
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin" style={{ color: "#9CA3C0" }} /></div>
        ) : messages.length === 0 ? (
          <div className="text-center py-16">
            <MessageCircle className="w-10 h-10 mx-auto mb-2" style={{ color: "#9CA3C0" }} />
            <p className="text-[14px] font-semibold" style={{ color: "#1A1A2E" }}>Welcome to {group.name}</p>
            <p className="text-[12px]" style={{ color: "#9CA3C0" }}>Start the conversation</p>
          </div>
        ) : messages.map(msg => {
          const isOwn = msg.sender_id === userId;
          const dateSep = formatDateSep(msg.created_at || "");
          let showSep = false;
          if (dateSep !== lastDateSep) { showSep = true; lastDateSep = dateSep; }

          return (
            <div key={msg.id}>
              {showSep && (
                <div className="flex items-center gap-3 my-3">
                  <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.15)" }} />
                  <span className="text-[10px] font-semibold" style={{ color: "#9CA3C0" }}>{dateSep}</span>
                  <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.15)" }} />
                </div>
              )}
              <div className={`flex gap-2 group ${isOwn ? "flex-row-reverse" : ""}`}>
                {!isOwn && (
                  <SquareAvatar url={msg.sender?.avatar_url} name={msg.sender?.full_name || "?"} size={28} />
                )}
                <div className={`max-w-[70%] ${isOwn ? "items-end" : ""}`}>
                  {!isOwn && (
                    <p className="text-[11px] font-semibold mb-0.5" style={{ color: "#E8733A" }}>{msg.sender?.full_name || "User"}</p>
                  )}
                  <div className={`rounded-[10px] px-3 py-2 relative ${msg.is_deleted ? "opacity-50" : ""}`}
                    style={{
                      background: isOwn ? "rgba(232,115,58,0.10)" : "rgba(255,255,255,0.15)",
                      border: `1px solid ${isOwn ? "rgba(232,115,58,0.20)" : "rgba(255,255,255,0.25)"}`,
                      maxWidth: "100%",
                    }}>
                    {msg.is_deleted ? (
                      <p className="text-[12px] italic" style={{ color: "#9CA3C0" }}>This message was deleted</p>
                    ) : (
                      <>
                        <p className="text-[13px] whitespace-pre-wrap break-words" style={{ color: "#1A1A2E" }}>
                          <ChatMessageContent text={msg.content} />
                        </p>
                        <WorkspaceAttachment msg={msg} />
                      </>
                    )}
                    {isOwn && !msg.is_deleted && (
                      <button type="button" onClick={() => handleDeleteMsg(msg.id)}
                        className="absolute -top-2 -right-2 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.10)", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                        <Trash2 className="w-3 h-3" style={{ color: "#EF4444" }} />
                      </button>
                    )}
                  </div>
                  <p className={`text-[9px] mt-0.5 ${isOwn ? "text-right" : ""}`} style={{ color: "#9CA3C0" }}>{formatTime(msg.created_at || "")}</p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="px-3 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.15)" }}>
        {pendingAttachment && (
          <div className="flex items-center gap-2 mb-2 px-3 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.15)" }}>
            {pendingAttachment.file.type.startsWith("image/") ? (
              <img src={pendingAttachment.url} alt="" className="w-10 h-10 rounded object-cover" />
            ) : (
              <Paperclip className="w-4 h-4" style={{ color: "#E8733A" }} />
            )}
            <span className="text-[12px] flex-1 truncate" style={{ color: "#1A1A2E" }}>{pendingAttachment.file.name}</span>
            <button type="button" onClick={() => { URL.revokeObjectURL(pendingAttachment.url); setPendingAttachment(null); }} className="cursor-pointer">
              <X className="w-3.5 h-3.5" style={{ color: "#9CA3C0" }} />
            </button>
          </div>
        )}
        <div className="flex items-center gap-2">
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} />
          <button type="button" onClick={() => fileInputRef.current?.click()}
            className="w-9 h-9 flex items-center justify-center cursor-pointer rounded-full"
            style={{ color: "#9CA3C0" }}>
            <Paperclip className="w-5 h-5" />
          </button>
          <input value={msgInput} onChange={e => setMsgInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 h-10 rounded-full px-4 text-[13px] outline-none"
            style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.20)", color: "#1A1A2E" }}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }} />
          <button type="button" onClick={handleSend} disabled={sending || (!msgInput.trim() && !pendingAttachment)}
            className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer disabled:opacity-40"
            style={{ background: "linear-gradient(135deg, #E8733A, #FF9A62)" }}>
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════ */
/*  MAIN WORKSPACE PAGE                                          */
/* ══════════════════════════════════════════════════════════════ */
export default function Workspace() {
  const { user, profile } = useAuth();
  const isInstitution = profile?.account_type === "institution";
  const userId = user?.id;

  const { groups, loading, createGroup, acceptInvite, declineInvite, leaveGroup, fetchMembers, fetchMessages, sendMessage, deleteMessage, fetchGroups } = useWorkspaces(userId);

  const [showCreate, setShowCreate] = useState(false);
  const [activeGroup, setActiveGroup] = useState<WorkspaceGroup | null>(null);
  const [mobileShowChat, setMobileShowChat] = useState(false);

  const handleCloseCreate = () => {
    setShowCreate(false);
    fetchGroups();
  };

  // Separate pending invites from accepted groups
  const pendingInvites = groups.filter(g => g.invitation_status === "pending");
  const acceptedGroups = groups.filter(g => g.invitation_status === "accepted");

  const openGroup = (g: WorkspaceGroup) => {
    setActiveGroup(g);
    setMobileShowChat(true);
  };

  const handleBack = () => {
    setActiveGroup(null);
    setMobileShowChat(false);
  };

  if (!userId) return null;

  if (loading) return (
    <div className="max-w-[960px] mx-auto px-4 py-8">
      <div className="animate-pulse space-y-4">
        <div className="h-10 w-1/3 rounded-xl" style={{ background: "rgba(255,255,255,0.15)" }} />
        <div className="h-64 rounded-xl" style={{ background: "rgba(255,255,255,0.15)" }} />
      </div>
    </div>
  );

  /* ── LAYOUT ── */
  return (
    <>
    <PageSEO title="Workspace | Tiikme" description="Your private workspace for team collaboration on Tiikme." noIndex />
    <SubscriptionGate feature="workspace">
    <div className="max-w-[960px] mx-auto" style={{ height: "calc(100vh - 80px)" }}>
      <div className="flex h-full" style={{ gap: 0 }}>

        {/* LEFT PANEL — Group List */}
        <div className={`flex flex-col ${mobileShowChat ? "hidden md:flex" : "flex"}`}
          style={{ width: 280, minWidth: 280, borderRight: "1px solid rgba(255,255,255,0.12)", padding: "16px 0" }}>

          {/* Header */}
          <div className="px-4 pb-3 flex items-center justify-between">
            <h1 className="text-[18px] font-bold" style={{ color: "#1A1A2E" }}>Groups</h1>
            <button type="button" onClick={() => setShowCreate(true)}
              className="h-8 px-3 rounded-lg text-[12px] font-semibold cursor-pointer flex items-center gap-1"
              style={{ background: "linear-gradient(135deg, #E8733A, #FF9A62)", color: "#fff" }}>
              <Plus className="w-3.5 h-3.5" /> Create
            </button>
          </div>

          {/* Pending Invitations */}
          {pendingInvites.length > 0 && (
            <div className="px-4 pb-2">
              <p className="text-[11px] font-semibold uppercase mb-2" style={{ color: "#FFB800" }}>Invitations ({pendingInvites.length})</p>
              {pendingInvites.map(g => (
                <div key={g.id} className="mb-2 p-3 rounded-xl" style={{ background: "rgba(255,184,0,0.08)", border: "1px solid rgba(255,184,0,0.20)" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <SquareAvatar url={g.avatar_url} name={g.name} size={36} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold truncate" style={{ color: "#1A1A2E" }}>{g.name}</p>
                      <p className="text-[11px]" style={{ color: "#9CA3C0" }}><span className="num">{g.member_count || 0}</span> members</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => acceptInvite(g.id)}
                      className="flex-1 h-7 rounded-lg text-[11px] font-semibold cursor-pointer flex items-center justify-center gap-1"
                      style={{ background: "rgba(52,199,89,0.12)", color: "#34C759", border: "1px solid rgba(52,199,89,0.25)" }}>
                      <Check className="w-3 h-3" /> Join
                    </button>
                    <button type="button" onClick={() => declineInvite(g.id)}
                      className="flex-1 h-7 rounded-lg text-[11px] font-semibold cursor-pointer flex items-center justify-center gap-1"
                      style={{ background: "rgba(220,38,38,0.08)", color: "#EF4444", border: "1px solid rgba(220,38,38,0.15)" }}>
                      <XCircle className="w-3 h-3" /> Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Group List */}
          <div className="flex-1 overflow-y-auto px-2">
            {acceptedGroups.length === 0 && pendingInvites.length === 0 ? (
              <div className="text-center py-12 px-4">
                <Users className="w-12 h-12 mx-auto mb-3" style={{ color: "#9CA3C0" }} />
                <p className="text-[14px] font-semibold mb-1" style={{ color: "#1A1A2E" }}>No groups yet</p>
                <p className="text-[12px] mb-4" style={{ color: "#9CA3C0" }}>Create a group to chat with your connections</p>
                <button type="button" onClick={() => setShowCreate(true)}
                  className="h-10 px-6 rounded-xl text-[13px] font-semibold cursor-pointer"
                  style={{ background: "linear-gradient(135deg, #E8733A, #FF9A62)", color: "#fff" }}>
                  <Plus className="w-4 h-4 inline mr-1" /> Create Group
                </button>
              </div>
            ) : acceptedGroups.map(g => {
              const isActive = activeGroup?.id === g.id;
              return (
                <button type="button" key={g.id} onClick={() => openGroup(g)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-left mb-1 transition-all"
                  style={{
                    background: isActive ? "rgba(232,115,58,0.10)" : "transparent",
                    borderLeft: isActive ? "2px solid #E8733A" : "2px solid transparent",
                  }}>
                  <SquareAvatar url={g.avatar_url} name={g.name} size={36} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold truncate" style={{ color: "#1A1A2E" }}>{g.name}</p>
                    <p className="text-[11px] truncate" style={{ color: "#9CA3C0" }}>
                      <span className="num">{g.member_count || 0}</span> members
                    </p>
                  </div>
                  {g.last_message_at && (
                    <span className="text-[10px] shrink-0" style={{ color: "#9CA3C0" }}>
                      {formatTime(g.last_message_at)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT PANEL — Chat Area */}
        <div className={`flex-1 flex flex-col min-w-0 ${!mobileShowChat && !activeGroup ? "" : ""} ${mobileShowChat ? "flex" : "hidden md:flex"}`}>
          {activeGroup && activeGroup.default_channel_id ? (
            <GroupChat
              group={activeGroup}
              userId={userId}
              onBack={handleBack}
              onSendMessage={sendMessage}
              onDeleteMessage={deleteMessage}
              fetchMessages={fetchMessages}
              fetchMembers={fetchMembers}
              onLeave={leaveGroup}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 mx-auto mb-3" style={{ color: "#9CA3C0" }} />
                <p className="text-[16px] font-semibold" style={{ color: "#1A1A2E" }}>Select a group to start chatting</p>
                <p className="text-[13px] mt-1" style={{ color: "#9CA3C0" }}>Or create a new group with your connections</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Group Modal */}
      <CreateGroupModal
        open={showCreate}
        onClose={handleCloseCreate}
        userId={userId}
        onCreate={createGroup}
      />
    </div>
    </SubscriptionGate>
    </>
  );
}

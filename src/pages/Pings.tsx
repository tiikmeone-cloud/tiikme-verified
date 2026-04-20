import AvatarSquare from "@/components/ui/AvatarSquare";
import React from "react";
import { useState, useRef, useEffect } from "react";
import { MessageCircle, Search, Send, Paperclip, PenSquare, X, Shield, ArrowLeft, FileText, Briefcase, Download, Trash2, ArrowUp, Image as ImageIcon, Lock, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import EmptyState from "@/components/EmptyState";
import { useAuth } from "@/contexts/AuthContext";
import { useConversations } from "@/hooks/useConversations";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import EncryptionKeyManager from "@/components/pings/EncryptionKeyManager";

import { validateUpload } from "@/lib/uploadValidation";

const ROLE_COLORS: Record<string, string> = { faculty: "#92400E", professional: "#0369A1", doctor: "#0E7490", student: "#4F46E5", skilled_trade: "#C2410C", hr: "#6B21A8", government: "#166534" };

/** Render URLs in message text as clickable links */
function renderLinkedText(text: string, isOwnMessage: boolean): React.ReactNode {
  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  const parts = text.split(urlRegex);
  if (parts.length === 1) return text;
  return parts.map((part, i) => {
    if (urlRegex.test(part)) {
      // Reset lastIndex since global regex is stateful
      urlRegex.lastIndex = 0;
      return (
        <a key={i} href={part} target="_blank" rel="noopener noreferrer"
          style={{ color: isOwnMessage ? "rgba(255,255,255,0.9)" : "#4A90D9", textDecoration: "underline", wordBreak: "break-all" }}>
          {part}
        </a>
      );
    }
    urlRegex.lastIndex = 0;
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

const ringStyle = (verified: boolean): React.CSSProperties => {
  if (verified) return { boxShadow: "0 0 0 2px var(--surface), 0 0 0 4.5px #F59E0B, 0 0 12px rgba(245,158,11,0.45)" };
  return {};
};

function shortTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "now";
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return d === 1 ? "1d" : `${d}d`;
}

function getLastMessagePreview(convo: any): string {
  if (!convo.last_message && !convo.last_message_type) return "";
  if (convo.last_message_type === "pdf" || convo.last_message_type === "document") return "📄 Document";
  if (convo.last_message_type === "image") return "🖼 Photo";
  const msg = convo.last_message || "";
  return msg.length > 35 ? msg.substring(0, 35) + "..." : msg;
}

function dateSeparator(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const today = new Date();
  const diff = Math.floor((today.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: d.getFullYear() !== today.getFullYear() ? "numeric" : undefined });
}

const Pings = () => {
  const { user, profile } = useAuth();
  const { conversations, loading, activeConvoId, messages, messagesLoading, loadMessages, sendMessage, deleteMessage, findOrCreateConversation } = useConversations(user?.id);
  const [tab, setTab] = useState<"chats" | "applications" | "requests">("chats");
  const [search, setSearch] = useState("");
  const [newMsg, setNewMsg] = useState("");
  const [showMobileList, setShowMobileList] = useState(true);
  const [dismissedBanner, setDismissedBanner] = useState(false);
  const [showKeyManager, setShowKeyManager] = useState(false);
  const [showNewPing, setShowNewPing] = useState(false);
  const [newPingSearch, setNewPingSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // BUG FIX 2: Attachment preview state — upload first, send on button click
  const [pendingAttachment, setPendingAttachment] = useState<{ url: string; type: string; name: string; size: number; previewUrl?: string } | null>(null);
  const [uploading, setUploading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeConvo = conversations.find(c => c.id === activeConvoId);
  const filteredConvos = conversations.filter(c =>
    !search || (c.other_user?.full_name || "").toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Mark all incoming pings as read when the page opens
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const { data: convos } = await supabase
        .from("conversations")
        .select("id")
        .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`);
      if (!convos?.length) {
        window.dispatchEvent(new Event("pings-read"));
        return;
      }
      const convIds = convos.map((c: any) => c.id);
      await supabase
        .from("pings")
        .update({ is_read: true })
        .in("conversation_id", convIds)
        .neq("sender_id", user.id)
        .eq("is_read", false);
      window.dispatchEvent(new Event("pings-read"));
    })();
  }, [user?.id]);

  // Auto-resize textarea
  const autoResize = () => {
    const el = textareaRef.current;
    if (el) { el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 120) + "px"; }
  };

  const handleSend = async () => {
    const hasContent = newMsg.trim() || pendingAttachment;
    if (!hasContent) return;
    // Warn if recipient hasn't published an encryption key
    if (newMsg.trim() && activeConvo?.other_user && !(activeConvo.other_user as any).public_key) {
      toast.warning("Not encrypted yet — recipient hasn't enabled secure messaging on a device.");
    }
    await sendMessage(newMsg.trim(), pendingAttachment || undefined);
    setNewMsg("");
    setPendingAttachment(null);
    if (textareaRef.current) { textareaRef.current.style.height = "auto"; }
  };

  // BUG FIX 2: Upload file and show preview, do NOT auto-send
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !activeConvoId) return;
    const validationErr = validateUpload(file, { maxBytes: 25 * 1024 * 1024, allowImages: true, allowPdf: true, allowOffice: true });
    if (validationErr) { toast.error(validationErr); e.target.value = ""; return; }

    setUploading(true);
    const isImage = file.type.startsWith("image/");
    const isPDF = file.type === "application/pdf";
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;

    const { data, error } = await supabase.storage.from("message-attachments").upload(path, file, { contentType: file.type });
    if (error) { toast.error("Upload failed: " + error.message); setUploading(false); e.target.value = ""; return; }

    const { data: urlData } = supabase.storage.from("message-attachments").getPublicUrl(data.path);
    const attachType = isImage ? "image" : isPDF ? "pdf" : "document";

    // Create local preview for images
    const previewUrl = isImage ? URL.createObjectURL(file) : undefined;

    setPendingAttachment({ url: urlData.publicUrl, type: attachType, name: file.name, size: file.size, previewUrl });
    setUploading(false);
    e.target.value = "";
  };

  const cancelAttachment = () => {
    if (pendingAttachment?.previewUrl) URL.revokeObjectURL(pendingAttachment.previewUrl);
    setPendingAttachment(null);
  };

  // Search users for new ping
  useEffect(() => {
    if (!newPingSearch.trim() || newPingSearch.length < 2) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, username, avatar_url, role, institution_name, is_verified")
        .or(`full_name.ilike.%${newPingSearch}%,username.ilike.%${newPingSearch}%`)
        .neq("id", user?.id || "")
        .limit(10);
      setSearchResults(data || []);
    }, 300);
    return () => clearTimeout(timer);
  }, [newPingSearch, user?.id]);

  const startConversation = async (otherUserId: string) => {
    const result = await findOrCreateConversation(otherUserId);
    if (result === "blocked") { toast.error("This user doesn't accept messages"); return; }
    if (result === "connections_only") { toast.error("This user only accepts messages from connections"); return; }
    if (result) { loadMessages(result); setShowMobileList(false); setShowNewPing(false); setNewPingSearch(""); }
  };

  const handleDelete = async (msgId: string) => {
    await deleteMessage(msgId);
    setDeleteConfirm(null);
    toast.success("Message deleted");
  };

  // Group messages by date
  const getDateKey = (dateStr: string | null) => dateStr ? new Date(dateStr).toDateString() : "";

  const canSend = !!(newMsg.trim() || pendingAttachment);

  return (
    <div className="flex relative" style={{ height: "calc(100vh - 52px)", maxHeight: "calc(100dvh - 52px - env(safe-area-inset-bottom, 0px))" }}>
      <input ref={fileInputRef} type="file" accept="image/*,.pdf,.doc,.docx" className="hidden" onChange={handleFileSelect} />

      {/* Left panel */}
      <div className={`w-full md:w-[340px] flex flex-col shrink-0 relative ${!showMobileList ? "hidden md:flex" : "flex"}`} style={{ background: "var(--glass-bg)", backdropFilter: "blur(20px) saturate(180%)", WebkitBackdropFilter: "blur(20px) saturate(180%)", borderRight: "1px solid var(--glass-border)" }}>
        <div className="p-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-[20px] font-extrabold" style={{ color: "var(--text-1)", letterSpacing: "-0.01em" }}>Pings</h1>
            <button type="button" className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-150 cursor-pointer active:scale-95" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }} onClick={() => setShowNewPing(true)}>
              <PenSquare className="w-4 h-4" style={{ color: "var(--text-2)" }} />
            </button>
          </div>
          <div className="flex gap-1 mb-3">
            {(["chats", "applications", "requests"] as const).map(t => (
              <button type="button" key={t} onClick={() => setTab(t)}
                className="text-[12px] font-bold px-3.5 py-1.5 rounded-full transition-all duration-200 cursor-pointer active:scale-95 capitalize"
                style={{ background: tab === t ? "var(--brand)" : "var(--surface-2)", color: tab === t ? "white" : "var(--text-2)", border: `1px solid ${tab === t ? "var(--brand)" : "var(--border)"}` }}>
                {t === "requests" ? "Requests" : t === "applications" ? "Applications" : "Chats"}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 px-3 h-9 rounded-full" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
            <Search className="w-4 h-4" style={{ color: "var(--text-3)" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search Pings..." className="flex-1 bg-transparent text-[12px] outline-none" style={{ color: "var(--text-1)" }} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && <div className="flex items-center justify-center py-10"><div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--brand)", borderTopColor: "transparent" }} /></div>}
          {!loading && tab === "chats" && filteredConvos.length === 0 && (
            <div className="p-6"><EmptyState icon={MessageCircle} title="No conversations yet" description="Start a conversation by visiting someone's profile and clicking 'Message'." /></div>
          )}
          {tab === "applications" && <div className="p-6"><EmptyState icon={Briefcase} title="No applications" description="Application messages will appear here." /></div>}
          {tab === "requests" && <div className="p-6"><EmptyState icon={MessageCircle} title="No requests" description="Ping requests will appear here." /></div>}
          {tab === "chats" && filteredConvos.map(convo => {
            const other = convo.other_user;
            const name = other?.full_name || other?.username || "User";
            const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
            const roleColor = ROLE_COLORS[other?.role || ""] || "#6B7280";
            const timeAgo = convo.last_message_at ? shortTimeAgo(new Date(convo.last_message_at)) : "";
            const active = activeConvoId === convo.id;
            const preview = getLastMessagePreview(convo);
            const hasUnread = convo.unread_count > 0;

            return (
              <button type="button" key={convo.id} onClick={() => { loadMessages(convo.id); setShowMobileList(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-150 cursor-pointer active:scale-[0.99]"
                style={{
                  background: hasUnread ? "linear-gradient(90deg, var(--brand-dim) 0%, transparent 100%)" : active ? "var(--brand-dim)" : "transparent",
                  borderLeft: hasUnread || active ? "3px solid var(--brand)" : "3px solid transparent",
                  borderBottom: "1px solid var(--border)",
                }}>
                <div className="relative">
                  <AvatarSquare src={other?.avatar_url} name={name} size={44} bgColor={roleColor} />
                  {hasUnread && (
                    <span className="absolute" style={{
                      top: -2, right: -2,
                      width: 10, height: 10, borderRadius: "50%",
                      background: "var(--brand)",
                      border: "2px solid rgba(255,255,255,0.95)",
                    }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] truncate" style={{ color: "var(--text-1)", fontWeight: hasUnread ? 700 : 500 }}>{name}</span>
                    <span className="text-[10px] shrink-0 ml-2" style={{ color: "var(--text-3)" }}>{timeAgo}</span>
                  </div>
                  <p className="text-[12px] truncate" style={{ color: hasUnread ? "var(--text-1)" : "var(--text-2)", fontWeight: hasUnread ? 600 : 400 }}>
                    {preview || "No messages yet"}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right panel — Chat */}
      <div className={`flex-1 flex flex-col min-w-0 ${showMobileList ? "hidden md:flex" : "flex"}`} style={{ background: "var(--bg)" }}>
        {!activeConvoId ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--text-3)" }} />
              <p className="text-[15px] font-bold" style={{ color: "var(--text-1)" }}>Select a conversation</p>
              <p className="text-[13px] mt-1" style={{ color: "var(--text-3)" }}>Start a conversation by visiting someone's profile and clicking 'Message'</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 px-5 h-16 shrink-0" style={{ background: "var(--glass-bg)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: "1px solid var(--glass-border)" }}>
              <button type="button" onClick={() => setShowMobileList(true)} className="md:hidden p-1.5 rounded-lg cursor-pointer active:scale-95" style={{ color: "var(--text-2)" }}><ArrowLeft className="w-5 h-5" /></button>
              {activeConvo?.other_user && (
                <Link to={`/app/profile/${activeConvo.other_user.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="relative">
                    <AvatarSquare src={activeConvo.other_user.avatar_url} name={activeConvo.other_user.full_name || "U"} size={40} bgColor={ROLE_COLORS[activeConvo.other_user.role || ""] || "#6B7280"} />
                    <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2" style={{ background: "#22C55E", borderColor: "var(--glass-bg)" }} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[14px] font-bold block" style={{ color: "var(--text-1)" }}>{activeConvo.other_user.full_name || activeConvo.other_user.username}</span>
                    <span className="text-[11px]" style={{ color: "var(--text-3)" }}>
                      {activeConvo.other_user.institution_name || activeConvo.other_user.role}
                      <span className="ml-2 text-[10px]" style={{ color: "var(--brand)" }}>View Profile →</span>
                    </span>
                  </div>
                </Link>
              )}
              <button
                type="button"
                onClick={() => setShowKeyManager(true)}
                className="ml-auto p-2 rounded-lg cursor-pointer active:scale-95 shrink-0"
                title="Encryption keys"
                style={{ color: "var(--text-2)", background: "var(--surface-2)" }}>
                <Key className="w-4 h-4" />
              </button>
            </div>

            {/* E2EE indicator banner */}
            <div className="px-5 py-1.5 flex items-center gap-1.5" style={{ background: "rgba(16,185,129,0.06)", borderBottom: "1px solid rgba(16,185,129,0.15)" }}>
              <Lock className="w-3 h-3" style={{ color: "#10B981" }} />
              <p className="text-[11px]" style={{ color: "var(--text-2)" }}>
                {activeConvo?.other_user && (activeConvo.other_user as any).public_key
                  ? "Messages in this chat are end-to-end encrypted. Tiikme cannot read them."
                  : "Recipient hasn't enabled secure messaging yet — your messages will go as plaintext until they sign in."}
              </p>
            </div>

            {!dismissedBanner && activeConvo?.other_user?.is_verified && (
              <div className="px-5 py-2 flex items-center justify-between" style={{ background: "rgba(245,158,11,0.07)", borderBottom: "1px solid rgba(245,158,11,0.18)" }}>
                <p className="text-[12px]" style={{ color: "rgba(245,158,11,0.9)" }}><Shield className="w-3.5 h-3.5 inline mr-1" style={{ color: "#F59E0B" }} />{activeConvo.other_user.full_name} is Tiik Approved</p>
                <button type="button" onClick={() => setDismissedBanner(true)} className="cursor-pointer" style={{ color: "var(--text-3)" }}><X className="w-4 h-4" /></button>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-5 pb-[140px] md:pb-5 space-y-1">
              {messagesLoading && <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--brand)", borderTopColor: "transparent" }} /></div>}
              {messages.map((msg, i) => {
                const isMe = msg.sender_id === user?.id;
                const isDeleted = !!msg.is_deleted;
                const prevMsg = i > 0 ? messages[i - 1] : null;
                const prevSame = prevMsg?.sender_id === msg.sender_id;
                const nextMsg = i < messages.length - 1 ? messages[i + 1] : null;
                const nextSame = nextMsg?.sender_id === msg.sender_id;

                // Date separator
                const currentDate = getDateKey(msg.created_at);
                const prevDate = prevMsg ? getDateKey(prevMsg.created_at) : "";
                const showDate = currentDate !== prevDate;

                // Time clustering (within 2 mins)
                const showTime = !nextSame || !nextMsg?.created_at || !msg.created_at ||
                  Math.abs(new Date(nextMsg.created_at).getTime() - new Date(msg.created_at).getTime()) > 120000;

                const time = msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";

                const topLeft = isMe ? 18 : (prevSame && !showDate ? 4 : 4);
                const topRight = isMe ? (prevSame && !showDate ? 4 : 4) : 18;
                const bottomLeft = isMe ? 18 : (nextSame ? 4 : 18);
                const bottomRight = isMe ? (nextSame ? 4 : 18) : 18;

                // Read receipt on last sent message
                const isLastRead = (() => {
                  if (!isMe || !activeConvo?.other_user) return false;
                  const myReadMessages = messages.filter(m => m.sender_id === user?.id && m.status === "read");
                  return myReadMessages.length > 0 && myReadMessages[myReadMessages.length - 1]?.id === msg.id;
                })();

                return (
                  <div key={msg.id}>
                    {showDate && (
                      <div className="flex items-center justify-center py-3">
                        <span className="text-[11px] font-semibold px-3 py-1 rounded-full" style={{ background: "var(--surface-2)", color: "var(--text-3)" }}>
                          {dateSeparator(msg.created_at)}
                        </span>
                      </div>
                    )}
                    <div className={`flex ${isMe ? "justify-end" : "justify-start"} group mb-0.5`}>
                      {!isMe && !prevSame && activeConvo?.other_user && (
                        <AvatarSquare src={activeConvo.other_user.avatar_url} name={activeConvo.other_user.full_name || "U"} size={24} bgColor={ROLE_COLORS[activeConvo.other_user.role || ""] || "#6B7280"} className="mr-2 mt-1" />
                      )}
                      {!isMe && (prevSame && !showDate) && <div className="w-6 mr-2 shrink-0" />}

                      {/* Delete button (hover, own messages only) */}
                      {isMe && !isDeleted && (
                        <button type="button" onClick={() => setDeleteConfirm(msg.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity self-center mr-2 p-1 rounded-lg cursor-pointer"
                          style={{ color: "#DC2626" }}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <div className="max-w-[68%] px-3.5 py-2.5 relative" style={{
                        background: isDeleted ? "var(--surface-2)" : isMe ? "linear-gradient(135deg, var(--brand), var(--brand-2))" : "var(--glass-bg)",
                        backdropFilter: isMe || isDeleted ? "none" : "blur(16px) saturate(180%)",
                        WebkitBackdropFilter: isMe || isDeleted ? "none" : "blur(16px) saturate(180%)",
                        border: isMe ? "none" : "1px solid var(--glass-border-t)",
                        borderRadius: `${topLeft}px ${topRight}px ${bottomRight}px ${bottomLeft}px`,
                        color: isDeleted ? "var(--text-3)" : isMe ? "white" : "var(--text-1)",
                        boxShadow: isDeleted ? "none" : isMe ? "inset 0 1px 1px rgba(255,255,255,0.4), 0 4px 16px var(--brand-glow)" : "var(--glass-shadow)",
                        fontStyle: isDeleted ? "italic" : "normal",
                      }}>
                        {/* Deleted message */}
                        {isDeleted ? (
                          <p className="text-[13px] select-none">This message was deleted</p>
                        ) : (
                          <>
                            {/* Image attachment */}
                            {msg.attachment_type === "image" && msg.attachment_url && (
                              <img src={msg.attachment_url} alt="" loading="lazy" className="w-full max-w-[240px] rounded-xl mb-2 cursor-pointer" onClick={() => window.open(msg.attachment_url!, "_blank")} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                            )}
                            {/* PDF/Doc attachment */}
                            {(msg.attachment_type === "pdf" || msg.attachment_type === "document") && msg.attachment_url && (
                              <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 rounded-lg mb-2" style={{ background: isMe ? "rgba(255,255,255,0.15)" : "var(--surface-2)" }}>
                                <FileText className="w-8 h-8 shrink-0" style={{ color: isMe ? "white" : "var(--brand)" }} />
                                <div className="flex-1 min-w-0">
                                  <p className="text-[12px] font-bold truncate">{msg.attachment_name || "Document"}</p>
                                  {msg.attachment_size && <p className="text-[10px] opacity-70">{(msg.attachment_size / 1024).toFixed(0)} KB</p>}
                                </div>
                                <Download className="w-4 h-4 shrink-0" />
                              </a>
                            )}
                            {/* Text with URL detection */}
                            {(!msg.attachment_type || msg.content !== msg.attachment_name) && msg.content && (
                              <p className="text-[14px] leading-[1.6] whitespace-pre-wrap">{renderLinkedText(msg.content, isMe)}</p>
                            )}
                          </>
                        )}
                        {/* Time + status */}
                        {showTime && (
                          <div className="flex items-center justify-end gap-1 mt-1">
                            <p className="text-[10px] opacity-60" style={{ color: isDeleted ? "var(--text-3)" : isMe ? "rgba(255,255,255,0.7)" : "var(--text-3)" }}>{time}</p>
                            {isMe && !isDeleted && <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.5)" }}>
                              {msg.status === "sending" ? "Sending…" : msg.status === "read" ? "✓✓ Seen" : "✓ Delivered"}
                            </span>}
                          </div>
                        )}
                        {isLastRead && activeConvo?.other_user && (
                          <div className="flex justify-end mt-0.5">
                             <AvatarSquare src={activeConvo.other_user.avatar_url} name={activeConvo.other_user.full_name || "U"} size={14} bgColor={ROLE_COLORS[activeConvo.other_user.role || ""] || "#6B7280"} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Delete confirmation */}
            {deleteConfirm && (
              <div className="absolute inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }} onClick={() => setDeleteConfirm(null)}>
                <div className="rounded-2xl p-5 max-w-[320px] w-full mx-4" style={{ background: "var(--surface)", boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }} onClick={e => e.stopPropagation()}>
                  <p className="text-[15px] font-bold mb-2" style={{ color: "var(--text-1)" }}>Delete this message?</p>
                  <p className="text-[13px] mb-4" style={{ color: "var(--text-3)" }}>This message will be replaced with "This message was deleted"</p>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="flex-1" style={{ height: 40, borderRadius: 12 }}>Cancel</Button>
                    <Button onClick={() => handleDelete(deleteConfirm)} className="flex-1" style={{ height: 40, borderRadius: 12, background: "#DC2626", color: "#fff" }}>Delete</Button>
                  </div>
                </div>
              </div>
            )}

            {/* Input area */}
            <div className="fixed md:sticky bottom-[calc(64px+env(safe-area-inset-bottom))] md:bottom-0 left-0 right-0 md:left-auto md:right-auto px-3 md:px-4 py-2 md:py-3 z-30" style={{ background: "var(--glass-bg)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderTop: "1px solid var(--glass-border)", paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
              {/* Attachment preview */}
              {pendingAttachment && (
                <div className="flex items-center gap-3 mb-2 px-3 py-2 rounded-xl" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                  {pendingAttachment.type === "image" && pendingAttachment.previewUrl ? (
                    <img src={pendingAttachment.previewUrl} alt="" className="w-12 h-12 rounded-lg object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "var(--brand-dim)" }}>
                      <FileText className="w-5 h-5" style={{ color: "var(--brand)" }} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold truncate" style={{ color: "var(--text-1)" }}>{pendingAttachment.name}</p>
                    <p className="text-[10px]" style={{ color: "var(--text-3)" }}>{(pendingAttachment.size / 1024).toFixed(0)} KB</p>
                  </div>
                  <button type="button" onClick={cancelAttachment} className="p-1 rounded-lg cursor-pointer" style={{ color: "var(--text-3)" }}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              {uploading && (
                <div className="flex items-center gap-2 mb-2 px-3 py-2 rounded-xl" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                  <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--brand)", borderTopColor: "transparent" }} />
                  <span className="text-[12px]" style={{ color: "var(--text-2)" }}>Uploading...</span>
                </div>
              )}
              <div className="flex items-end gap-2">
                <button type="button" className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-150 cursor-pointer active:scale-95 shrink-0" style={{ color: "var(--text-2)", background: "var(--surface-2)" }} onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                  <Paperclip className="w-5 h-5" />
                </button>
                <textarea ref={textareaRef} value={newMsg} onChange={e => { setNewMsg(e.target.value); autoResize(); }}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder={activeConvo?.other_user ? `Ping ${activeConvo.other_user.full_name || ""}...` : "Type a message..."}
                  className="flex-1 min-h-[42px] max-h-[120px] rounded-2xl px-3.5 py-2.5 text-[14px] resize-none outline-none transition-all duration-150"
                  style={{ background: "var(--surface-2)", border: "1.5px solid var(--border-2)", color: "var(--text-1)" }}
                  rows={1} />
                <button type="button" onClick={handleSend} disabled={!canSend}
                  className="w-[42px] h-[42px] rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-40 active:scale-95 cursor-pointer shrink-0"
                  style={{ background: canSend ? "var(--brand)" : "var(--surface-2)", boxShadow: canSend ? "0 3px 10px var(--brand-glow)" : "none" }}>
                  <ArrowUp className="w-[18px] h-[18px]" style={{ color: canSend ? "white" : "var(--text-3)" }} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* New Ping panel */}
      {showNewPing && (
        <div className="absolute top-0 left-0 right-0 z-20 p-3" style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-[15px] font-extrabold" style={{ color: "var(--text-1)" }}>New Ping</h2>
            <button type="button" onClick={() => setShowNewPing(false)} className="p-1 cursor-pointer" style={{ color: "var(--text-3)" }}><X className="w-4 h-4" /></button>
          </div>
          <Input value={newPingSearch} onChange={e => setNewPingSearch(e.target.value)} placeholder="Search by name or @username..." autoFocus />
          <div className="mt-2 max-h-[300px] overflow-y-auto space-y-0.5">
            {searchResults.map((u: any) => (
              <button type="button" key={u.id} onClick={() => startConversation(u.id)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left cursor-pointer hover:bg-[var(--surface-2)]">
                <AvatarSquare src={u.avatar_url} name={u.full_name || "U"} size={32} bgColor={ROLE_COLORS[u.role || ""] || "#6B7280"} />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold truncate" style={{ color: "var(--text-1)" }}>{u.full_name || u.username}</p>
                  <p className="text-[11px]" style={{ color: "var(--text-3)" }}>@{u.username} · {u.role}</p>
                </div>
              </button>
            ))}
            {newPingSearch.length >= 2 && searchResults.length === 0 && (
              <p className="text-[12px] text-center py-3" style={{ color: "var(--text-3)" }}>No users found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Pings;

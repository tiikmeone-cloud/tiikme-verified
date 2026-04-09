import { useState, useRef, useEffect } from "react";
import { MessageCircle, Lock, Search, Send, Paperclip, Layers, PenSquare, Check, X, Shield, ArrowLeft, FileText, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import EmptyState from "@/components/EmptyState";
import { useAuth } from "@/contexts/AuthContext";
import { useConversations } from "@/hooks/useConversations";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";

const ROLE_COLORS: Record<string, string> = { faculty: "#92400E", professional: "#0369A1", doctor: "#0E7490", student: "#4F46E5", skilled_trade: "#C2410C", hr: "#6B21A8", government: "#166534" };
const ALLOWED_TYPES = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ringStyle = (verified: boolean): React.CSSProperties => {
  if (verified) return { boxShadow: "0 0 0 2px var(--surface), 0 0 0 4.5px #F59E0B, 0 0 12px rgba(245,158,11,0.45)" };
  return {};
};

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

const Pings = () => {
  const { user, profile } = useAuth();
  const { conversations, loading, activeConvoId, messages, messagesLoading, loadMessages, sendMessage, findOrCreateConversation } = useConversations(user?.id);
  const [tab, setTab] = useState<"chats" | "applications" | "requests">("chats");
  const [search, setSearch] = useState("");
  const [newMsg, setNewMsg] = useState("");
  const [showMobileList, setShowMobileList] = useState(true);
  const [dismissedBanner, setDismissedBanner] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [showNewPing, setShowNewPing] = useState(false);
  const [newPingSearch, setNewPingSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeConvo = conversations.find(c => c.id === activeConvoId);
  const filteredConvos = conversations.filter(c =>
    !search || (c.other_user?.full_name || "").toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = async () => {
    if (!newMsg.trim() && !attachedFile) return;
    await sendMessage(newMsg.trim());
    setNewMsg("");
    if (attachedFile) { toast.success(`Sent "${attachedFile.name}"`); setAttachedFile(null); }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) { toast.error("Only PDF and DOC files allowed"); return; }
    if (file.size > MAX_FILE_SIZE) { toast.error("File size must be under 5MB"); return; }
    setAttachedFile(file);
    toast.success(`"${file.name}" attached`);
    e.target.value = "";
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
    const convoId = await findOrCreateConversation(otherUserId);
    if (convoId) {
      loadMessages(convoId);
      setShowMobileList(false);
      setShowNewPing(false);
      setNewPingSearch("");
    }
  };

  return (
    <div className="flex" style={{ height: "calc(100vh - 64px)" }}>
      <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleFileSelect} />

      {/* Left panel */}
      <div className={`w-full md:w-[340px] flex flex-col shrink-0 ${!showMobileList ? "hidden md:flex" : "flex"}`} style={{ background: "var(--glass-bg)", backdropFilter: "blur(20px) saturate(180%)", WebkitBackdropFilter: "blur(20px) saturate(180%)", borderRight: "1px solid var(--glass-border)" }}>
        <div className="p-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-[20px] font-extrabold" style={{ color: "var(--text-1)", letterSpacing: "-0.01em" }}>Pings</h1>
            <button className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-150 cursor-pointer active:scale-95" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }} onClick={() => setShowNewPing(true)}>
              <PenSquare className="w-4 h-4" style={{ color: "var(--text-2)" }} />
            </button>
          </div>
          <div className="flex gap-1 mb-3">
            {(["chats", "applications", "requests"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
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
            <div className="p-6">
              <EmptyState icon={MessageCircle} title="No conversations yet" description="Start a Ping by clicking the compose button above." />
            </div>
          )}
          {tab === "applications" && <div className="p-6"><EmptyState icon={Briefcase} title="No applications" description="Application messages will appear here." /></div>}
          {tab === "requests" && <div className="p-6"><EmptyState icon={MessageCircle} title="No requests" description="Ping requests will appear here." /></div>}
          {tab === "chats" && filteredConvos.map(convo => {
            const other = convo.other_user;
            const name = other?.full_name || other?.username || "User";
            const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
            const roleColor = ROLE_COLORS[other?.role || ""] || "#6B7280";
            const timeAgo = convo.last_message_at ? getTimeAgo(new Date(convo.last_message_at)) : "";
            const active = activeConvoId === convo.id;

            return (
              <button key={convo.id} onClick={() => { loadMessages(convo.id); setShowMobileList(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-150 cursor-pointer active:scale-[0.99]"
                style={{
                  background: convo.unread_count > 0 ? "linear-gradient(90deg, var(--brand-dim) 0%, transparent 100%)" : active ? "var(--brand-dim)" : "transparent",
                  borderLeft: convo.unread_count > 0 || active ? "3px solid var(--brand)" : "3px solid transparent",
                  borderBottom: "1px solid var(--border)",
                }}>
                <div className="relative">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 overflow-hidden" style={{ backgroundColor: roleColor, ...ringStyle(other?.is_verified || false) }}>
                    {other?.avatar_url ? <img src={other.avatar_url} alt="" className="w-full h-full object-cover" /> : initials}
                  </div>
                  {convo.unread_count > 0 && <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full" style={{ background: "var(--open-green)", border: "2px solid var(--surface)" }} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] truncate" style={{ color: "var(--text-1)", fontWeight: convo.unread_count > 0 ? 700 : 500 }}>{name}</span>
                    <span className="text-[10px] shrink-0 ml-2" style={{ color: "var(--text-3)" }}>{timeAgo}</span>
                  </div>
                  <p className="text-[12px] truncate" style={{ color: convo.unread_count > 0 ? "var(--text-1)" : "var(--text-2)", fontWeight: convo.unread_count > 0 ? 600 : 400 }}>
                    {convo.last_message || "Start a conversation"}
                  </p>
                </div>
                {convo.unread_count > 0 && <span className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ background: "var(--brand)" }}>{convo.unread_count}</span>}
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
              <p className="text-[13px]" style={{ color: "var(--text-3)" }}>Or start a new Ping</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 px-5 h-16 shrink-0" style={{ background: "var(--glass-bg)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: "1px solid var(--glass-border)" }}>
              <button onClick={() => setShowMobileList(true)} className="md:hidden p-1.5 rounded-lg cursor-pointer active:scale-95" style={{ color: "var(--text-2)" }}><ArrowLeft className="w-5 h-5" /></button>
              {activeConvo?.other_user && (
                <Link to={`/app/profile/${activeConvo.other_user.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold text-white overflow-hidden" style={{ backgroundColor: ROLE_COLORS[activeConvo.other_user.role || ""] || "#6B7280", ...ringStyle(activeConvo.other_user.is_verified || false) }}>
                    {activeConvo.other_user.avatar_url ? <img src={activeConvo.other_user.avatar_url} alt="" className="w-full h-full object-cover" /> : (activeConvo.other_user.full_name || "U").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[14px] font-bold block" style={{ color: "var(--text-1)" }}>{activeConvo.other_user.full_name || activeConvo.other_user.username}</span>
                    <span className="text-[11px]" style={{ color: "var(--text-3)" }}>{activeConvo.other_user.institution_name || activeConvo.other_user.role}</span>
                  </div>
                </Link>
              )}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                <Lock className="w-3.5 h-3.5" style={{ color: "var(--brand)" }} />
                <span className="text-[11px] font-semibold hidden sm:inline" style={{ color: "var(--text-2)" }}>Encrypted</span>
              </div>
            </div>

            {/* Verification banner */}
            {!dismissedBanner && activeConvo?.other_user?.is_verified && (
              <div className="px-5 py-2 flex items-center justify-between" style={{ background: "rgba(245,158,11,0.07)", borderBottom: "1px solid rgba(245,158,11,0.18)" }}>
                <p className="text-[12px]" style={{ color: "rgba(245,158,11,0.9)" }}><Shield className="w-3.5 h-3.5 inline mr-1" style={{ color: "#F59E0B" }} />{activeConvo.other_user.full_name} is Tiik Approved</p>
                <button onClick={() => setDismissedBanner(true)} className="cursor-pointer" style={{ color: "var(--text-3)" }}><X className="w-4 h-4" /></button>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-2">
              <div className="text-center mb-4">
                <span className="text-[11px] px-3 py-1 rounded-full inline-flex items-center gap-1" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-3)" }}><Lock className="w-3 h-3" /> End-to-end encrypted</span>
              </div>
              {messagesLoading && <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--brand)", borderTopColor: "transparent" }} /></div>}
              {messages.map((msg, i) => {
                const isMe = msg.sender_id === user?.id;
                const prevSame = i > 0 && messages[i - 1].sender_id === msg.sender_id;
                const nextSame = i < messages.length - 1 && messages[i + 1].sender_id === msg.sender_id;
                const topLeft = isMe ? 18 : (prevSame ? 4 : 4);
                const topRight = isMe ? (prevSame ? 4 : 4) : 18;
                const bottomLeft = isMe ? 18 : (nextSame ? 4 : 18);
                const bottomRight = isMe ? (nextSame ? 4 : 18) : 18;
                const time = msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";

                return (
                  <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"} mb-1`}>
                    {!isMe && !prevSame && activeConvo?.other_user && (
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold text-white mr-2 shrink-0 mt-1 overflow-hidden" style={{ backgroundColor: ROLE_COLORS[activeConvo.other_user.role || ""] || "#6B7280" }}>
                        {activeConvo.other_user.avatar_url ? <img src={activeConvo.other_user.avatar_url} alt="" className="w-full h-full object-cover" /> : (activeConvo.other_user.full_name || "U").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    {!isMe && prevSame && <div className="w-7 mr-2 shrink-0" />}
                    <div className="max-w-[68%] px-3.5 py-2.5 group" style={{
                      background: isMe ? "linear-gradient(135deg, var(--brand), var(--brand-2))" : "var(--glass-bg)",
                      backdropFilter: isMe ? "none" : "blur(16px) saturate(180%)",
                      WebkitBackdropFilter: isMe ? "none" : "blur(16px) saturate(180%)",
                      border: isMe ? "none" : "1px solid var(--glass-border-t)",
                      borderRadius: `${topLeft}px ${topRight}px ${bottomRight}px ${bottomLeft}px`,
                      color: isMe ? "white" : "var(--text-1)",
                      boxShadow: isMe ? "inset 0 1px 1px rgba(255,255,255,0.4), 0 4px 16px var(--brand-glow)" : "var(--glass-shadow)",
                    }}>
                      <p className="text-[14px] leading-[1.6]">{msg.content}</p>
                      <div className="flex items-center justify-end gap-1 mt-1">
                        <p className="text-[10px] opacity-0 group-hover:opacity-60 transition-opacity" style={{ color: isMe ? "rgba(255,255,255,0.7)" : "var(--text-3)" }}>{time}</p>
                        {isMe && (
                          <span className="text-[9px]" style={{ color: msg.status === "read" ? "var(--brand)" : "rgba(255,255,255,0.5)" }}>
                            {msg.status === "sending" ? "✓" : "✓✓"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="px-4 py-3" style={{ background: "var(--glass-bg)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderTop: "1px solid var(--glass-border)" }}>
              {attachedFile && (
                <div className="flex items-center gap-2 mb-2 px-3 py-2 rounded-xl" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                  <FileText className="w-4 h-4 shrink-0" style={{ color: "var(--brand)" }} />
                  <span className="text-[12px] font-medium truncate flex-1" style={{ color: "var(--text-1)" }}>{attachedFile.name}</span>
                  <button onClick={() => setAttachedFile(null)} className="p-1 rounded cursor-pointer" style={{ color: "var(--text-3)" }}><X className="w-3.5 h-3.5" /></button>
                </div>
              )}
              <div className="flex items-center gap-1 mb-2">
                <Tooltip><TooltipTrigger asChild>
                  <button className="p-2 rounded-lg transition-all duration-150 cursor-pointer active:scale-95" style={{ color: "var(--text-2)" }} onClick={() => fileInputRef.current?.click()}>
                    <Paperclip className="w-4 h-4" />
                  </button>
                </TooltipTrigger><TooltipContent>Attach PDF or DOC</TooltipContent></Tooltip>
                <Tooltip><TooltipTrigger asChild>
                  <button className="p-2 rounded-lg transition-all duration-150 cursor-pointer active:scale-95" style={{ color: "var(--text-2)" }} onClick={() => toast.info("Share work item")}>
                    <Layers className="w-4 h-4" />
                  </button>
                </TooltipTrigger><TooltipContent>Share work</TooltipContent></Tooltip>
              </div>
              <div className="flex items-center gap-2.5">
                <textarea value={newMsg} onChange={e => setNewMsg(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder={activeConvo?.other_user ? `Ping ${activeConvo.other_user.full_name || ""}...` : "Type a message..."}
                  className="flex-1 min-h-[42px] max-h-[160px] rounded-2xl px-3.5 py-2.5 text-[14px] resize-none outline-none transition-all duration-150"
                  style={{ background: "var(--surface-2)", border: "1.5px solid var(--border-2)", color: "var(--text-1)" }}
                  rows={1} />
                <button onClick={handleSend} disabled={!newMsg.trim() && !attachedFile}
                  className="w-[42px] h-[42px] rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-40 active:scale-95 cursor-pointer"
                  style={{ background: "var(--brand)", boxShadow: "0 3px 10px var(--brand-glow)" }}>
                  <Send className="w-[18px] h-[18px] text-white" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* New Ping Modal */}
      {showNewPing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }} onClick={() => setShowNewPing(false)}>
          <div className="glass-card p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[17px] font-extrabold" style={{ color: "var(--text-1)" }}>New Ping</h2>
              <button onClick={() => setShowNewPing(false)} className="p-1 cursor-pointer" style={{ color: "var(--text-3)" }}><X className="w-5 h-5" /></button>
            </div>
            <Input value={newPingSearch} onChange={e => setNewPingSearch(e.target.value)} placeholder="Search by name or @username..." autoFocus />
            <div className="mt-3 max-h-[300px] overflow-y-auto space-y-1">
              {searchResults.map((u: any) => (
                <button key={u.id} onClick={() => startConversation(u.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left cursor-pointer transition-all duration-150 hover:bg-[var(--surface-2)]">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 overflow-hidden" style={{ backgroundColor: ROLE_COLORS[u.role || ""] || "#6B7280" }}>
                    {u.avatar_url ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" /> : (u.full_name || "U").split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold truncate" style={{ color: "var(--text-1)" }}>{u.full_name || u.username}</p>
                    <p className="text-[11px]" style={{ color: "var(--text-3)" }}>@{u.username} · {u.role} {u.institution_name ? `· ${u.institution_name}` : ""}</p>
                  </div>
                </button>
              ))}
              {newPingSearch.length >= 2 && searchResults.length === 0 && (
                <p className="text-[12px] text-center py-4" style={{ color: "var(--text-3)" }}>No users found</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pings;

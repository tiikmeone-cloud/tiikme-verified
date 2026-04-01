import { useState, useRef, useEffect } from "react";
import { MessageCircle, Lock, Search, Send, Paperclip, Layers, PenSquare, Check, X, Shield, ArrowLeft, FileText, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import EmptyState from "@/components/EmptyState";

const ROLE_COLORS: Record<string, string> = { Faculty: "#92400E", Professional: "#0369A1", Doctor: "#0E7490", Student: "#4F46E5", "Skilled Trade": "#C2410C" };
const ALLOWED_TYPES = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const conversations = [
  { id: "1", name: "Priya Menon", initials: "PM", role: "Faculty", institution: "DTU", lastMsg: "Great work on the TelemedicineRx update!", time: "2h ago", unread: 2, verified: "gold" as const },
  { id: "2", name: "Rahul Kumar", initials: "RK", role: "Professional", institution: "Backend Engineer", lastMsg: "Can we discuss the API architecture?", time: "5h ago", unread: 1, verified: "grey" as const },
  { id: "3", name: "Dr. Neha Sharma", initials: "NS", role: "Doctor", institution: "AIIMS", lastMsg: "The health camp report is ready.", time: "Yesterday", unread: 0, verified: "gold" as const },
  { id: "4", name: "Riya Sharma", initials: "RS", role: "Student", institution: "JNTU", lastMsg: "Thanks for the collaboration invite!", time: "2 days", unread: 0, verified: "grey" as const },
  { id: "5", name: "Sunita Devi", initials: "SD", role: "Skilled Trade", institution: "Electrician", lastMsg: "Installation completed. Photos uploaded.", time: "3 days", unread: 0, verified: "none" as const },
];

const requests = [
  { id: "r1", name: "Mohan R.", initials: "MR", role: "Student", institution: "BITS Pilani", preview: "Hi Arjun, I saw your TelemedicineRx project and would love to discuss...", time: "2 days", verified: "grey" as const },
  { id: "r2", name: "Dr. Sriram T.", initials: "ST", role: "Doctor", institution: "Manipal Hospital", preview: "I'm working on a similar health tech initiative. Can we connect?", time: "5 days", verified: "gold" as const },
];

const mockMessages = [
  { id: "m1", sender: "them", text: "Hey Arjun! I reviewed your TelemedicineRx project. The architecture looks solid.", time: "10:30 AM" },
  { id: "m2", sender: "them", text: "Have you considered adding offline support for areas with poor connectivity?", time: "10:31 AM" },
  { id: "m3", sender: "me", text: "Thanks Priya! Yes, we're planning a local-first sync layer using SQLite. Should be ready in 2 weeks.", time: "10:45 AM" },
  { id: "m4", sender: "them", text: "That's great. I can connect you with a student who worked on a similar offline-first healthcare app.", time: "11:02 AM" },
  { id: "m5", sender: "me", text: "That would be amazing! Please share their profile.", time: "11:05 AM" },
  { id: "m6", sender: "them", text: "Great work on the TelemedicineRx update!", time: "2:30 PM" },
];

const ringStyle = (v: string): React.CSSProperties => {
  if (v === "gold") return { boxShadow: "0 0 0 2px var(--surface), 0 0 0 4.5px #F59E0B, 0 0 12px rgba(245,158,11,0.45), 0 0 24px rgba(245,158,11,0.15)" };
  if (v === "grey") return { boxShadow: "0 0 0 2px var(--surface), 0 0 0 4px #6B7280" };
  return {};
};

const Pings = () => {
  const [activeConvo, setActiveConvo] = useState(conversations[0]);
  const [tab, setTab] = useState<"chats" | "applications" | "requests">("chats");
  const [search, setSearch] = useState("");
  const [newMsg, setNewMsg] = useState("");
  const [showMobileList, setShowMobileList] = useState(true);
  const [dismissedBanner, setDismissedBanner] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredConvos = conversations.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [activeConvo]);

  const handleSend = () => {
    if (!newMsg.trim() && !attachedFile) return;
    if (attachedFile) { toast.success(`Sent "${attachedFile.name}"`); setAttachedFile(null); } else { toast.success("Ping sent"); }
    setNewMsg("");
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

  return (
    <div className="flex" style={{ height: "calc(100vh - 64px)" }}>
      <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleFileSelect} />

      {/* Left panel */}
      <div className={`w-full md:w-[340px] flex flex-col shrink-0 ${!showMobileList ? "hidden md:flex" : "flex"}`} style={{ background: "var(--glass-bg)", backdropFilter: "blur(20px) saturate(180%)", WebkitBackdropFilter: "blur(20px) saturate(180%)", borderRight: "1px solid var(--glass-border)" }}>
        <div className="p-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-[20px] font-extrabold" style={{ color: "var(--text-1)", letterSpacing: "-0.01em" }}>Pings</h1>
            <button className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-150 cursor-pointer active:scale-95" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }} onClick={() => toast.info("New ping")}>
              <PenSquare className="w-4 h-4" style={{ color: "var(--text-2)" }} />
            </button>
          </div>
          <div className="flex gap-1 mb-3">
            {(["chats", "applications", "requests"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className="text-[12px] font-bold px-3.5 py-1.5 rounded-full transition-all duration-200 cursor-pointer active:scale-95 capitalize"
                style={{ background: tab === t ? "var(--brand)" : "var(--surface-2)", color: tab === t ? "white" : "var(--text-2)", border: `1px solid ${tab === t ? "var(--brand)" : "var(--border)"}` }}>
                {t === "requests" ? `Requests (${requests.length})` : t === "applications" ? "Applications" : "Chats"}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 px-3 h-9 rounded-full" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
            <Search className="w-4 h-4" style={{ color: "var(--text-3)" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search Pings..." className="flex-1 bg-transparent text-[12px] outline-none" style={{ color: "var(--text-1)" }} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {tab === "chats" && filteredConvos.length === 0 && <EmptyState icon={MessageCircle} title="No conversations" description="Start a Ping from someone in your Strands." />}
          {tab === "applications" && <div className="p-6"><EmptyState icon={Briefcase} title="No applications" description="Application messages will appear here." /></div>}
          {tab === "chats" && filteredConvos.map(convo => (
            <button key={convo.id} onClick={() => { setActiveConvo(convo); setShowMobileList(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-150 cursor-pointer active:scale-[0.99]"
              style={{
                background: convo.unread > 0 ? "linear-gradient(90deg, var(--brand-dim) 0%, transparent 100%)" : activeConvo.id === convo.id ? "var(--brand-dim)" : "transparent",
                borderLeft: convo.unread > 0 || activeConvo.id === convo.id ? "3px solid var(--brand)" : "3px solid transparent",
                borderBottom: "1px solid var(--border)",
              }}>
              <div className="relative">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ backgroundColor: ROLE_COLORS[convo.role] || "#3D5AF1", ...ringStyle(convo.verified) }}>{convo.initials}</div>
                {convo.unread > 0 && <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full" style={{ background: "var(--open-green)", border: "2px solid var(--surface)", animation: "statusPulse 2s infinite" }} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] truncate" style={{ color: "var(--text-1)", fontWeight: convo.unread > 0 ? 700 : 500 }}>{convo.name}</span>
                  <span className="text-[10px] shrink-0 ml-2" style={{ color: "var(--text-3)" }}>{convo.time}</span>
                </div>
                <p className="text-[12px] truncate" style={{ color: convo.unread > 0 ? "var(--text-1)" : "var(--text-2)", fontWeight: convo.unread > 0 ? 600 : 400 }}>{convo.lastMsg}</p>
              </div>
              {convo.unread > 0 && <span className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ background: "var(--brand)" }}>{convo.unread}</span>}
            </button>
          ))}
          {tab === "requests" && requests.map(req => (
            <div key={req.id} className="mx-3 my-2 t-card p-3.5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: ROLE_COLORS[req.role] || "#3D5AF1", ...ringStyle(req.verified) }}>{req.initials}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold" style={{ color: "var(--text-1)" }}>{req.name}</p>
                  <p className="text-[10px]" style={{ color: "var(--text-3)" }}>{req.role} · {req.institution}</p>
                </div>
              </div>
              <p className="text-[12px] mb-3 line-clamp-2 italic" style={{ color: "var(--text-2)" }}>{req.preview}</p>
              <div className="flex gap-2">
                <Button size="xs" className="active:scale-95" onClick={() => toast.success("Accepted!")}><Check className="w-3 h-3" /> Accept</Button>
                <Button variant="ghost" size="xs" className="active:scale-95" style={{ color: "#DC2626" }} onClick={() => toast.info("Declined")}><X className="w-3 h-3" /> Decline</Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — Chat */}
      <div className={`flex-1 flex flex-col min-w-0 ${showMobileList ? "hidden md:flex" : "flex"}`} style={{ background: "var(--bg)" }}>
        <div className="flex items-center gap-3 px-5 h-16 shrink-0" style={{ background: "var(--glass-bg)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: "1px solid var(--glass-border)" }}>
          <button onClick={() => setShowMobileList(true)} className="md:hidden p-1.5 rounded-lg cursor-pointer active:scale-95" style={{ color: "var(--text-2)" }}><ArrowLeft className="w-5 h-5" /></button>
          <Link to="/app/profile" className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: ROLE_COLORS[activeConvo.role] || "#3D5AF1", ...ringStyle(activeConvo.verified) }}>{activeConvo.initials}</div>
            <div className="min-w-0">
              <span className="text-[14px] font-bold block" style={{ color: "var(--text-1)" }}>{activeConvo.name}</span>
              <span className="text-[11px]" style={{ color: "var(--text-3)" }}>{activeConvo.institution}</span>
            </div>
          </Link>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
            <Lock className="w-3.5 h-3.5" style={{ color: "var(--brand)" }} />
            <span className="text-[11px] font-semibold hidden sm:inline" style={{ color: "var(--text-2)" }}>Encrypted</span>
          </div>
        </div>

        {/* Verification banner */}
        {!dismissedBanner && activeConvo.verified === "gold" && (
          <div className="px-5 py-2 flex items-center justify-between" style={{ background: "rgba(245,158,11,0.07)", borderBottom: "1px solid rgba(245,158,11,0.18)" }}>
            <p className="text-[12px]" style={{ color: "rgba(245,158,11,0.9)" }}><Shield className="w-3.5 h-3.5 inline mr-1" style={{ color: "#F59E0B" }} />{activeConvo.name} is Tiik Approved</p>
            <button onClick={() => setDismissedBanner(true)} className="cursor-pointer" style={{ color: "var(--text-3)" }}><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-2">
          <div className="text-center mb-4">
            <span className="text-[11px] px-3 py-1 rounded-full inline-flex items-center gap-1" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-3)" }}><Lock className="w-3 h-3" /> End-to-end encrypted</span>
          </div>
          <div className="text-center mb-2">
            <span className="text-[11px] px-3 py-1 rounded-full" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-3)" }}>Today</span>
          </div>
          {mockMessages.map((msg, i) => {
            const isMe = msg.sender === "me";
            // Determine bubble radius based on clustering
            const prevSame = i > 0 && mockMessages[i - 1].sender === msg.sender;
            const nextSame = i < mockMessages.length - 1 && mockMessages[i + 1].sender === msg.sender;
            const topLeft = isMe ? 18 : (prevSame ? 4 : 4);
            const topRight = isMe ? (prevSame ? 4 : 4) : 18;
            const bottomLeft = isMe ? 18 : (nextSame ? 4 : 18);
            const bottomRight = isMe ? (nextSame ? 4 : 18) : 18;
            
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"} mb-1`}>
                {!isMe && !prevSame && (
                  <Link to="/app/profile">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold text-white mr-2 shrink-0 mt-1 hover:scale-105 transition-transform" style={{ backgroundColor: ROLE_COLORS[activeConvo.role] || "#3D5AF1" }}>{activeConvo.initials}</div>
                  </Link>
                )}
                {!isMe && prevSame && <div className="w-7 mr-2 shrink-0" />}
                <div className="max-w-[68%] px-3.5 py-2.5 group" style={{
                  background: isMe ? "linear-gradient(135deg, var(--brand), var(--brand-2))" : "rgba(20,24,82,0.65)",
                  backdropFilter: isMe ? "none" : "blur(24px) saturate(180%)",
                  WebkitBackdropFilter: isMe ? "none" : "blur(24px) saturate(180%)",
                  border: isMe ? "none" : "1.5px solid rgba(255,255,255,0.18)",
                  borderRadius: `${topLeft}px ${topRight}px ${bottomRight}px ${bottomLeft}px`,
                  color: isMe ? "white" : "var(--text-1)",
                  boxShadow: isMe
                    ? "inset 0 1px 1px rgba(255,255,255,0.4), 0 4px 16px var(--brand-glow)"
                    : "0 4px 16px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.15)",
                }}>
                  <p className="text-[14px] leading-[1.6]">{msg.text}</p>
                  <p className="text-[10px] mt-1 text-right opacity-0 group-hover:opacity-60 transition-opacity" style={{ color: isMe ? "rgba(255,255,255,0.7)" : "var(--text-3)" }}>{msg.time}</p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="px-4 py-3" style={{ background: "var(--surface)", borderTop: "1px solid var(--border)" }}>
          {attachedFile && (
            <div className="flex items-center gap-2 mb-2 px-3 py-2 rounded-xl" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
              <FileText className="w-4 h-4 shrink-0" style={{ color: "var(--brand)" }} />
              <span className="text-[12px] font-medium truncate flex-1" style={{ color: "var(--text-1)" }}>{attachedFile.name}</span>
              <span className="text-[10px] shrink-0" style={{ color: "var(--text-3)" }}>{(attachedFile.size / 1024).toFixed(0)}KB</span>
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
              placeholder={`Ping ${activeConvo.name}...`}
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
      </div>
    </div>
  );
};

export default Pings;

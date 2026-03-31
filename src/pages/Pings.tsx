import { useState, useRef, useEffect } from "react";
import { MessageCircle, Lock, Search, Send, Paperclip, Layers, PenSquare, Check, X, Shield, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const ROLE_COLORS: Record<string, string> = { Faculty: "#92400E", Professional: "#0369A1", Doctor: "#0E7490", Student: "#4F46E5", "Skilled Trade": "#C2410C" };

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
  if (v === "gold") return { boxShadow: "0 0 0 2px var(--surface), 0 0 0 4px #F59E0B, 0 0 8px rgba(245,158,11,0.5)" };
  if (v === "grey") return { boxShadow: "0 0 0 2px var(--surface), 0 0 0 4px #6B7280" };
  return {};
};

const Pings = () => {
  const [activeConvo, setActiveConvo] = useState(conversations[0]);
  const [tab, setTab] = useState<"all" | "requests">("all");
  const [search, setSearch] = useState("");
  const [newMsg, setNewMsg] = useState("");
  const [showMobileList, setShowMobileList] = useState(true);
  const [dismissedBanner, setDismissedBanner] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const filteredConvos = conversations.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [activeConvo]);

  const handleSend = () => {
    if (!newMsg.trim()) return;
    toast.success("Ping sent");
    setNewMsg("");
  };

  return (
    <div className="flex" style={{ height: "calc(100vh - 64px)" }}>
      {/* Left panel */}
      <div className={`w-full md:w-[340px] border-r flex flex-col shrink-0 ${!showMobileList ? "hidden md:flex" : "flex"}`} style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="p-4 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-[22px] font-extrabold" style={{ color: "var(--text-1)" }}>Pings</h1>
            <button className="w-9 h-9 rounded-full flex items-center justify-center transition-colors" style={{ background: "var(--surface-2)", border: "1px solid var(--border-2)" }} onClick={() => toast.info("New Ping composer")}>
              <PenSquare className="w-4 h-4" style={{ color: "var(--text-2)" }} />
            </button>
          </div>
          <div className="flex gap-4 mb-3">
            {(["all", "requests"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} className="text-[13px] font-bold pb-1 transition-colors" style={{ borderBottom: tab === t ? "2px solid var(--brand)" : "2px solid transparent", color: tab === t ? "var(--brand)" : "var(--text-3)" }}>
                {t === "all" ? "All" : `Requests (${requests.length})`}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 px-3 h-9 rounded-full" style={{ background: "var(--surface-2)", border: "1px solid var(--border-2)" }}>
            <Search className="w-4 h-4" style={{ color: "var(--text-3)" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search Pings..." className="flex-1 bg-transparent text-[12px] outline-none" style={{ color: "var(--text-1)" }} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {tab === "all" && filteredConvos.map(convo => (
            <button key={convo.id} onClick={() => { setActiveConvo(convo); setShowMobileList(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b"
              style={{
                background: activeConvo.id === convo.id ? "var(--brand-dim)" : convo.unread > 0 ? "var(--brand-dim)" : "transparent",
                borderLeft: activeConvo.id === convo.id ? "3px solid var(--brand)" : "3px solid transparent",
                borderBottomColor: "var(--border)",
              }}>
              <div className="relative">
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0" style={{ backgroundColor: ROLE_COLORS[convo.role] || "#3D5AF1", ...ringStyle(convo.verified) }}>{convo.initials}</div>
                {convo.unread > 0 && <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full" style={{ background: "var(--open-green)", border: "2px solid var(--surface)" }} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] truncate" style={{ color: "var(--text-1)", fontWeight: convo.unread > 0 ? 700 : 500 }}>{convo.name}</span>
                  <span className="text-[11px] shrink-0 ml-2" style={{ color: "var(--text-3)" }}>{convo.time}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold px-1 py-0 rounded" style={{ background: `${ROLE_COLORS[convo.role] || "#3D5AF1"}1A`, color: ROLE_COLORS[convo.role] || "#3D5AF1" }}>{convo.role}</span>
                  <span className="text-[11px] truncate" style={{ color: "var(--text-3)" }}>{convo.institution}</span>
                </div>
                <p className="text-[12px] truncate" style={{ color: convo.unread > 0 ? "var(--text-1)" : "var(--text-2)", fontWeight: convo.unread > 0 ? 600 : 400 }}>{convo.lastMsg}</p>
              </div>
              {convo.unread > 0 && <span className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ background: "var(--brand)" }}>{convo.unread}</span>}
            </button>
          ))}
          {tab === "requests" && requests.map(req => (
            <div key={req.id} className="mx-3 my-2 rounded-[14px] p-3.5" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)" }}>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: ROLE_COLORS[req.role] || "#3D5AF1", ...ringStyle(req.verified) }}>{req.initials}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold" style={{ color: "var(--text-1)" }}>{req.name}</p>
                  <p className="text-[10px]" style={{ color: "var(--text-3)" }}>{req.role} · {req.institution}</p>
                </div>
                <span className="text-[11px]" style={{ color: "var(--text-3)" }}>{req.time}</span>
              </div>
              <p className="text-[12px] mb-3 line-clamp-2" style={{ color: "var(--text-2)", fontStyle: "italic" }}>{req.preview}</p>
              <div className="flex gap-2">
                <Button size="xs" onClick={() => toast.success("Accepted! Strand created.")}><Check className="w-3 h-3" /> Accept</Button>
                <Button variant="ghost" size="xs" className="text-[#DC2626]" onClick={() => toast.info("Declined")}><X className="w-3 h-3" /> Decline</Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className={`flex-1 flex flex-col min-w-0 ${showMobileList ? "hidden md:flex" : "flex"}`} style={{ background: "var(--bg)" }}>
        {/* Chat header */}
        <div className="flex items-center gap-3 px-5 h-16 border-b shrink-0" style={{ background: "var(--surface)", borderColor: "var(--border)", backdropFilter: "blur(12px)" }}>
          <button onClick={() => setShowMobileList(true)} className="md:hidden p-1.5 rounded-lg" style={{ color: "var(--text-2)" }}><ArrowLeft className="w-5 h-5" /></button>
          <Link to="/app/profile" className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: ROLE_COLORS[activeConvo.role] || "#3D5AF1", ...ringStyle(activeConvo.verified) }}>{activeConvo.initials}</div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-bold" style={{ color: "var(--text-1)" }}>{activeConvo.name}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: `${ROLE_COLORS[activeConvo.role] || "#3D5AF1"}1A`, color: ROLE_COLORS[activeConvo.role] || "#3D5AF1" }}>{activeConvo.role}</span>
              </div>
              <p className="text-[12px]" style={{ color: "var(--text-3)" }}>{activeConvo.institution}</p>
            </div>
          </Link>
          <div className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--text-3)" }}><Lock className="w-3.5 h-3.5" /> Encrypted</div>
        </div>

        {/* Verification banner */}
        {!dismissedBanner && activeConvo.verified === "gold" && (
          <div className="px-5 py-2.5 flex items-center justify-between border-b" style={{ background: "rgba(245,158,11,0.08)", borderColor: "rgba(245,158,11,0.18)" }}>
            <p className="text-[12px]" style={{ color: "rgba(245,158,11,0.9)" }}><Shield className="w-3.5 h-3.5 inline text-[#F59E0B] mr-1" />{activeConvo.name} is Tiik Approved — verified by {activeConvo.institution}</p>
            <button onClick={() => setDismissedBanner(true)} style={{ color: "var(--text-3)" }}>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-2">
          <div className="text-center mb-4">
            <span className="text-[11px] px-3 py-1 rounded-full inline-flex items-center gap-1" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-3)" }}><Lock className="w-3 h-3" /> End-to-end encrypted</span>
          </div>
          <div className="text-center mb-2"><span className="text-[11px] px-3 py-1 rounded-full" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-3)" }}>Today</span></div>
          {mockMessages.map(msg => (
            <div key={msg.id} className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"} mb-2`}>
              {msg.sender === "them" && (
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold text-white mr-2 shrink-0 mt-1" style={{ backgroundColor: ROLE_COLORS[activeConvo.role] || "#3D5AF1", ...ringStyle(activeConvo.verified) }}>{activeConvo.initials}</div>
              )}
              <div className="max-w-[68%] px-3.5 py-2.5" style={{
                background: msg.sender === "me" ? "linear-gradient(135deg, var(--brand), var(--brand-2))" : "var(--surface-2)",
                border: msg.sender === "me" ? "none" : "1px solid var(--border)",
                borderRadius: msg.sender === "me" ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
                color: msg.sender === "me" ? "white" : "var(--text-1)",
                boxShadow: msg.sender === "me" ? "0 2px 8px var(--brand-glow)" : "none",
              }}>
                <p className="text-[14px] leading-[1.6]">{msg.text}</p>
                <p className="text-[11px] mt-1 text-right" style={{ opacity: 0.6 }}>{msg.time}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t px-4 py-3" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="flex items-center gap-1 mb-2">
            <button className="p-2 rounded-lg transition-colors" onClick={() => toast.info("PDF upload")} style={{ color: "var(--text-2)" }}><Paperclip className="w-4 h-4" /></button>
            <button className="p-2 rounded-lg transition-colors" onClick={() => toast.info("Share work item")} style={{ color: "var(--text-2)" }}><Layers className="w-4 h-4" /></button>
          </div>
          <div className="flex items-center gap-2.5">
            <textarea value={newMsg} onChange={e => setNewMsg(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder={`Ping ${activeConvo.name}...`}
              className="flex-1 min-h-[42px] max-h-[160px] rounded-2xl px-3.5 py-2.5 text-[14px] resize-none outline-none transition-colors"
              rows={1}
              style={{ background: "var(--surface-2)", border: "1.5px solid var(--border-2)", color: "var(--text-1)" }}
            />
            <button onClick={handleSend} disabled={!newMsg.trim()}
              className="w-[42px] h-[42px] rounded-full flex items-center justify-center transition-all disabled:opacity-40"
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

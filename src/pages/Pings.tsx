import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Lock, Search, Send, Paperclip, Layers, PenSquare, Check, X, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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

  const ringColor = (v: string) => v === "gold" ? "#F59E0B" : v === "grey" ? "#6B7280" : "transparent";

  return (
    <div className="max-w-6xl mx-auto px-4 py-7">
      <h1 className="text-[20px] font-bold text-t1 mb-5">Pings</h1>

      <div className="t-card overflow-hidden flex" style={{ height: "calc(100vh - 180px)", minHeight: "500px" }}>
        {/* Left panel */}
        <div className={`w-full md:w-[340px] border-r border-border flex flex-col shrink-0 ${!showMobileList ? "hidden md:flex" : "flex"}`}>
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-3">
              <div className="flex gap-3">
                <button onClick={() => setTab("all")} className={`text-sm font-bold pb-1 border-b-2 transition-colors ${tab === "all" ? "border-brand text-t1" : "border-transparent text-t2"}`}>All</button>
                <button onClick={() => setTab("requests")} className={`text-sm font-bold pb-1 border-b-2 transition-colors ${tab === "requests" ? "border-brand text-t1" : "border-transparent text-t2"}`}>
                  Requests ({requests.length})
                </button>
              </div>
              <button className="p-2 rounded-lg hover:bg-brand-dim transition-colors" onClick={() => toast.info("New Ping composer")}><PenSquare className="w-4 h-4 text-t2" /></button>
            </div>
            <div className="flex items-center gap-2 px-3 h-9 rounded-[20px] bg-surface-2 border border-border">
              <Search className="w-4 h-4 text-t3" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search conversations..." className="flex-1 bg-transparent text-xs outline-none placeholder:text-t3 text-t1" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {tab === "all" && filteredConvos.map(convo => (
              <button key={convo.id} onClick={() => { setActiveConvo(convo); setShowMobileList(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-brand-dim"
                style={activeConvo.id === convo.id ? { background: "hsl(var(--brand-dim))", borderLeft: "3px solid hsl(var(--brand))" } : {}}>
                <div className="relative">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ backgroundColor: ROLE_COLORS[convo.role] || "#5B4FFF", border: convo.verified !== "none" ? `2.5px solid ${ringColor(convo.verified)}` : undefined }}>{convo.initials}</div>
                  {convo.unread > 0 && <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#10B981] rounded-full border-2 border-surface" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`text-[13px] ${convo.unread > 0 ? "font-bold text-t1" : "font-medium text-t1"} truncate`}>{convo.name}</span>
                    <span className="text-[11px] text-t3 shrink-0 ml-2">{convo.time}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold px-1 py-0 rounded" style={{ backgroundColor: `${ROLE_COLORS[convo.role] || "#5B4FFF"}20`, color: ROLE_COLORS[convo.role] || "#5B4FFF" }}>{convo.role}</span>
                    <span className="text-[11px] text-t3 truncate">{convo.institution}</span>
                  </div>
                  <p className={`text-xs truncate ${convo.unread > 0 ? "font-bold text-t1" : "text-t2"}`}>{convo.lastMsg}</p>
                </div>
                {convo.unread > 0 && <span className="w-[18px] h-[18px] rounded-full bg-brand text-white text-[10px] font-bold flex items-center justify-center shrink-0">{convo.unread}</span>}
              </button>
            ))}
            {tab === "requests" && requests.map(req => (
              <div key={req.id} className="px-4 py-3 border-b border-border">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: ROLE_COLORS[req.role] || "#5B4FFF", border: `2.5px solid ${ringColor(req.verified)}` }}>{req.initials}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-t1">{req.name}</p>
                    <p className="text-[10px] text-t3">{req.role} · {req.institution}</p>
                  </div>
                  <span className="text-[11px] text-t3">{req.time}</span>
                </div>
                <p className="text-xs text-t2 mb-3 line-clamp-2">{req.preview}</p>
                <div className="flex gap-2">
                  <Button size="xs" onClick={() => toast.success("Accepted! Strand created.")}><Check className="w-3 h-3" /> Accept</Button>
                  <Button variant="ghost" size="xs" onClick={() => toast.info("Declined")}><X className="w-3 h-3" /> Decline</Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div className={`flex-1 flex flex-col min-w-0 ${showMobileList ? "hidden md:flex" : "flex"}`}>
          {/* Chat header */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-border h-14">
            <button onClick={() => setShowMobileList(true)} className="md:hidden p-1.5 rounded-lg hover:bg-brand-dim text-t2">←</button>
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: ROLE_COLORS[activeConvo.role] || "#5B4FFF", border: `2px solid ${ringColor(activeConvo.verified)}` }}>{activeConvo.initials}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-t1">{activeConvo.name}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${ROLE_COLORS[activeConvo.role] || "#5B4FFF"}20`, color: ROLE_COLORS[activeConvo.role] || "#5B4FFF" }}>{activeConvo.role}</span>
              </div>
              <p className="text-[11px] text-t3">{activeConvo.institution}</p>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-t3"><Lock className="w-3 h-3" /> End-to-end encrypted</div>
          </div>

          {/* Verification banner */}
          {!dismissedBanner && activeConvo.verified === "gold" && (
            <div className="px-5 py-2.5 bg-[rgba(245,158,11,0.08)] border-b border-[rgba(245,158,11,0.2)] flex items-center justify-between">
              <p className="text-xs text-t2"><Shield className="w-3 h-3 inline text-[#F59E0B] mr-1" />{activeConvo.name} is Tiik Approved — identity verified by {activeConvo.institution}</p>
              <button onClick={() => setDismissedBanner(true)} className="text-t3 hover:text-t1 text-xs">✕</button>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            <div className="text-center mb-4">
              <span className="text-[11px] text-t3 bg-surface-2 border border-border px-3 py-1 rounded-full inline-flex items-center gap-1"><Lock className="w-3 h-3" /> End-to-end encrypted</span>
            </div>
            <div className="text-center mb-2"><span className="text-[11px] text-t3 bg-surface-2 border border-border px-3 py-1 rounded-full">Today</span></div>
            {mockMessages.map(msg => (
              <div key={msg.id} className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}>
                {msg.sender === "them" && (
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold text-white mr-2 shrink-0 mt-1" style={{ backgroundColor: ROLE_COLORS[activeConvo.role] || "#5B4FFF" }}>{activeConvo.initials}</div>
                )}
                <div className="max-w-[70%] px-3.5 py-2.5" style={{
                  background: msg.sender === "me" ? "hsl(var(--brand))" : "hsl(var(--surface-2))",
                  border: msg.sender === "me" ? "none" : "1px solid hsl(var(--border))",
                  borderRadius: msg.sender === "me" ? "14px 4px 14px 14px" : "4px 14px 14px 14px",
                  color: msg.sender === "me" ? "white" : "hsl(var(--text-1))",
                }}>
                  <p className="text-xs leading-relaxed">{msg.text}</p>
                  <p className="text-[10px] mt-1 text-right" style={{ opacity: 0.6 }}>{msg.time}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-border px-4 py-3">
            <div className="flex items-center gap-1 mb-2">
              <button className="p-2 rounded-lg hover:bg-brand-dim transition-colors" onClick={() => toast.info("PDF upload")}><Paperclip className="w-4 h-4 text-t2" /></button>
              <button className="p-2 rounded-lg hover:bg-brand-dim transition-colors" onClick={() => toast.info("Share work item")}><Layers className="w-4 h-4 text-t2" /></button>
            </div>
            <div className="flex items-center gap-2">
              <input value={newMsg} onChange={e => setNewMsg(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Write a Ping..." className="flex-1 min-h-[40px] bg-surface-2 border border-border rounded-[20px] px-4 text-sm outline-none placeholder:text-t3 text-t1 focus:border-brand transition-colors" />
              <button onClick={handleSend} disabled={!newMsg.trim()}
                className="w-10 h-10 rounded-full bg-brand flex items-center justify-center disabled:opacity-40 transition-opacity">
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pings;

import { useState } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Lock, Search, Send, Paperclip, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const conversations = [
  { id: "1", name: "Priya Menon", initials: "PM", color: "#FFB547", role: "Faculty", lastMsg: "Great work on the TelemedicineRx update!", time: "2h ago", unread: true },
  { id: "2", name: "Rahul Kumar", initials: "RK", color: "#4FC3F7", role: "Professional", lastMsg: "Can we discuss the API architecture?", time: "5h ago", unread: true },
  { id: "3", name: "Dr. Neha Sharma", initials: "NS", color: "#26C6DA", role: "Doctor", lastMsg: "The health camp report is ready for review.", time: "Yesterday", unread: false },
  { id: "4", name: "Riya Sharma", initials: "RS", color: "#7C6FFF", role: "Student", lastMsg: "Thanks for the collaboration invite!", time: "2 days ago", unread: false },
  { id: "5", name: "Sunita Devi", initials: "SD", color: "#FFA726", role: "Skilled Trade", lastMsg: "Installation completed. Photos uploaded.", time: "3 days ago", unread: false },
];

const mockMessages = [
  { id: "m1", sender: "them", text: "Hey Arjun! I reviewed your TelemedicineRx project. The architecture looks solid.", time: "10:30 AM" },
  { id: "m2", sender: "them", text: "Have you considered adding offline support for areas with poor connectivity?", time: "10:31 AM" },
  { id: "m3", sender: "me", text: "Thanks Priya! Yes, we're planning to add a local-first sync layer using SQLite. Should be ready in 2 weeks.", time: "10:45 AM" },
  { id: "m4", sender: "them", text: "That's great. I can connect you with a student who worked on a similar offline-first healthcare app last semester.", time: "11:02 AM" },
  { id: "m5", sender: "me", text: "That would be amazing! Please share their profile.", time: "11:05 AM" },
  { id: "m6", sender: "them", text: "Great work on the TelemedicineRx update!", time: "2:30 PM" },
];

const Messages = () => {
  const [activeConvo, setActiveConvo] = useState(conversations[0]);
  const [search, setSearch] = useState("");
  const [newMsg, setNewMsg] = useState("");
  const [showMobileList, setShowMobileList] = useState(true);

  const filteredConvos = conversations.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSend = () => {
    if (!newMsg.trim()) return;
    toast.success("Message sent");
    setNewMsg("");
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <MessageCircle className="w-7 h-7 text-electric" />
        <h1 className="text-[28px] font-bold">Messages</h1>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden flex" style={{ height: "calc(100vh - 200px)", minHeight: "500px" }}>
        {/* Conversation list */}
        <div className={`w-full md:w-80 border-r border-border flex flex-col shrink-0 ${!showMobileList ? "hidden md:flex" : "flex"}`}>
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3 px-3 h-10 rounded-xl" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}>
              <Search className="w-4 h-4 text-muted-foreground" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search conversations..."
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredConvos.map(convo => (
              <button
                key={convo.id}
                onClick={() => { setActiveConvo(convo); setShowMobileList(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[rgba(255,255,255,0.06)]"
                style={activeConvo.id === convo.id ? { background: "rgba(124,111,255,0.12)" } : {}}
              >
                <div className="relative">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ backgroundColor: convo.color }}>
                    {convo.initials}
                  </div>
                  {convo.unread && <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-neon rounded-full border-2 border-background" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${convo.unread ? "font-bold" : "font-medium"} truncate`}>{convo.name}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0 ml-2">{convo.time}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{convo.lastMsg}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat area */}
        <div className={`flex-1 flex flex-col min-w-0 ${showMobileList ? "hidden md:flex" : "flex"}`}>
          {/* Chat header */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-border">
            <button onClick={() => setShowMobileList(true)} className="md:hidden p-1.5 rounded-lg hover:bg-[rgba(255,255,255,0.06)]">
              ←
            </button>
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: activeConvo.color }}>
              {activeConvo.initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold">{activeConvo.name}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${activeConvo.color}22`, color: activeConvo.color }}>
                  {activeConvo.role}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <Lock className="w-3 h-3" />
              Encrypted
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            <div className="text-center mb-4">
              <span className="text-[10px] text-muted-foreground glass-card px-3 py-1 rounded-full">
                <Lock className="w-3 h-3 inline mr-1" />
                Messages are end-to-end encrypted
              </span>
            </div>
            {mockMessages.map(msg => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className="max-w-[75%] rounded-2xl px-4 py-2.5"
                  style={{
                    background: msg.sender === "me" ? "rgba(124,111,255,0.2)" : "rgba(255,255,255,0.08)",
                    border: `1px solid ${msg.sender === "me" ? "rgba(124,111,255,0.3)" : "rgba(255,255,255,0.1)"}`,
                  }}
                >
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                  <p className="text-[10px] text-muted-foreground mt-1 text-right">{msg.time}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-border">
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-lg hover:bg-[rgba(255,255,255,0.06)] transition-colors" onClick={() => toast.info("File attachment coming soon")}>
                <Paperclip className="w-4 h-4 text-muted-foreground" />
              </button>
              <button className="p-2 rounded-lg hover:bg-[rgba(255,255,255,0.06)] transition-colors" onClick={() => toast.info("Share work item coming soon")}>
                <Layers className="w-4 h-4 text-muted-foreground" />
              </button>
              <input
                value={newMsg}
                onChange={e => setNewMsg(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSend()}
                placeholder="Type a message..."
                className="flex-1 h-10 bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.12)] rounded-xl px-4 text-sm outline-none placeholder:text-muted-foreground focus:border-[rgba(124,111,255,0.5)] transition-colors"
              />
              <Button variant="default" size="sm" onClick={handleSend} disabled={!newMsg.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;

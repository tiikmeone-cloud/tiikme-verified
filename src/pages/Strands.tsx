import { useState } from "react";
import { motion } from "framer-motion";
import { Share2, Shield, Check, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const connectedStrands = [
  { name: "Priya Menon", initials: "PM", role: "Faculty", color: "#FFB547", institution: "Delhi Tech University", mutual: 12 },
  { name: "Rahul Kumar", initials: "RK", role: "Professional", color: "#4FC3F7", institution: "Backend Engineer, Bengaluru", mutual: 8 },
  { name: "Dr. Neha Sharma", initials: "NS", role: "Doctor", color: "#26C6DA", institution: "AIIMS New Delhi", mutual: 5 },
  { name: "Riya Sharma", initials: "RS", role: "Student", color: "#7C6FFF", institution: "JNTU Hyderabad", mutual: 14 },
  { name: "Sunita Devi", initials: "SD", role: "Skilled Trade", color: "#FFA726", institution: "Electrician, Hyderabad", mutual: 3 },
];

const pendingStrands = [
  { name: "Mohan R.", initials: "MR", role: "Student", color: "#7C6FFF", institution: "BITS Pilani", sentAgo: "2 days ago" },
  { name: "Kavya P.", initials: "KP", role: "Professional", color: "#4FC3F7", institution: "UX Designer", sentAgo: "3 days ago" },
  { name: "Dr. Sriram T.", initials: "ST", role: "Doctor", color: "#26C6DA", institution: "Manipal Hospital", sentAgo: "5 days ago" },
];

const suggestedStrands = [
  { name: "Anika R.", initials: "AR", role: "Student", color: "#7C6FFF", institution: "DTU — Same institution", mutual: 8 },
  { name: "Prof. Verma", initials: "PV", role: "Faculty", color: "#FFB547", institution: "DTU — Computer Science", mutual: 15 },
  { name: "Kiran M.", initials: "KM", role: "Student", color: "#7C6FFF", institution: "DTU — HealthTech domain", mutual: 6 },
  { name: "Meera Joshi", initials: "MJ", role: "Professional", color: "#4FC3F7", institution: "Backend Dev — Similar projects", mutual: 4 },
];

const Strands = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"connected" | "pending" | "suggested">("connected");
  const [search, setSearch] = useState("");

  const filteredConnected = connectedStrands.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) || s.institution.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-2">
        <Share2 className="w-7 h-7 text-electric" />
        <h1 className="text-[28px] font-bold">My Strands</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Mutual connections — people who chose you and you chose back.
      </p>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {([
          ["connected", `My strands (${connectedStrands.length})`],
          ["pending", `Pending (${pendingStrands.length})`],
          ["suggested", "Suggested"],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key as any)}
            className="whitespace-nowrap text-xs font-bold px-4 py-2 rounded-full transition-all"
            style={{
              background: tab === key ? "#7C6FFF" : "rgba(255,255,255,0.06)",
              border: `1px solid ${tab === key ? "#7C6FFF" : "rgba(255,255,255,0.12)"}`,
              color: tab === key ? "white" : "rgba(240,240,255,0.6)",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Connected */}
      {tab === "connected" && (
        <div>
          <div className="flex items-center gap-3 px-4 mb-4 h-11 rounded-xl" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}>
            <Search className="w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search your strands..." className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
          </div>
          <div className="space-y-3">
            {filteredConnected.map((strand, i) => (
              <motion.div key={strand.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="glass-card rounded-2xl p-4 flex items-center gap-4">
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ backgroundColor: strand.color }}>{strand.initials}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">{strand.name}</span>
                    <Shield className="w-3 h-3 text-neon" />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span style={{ color: strand.color }}>{strand.role}</span>
                    <span>·</span>
                    <span>{strand.institution}</span>
                  </div>
                </div>
                <Button variant="secondary" size="xs" onClick={() => toast.info("Opening message...")}>View profile</Button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Pending */}
      {tab === "pending" && (
        <div>
          <p className="text-sm font-bold mb-4">{pendingStrands.length} pending strand requests</p>
          <div className="space-y-3">
            {pendingStrands.map((strand, i) => (
              <motion.div key={strand.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="glass-card rounded-2xl p-4 flex items-center gap-4">
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ backgroundColor: strand.color }}>{strand.initials}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">{strand.name}</span>
                    <span className="text-[10px] font-bold" style={{ color: strand.color }}>{strand.role}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{strand.institution} · Sent {strand.sentAgo}</div>
                </div>
                <div className="flex gap-2">
                  <Button variant="neon" size="xs" onClick={() => toast.success("Strand accepted!")}>
                    <Check className="w-3 h-3" /> Accept
                  </Button>
                  <Button variant="ghost" size="xs" className="text-destructive" onClick={() => toast.info("Request declined")}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Suggested */}
      {tab === "suggested" && (
        <div>
          <p className="text-sm font-bold mb-4">People in your domain</p>
          <div className="space-y-3">
            {suggestedStrands.map((strand, i) => (
              <motion.div key={strand.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="glass-card rounded-2xl p-4 flex items-center gap-4">
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ backgroundColor: strand.color }}>{strand.initials}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">{strand.name}</span>
                    <span className="text-[10px] font-bold" style={{ color: strand.color }}>{strand.role}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{strand.institution} · {strand.mutual} mutual</div>
                </div>
                <Button variant="default" size="xs" onClick={() => toast.success("Strand request sent!")}>Send strand</Button>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Strands;

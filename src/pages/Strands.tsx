import { useState } from "react";
import { motion } from "framer-motion";
import { Share2, Shield, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const strands = [
  { name: "Priya Menon", initials: "PM", role: "Faculty", color: "#FFB547", status: "connected", mutual: 12 },
  { name: "Rahul Kumar", initials: "RK", role: "Professional", color: "#4FC3F7", status: "connected", mutual: 8 },
  { name: "Dr. Anita", initials: "DA", role: "Doctor", color: "#26C6DA", status: "connected", mutual: 5 },
  { name: "Suresh Reddy", initials: "SR", role: "Government", color: "#66BB6A", status: "pending", mutual: 3 },
  { name: "Meera Joshi", initials: "MJ", role: "HR / Recruiter", color: "#FF6B6B", status: "incoming", mutual: 7 },
];

const Strands = () => {
  const [tab, setTab] = useState<"all" | "pending" | "incoming">("all");

  const filtered = strands.filter(s => {
    if (tab === "all") return s.status === "connected";
    if (tab === "pending") return s.status === "pending";
    return s.status === "incoming";
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-2">
        <Share2 className="w-7 h-7 text-electric" />
        <h1 className="text-[28px] font-bold">My Strands</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Your professional connections. Mutual only — no cold messaging.
      </p>

      <div className="flex gap-2 mb-6">
        {([["all", "Connected"], ["pending", "Pending"], ["incoming", "Requests"]] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`text-xs font-bold px-4 py-2 rounded-full glass-card transition-all ${
              tab === key ? "border-electric text-electric" : "text-muted-foreground"
            }`}
            style={tab === key ? { borderColor: "#7C6FFF", boxShadow: "0 0 10px rgba(124,111,255,0.2)" } : {}}
          >
            {label} ({strands.filter(s => key === "all" ? s.status === "connected" : s.status === key).length})
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((strand, i) => (
          <motion.div
            key={strand.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="glass-card rounded-2xl p-4 flex items-center gap-4"
          >
            <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ backgroundColor: strand.color }}>
              {strand.initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold">{strand.name}</span>
                <Shield className="w-3 h-3 text-neon" />
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span style={{ color: strand.color }}>{strand.role}</span>
                <span>·</span>
                <span>{strand.mutual} mutual</span>
              </div>
            </div>
            {strand.status === "connected" && (
              <Button variant="secondary" size="xs" onClick={() => toast.info("Opening message...")}>Message</Button>
            )}
            {strand.status === "pending" && (
              <span className="text-xs text-muted-foreground font-medium">Pending</span>
            )}
            {strand.status === "incoming" && (
              <div className="flex gap-2">
                <Button variant="default" size="xs" onClick={() => toast.success("Strand accepted!")}>
                  <Check className="w-3 h-3" />
                </Button>
                <Button variant="ghost" size="xs" onClick={() => toast.info("Request declined")}>
                  <X className="w-3 h-3" />
                </Button>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <Share2 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-3">No strands here yet</p>
          <Button variant="default" size="sm" onClick={() => toast.info("Opening Nexus...")}>Find people in Nexus</Button>
        </div>
      )}
    </div>
  );
};

export default Strands;

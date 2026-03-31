import { useState } from "react";
import { motion } from "framer-motion";
import { Link2, Check, X, Search, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const ROLE_COLORS: Record<string, string> = {
  Student: "#4F46E5", Professional: "#0369A1", Government: "#166534",
  Doctor: "#0E7490", Faculty: "#92400E", "Skilled Trade": "#C2410C",
  "HR/Recruiter": "#6B21A8", Aspirant: "#374151", Builder: "#7C3AED",
};

type Verification = "gold" | "grey" | "none";

interface Person {
  name: string; initials: string; role: string; institution: string;
  verification: Verification; mutual?: number; sentAgo?: string;
  reason?: string;
}

const connectedStrands: Person[] = [
  { name: "Priya Menon", initials: "PM", role: "Faculty", institution: "Delhi Tech University", verification: "gold", mutual: 12 },
  { name: "Rahul Kumar", initials: "RK", role: "Professional", institution: "Backend Engineer, Bengaluru", verification: "grey", mutual: 8 },
  { name: "Dr. Neha Sharma", initials: "NS", role: "Doctor", institution: "AIIMS New Delhi", verification: "gold", mutual: 5 },
  { name: "Riya Sharma", initials: "RS", role: "Student", institution: "JNTU Hyderabad", verification: "grey", mutual: 14 },
  { name: "Sunita Devi", initials: "SD", role: "Skilled Trade", institution: "Electrician, Hyderabad", verification: "none", mutual: 3 },
];

const pendingStrands: Person[] = [
  { name: "Mohan R.", initials: "MR", role: "Student", institution: "BITS Pilani", verification: "grey", sentAgo: "2 days ago" },
  { name: "Kavya P.", initials: "KP", role: "Professional", institution: "UX Designer", verification: "none", sentAgo: "3 days ago" },
  { name: "Dr. Sriram T.", initials: "ST", role: "Doctor", institution: "Manipal Hospital", verification: "gold", sentAgo: "5 days ago" },
];

const suggestedStrands: Person[] = [
  { name: "Anika R.", initials: "AR", role: "Student", institution: "DTU", verification: "grey", reason: "Same institution", mutual: 8 },
  { name: "Prof. Verma", initials: "PV", role: "Faculty", institution: "DTU — CS Dept", verification: "gold", reason: "Same domain", mutual: 15 },
  { name: "Kiran M.", initials: "KM", role: "Student", institution: "DTU", verification: "none", reason: "HealthTech domain", mutual: 6 },
  { name: "Meera Joshi", initials: "MJ", role: "Professional", institution: "Backend Dev", verification: "grey", reason: "Similar projects", mutual: 4 },
];

const Avatar = ({ initials, role, verification = "none" as Verification, size = 40 }: { initials: string; role: string; verification?: Verification; size?: number }) => {
  const color = ROLE_COLORS[role] || "#5B4FFF";
  return (
    <div className="relative shrink-0" style={{ width: size + (verification !== "none" ? 6 : 0), height: size + (verification !== "none" ? 6 : 0) }}>
      <div className="rounded-full flex items-center justify-center text-white font-bold absolute"
        style={{
          backgroundColor: color, width: size, height: size, fontSize: size * 0.28,
          top: verification !== "none" ? 3 : 0,
          left: verification !== "none" ? 3 : 0,
        }}>
        {initials}
      </div>
      {verification === "gold" && <div className="absolute inset-0 rounded-full" style={{ boxShadow: `0 0 0 2px var(--surface), 0 0 0 3.5px #F59E0B` }} />}
      {verification === "grey" && <div className="absolute inset-0 rounded-full" style={{ boxShadow: `0 0 0 2px var(--surface), 0 0 0 3.5px #6B7280` }} />}
    </div>
  );
};

const Strands = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"connected" | "pending" | "suggested">("connected");
  const [search, setSearch] = useState("");
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());
  const [acceptedPending, setAcceptedPending] = useState<Set<string>>(new Set());
  const [declinedPending, setDeclinedPending] = useState<Set<string>>(new Set());

  const filteredConnected = connectedStrands.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) || s.institution.toLowerCase().includes(search.toLowerCase())
  );

  const activePending = pendingStrands.filter(s => !acceptedPending.has(s.name) && !declinedPending.has(s.name));

  const tabs = [
    { key: "connected" as const, label: `My strands (${connectedStrands.length})` },
    { key: "pending" as const, label: `Pending (${activePending.length})` },
    { key: "suggested" as const, label: "Suggested" },
  ];

  const renderPerson = (strand: Person, actions: React.ReactNode, subtitle: string) => (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border/30 last:border-b-0 hover:bg-surface-2/50 transition-all duration-200">
      <button onClick={() => navigate("/app/profile")} className="cursor-pointer">
        <Avatar initials={strand.initials} role={strand.role} verification={strand.verification} />
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate("/app/profile")} className="text-[13px] font-bold text-t1 hover:text-brand transition-colors cursor-pointer">{strand.name}</button>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${ROLE_COLORS[strand.role] || "#5B4FFF"}14`, color: ROLE_COLORS[strand.role] || "#5B4FFF" }}>{strand.role}</span>
        </div>
        <p className="text-[11px] text-t3 truncate">{subtitle}</p>
      </div>
      <div className="flex gap-1.5 shrink-0">{actions}</div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-2">
        <Link2 className="w-6 h-6 text-brand" />
        <h1 className="text-[20px] font-bold text-t1">My Strands</h1>
      </div>
      <p className="text-[13px] text-t2 mb-5">Mutual connections — people who chose you and you chose back.</p>

      {/* Tabs — underline style */}
      <div className="flex gap-0 border-b border-border/30 mb-5">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-[12px] font-semibold transition-all duration-200 relative cursor-pointer ${
              tab === t.key ? "text-brand" : "text-t3 hover:text-t1"
            }`}>
            {t.label}
            {tab === t.key && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-brand rounded-full" />}
          </button>
        ))}
      </div>

      {/* Connected */}
      {tab === "connected" && (
        <div>
          <div className="flex items-center gap-3 px-4 mb-4 h-[38px] rounded-full bg-surface-2 border border-border/30">
            <Search className="w-4 h-4 text-t3" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search your strands..."
              className="flex-1 bg-transparent text-sm outline-none text-t1 placeholder:text-t3" />
          </div>
          <div className="rounded-2xl border border-border/30 overflow-hidden" style={{ background: "var(--surface)" }}>
            {filteredConnected.map((strand, i) => (
              <motion.div key={strand.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                {renderPerson(strand, (
                  <>
                    <Button variant="ghost" size="xs" className="active:scale-95 transition-all duration-200" onClick={() => navigate("/app/profile")}>View</Button>
                    <Button variant="secondary" size="xs" className="active:scale-95 transition-all duration-200" onClick={() => navigate("/app/pings")}>
                      <MessageCircle className="w-3 h-3" /> Ping
                    </Button>
                  </>
                ), `${strand.institution}${strand.mutual ? ` · ${strand.mutual} mutual` : ""}`)}
              </motion.div>
            ))}
            {filteredConnected.length === 0 && (
              <div className="text-center py-12">
                <Link2 className="w-10 h-10 text-t3 mx-auto mb-3" />
                <p className="text-[14px] text-t2">No strands match your search.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pending */}
      {tab === "pending" && (
        <div>
          {activePending.length > 0 && <p className="text-[13px] font-bold text-t1 mb-3">{activePending.length} pending strand requests</p>}
          <div className="rounded-2xl border border-border/30 overflow-hidden" style={{ background: "var(--surface)" }}>
            {activePending.map((strand, i) => (
              <motion.div key={strand.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                {renderPerson(strand, (
                  <>
                    <Button size="xs" className="active:scale-95 transition-all duration-200" onClick={() => { setAcceptedPending(p => new Set(p).add(strand.name)); toast.success(`Strand with ${strand.name} accepted!`); }}>
                      <Check className="w-3 h-3" /> Accept
                    </Button>
                    <Button variant="ghost" size="xs" className="active:scale-95 transition-all duration-200" onClick={() => { setDeclinedPending(p => new Set(p).add(strand.name)); toast.info("Request declined"); }}>
                      <X className="w-3 h-3" />
                    </Button>
                  </>
                ), `${strand.institution} · Sent ${strand.sentAgo}`)}
              </motion.div>
            ))}
            {activePending.length === 0 && (
              <div className="text-center py-12">
                <Check className="w-10 h-10 text-t3 mx-auto mb-3" />
                <p className="text-[14px] text-t2">No pending requests. You're all caught up!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Suggested */}
      {tab === "suggested" && (
        <div>
          <p className="text-[13px] font-bold text-t1 mb-3">People in your domain</p>
          <div className="rounded-2xl border border-border/30 overflow-hidden" style={{ background: "var(--surface)" }}>
            {suggestedStrands.map((strand, i) => (
              <motion.div key={strand.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                {renderPerson(strand, (
                  <Button size="xs" className="active:scale-95 transition-all duration-200" disabled={sentRequests.has(strand.name)}
                    onClick={() => { setSentRequests(p => new Set(p).add(strand.name)); toast.success(`Strand request sent to ${strand.name}`); }}>
                    {sentRequests.has(strand.name) ? "Sent ✓" : "Connect"}
                  </Button>
                ), `${strand.institution} · ${strand.reason} · ${strand.mutual} mutual`)}
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Strands;

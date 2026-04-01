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
  { name: "Mohan R.", initials: "MR", role: "Student", institution: "BITS Pilani", verification: "grey", mutual: 6 },
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

const Avatar = ({ initials, role, verification = "none" as Verification, size = 44 }: { initials: string; role: string; verification?: Verification; size?: number }) => {
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

  const renderGridCard = (strand: Person, actions: React.ReactNode, subtitle: string) => (
    <article className="glass-liquid glass-liquid-hover rounded-2xl md:rounded-3xl p-5 flex flex-col items-center text-center">
      <button onClick={() => navigate("/app/profile")} className="cursor-pointer mb-3">
        <Avatar initials={strand.initials} role={strand.role} verification={strand.verification} size={48} />
      </button>
      <button onClick={() => navigate("/app/profile")} className="text-[14px] font-bold hover:text-[var(--brand)] transition-colors cursor-pointer" style={{ color: "var(--text-1)" }}>{strand.name}</button>
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full mt-1" style={{ backgroundColor: `${ROLE_COLORS[strand.role] || "#5B4FFF"}14`, color: ROLE_COLORS[strand.role] || "#5B4FFF" }}>{strand.role}</span>
      <p className="text-[11px] mt-1.5 line-clamp-1" style={{ color: "var(--text-3)" }}>{subtitle}</p>
      <div className="flex gap-1.5 mt-3 w-full justify-center">{actions}</div>
    </article>
  );

  return (
    <main className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-2">
        <Link2 className="w-6 h-6" style={{ color: "var(--brand)" }} />
        <h1 className="text-[20px] text-emboss">My Strands</h1>
      </div>
      <p className="text-[13px] mb-5" style={{ color: "var(--text-2)" }}>Mutual connections — people who chose you and you chose back.</p>

      {/* Tabs */}
      <div className="flex gap-0 border-b mb-5" style={{ borderColor: "var(--border)" }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-[12px] font-semibold transition-all duration-200 relative cursor-pointer ${
              tab === t.key ? "" : "hover:opacity-80"
            }`}
            style={{ color: tab === t.key ? "var(--brand)" : "var(--text-3)" }}>
            {t.label}
            {tab === t.key && <div className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full" style={{ background: "var(--brand)" }} />}
          </button>
        ))}
      </div>

      {/* Connected */}
      {tab === "connected" && (
        <div>
          <div className="flex items-center gap-3 px-4 mb-4 h-[38px] rounded-full" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
            <Search className="w-4 h-4" style={{ color: "var(--text-3)" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search your strands..."
              className="flex-1 bg-transparent text-sm outline-none" style={{ color: "var(--text-1)" }} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredConnected.map((strand, i) => (
              <motion.div key={strand.name} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                {renderGridCard(strand, (
                  <>
                    <Button variant="ghost" size="xs" className="active:scale-95" onClick={() => navigate("/app/profile")}>View</Button>
                    <Button variant="secondary" size="xs" className="active:scale-95" onClick={() => navigate("/app/pings")}>
                      <MessageCircle className="w-3 h-3" /> Ping
                    </Button>
                  </>
                ), `${strand.institution}${strand.mutual ? ` · ${strand.mutual} mutual` : ""}`)}
              </motion.div>
            ))}
          </div>
          {filteredConnected.length === 0 && (
            <div className="text-center py-12">
              <Link2 className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--text-3)" }} />
              <p className="text-[14px]" style={{ color: "var(--text-2)" }}>No strands match your search.</p>
            </div>
          )}
        </div>
      )}

      {/* Pending */}
      {tab === "pending" && (
        <div>
          {activePending.length > 0 && <p className="text-[13px] font-bold mb-3" style={{ color: "var(--text-1)" }}>{activePending.length} pending strand requests</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activePending.map((strand, i) => (
              <motion.div key={strand.name} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                {renderGridCard(strand, (
                  <>
                    <Button size="xs" className="active:scale-95" onClick={() => { setAcceptedPending(p => new Set(p).add(strand.name)); toast.success(`Strand with ${strand.name} accepted!`); }}>
                      <Check className="w-3 h-3" /> Accept
                    </Button>
                    <Button variant="ghost" size="xs" className="active:scale-95" onClick={() => { setDeclinedPending(p => new Set(p).add(strand.name)); toast.info("Request declined"); }}>
                      <X className="w-3 h-3" />
                    </Button>
                  </>
                ), `${strand.institution} · Sent ${strand.sentAgo}`)}
              </motion.div>
            ))}
          </div>
          {activePending.length === 0 && (
            <div className="text-center py-12">
              <Check className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--text-3)" }} />
              <p className="text-[14px]" style={{ color: "var(--text-2)" }}>No pending requests. You're all caught up!</p>
            </div>
          )}
        </div>
      )}

      {/* Suggested */}
      {tab === "suggested" && (
        <div>
          <p className="text-[13px] font-bold mb-3" style={{ color: "var(--text-1)" }}>People in your domain</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suggestedStrands.map((strand, i) => (
              <motion.div key={strand.name} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                {renderGridCard(strand, (
                  <Button size="xs" className="active:scale-95" disabled={sentRequests.has(strand.name)}
                    onClick={() => { setSentRequests(p => new Set(p).add(strand.name)); toast.success(`Strand request sent to ${strand.name}`); }}>
                    {sentRequests.has(strand.name) ? "Sent ✓" : "Connect"}
                  </Button>
                ), `${strand.institution} · ${strand.reason} · ${strand.mutual} mutual`)}
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
};

export default Strands;

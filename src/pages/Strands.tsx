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

const ROLE_BG: Record<string, string> = {
  Student: "#EEF2FF", Professional: "#E0F2FE", Government: "#DCFCE7",
  Doctor: "#CCFBF1", Faculty: "#FEF3C7", "Skilled Trade": "#FFEDD5",
  "HR/Recruiter": "#F3E8FF", Aspirant: "#F3F4F6", Builder: "#EDE9FE",
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

const VerificationRing = ({ level, size = 44 }: { level: Verification; size?: number }) => {
  const border = level === "gold" ? "2.5px solid #F59E0B" : level === "grey" ? "2.5px solid #6B7280" : "none";
  return <div className="rounded-full" style={{ border, padding: level !== "none" ? 1 : 0, width: size + (level !== "none" ? 6 : 0), height: size + (level !== "none" ? 6 : 0), display: "flex", alignItems: "center", justifyContent: "center" }} />;
};

const Avatar = ({ initials, role, size = 44, verification = "none" as Verification }: { initials: string; role: string; size?: number; verification?: Verification }) => {
  const color = ROLE_COLORS[role] || "#5B4FFF";
  const ringBorder = verification === "gold" ? "2.5px solid #F59E0B" : verification === "grey" ? "2.5px solid #6B7280" : "none";
  return (
    <div className="shrink-0 rounded-full flex items-center justify-center" style={{ border: ringBorder, padding: verification !== "none" ? 2 : 0 }}>
      <div className="rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: color, width: size, height: size, fontSize: size * 0.3 }}>
        {initials}
      </div>
    </div>
  );
};

const RoleBadge = ({ role }: { role: string }) => (
  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: ROLE_BG[role] || "#EEF2FF", color: ROLE_COLORS[role] || "#5B4FFF" }}>
    {role}
  </span>
);

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

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-2">
        <Link2 className="w-6 h-6 text-brand" />
        <h1 className="text-[20px] font-bold text-t1">My Strands</h1>
      </div>
      <p className="text-[13px] text-t2 mb-6">
        Mutual connections — people who chose you and you chose back.
      </p>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="whitespace-nowrap text-xs font-bold px-4 py-2 rounded-full transition-all"
            style={{
              background: tab === t.key ? "hsl(var(--brand))" : "var(--surface-2)",
              border: `1px solid ${tab === t.key ? "hsl(var(--brand))" : "var(--border-2)"}`,
              color: tab === t.key ? "white" : "var(--text-2)",
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Connected Tab */}
      {tab === "connected" && (
        <div>
          <div className="flex items-center gap-3 px-4 mb-4 h-[38px] rounded-[20px] bg-surface-2 border border-border-2">
            <Search className="w-4 h-4 text-t3" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search your strands..."
              className="flex-1 bg-transparent text-sm outline-none text-t1 placeholder:text-t3" />
          </div>
          <div className="space-y-3">
            {filteredConnected.map((strand, i) => (
              <motion.div key={strand.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="rounded-2xl p-4 flex items-center gap-4 bg-surface border border-border" style={{ borderRadius: 16 }}>
                <button onClick={() => navigate("/app/profile")}>
                  <Avatar initials={strand.initials} role={strand.role} verification={strand.verification} />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button onClick={() => navigate("/app/profile")} className="text-[14px] font-bold text-t1 hover:underline">{strand.name}</button>
                    <RoleBadge role={strand.role} />
                  </div>
                  <p className="text-[12px] text-t3 truncate">
                    <button onClick={() => navigate("/app/institution/1")} className="hover:underline">{strand.institution}</button>
                    {strand.mutual ? ` · ${strand.mutual} mutual` : ""}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="ghost" size="xs" onClick={() => navigate("/app/profile")}>View profile</Button>
                  <Button variant="secondary" size="xs" onClick={() => navigate("/app/pings")}>
                    <MessageCircle className="w-3 h-3" /> Ping
                  </Button>
                </div>
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

      {/* Pending Tab */}
      {tab === "pending" && (
        <div>
          {activePending.length > 0 && <p className="text-[13px] font-bold text-t1 mb-4">{activePending.length} pending strand requests</p>}
          <div className="space-y-3">
            {activePending.map((strand, i) => (
              <motion.div key={strand.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="rounded-2xl p-4 flex items-center gap-4 bg-surface border border-border" style={{ borderRadius: 16 }}>
                <button onClick={() => navigate("/app/profile")}>
                  <Avatar initials={strand.initials} role={strand.role} verification={strand.verification} />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button onClick={() => navigate("/app/profile")} className="text-[14px] font-bold text-t1 hover:underline">{strand.name}</button>
                    <RoleBadge role={strand.role} />
                  </div>
                  <p className="text-[12px] text-t3">{strand.institution} · Sent {strand.sentAgo}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="xs" onClick={() => { setAcceptedPending(p => new Set(p).add(strand.name)); toast.success(`Strand with ${strand.name} accepted!`); }}>
                    <Check className="w-3 h-3" /> Accept
                  </Button>
                  <Button variant="ghost" size="xs" onClick={() => { setDeclinedPending(p => new Set(p).add(strand.name)); toast.info("Request declined"); }}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>
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

      {/* Suggested Tab */}
      {tab === "suggested" && (
        <div>
          <p className="text-[13px] font-bold text-t1 mb-4">People in your domain</p>
          <div className="space-y-3">
            {suggestedStrands.map((strand, i) => (
              <motion.div key={strand.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="rounded-2xl p-4 flex items-center gap-4 bg-surface border border-border" style={{ borderRadius: 16 }}>
                <button onClick={() => navigate("/app/profile")}>
                  <Avatar initials={strand.initials} role={strand.role} verification={strand.verification} />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button onClick={() => navigate("/app/profile")} className="text-[14px] font-bold text-t1 hover:underline">{strand.name}</button>
                    <RoleBadge role={strand.role} />
                  </div>
                  <p className="text-[12px] text-t3">
                    {strand.institution} · {strand.reason} · {strand.mutual} mutual
                  </p>
                </div>
                <Button size="xs" disabled={sentRequests.has(strand.name)}
                  onClick={() => { setSentRequests(p => new Set(p).add(strand.name)); toast.success(`Strand request sent to ${strand.name}`); }}>
                  {sentRequests.has(strand.name) ? "Sent ✓" : "Send strand"}
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Strands;

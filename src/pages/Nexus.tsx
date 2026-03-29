import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Compass, Shield, MapPin, Users, Zap, Layers, BarChart3, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const filterChips = ["All", "Students", "Professionals", "Doctors", "Government", "Skilled Trade", "Faculty", "Telangana", "AP", "Karnataka", "Tamil Nadu", "Active Projects", "Verified only"];

type CardType = "profile" | "project" | "group" | "challenge";
interface NexusCard {
  type: CardType;
  name: string;
  initials: string;
  color: string;
  role?: string;
  city?: string;
  score?: number;
  strands?: number;
  institution?: string;
  domain?: string;
  status?: string;
  creator?: string;
  creatorRole?: string;
  teamSize?: number;
  members?: number;
  activeProjects?: number;
  reward?: string;
  daysLeft?: number;
  state?: string;
  description?: string;
}

const mockCards: NexusCard[] = [
  { type: "profile", name: "Riya Sharma", initials: "RS", color: "#7C6FFF", role: "Student", city: "Delhi", state: "Delhi", score: 68, strands: 92, institution: "DTU" },
  { type: "project", name: "SmartGrid Monitor", initials: "SM", color: "#7C6FFF", domain: "IoT", status: "Active", creator: "Arjun K.", creatorRole: "Student", teamSize: 3, description: "IoT dashboard for electrical grid monitoring" },
  { type: "group", name: "CodeCraft Club", initials: "CC", color: "#4FC3F7", members: 12, activeProjects: 3 },
  { type: "profile", name: "Dr. Manoj Patil", initials: "MP", color: "#26C6DA", role: "Doctor", city: "Mumbai", state: "Maharashtra", score: 85, strands: 210, institution: "KEM Hospital" },
  { type: "project", name: "Rural Water IoT", initials: "RW", color: "#66BB6A", domain: "Environment", status: "Active", creator: "Suresh R.", creatorRole: "Government", teamSize: 5, description: "IoT-based water quality monitoring for rural areas" },
  { type: "challenge", name: "Cold Storage for Farmers", initials: "CS", color: "#FFB547", reward: "₹25,000", daysLeft: 12 },
  { type: "profile", name: "Sunita Devi", initials: "SD", color: "#FFA726", role: "Skilled Trade", city: "Hyderabad", state: "Telangana", score: 74, strands: 48, institution: "Independent" },
  { type: "project", name: "TelemedicineRx", initials: "TR", color: "#26C6DA", domain: "HealthTech", status: "Active", creator: "Riya S.", creatorRole: "Student", teamSize: 4, description: "Telemedicine platform for rural India with AI triage" },
  { type: "challenge", name: "AI Crop Disease Detection", initials: "AC", color: "#FFB547", reward: "₹50,000", daysLeft: 20 },
  { type: "profile", name: "Arjun Kumar", initials: "AK", color: "#7C6FFF", role: "Student", city: "Delhi", state: "Delhi", score: 78, strands: 156, institution: "DTU" },
  { type: "project", name: "HealthBridge App", initials: "HB", color: "#FF6B6B", domain: "Health", status: "Completed", creator: "Dr. Manoj", creatorRole: "Doctor", teamSize: 5, description: "Health monitoring and bridge app for community health workers" },
  { type: "group", name: "EduTech Builders", initials: "EB", color: "#FFB547", members: 28, activeProjects: 5 },
];

const stateMap: Record<string, string> = {
  "Telangana": "Telangana", "AP": "Andhra Pradesh", "Karnataka": "Karnataka", "Tamil Nadu": "Tamil Nadu",
};

const roleMap: Record<string, string> = {
  "Students": "Student", "Professionals": "Professional", "Doctors": "Doctor",
  "Government": "Government", "Skilled Trade": "Skilled Trade", "Faculty": "Faculty",
};

const filterCards = (cards: NexusCard[], filter: string, query: string): NexusCard[] => {
  let filtered = cards;

  if (filter !== "All") {
    if (roleMap[filter]) {
      filtered = filtered.filter(c => c.type === "profile" && c.role === roleMap[filter]);
    } else if (stateMap[filter]) {
      filtered = filtered.filter(c => c.state === stateMap[filter] || c.city?.includes(stateMap[filter]));
    } else if (filter === "Active Projects") {
      filtered = filtered.filter(c => c.type === "project" && c.status === "Active");
    } else if (filter === "Verified only") {
      filtered = filtered.filter(c => c.type === "profile");
    }
  }

  if (query.trim()) {
    const q = query.toLowerCase();
    filtered = filtered.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.role?.toLowerCase().includes(q) ||
      c.city?.toLowerCase().includes(q) ||
      c.domain?.toLowerCase().includes(q) ||
      c.institution?.toLowerCase().includes(q) ||
      c.creator?.toLowerCase().includes(q)
    );
  }

  return filtered;
};

// Detail drawer for projects/groups
const DetailDrawer = ({ card, open, onClose }: { card: NexusCard | null; open: boolean; onClose: () => void }) => {
  if (!open || !card) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ x: 400 }} animate={{ x: 0 }} exit={{ x: 400 }} transition={{ type: "spring", damping: 25 }}
        className="w-full max-w-[400px] h-full bg-[#0a0a1a] border-l border-border p-6 overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold">{card.type === "project" ? "Project" : "Group"} Details</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[rgba(255,255,255,0.06)]"><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center text-lg font-bold text-white" style={{ backgroundColor: card.color }}>{card.initials}</div>
          <div>
            <h3 className="text-xl font-bold">{card.name}</h3>
            {card.type === "project" && <p className="text-xs text-muted-foreground">{card.creator} · {card.creatorRole}</p>}
            {card.type === "group" && <p className="text-xs text-muted-foreground">{card.members} members</p>}
          </div>
        </div>
        {card.description && <p className="text-sm text-muted-foreground mb-4">{card.description}</p>}
        {card.type === "project" && (
          <div className="space-y-3">
            <div className="flex gap-2">
              {card.domain && <span className="text-xs px-2 py-0.5 rounded-full glass-card text-muted-foreground">{card.domain}</span>}
              {card.status && <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: card.status === "Active" ? "rgba(0,255,178,0.15)" : "rgba(124,111,255,0.15)", color: card.status === "Active" ? "#00FFB2" : "#7C6FFF" }}>{card.status}</span>}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1"><Users className="w-3 h-3" /> {card.teamSize} team members</p>
          </div>
        )}
        {card.type === "group" && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground flex items-center gap-1"><Layers className="w-3 h-3" /> {card.activeProjects} active projects</p>
          </div>
        )}
        <Button variant="default" className="w-full mt-6" onClick={() => { toast.success("Opening..."); onClose(); }}>
          {card.type === "project" ? "View full project" : "Join group"}
        </Button>
      </motion.div>
    </div>
  );
};

const ProfileCard = ({ card }: { card: NexusCard }) => (
  <div className="glass-card-hover rounded-2xl p-5 cursor-pointer">
    <div className="flex items-center gap-3 mb-3">
      <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ backgroundColor: card.color }}>{card.initials}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-bold truncate">{card.name}</span>
          <Shield className="w-3 h-3 text-neon shrink-0" />
        </div>
        <span className="text-[10px] font-bold" style={{ color: card.color }}>{card.role}</span>
      </div>
    </div>
    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2"><MapPin className="w-3 h-3" /> {card.institution} · {card.city}</div>
    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
      <span className="flex items-center gap-1"><BarChart3 className="w-3 h-3" /> Score: {card.score}</span>
      <span>{card.strands} strands</span>
    </div>
    <Button variant="outline" size="xs" className="w-full" onClick={() => toast.success("Connection request sent")}>Connect</Button>
  </div>
);

const ProjectCard = ({ card, onView }: { card: NexusCard; onView: () => void }) => (
  <div className="glass-card-hover rounded-2xl p-5 cursor-pointer">
    <h3 className="text-sm font-bold mb-1">{card.name}</h3>
    <div className="flex items-center gap-2 mb-2">
      <span className="text-[10px] font-bold" style={{ color: card.color }}>{card.creator}</span>
      <span className="text-[10px] text-muted-foreground">{card.creatorRole}</span>
    </div>
    <div className="flex items-center gap-2 mb-3">
      <span className="text-[10px] px-2 py-0.5 rounded-full glass-card text-muted-foreground">{card.domain}</span>
      <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: card.status === "Active" ? "rgba(0,255,178,0.15)" : "rgba(124,111,255,0.15)", color: card.status === "Active" ? "#00FFB2" : "#7C6FFF" }}>{card.status}</span>
    </div>
    <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1"><Users className="w-3 h-3" /> {card.teamSize} members</p>
    <Button variant="outline" size="xs" className="w-full" onClick={onView}>View project</Button>
  </div>
);

const GroupCard = ({ card, onView }: { card: NexusCard; onView: () => void }) => (
  <div className="glass-card-hover rounded-2xl p-5 cursor-pointer">
    <div className="flex items-center gap-3 mb-3">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold text-white" style={{ backgroundColor: card.color }}>{card.initials}</div>
      <div>
        <h3 className="text-sm font-bold">{card.name}</h3>
        <span className="text-xs text-muted-foreground">{card.members} members</span>
      </div>
    </div>
    <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1"><Layers className="w-3 h-3" /> {card.activeProjects} active projects</p>
    <Button variant="outline" size="xs" className="w-full" onClick={onView}>View</Button>
  </div>
);

const ChallengeCard = ({ card }: { card: NexusCard }) => (
  <div className="glass-card-hover rounded-2xl p-5 cursor-pointer" style={{ borderTop: "3px solid #FFB547" }}>
    <span className="micro-label text-amber mb-2 block">Opportunity</span>
    <h3 className="text-sm font-bold mb-2">{card.name}</h3>
    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
      <span className="text-amber font-bold">{card.reward}</span>
      <span>{card.daysLeft} days left</span>
    </div>
    <Button variant="outline" size="xs" className="w-full" onClick={() => toast.success("Opening submission...")}>Submit solution</Button>
  </div>
);

const Nexus = () => {
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [drawerCard, setDrawerCard] = useState<NexusCard | null>(null);

  const filtered = filterCards(mockCards, activeFilter, searchQuery);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-2">
        <Compass className="w-7 h-7 text-electric" />
        <h1 className="text-[28px] font-bold">Explore</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6">Find people, projects, institutions and opportunities across India.</p>

      <div className="flex items-center gap-3 px-4 mb-4 h-[52px] rounded-2xl" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}>
        <Compass className="w-5 h-5 text-muted-foreground shrink-0" />
        <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search by name, project, skill, city..." className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
        {filterChips.map(chip => (
          <button key={chip} onClick={() => setActiveFilter(chip)}
            className="whitespace-nowrap text-xs font-bold px-4 py-2 rounded-full transition-all shrink-0"
            style={{
              background: activeFilter === chip ? "#7C6FFF" : "rgba(255,255,255,0.06)",
              border: `1px solid ${activeFilter === chip ? "#7C6FFF" : "rgba(255,255,255,0.12)"}`,
              color: activeFilter === chip ? "white" : "rgba(240,240,255,0.6)",
            }}>
            {chip}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Compass className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm mb-3">No results found</p>
          <Button variant="outline" size="sm" onClick={() => { setActiveFilter("All"); setSearchQuery(""); }}>Clear filters</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((card, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              {card.type === "profile" && <ProfileCard card={card} />}
              {card.type === "project" && <ProjectCard card={card} onView={() => setDrawerCard(card)} />}
              {card.type === "group" && <GroupCard card={card} onView={() => setDrawerCard(card)} />}
              {card.type === "challenge" && <ChallengeCard card={card} />}
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        <DetailDrawer card={drawerCard} open={!!drawerCard} onClose={() => setDrawerCard(null)} />
      </AnimatePresence>
    </div>
  );
};

export default Nexus;

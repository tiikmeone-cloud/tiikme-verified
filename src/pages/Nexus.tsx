import { useState } from "react";
import { motion } from "framer-motion";
import { Compass, Shield, MapPin, Users, Zap, Layers, BarChart3 } from "lucide-react";
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
}

const mockCards: NexusCard[] = [
  { type: "profile", name: "Riya Sharma", initials: "RS", color: "#7C6FFF", role: "Student", city: "Delhi", score: 68, strands: 92, institution: "DTU" },
  { type: "project", name: "SmartGrid Monitor", initials: "SM", color: "#7C6FFF", domain: "IoT", status: "Active", creator: "Arjun K.", creatorRole: "Student", teamSize: 3 },
  { type: "group", name: "CodeCraft Club", initials: "CC", color: "#4FC3F7", members: 12, activeProjects: 3 },
  { type: "profile", name: "Dr. Manoj Patil", initials: "MP", color: "#26C6DA", role: "Doctor", city: "Mumbai", score: 85, strands: 210, institution: "KEM Hospital" },
  { type: "project", name: "Rural Water IoT", initials: "RW", color: "#66BB6A", domain: "Environment", status: "Active", creator: "Suresh R.", creatorRole: "Government", teamSize: 5 },
  { type: "challenge", name: "Cold Storage for Farmers", initials: "CS", color: "#FFB547", reward: "₹25,000", daysLeft: 12 } as NexusCard,
  { type: "profile", name: "Sunita Devi", initials: "SD", color: "#FFA726", role: "Skilled Trade", city: "Hyderabad", score: 74, strands: 48, institution: "Independent" },
  { type: "project", name: "TelemedicineRx", initials: "TR", color: "#26C6DA", domain: "HealthTech", status: "Active", creator: "Riya S.", creatorRole: "Student", teamSize: 4 },
  { type: "challenge", name: "AI Crop Disease Detection", initials: "AC", color: "#FFB547", reward: "₹50,000", daysLeft: 20 } as NexusCard,
  { type: "profile", name: "Arjun Kumar", initials: "AK", color: "#7C6FFF", role: "Student", city: "Delhi", score: 78, strands: 156, institution: "DTU" },
  { type: "project", name: "HealthBridge App", initials: "HB", color: "#FF6B6B", domain: "Health", status: "Completed", creator: "Dr. Manoj", creatorRole: "Doctor", teamSize: 5 },
  { type: "group", name: "EduTech Builders", initials: "EB", color: "#FFB547", members: 28, activeProjects: 5 },
];

const ProfileCard = ({ card }: { card: NexusCard }) => (
  <div className="glass-card-hover rounded-2xl p-5 cursor-pointer">
    <div className="flex items-center gap-3 mb-3">
      <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ backgroundColor: card.color }}>
        {card.initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-bold truncate">{card.name}</span>
          <Shield className="w-3 h-3 text-neon shrink-0" />
        </div>
        <span className="text-[10px] font-bold" style={{ color: card.color }}>{card.role}</span>
      </div>
    </div>
    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
      <MapPin className="w-3 h-3" /> {card.institution} · {card.city}
    </div>
    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
      <span className="flex items-center gap-1"><BarChart3 className="w-3 h-3" /> Score: {card.score}</span>
      <span>{card.strands} strands</span>
    </div>
    <Button variant="outline" size="xs" className="w-full" onClick={() => toast.success("Connection request sent")}>Connect</Button>
  </div>
);

const ProjectCard = ({ card }: { card: NexusCard }) => (
  <div className="glass-card-hover rounded-2xl p-5 cursor-pointer">
    <h3 className="text-sm font-bold mb-1">{card.name}</h3>
    <div className="flex items-center gap-2 mb-2">
      <span className="text-[10px] font-bold" style={{ color: card.color }}>{card.creator}</span>
      <span className="text-[10px] text-muted-foreground">{card.creatorRole}</span>
    </div>
    <div className="flex items-center gap-2 mb-3">
      <span className="text-[10px] px-2 py-0.5 rounded-full glass-card text-muted-foreground">{card.domain}</span>
      <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: card.status === "Active" ? "rgba(0,255,178,0.15)" : "rgba(124,111,255,0.15)", color: card.status === "Active" ? "#00FFB2" : "#7C6FFF" }}>
        {card.status}
      </span>
    </div>
    <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1"><Users className="w-3 h-3" /> {card.teamSize} members</p>
    <Button variant="outline" size="xs" className="w-full">View project</Button>
  </div>
);

const GroupCard = ({ card }: { card: NexusCard }) => (
  <div className="glass-card-hover rounded-2xl p-5 cursor-pointer">
    <div className="flex items-center gap-3 mb-3">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold text-white" style={{ backgroundColor: card.color }}>
        {card.initials}
      </div>
      <div>
        <h3 className="text-sm font-bold">{card.name}</h3>
        <span className="text-xs text-muted-foreground">{card.members} members</span>
      </div>
    </div>
    <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1"><Layers className="w-3 h-3" /> {card.activeProjects} active projects</p>
    <Button variant="outline" size="xs" className="w-full">View</Button>
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

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-2">
        <Compass className="w-7 h-7 text-electric" />
        <h1 className="text-[28px] font-bold">Nexus</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        The intersection of every builder, maker, and professional across India.
      </p>

      {/* Search */}
      <div className="flex items-center gap-3 px-4 mb-4 h-[52px] rounded-2xl" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}>
        <Compass className="w-5 h-5 text-muted-foreground shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search by name, project, skill, city..."
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
        {filterChips.map(chip => (
          <button
            key={chip}
            onClick={() => setActiveFilter(chip)}
            className="whitespace-nowrap text-xs font-bold px-4 py-2 rounded-full transition-all shrink-0"
            style={{
              background: activeFilter === chip ? "#7C6FFF" : "rgba(255,255,255,0.06)",
              border: `1px solid ${activeFilter === chip ? "#7C6FFF" : "rgba(255,255,255,0.12)"}`,
              color: activeFilter === chip ? "white" : "rgba(240,240,255,0.6)",
            }}
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Results grid — 12 cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockCards.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
          >
            {card.type === "profile" && <ProfileCard card={card} />}
            {card.type === "project" && <ProjectCard card={card} />}
            {card.type === "group" && <GroupCard card={card} />}
            {card.type === "challenge" && <ChallengeCard card={card} />}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Nexus;

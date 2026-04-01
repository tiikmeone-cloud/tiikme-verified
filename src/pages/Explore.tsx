import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, X, ChevronLeft, ChevronRight, Shield, Users, Layers, Target,
  ArrowRight, Cpu, Stethoscope, Scale, Building2, Wrench, Microscope,
  DollarSign, GraduationCap, Rocket, ShieldCheck, Hash, MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { tiikToast } from "@/components/ui/tiik-toast";

const ROLE_COLORS: Record<string, string> = {
  Student: "#4F46E5", Professional: "#0369A1", Government: "#166534",
  Doctor: "#0E7490", Faculty: "#92400E", "Skilled Trade": "#C2410C",
  "HR/Recruiter": "#6B21A8", Aspirant: "#374151", Builder: "#7C3AED",
};

const terrainFields = [
  { name: "Engineering", icon: Cpu, color: "#4F46E5", count: "12.4K" },
  { name: "Medicine", icon: Stethoscope, color: "#0E7490", count: "8.2K" },
  { name: "Law", icon: Scale, color: "#166534", count: "3.1K" },
  { name: "Government", icon: Building2, color: "#166534", count: "6.8K" },
  { name: "Skilled Trades", icon: Wrench, color: "#C2410C", count: "4.5K" },
  { name: "Research", icon: Microscope, color: "#92400E", count: "2.9K" },
  { name: "Finance", icon: DollarSign, color: "#0369A1", count: "5.3K" },
  { name: "Education", icon: GraduationCap, color: "#92400E", count: "7.1K" },
  { name: "Startups", icon: Rocket, color: "#7C3AED", count: "3.8K" },
  { name: "Police & Defence", icon: ShieldCheck, color: "#374151", count: "2.1K" },
];

const filterRow1 = ["All", "People", "Projects", "Institutions", "Opportunities", "Topics"];
const filterRow2 = ["Student", "Professional", "Govt", "Doctor", "Trade", "Faculty", "Builder", "Aspirant"];

const peopleMock = [
  { name: "Riya Sharma", initials: "RS", role: "Student", city: "Delhi", score: 68, strands: 92, institution: "DTU", headline: "Building healthcare apps for rural India", verified: "gold", color: "#4F46E5" },
  { name: "Dr. Manoj Patil", initials: "MP", role: "Doctor", city: "Mumbai", score: 85, strands: 210, institution: "KEM Hospital", headline: "Rural health camps & telemedicine advocate", verified: "gold", color: "#0E7490" },
  { name: "Sunita Devi", initials: "SD", role: "Skilled Trade", city: "Hyderabad", score: 74, strands: 48, institution: "Independent", headline: "Certified electrician, 8+ years residential & commercial", verified: "grey", color: "#C2410C" },
  { name: "Kavita Rao", initials: "KR", role: "HR/Recruiter", city: "Bengaluru", score: 90, strands: 340, institution: "TCS", headline: "Talent acquisition lead, hiring for tech roles", verified: "gold", color: "#6B21A8" },
  { name: "Prof. Sharma", initials: "PS", role: "Faculty", city: "Delhi", score: 88, strands: 180, institution: "DTU", headline: "CS professor, IoT & embedded systems research", verified: "gold", color: "#92400E" },
  { name: "Rahul Mehra", initials: "RM", role: "Professional", city: "Bengaluru", score: 72, strands: 115, institution: "Infosys", headline: "Full-stack engineer building fintech products", verified: "grey", color: "#0369A1" },
];

const projectsMock = [
  { name: "SmartGrid Monitor", domain: "IoT", status: "Active", creator: "Arjun K.", teamSize: 3, description: "IoT dashboard for electrical grid monitoring across 4 states", color: "#4F46E5", tags: ["React", "MQTT"] },
  { name: "Rural Water IoT", domain: "Environment", status: "Active", creator: "Suresh R.", teamSize: 5, description: "IoT-based water quality monitoring for rural communities", color: "#166534", tags: ["Arduino", "Cloud"] },
  { name: "AgriSense Dashboard", domain: "AgriTech", status: "Completed", creator: "Riya S.", teamSize: 4, description: "ML-powered crop health monitoring with satellite data", color: "#166534", tags: ["Python", "TensorFlow"] },
  { name: "EduBridge App", domain: "EdTech", status: "Active", creator: "Priya M.", teamSize: 2, description: "Vernacular learning platform for government school students", color: "#92400E", tags: ["Flutter", "Firebase"] },
];

const institutionsMock = [
  { name: "Delhi Technological University", initials: "DT", type: "College", city: "Delhi", members: 4200, projects: 380, verified: "gold" },
  { name: "KEM Hospital", initials: "KE", type: "Hospital", city: "Mumbai", members: 1800, projects: 120, verified: "grey" },
  { name: "IIIT Hyderabad", initials: "IH", type: "College", city: "Hyderabad", members: 2100, projects: 290, verified: "gold" },
];

const opportunitiesMock = [
  { name: "Cold Storage for Farmers", type: "Funded Challenge", reward: "₹25,000", daysLeft: "12 days", domain: "AgriTech", poster: "NABARD" },
  { name: "AI Crop Disease Detection", type: "Funded Challenge", reward: "₹50,000", daysLeft: "20 days", domain: "AI/ML", poster: "IIT Delhi" },
  { name: "E-Governance Portal Redesign", type: "Gig", reward: "₹30,000", daysLeft: "8 days", domain: "GovTech", poster: "NIC" },
];

const topicsMock = [
  { name: "IoT", posts: 2400, followers: 890 },
  { name: "HealthTech", posts: 1800, followers: 650 },
  { name: "GovTech", posts: 920, followers: 340 },
];

const ringStyle = (v: string): React.CSSProperties => {
  if (v === "gold") return { boxShadow: "0 0 0 2px var(--surface), 0 0 0 4.5px #F59E0B, 0 0 12px rgba(245,158,11,0.45)" };
  if (v === "grey") return { boxShadow: "0 0 0 2px var(--surface), 0 0 0 4px #6B7280" };
  return {};
};

function PersonCard({ p }: { p: typeof peopleMock[0] }) {
  const [connected, setConnected] = useState(false);
  return (
    <article className="glass-liquid glass-liquid-hover rounded-2xl md:rounded-3xl p-[18px] flex flex-col cursor-pointer" style={{ borderTop: `4px solid ${p.color}` }}>
      <div className="flex items-start justify-between mb-2.5">
        <Link to="/app/profile">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-[15px] font-bold text-white" style={{ backgroundColor: p.color, ...ringStyle(p.verified) }}>{p.initials}</div>
        </Link>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full" style={{ backgroundColor: `${p.color}1F`, color: p.color, border: `1px solid ${p.color}33` }}>{p.role}</span>
          {p.verified === "gold" && <Shield className="w-3.5 h-3.5" style={{ color: "#F59E0B" }} />}
        </div>
      </div>
      <Link to="/app/profile" className="text-[14px] font-bold hover:underline" style={{ color: "var(--text-1)" }}>{p.name}</Link>
      <Link to="/app/institution/1" className="text-[12px] hover:underline" style={{ color: "var(--text-3)" }}>{p.institution}</Link>
      <p className="text-[13px] mt-1 line-clamp-2" style={{ color: "var(--text-2)" }}>{p.headline}</p>
      <div className="flex items-center gap-3 mt-2.5">
        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: "var(--brand-dim)", color: "var(--brand)" }}>{p.score}</span>
        <span className="text-[11px]" style={{ color: "var(--text-3)" }}>{p.strands} strands</span>
      </div>
      <Button variant={connected ? "ghost" : "secondary"} className="w-full mt-3 active:scale-95" disabled={connected}
        onClick={() => { setConnected(true); tiikToast.success("Connection request sent"); }}>
        {connected ? "Pending ✓" : "Connect"}
      </Button>
    </article>
  );
}

function ProjectCard({ p }: { p: typeof projectsMock[0] }) {
  return (
    <article className="glass-liquid glass-liquid-hover rounded-2xl md:rounded-3xl p-[18px] flex flex-col">
      <div className="flex items-center justify-between mb-2.5">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${p.color}14` }}>
          <Layers className="w-5 h-5" style={{ color: p.color }} strokeWidth={1.8} />
        </div>
        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full" style={{
          backgroundColor: p.status === "Active" ? "rgba(16,185,129,0.12)" : "var(--brand-dim)",
          color: p.status === "Active" ? "#10B981" : "var(--brand)"
        }}>{p.status}</span>
      </div>
      <Link to="/app/teams/1" className="text-[15px] font-bold hover:underline" style={{ color: "var(--text-1)" }}>{p.name}</Link>
      <p className="text-[12px]" style={{ color: "var(--text-2)" }}>by <Link to="/app/profile" className="hover:underline" style={{ color: "var(--brand)" }}>{p.creator}</Link></p>
      <p className="text-[13px] mt-1.5 line-clamp-2" style={{ color: "var(--text-2)" }}>{p.description}</p>
      <div className="flex flex-wrap gap-1.5 mt-2">
        <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-2)" }}>{p.domain}</span>
        {p.tags.map(t => <span key={t} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-3)" }}>{t}</span>)}
      </div>
      <div className="flex items-center gap-1.5 mt-2.5">
        <Users className="w-3 h-3" style={{ color: "var(--text-3)" }} />
        <span className="text-[11px]" style={{ color: "var(--text-3)" }}>Team of {p.teamSize}</span>
      </div>
      <Button variant="secondary" className="w-full mt-3 active:scale-95">
        View project <ArrowRight className="w-3 h-3 ml-1" />
      </Button>
    </article>
  );
}

function InstitutionCard({ inst }: { inst: typeof institutionsMock[0] }) {
  const [following, setFollowing] = useState(false);
  return (
    <article className="glass-liquid glass-liquid-hover rounded-2xl md:rounded-3xl p-[18px] flex flex-col">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-[13px] font-bold" style={{ background: "var(--brand-dim)", border: "1px solid var(--border-2)", color: "var(--brand)" }}>{inst.initials}</div>
        <div className="min-w-0 flex-1">
          <Link to="/app/institution/1" className="text-[15px] font-bold hover:underline block truncate" style={{ color: "var(--text-1)" }}>{inst.name}</Link>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "var(--surface-2)", color: "var(--text-2)" }}>{inst.type}</span>
            <MapPin className="w-3 h-3" style={{ color: "var(--text-3)" }} />
            <span className="text-[10px]" style={{ color: "var(--text-3)" }}>{inst.city}</span>
          </div>
        </div>
      </div>
      {inst.verified === "gold" && (
        <div className="flex items-center gap-1.5 mb-2">
          <Shield className="w-3.5 h-3.5" style={{ color: "#F59E0B" }} />
          <span className="text-[10px] font-bold" style={{ color: "#F59E0B" }}>Tiik Verified</span>
        </div>
      )}
      <p className="text-[11px] mb-3" style={{ color: "var(--text-3)" }}>{inst.members.toLocaleString()} verified members · {inst.projects} projects</p>
      <div className="flex gap-2 mt-auto">
        <Button className="flex-1 active:scale-95" onClick={() => tiikToast.success("Verification request sent")}>I work here</Button>
        <Button variant="ghost" className="flex-1 active:scale-95" onClick={() => { setFollowing(!following); tiikToast.success(following ? "Unfollowed" : "Following"); }}>
          {following ? "Following ✓" : "Follow"}
        </Button>
      </div>
    </article>
  );
}

function OpportunityCard({ o }: { o: typeof opportunitiesMock[0] }) {
  return (
    <article className="glass-liquid glass-liquid-hover rounded-2xl md:rounded-3xl p-[18px] flex flex-col" style={{ borderLeft: "4px solid #F59E0B" }}>
      <p className="micro-label mb-1" style={{ color: "#F59E0B" }}>{o.type}</p>
      <p className="text-[15px] font-bold" style={{ color: "var(--text-1)" }}>{o.name}</p>
      <p className="text-[12px] mt-1" style={{ color: "var(--text-3)" }}>Posted by {o.poster}</p>
      <div className="flex items-center gap-2 mt-2.5">
        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full" style={{ backgroundColor: "rgba(245,158,11,0.10)", color: "#F59E0B" }}>{o.reward}</span>
        <span className="text-[11px] flex items-center gap-1" style={{ color: "var(--text-3)" }}><Target className="w-3 h-3" /> {o.daysLeft}</span>
      </div>
      <Button variant="secondary" className="w-full mt-3 active:scale-95">View <ArrowRight className="w-3 h-3 ml-1" /></Button>
    </article>
  );
}

function TopicCard({ t }: { t: typeof topicsMock[0] }) {
  const [following, setFollowing] = useState(false);
  return (
    <article className="glass-liquid glass-liquid-hover rounded-2xl md:rounded-3xl p-[18px] flex flex-col" style={{ borderLeft: "4px solid var(--brand)" }}>
      <div className="flex items-center gap-2 mb-2">
        <Hash className="w-8 h-8" style={{ color: "var(--brand)" }} />
        <span className="text-[18px] font-bold" style={{ color: "var(--text-1)" }}>{t.name}</span>
      </div>
      <p className="text-[12px]" style={{ color: "var(--text-3)" }}>{t.posts.toLocaleString()} posts · {t.followers} followers</p>
      <Button variant={following ? "ghost" : "secondary"} size="sm" className="w-full mt-3 active:scale-95" disabled={following}
        onClick={() => { setFollowing(true); tiikToast.success("Following #" + t.name); }}>
        {following ? "Following ✓" : "Follow"}
      </Button>
    </article>
  );
}

const Explore = () => {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [activeRoles, setActiveRoles] = useState<string[]>([]);
  const [activeTerrain, setActiveTerrain] = useState<string | null>(null);
  const terrainRef = useRef<HTMLDivElement>(null);

  const scrollTerrain = (dir: "left" | "right") => {
    terrainRef.current?.scrollBy({ left: dir === "left" ? -200 : 200, behavior: "smooth" });
  };

  const toggleRole = (r: string) => {
    setActiveRoles(prev => prev.includes(r) ? prev.filter(v => v !== r) : [...prev, r]);
  };

  const showPeople = activeFilter === "All" || activeFilter === "People";
  const showProjects = activeFilter === "All" || activeFilter === "Projects";
  const showInstitutions = activeFilter === "All" || activeFilter === "Institutions";
  const showOpportunities = activeFilter === "All" || activeFilter === "Opportunities";
  const showTopics = activeFilter === "All" || activeFilter === "Topics";

  return (
    <main className="max-w-[1100px] mx-auto px-3 md:px-6 py-7">
      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: "var(--text-3)" }} />
        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, skill, city, field..."
          className="w-full h-[52px] glass-input pl-[52px] pr-12 text-[14px] outline-none"
          style={{ color: "var(--text-1)" }}
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center" style={{ color: "var(--text-3)" }}>
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Terrain Strip */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <p className="micro-label">EXPLORE BY FIELD</p>
          <div className="flex gap-1">
            <button onClick={() => scrollTerrain("left")} className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer" style={{ color: "var(--text-3)" }}><ChevronLeft className="w-4 h-4" /></button>
            <button onClick={() => scrollTerrain("right")} className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer" style={{ color: "var(--text-3)" }}><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
        <div ref={terrainRef} className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-1">
          {terrainFields.map(f => {
            const active = activeTerrain === f.name;
            return (
              <button key={f.name} onClick={() => setActiveTerrain(active ? null : f.name)}
                className="shrink-0 w-[110px] glass-liquid rounded-2xl p-3.5 text-center cursor-pointer"
                style={{
                  borderColor: active ? "var(--brand)" : undefined,
                  background: active ? "var(--brand-dim)" : undefined,
                  transform: active ? "translateY(-2px)" : "none",
                  transition: "all 0.2s cubic-bezier(0.34,1.56,0.64,1)",
                }}>
                <div className="w-2 h-2 rounded-full mx-auto mb-2" style={{ background: f.color }} />
                <f.icon className="w-6 h-6 mx-auto mb-1.5" style={{ color: active ? "var(--brand)" : f.color }} strokeWidth={1.8} />
                <p className="text-[11px] font-bold" style={{ color: "var(--text-1)" }}>{f.name}</p>
                <p className="text-[9px] mt-0.5" style={{ color: "var(--text-3)" }}>{f.count}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter Row 1 */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide mb-2.5 pb-1">
        {filterRow1.map(f => (
          <button key={f} onClick={() => setActiveFilter(f)}
            className="shrink-0 h-[30px] px-3 rounded-full text-[12px] font-semibold cursor-pointer active:scale-95"
            style={{
              background: activeFilter === f ? "var(--brand)" : "var(--surface-2)",
              color: activeFilter === f ? "white" : "var(--text-2)",
              border: activeFilter === f ? "none" : "1px solid var(--border)",
              transition: "all 0.15s",
            }}>
            {f}
          </button>
        ))}
      </div>

      {/* Filter Row 2 - Roles */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide mb-6 pb-1">
        {filterRow2.map(r => {
          const active = activeRoles.includes(r);
          return (
            <button key={r} onClick={() => toggleRole(r)}
              className="shrink-0 h-[30px] px-3 rounded-full text-[12px] font-semibold cursor-pointer active:scale-95"
              style={{
                background: active ? "var(--brand)" : "var(--surface-2)",
                color: active ? "white" : "var(--text-2)",
                border: active ? "none" : "1px solid var(--border)",
                transition: "all 0.15s",
              }}>
              {r}
            </button>
          );
        })}
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {showPeople && peopleMock.map((p, i) => (
            <motion.div key={"p" + i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <PersonCard p={p} />
            </motion.div>
          ))}
          {showProjects && projectsMock.map((p, i) => (
            <motion.div key={"pr" + i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <ProjectCard p={p} />
            </motion.div>
          ))}
          {showInstitutions && institutionsMock.map((inst, i) => (
            <motion.div key={"inst" + i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <InstitutionCard inst={inst} />
            </motion.div>
          ))}
          {showOpportunities && opportunitiesMock.map((o, i) => (
            <motion.div key={"opp" + i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <OpportunityCard o={o} />
            </motion.div>
          ))}
          {showTopics && topicsMock.map((t, i) => (
            <motion.div key={"topic" + i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <TopicCard t={t} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Load more */}
      <div className="mt-6">
        <Button variant="secondary" className="w-full active:scale-95" onClick={() => tiikToast("Loading 12 more results...")}>
          Load 12 more results
        </Button>
      </div>
    </main>
  );
};

export default Explore;

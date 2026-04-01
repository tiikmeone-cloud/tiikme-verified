import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, X, ChevronLeft, ChevronRight, Shield, Users, Layers, Target,
  ArrowRight, Cpu, Stethoscope, Scale, Building2, Wrench, Microscope,
  DollarSign, GraduationCap, Rocket, ShieldCheck, Hash, MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
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
  { name: "Riya Sharma", initials: "RS", role: "Student", city: "Delhi", score: 68, strands: 92, institution: "DTU", headline: "Building healthcare apps for rural India", verified: "gold", color: "#4F46E5", domain: "Engineering" },
  { name: "Dr. Manoj Patil", initials: "MP", role: "Doctor", city: "Mumbai", score: 85, strands: 210, institution: "KEM Hospital", headline: "Rural health camps & telemedicine advocate", verified: "gold", color: "#0E7490", domain: "Medicine" },
  { name: "Sunita Devi", initials: "SD", role: "Skilled Trade", city: "Hyderabad", score: 74, strands: 48, institution: "Independent", headline: "Certified electrician, 8+ years residential & commercial", verified: "grey", color: "#C2410C", domain: "Skilled Trades" },
  { name: "Kavita Rao", initials: "KR", role: "HR/Recruiter", city: "Bengaluru", score: 90, strands: 340, institution: "TCS", headline: "Talent acquisition lead, hiring for tech roles", verified: "gold", color: "#6B21A8", domain: "Engineering" },
  { name: "Prof. Sharma", initials: "PS", role: "Faculty", city: "Delhi", score: 88, strands: 180, institution: "DTU", headline: "CS professor, IoT & embedded systems research", verified: "gold", color: "#92400E", domain: "Engineering" },
  { name: "Rahul Mehra", initials: "RM", role: "Professional", city: "Bengaluru", score: 72, strands: 115, institution: "Infosys", headline: "Full-stack engineer building fintech products", verified: "grey", color: "#0369A1", domain: "Finance" },
  { name: "Meera Krishnan", initials: "MK", role: "Student", city: "Chennai", score: 65, strands: 56, institution: "IIT Madras", headline: "Research intern — NLP and vernacular computing", verified: "grey", color: "#4F46E5", domain: "Research" },
  { name: "Suresh Yadav", initials: "SY", role: "Government", city: "Jaipur", score: 71, strands: 89, institution: "Rajasthan Admin", headline: "IAS officer, district collector, rural development", verified: "gold", color: "#166534", domain: "Government" },
];

const projectsMock = [
  { name: "SmartGrid Monitor", domain: "Engineering", status: "Active", creator: "Arjun K.", teamSize: 3, description: "IoT dashboard for electrical grid monitoring across 4 states", color: "#4F46E5", tags: ["React", "MQTT"] },
  { name: "Rural Water IoT", domain: "Engineering", status: "Active", creator: "Suresh R.", teamSize: 5, description: "IoT-based water quality monitoring for rural communities", color: "#166534", tags: ["Arduino", "Cloud"] },
  { name: "AgriSense Dashboard", domain: "Research", status: "Completed", creator: "Riya S.", teamSize: 4, description: "ML-powered crop health monitoring with satellite data", color: "#166534", tags: ["Python", "TensorFlow"] },
  { name: "EduBridge App", domain: "Education", status: "Active", creator: "Priya M.", teamSize: 2, description: "Vernacular learning platform for government school students", color: "#92400E", tags: ["Flutter", "Firebase"] },
];

const institutionsMock = [
  { name: "Delhi Technological University", initials: "DT", type: "College", city: "Delhi", members: 4200, projects: 380, verified: "gold" },
  { name: "KEM Hospital", initials: "KE", type: "Hospital", city: "Mumbai", members: 1800, projects: 120, verified: "grey" },
  { name: "IIIT Hyderabad", initials: "IH", type: "College", city: "Hyderabad", members: 2100, projects: 290, verified: "gold" },
];

const opportunitiesMock = [
  { name: "Cold Storage for Farmers", type: "Funded Challenge", reward: "₹25,000", daysLeft: "12 days", domain: "Engineering", poster: "NABARD" },
  { name: "AI Crop Disease Detection", type: "Funded Challenge", reward: "₹50,000", daysLeft: "20 days", domain: "Research", poster: "IIT Delhi" },
  { name: "E-Governance Portal Redesign", type: "Gig", reward: "₹30,000", daysLeft: "8 days", domain: "Government", poster: "NIC" },
];

const topicsMock = [
  { name: "IoT", posts: 2400, followers: 890 },
  { name: "HealthTech", posts: 1800, followers: 650 },
  { name: "GovTech", posts: 920, followers: 340 },
  { name: "AgriTech", posts: 1200, followers: 520 },
];

const ringStyle = (v: string): React.CSSProperties => {
  if (v === "gold") return { boxShadow: "0 0 0 2px var(--surface), 0 0 0 4.5px #F59E0B, 0 0 12px rgba(245,158,11,0.45)" };
  if (v === "grey") return { boxShadow: "0 0 0 2px var(--surface), 0 0 0 4px #6B7280" };
  return {};
};

const roleMap: Record<string, string> = { Student: "Student", Professional: "Professional", Govt: "Government", Doctor: "Doctor", Trade: "Skilled Trade", Faculty: "Faculty", Builder: "Builder", Aspirant: "Aspirant" };

/* ─── COMPACT CARDS ─── */
function PersonCard({ p }: { p: typeof peopleMock[0] }) {
  const [connected, setConnected] = useState(false);
  const navigate = useNavigate();
  return (
    <article className="glass-liquid glass-liquid-hover rounded-2xl p-4 flex flex-col cursor-pointer" style={{ borderTop: `3px solid ${p.color}` }}
      onClick={() => navigate("/app/profile")}>
      <div className="flex items-start justify-between mb-2">
        <div className="w-11 h-11 rounded-full flex items-center justify-center text-[13px] font-bold text-white" style={{ backgroundColor: p.color, ...ringStyle(p.verified) }}>{p.initials}</div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${p.color}1F`, color: p.color }}>{p.role}</span>
      </div>
      <p className="text-[13px] font-bold" style={{ color: "var(--text-1)" }}>{p.name}</p>
      <p className="text-[11px]" style={{ color: "var(--text-3)" }}>{p.institution} · {p.city}</p>
      <p className="text-[12px] mt-1 line-clamp-2 flex-1" style={{ color: "var(--text-2)" }}>{p.headline}</p>
      <div className="flex items-center gap-2 mt-2">
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "var(--brand-dim)", color: "var(--brand)" }}>{p.score}</span>
        <span className="text-[10px]" style={{ color: "var(--text-3)" }}>{p.strands} strands</span>
      </div>
      <Button variant={connected ? "ghost" : "secondary"} size="sm" className="w-full mt-2.5 h-8 text-[11px] active:scale-95" disabled={connected}
        onClick={e => { e.stopPropagation(); setConnected(true); tiikToast.success("Connection request sent"); }}>
        {connected ? "Pending ✓" : "Connect"}
      </Button>
    </article>
  );
}

function ProjectCard({ p }: { p: typeof projectsMock[0] }) {
  return (
    <Link to="/app/teams/1" className="glass-liquid glass-liquid-hover rounded-2xl p-4 flex flex-col block">
      <div className="flex items-center justify-between mb-2">
        <Layers className="w-5 h-5" style={{ color: p.color }} />
        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: p.status === "Active" ? "rgba(16,185,129,0.12)" : "var(--brand-dim)", color: p.status === "Active" ? "#10B981" : "var(--brand)" }}>{p.status}</span>
      </div>
      <p className="text-[13px] font-bold" style={{ color: "var(--text-1)" }}>{p.name}</p>
      <p className="text-[11px]" style={{ color: "var(--text-2)" }}>by <span style={{ color: "var(--brand)" }}>{p.creator}</span></p>
      <p className="text-[12px] mt-1 line-clamp-2 flex-1" style={{ color: "var(--text-2)" }}>{p.description}</p>
      <div className="flex flex-wrap gap-1 mt-2">
        {p.tags.map(t => <span key={t} className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: "var(--surface-2)", color: "var(--text-3)" }}>{t}</span>)}
      </div>
      <div className="flex items-center gap-1 mt-2">
        <Users className="w-3 h-3" style={{ color: "var(--text-3)" }} />
        <span className="text-[10px]" style={{ color: "var(--text-3)" }}>Team of {p.teamSize}</span>
      </div>
    </Link>
  );
}

function InstitutionCard({ inst }: { inst: typeof institutionsMock[0] }) {
  return (
    <Link to="/app/institution/1" className="glass-liquid glass-liquid-hover rounded-2xl p-4 flex flex-col block">
      <div className="flex items-center gap-2.5 mb-2">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[11px] font-bold" style={{ background: "var(--brand-dim)", color: "var(--brand)" }}>{inst.initials}</div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-bold truncate" style={{ color: "var(--text-1)" }}>{inst.name}</p>
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "var(--surface-2)", color: "var(--text-2)" }}>{inst.type}</span>
            <MapPin className="w-2.5 h-2.5" style={{ color: "var(--text-3)" }} />
            <span className="text-[9px]" style={{ color: "var(--text-3)" }}>{inst.city}</span>
          </div>
        </div>
      </div>
      {inst.verified === "gold" && (
        <div className="flex items-center gap-1 mb-1">
          <Shield className="w-3 h-3" style={{ color: "#F59E0B" }} />
          <span className="text-[9px] font-bold" style={{ color: "#F59E0B" }}>Tiik Verified</span>
        </div>
      )}
      <p className="text-[10px]" style={{ color: "var(--text-3)" }}>{inst.members.toLocaleString()} members · {inst.projects} projects</p>
    </Link>
  );
}

/* ─── SWIMLANE ─── */
function Swimlane({ title, count, onSeeAll, children }: { title: string; count?: string; onSeeAll: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-[14px] font-bold" style={{ color: "var(--text-1)" }}>{title}</h3>
        <button onClick={onSeeAll} className="text-[12px] font-semibold flex items-center gap-1 cursor-pointer" style={{ color: "var(--brand)" }}>
          {count && `See all ${count}`} <ArrowRight className="w-3 h-3" />
        </button>
      </div>
      <div ref={ref} className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
        {children}
      </div>
    </section>
  );
}

const Explore = () => {
  const navigate = useNavigate();
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

  const clearFilters = () => { setActiveFilter("All"); setActiveRoles([]); setActiveTerrain(null); setSearch(""); };
  const hasFilters = activeFilter !== "All" || activeRoles.length > 0 || activeTerrain || search;

  // Filtering
  const filterPerson = (p: typeof peopleMock[0]) => {
    if (activeRoles.length > 0 && !activeRoles.some(r => p.role === (roleMap[r] || r))) return false;
    if (activeTerrain && p.domain !== activeTerrain) return false;
    if (search) { const q = search.toLowerCase(); if (!p.name.toLowerCase().includes(q) && !p.headline.toLowerCase().includes(q) && !p.city.toLowerCase().includes(q)) return false; }
    return true;
  };
  const filterProject = (p: typeof projectsMock[0]) => {
    if (activeTerrain && p.domain !== activeTerrain) return false;
    if (search) { const q = search.toLowerCase(); if (!p.name.toLowerCase().includes(q) && !p.description.toLowerCase().includes(q)) return false; }
    return true;
  };
  const filterOpp = (o: typeof opportunitiesMock[0]) => {
    if (activeTerrain && o.domain !== activeTerrain) return false;
    if (search && !o.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  };
  const filterTopic = (t: typeof topicsMock[0]) => {
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  };

  const fPeople = peopleMock.filter(filterPerson);
  const fProjects = projectsMock.filter(filterProject);
  const fInstitutions = institutionsMock.filter(i => !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.city.toLowerCase().includes(search.toLowerCase()));
  const fOpps = opportunitiesMock.filter(filterOpp);
  const fTopics = topicsMock.filter(filterTopic);

  const showPeople = activeFilter === "All" || activeFilter === "People";
  const showProjects = activeFilter === "All" || activeFilter === "Projects";
  const showInstitutions = activeFilter === "All" || activeFilter === "Institutions";
  const showOpps = activeFilter === "All" || activeFilter === "Opportunities";
  const showTopics = activeFilter === "All" || activeFilter === "Topics";
  const isGridMode = activeFilter !== "All";

  const totalResults = (showPeople ? fPeople.length : 0) + (showProjects ? fProjects.length : 0) + (showInstitutions ? fInstitutions.length : 0) + (showOpps ? fOpps.length : 0) + (showTopics ? fTopics.length : 0);

  const terrainLabel = activeTerrain ? `${activeTerrain} ` : "";

  return (
    <main className="max-w-[1100px] mx-auto px-3 md:px-6 py-7">
      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: "var(--text-3)" }} />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, skill, city, field..."
          className="w-full h-[52px] glass-input pl-[52px] pr-12 text-[14px] outline-none" style={{ color: "var(--text-1)" }} />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer" style={{ color: "var(--text-3)" }}>
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Terrain Strip */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
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
                className="shrink-0 w-[100px] glass-liquid rounded-2xl p-3 text-center cursor-pointer"
                style={{ borderColor: active ? "var(--brand)" : undefined, background: active ? "var(--brand-dim)" : undefined, transform: active ? "translateY(-2px)" : "none", transition: "all 0.2s" }}>
                <f.icon className="w-5 h-5 mx-auto mb-1" style={{ color: active ? "var(--brand)" : f.color }} strokeWidth={1.8} />
                <p className="text-[10px] font-bold" style={{ color: "var(--text-1)" }}>{f.name}</p>
                <p className="text-[9px]" style={{ color: "var(--text-3)" }}>{f.count}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active terrain label */}
      {activeTerrain && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[12px] font-semibold px-3 py-1 rounded-full" style={{ background: "var(--brand-dim)", color: "var(--brand)", border: "1px solid var(--brand)" }}>
            Exploring: {activeTerrain} <button onClick={() => setActiveTerrain(null)} className="ml-1 cursor-pointer">×</button>
          </span>
        </div>
      )}

      {/* Filter Row 1 */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide mb-2 pb-1">
        {filterRow1.map(f => (
          <button key={f} onClick={() => setActiveFilter(f)}
            className="shrink-0 h-[28px] px-3 rounded-full text-[11px] font-bold cursor-pointer active:scale-95"
            style={{ background: activeFilter === f ? "var(--brand)" : "var(--surface-2)", color: activeFilter === f ? "white" : "var(--text-2)", border: activeFilter === f ? "none" : "1px solid var(--border)" }}>
            {f}
          </button>
        ))}
        {hasFilters && (
          <button onClick={clearFilters} className="shrink-0 h-[28px] px-3 rounded-full text-[11px] font-bold cursor-pointer" style={{ color: "#DC2626", border: "1px solid rgba(220,38,38,0.2)" }}>Clear all</button>
        )}
      </div>

      {/* Filter Row 2 - Roles */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide mb-5 pb-1">
        {filterRow2.map(r => {
          const active = activeRoles.includes(r);
          return (
            <button key={r} onClick={() => toggleRole(r)}
              className="shrink-0 h-[28px] px-3 rounded-full text-[11px] font-bold cursor-pointer active:scale-95"
              style={{ background: active ? "var(--brand)" : "var(--surface-2)", color: active ? "white" : "var(--text-2)", border: active ? "none" : "1px solid var(--border)" }}>
              {r}
            </button>
          );
        })}
      </div>

      {/* Empty state */}
      {totalResults === 0 && (
        <div className="text-center py-16">
          <Search className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--text-3)" }} />
          <p className="text-[15px] font-bold mb-2" style={{ color: "var(--text-1)" }}>No results found</p>
          <p className="text-[12px] mb-4" style={{ color: "var(--text-3)" }}>Try adjusting your filters or search term.</p>
          <Button variant="secondary" onClick={clearFilters}>Clear all filters</Button>
        </div>
      )}

      {/* SWIMLANE mode (when "All" selected) */}
      {!isGridMode && totalResults > 0 && (
        <>
          {fPeople.length > 0 && showPeople && (
            <Swimlane title={`${terrainLabel}People`} count={`${fPeople.length}+`} onSeeAll={() => setActiveFilter("People")}>
              {fPeople.map((p, i) => (
                <div key={i} className="shrink-0 w-[220px]"><PersonCard p={p} /></div>
              ))}
            </Swimlane>
          )}
          {fProjects.length > 0 && showProjects && (
            <Swimlane title={`${terrainLabel}Projects`} count={`${fProjects.length}+`} onSeeAll={() => setActiveFilter("Projects")}>
              {fProjects.map((p, i) => (
                <div key={i} className="shrink-0 w-[220px]"><ProjectCard p={p} /></div>
              ))}
            </Swimlane>
          )}
          {fInstitutions.length > 0 && showInstitutions && (
            <Swimlane title="Institutions near you" count={`${fInstitutions.length}+`} onSeeAll={() => setActiveFilter("Institutions")}>
              {fInstitutions.map((inst, i) => (
                <div key={i} className="shrink-0 w-[240px]"><InstitutionCard inst={inst} /></div>
              ))}
            </Swimlane>
          )}
          {fOpps.length > 0 && showOpps && (
            <Swimlane title={`${terrainLabel}Opportunities`} count={`${fOpps.length}+`} onSeeAll={() => navigate("/app/opportunities")}>
              {fOpps.map((o, i) => (
                <Link key={i} to="/app/opportunities" className="shrink-0 w-[220px] glass-liquid glass-liquid-hover rounded-2xl p-4 flex flex-col" style={{ borderLeft: "3px solid #F59E0B" }}>
                  <p className="micro-label mb-1" style={{ color: "#F59E0B" }}>{o.type}</p>
                  <p className="text-[13px] font-bold" style={{ color: "var(--text-1)" }}>{o.name}</p>
                  <p className="text-[10px] mt-1" style={{ color: "var(--text-3)" }}>{o.poster} · {o.daysLeft}</p>
                  <span className="text-[10px] font-bold mt-2 px-2 py-0.5 rounded-full self-start" style={{ background: "rgba(245,158,11,0.1)", color: "#F59E0B" }}>{o.reward}</span>
                </Link>
              ))}
            </Swimlane>
          )}
          {fTopics.length > 0 && showTopics && (
            <Swimlane title="Trending Topics" count={`${fTopics.length}`} onSeeAll={() => setActiveFilter("Topics")}>
              {fTopics.map((t, i) => (
                <div key={i} className="shrink-0 w-[180px] glass-liquid glass-liquid-hover rounded-2xl p-4 flex flex-col" style={{ borderLeft: "3px solid var(--brand)" }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Hash className="w-5 h-5" style={{ color: "var(--brand)" }} />
                    <span className="text-[14px] font-bold" style={{ color: "var(--text-1)" }}>{t.name}</span>
                  </div>
                  <p className="text-[10px]" style={{ color: "var(--text-3)" }}>{t.posts.toLocaleString()} posts · {t.followers} followers</p>
                </div>
              ))}
            </Swimlane>
          )}
        </>
      )}

      {/* GRID mode (when specific category selected) */}
      {isGridMode && totalResults > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <AnimatePresence>
            {showPeople && fPeople.map((p, i) => (
              <motion.div key={"p" + i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <PersonCard p={p} />
              </motion.div>
            ))}
            {showProjects && fProjects.map((p, i) => (
              <motion.div key={"pr" + i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <ProjectCard p={p} />
              </motion.div>
            ))}
            {showInstitutions && fInstitutions.map((inst, i) => (
              <motion.div key={"inst" + i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <InstitutionCard inst={inst} />
              </motion.div>
            ))}
            {showOpps && fOpps.map((o, i) => (
              <motion.div key={"opp" + i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <Link to="/app/opportunities" className="glass-liquid glass-liquid-hover rounded-2xl p-4 flex flex-col" style={{ borderLeft: "3px solid #F59E0B" }}>
                  <p className="micro-label mb-1" style={{ color: "#F59E0B" }}>{o.type}</p>
                  <p className="text-[13px] font-bold" style={{ color: "var(--text-1)" }}>{o.name}</p>
                  <p className="text-[10px] mt-1" style={{ color: "var(--text-3)" }}>{o.poster} · {o.daysLeft}</p>
                  <span className="text-[10px] font-bold mt-2 px-2 py-0.5 rounded-full self-start" style={{ background: "rgba(245,158,11,0.1)", color: "#F59E0B" }}>{o.reward}</span>
                </Link>
              </motion.div>
            ))}
            {showTopics && fTopics.map((t, i) => (
              <motion.div key={"topic" + i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <div className="glass-liquid glass-liquid-hover rounded-2xl p-4 flex flex-col" style={{ borderLeft: "3px solid var(--brand)" }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Hash className="w-5 h-5" style={{ color: "var(--brand)" }} />
                    <span className="text-[14px] font-bold" style={{ color: "var(--text-1)" }}>{t.name}</span>
                  </div>
                  <p className="text-[10px]" style={{ color: "var(--text-3)" }}>{t.posts.toLocaleString()} posts · {t.followers} followers</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {totalResults > 0 && (
        <div className="mt-6">
          <Button variant="secondary" className="w-full active:scale-95" onClick={() => tiikToast("Loading more results...")}>Load more</Button>
        </div>
      )}
    </main>
  );
};

export default Explore;

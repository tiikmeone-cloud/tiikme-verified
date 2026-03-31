import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Compass, Shield, Users, Layers, X, Target,
  Cpu, Stethoscope, Scale, Building2, Wrench, FlaskConical,
  Banknote, GraduationCap, Rocket, ArrowRight, Link2, ChevronRight, ChevronLeft, SlidersHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { tiikToast } from "@/components/ui/tiik-toast";

const ROLE_COLORS: Record<string, string> = {
  Student: "#4F46E5", Professional: "#0369A1", Government: "#166534",
  Doctor: "#0E7490", Faculty: "#92400E", "Skilled Trade": "#C2410C",
  "HR/Recruiter": "#6B21A8", Aspirant: "#374151", Builder: "#7C3AED",
};

const categoryTabs = ["All", "People", "Projects", "Institutions", "Opportunities"];

const roleFilters = ["Student", "Professional", "Government", "Doctor", "Skilled Trade", "Faculty", "Builder", "Aspirant"];
const cityFilters = ["Delhi", "Mumbai", "Bengaluru", "Hyderabad", "Chennai"];
const domainFilters = ["Engineering", "Medicine", "Law", "Finance", "Education"];

// --- Mock data ---
const peopleMock = [
  { name: "Riya Sharma", initials: "RS", role: "Student", city: "Delhi", score: 68, strands: 92, institution: "DTU", headline: "Building healthcare apps for rural India", verified: "gold" as const, color: "#4F46E5" },
  { name: "Dr. Manoj Patil", initials: "MP", role: "Doctor", city: "Mumbai", score: 85, strands: 210, institution: "KEM Hospital", headline: "Rural health camps & telemedicine", verified: "gold" as const, color: "#0E7490" },
  { name: "Sunita Devi", initials: "SD", role: "Skilled Trade", city: "Hyderabad", score: 74, strands: 48, institution: "Independent", headline: "Certified electrician, 8+ years residential & commercial", verified: "grey" as const, color: "#C2410C" },
  { name: "Kavita Rao", initials: "KR", role: "HR/Recruiter", city: "Bengaluru", score: 90, strands: 340, institution: "TCS", headline: "Talent acquisition lead, hiring for tech roles", verified: "gold" as const, color: "#6B21A8" },
  { name: "Prof. Sharma", initials: "PS", role: "Faculty", city: "Delhi", score: 88, strands: 180, institution: "DTU", headline: "CS professor, IoT & embedded systems research", verified: "gold" as const, color: "#92400E" },
  { name: "Rahul Mehra", initials: "RM", role: "Professional", city: "Bengaluru", score: 72, strands: 115, institution: "Infosys", headline: "Full-stack engineer building fintech products", verified: "grey" as const, color: "#0369A1" },
];

const projectsMock = [
  { name: "SmartGrid Monitor", domain: "IoT", status: "Active", creator: "Arjun K.", teamSize: 3, description: "IoT dashboard for electrical grid monitoring across 4 states", color: "#4F46E5" },
  { name: "Rural Water IoT", domain: "Environment", status: "Active", creator: "Suresh R.", teamSize: 5, description: "IoT-based water quality monitoring for rural communities", color: "#166534" },
  { name: "AgriSense Dashboard", domain: "AgriTech", status: "Completed", creator: "Riya S.", teamSize: 4, description: "ML-powered crop health monitoring system with satellite data", color: "#166534" },
  { name: "EduBridge App", domain: "EdTech", status: "Active", creator: "Priya M.", teamSize: 2, description: "Vernacular learning platform for government school students", color: "#92400E" },
];

const opportunitiesMock = [
  { name: "Cold Storage for Farmers", type: "Funded Challenge", reward: "₹25,000", daysLeft: "12 days", domain: "AgriTech" },
  { name: "AI Crop Disease Detection", type: "Funded Challenge", reward: "₹50,000", daysLeft: "20 days", domain: "AI/ML" },
  { name: "E-Governance Portal Redesign", type: "Gig", reward: "₹30,000", daysLeft: "8 days", domain: "GovTech" },
  { name: "Healthcare Data Pipeline", type: "Research", reward: "₹40,000", daysLeft: "15 days", domain: "HealthTech" },
];

const institutionsMock = [
  { name: "Delhi Technological University", initials: "DT", type: "College", city: "Delhi", members: 4200, projects: 380, verified: "gold" as const },
  { name: "KEM Hospital", initials: "KE", type: "Hospital", city: "Mumbai", members: 1800, projects: 120, verified: "grey" as const },
  { name: "IIIT Hyderabad", initials: "IH", type: "College", city: "Hyderabad", members: 2100, projects: 290, verified: "gold" as const },
];

// --- Scroll hook ---
function useHScroll() {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: "left" | "right") => {
    ref.current?.scrollBy({ left: dir === "left" ? -280 : 280, behavior: "smooth" });
  };
  return { ref, scroll };
}

// --- Cards ---
const cardBase = "rounded-2xl border border-border/50 flex flex-col justify-between transition-all duration-200 hover:shadow-md hover:-translate-y-0.5";
const cardShadow = "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.02)";

function PersonCard({ p }: { p: typeof peopleMock[0] }) {
  const rc = ROLE_COLORS[p.role] || "var(--brand)";
  return (
    <div className={`${cardBase} h-[240px] w-[260px] shrink-0 p-5`} style={{ background: "var(--surface)", boxShadow: cardShadow, borderLeft: `3px solid ${rc}` }}>
      <div>
        <div className="flex items-center gap-3 mb-3">
          <div className="relative shrink-0" style={{ width: 44, height: 44 }}>
            <div className="w-11 h-11 rounded-full flex items-center justify-center text-[11px] font-bold text-white" style={{ backgroundColor: rc }}>{p.initials}</div>
            {p.verified === "gold" && <div className="absolute inset-0 rounded-full" style={{ boxShadow: "0 0 0 2px var(--surface), 0 0 0 3.5px #F59E0B" }} />}
            {p.verified === "grey" && <div className="absolute inset-0 rounded-full" style={{ boxShadow: "0 0 0 2px var(--surface), 0 0 0 3.5px #6B7280" }} />}
          </div>
          <div className="min-w-0 flex-1">
            <Link to="/app/profile" className="text-[13px] font-bold text-t1 hover:text-brand transition-colors block truncate">{p.name}</Link>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${rc}14`, color: rc }}>{p.role}</span>
              <Link to="/app/institution/1" className="text-[9px] text-t3 hover:text-brand transition-colors truncate">{p.institution}</Link>
            </div>
          </div>
        </div>
        <p className="text-[13px] text-t1 leading-relaxed line-clamp-2 mb-2">{p.headline}</p>
        <div className="flex items-center gap-3 text-[10px] text-t3">
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-brand inline-block" />Score {p.score}</span>
          <span><Link2 className="w-3 h-3 inline" /> {p.strands}</span>
        </div>
      </div>
      <Button variant="secondary" size="sm" className="w-full mt-3" onClick={() => tiikToast.success("Strand request sent")}>Connect</Button>
    </div>
  );
}

function ProjectCard({ p }: { p: typeof projectsMock[0] }) {
  return (
    <div className={`${cardBase} h-[240px] w-[260px] shrink-0 p-5`} style={{ background: "var(--surface)", boxShadow: cardShadow }}>
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{
            backgroundColor: p.status === "Active" ? "rgba(16,185,129,0.12)" : "var(--brand-dim)",
            color: p.status === "Active" ? "#10B981" : "var(--brand)"
          }}>{p.status}</span>
          <span className="text-[10px] text-t3 flex items-center gap-1"><Users className="w-3 h-3" /> {p.teamSize}</span>
        </div>
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${p.color}14` }}>
            <Layers className="w-4 h-4" style={{ color: p.color }} strokeWidth={1.8} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-bold text-t1 truncate">{p.name}</p>
            <p className="text-[11px] text-t2">by <Link to="/app/profile" className="text-brand hover:underline">{p.creator}</Link></p>
          </div>
        </div>
        <p className="text-[13px] text-t1 leading-relaxed line-clamp-2 mb-2">{p.description}</p>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-2 border border-border/50 text-t2 inline-block">{p.domain}</span>
      </div>
      <Button variant="secondary" size="sm" className="w-full mt-3">
        View project <ArrowRight className="w-3 h-3 ml-1" />
      </Button>
    </div>
  );
}

function OpportunityCard({ o }: { o: typeof opportunitiesMock[0] }) {
  return (
    <div className={`${cardBase} h-[200px] p-5`} style={{ background: "var(--surface)", boxShadow: cardShadow, borderLeft: "3px solid #F59E0B" }}>
      <div>
        <p className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: "#F59E0B" }}>{o.type}</p>
        <h3 className="text-[14px] font-bold text-t1 mb-1.5 line-clamp-2">{o.name}</h3>
        <div className="flex items-center gap-2.5">
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(245,158,11,0.10)", color: "#F59E0B" }}>{o.reward}</span>
          <span className="text-[10px] text-t3 flex items-center gap-1"><Target className="w-3 h-3" /> {o.daysLeft}</span>
        </div>
        <span className="text-[10px] mt-1.5 inline-block px-2 py-0.5 rounded-full bg-surface-2 border border-border/50 text-t3">{o.domain}</span>
      </div>
      <Button variant="secondary" size="sm" className="w-full mt-3" onClick={() => tiikToast("Opening opportunity...")}>View <ArrowRight className="w-3 h-3 ml-1" /></Button>
    </div>
  );
}

function InstitutionCard({ inst }: { inst: typeof institutionsMock[0] }) {
  return (
    <div className={`${cardBase} h-[240px] w-[260px] shrink-0 p-5`} style={{ background: "var(--surface)", boxShadow: cardShadow, borderLeft: "3px solid var(--brand)" }}>
      <div>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-11 h-11 rounded-[12px] flex items-center justify-center text-[12px] font-bold bg-brand-dim text-brand border border-brand/20">{inst.initials}</div>
          <div className="min-w-0 flex-1">
            <Link to="/app/institution/1" className="text-[13px] font-bold text-t1 hover:text-brand transition-colors block truncate">{inst.name}</Link>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-surface-2 text-t2">{inst.type}</span>
              <span className="text-[9px] text-t3">{inst.city}</span>
            </div>
          </div>
        </div>
        {inst.verified === "gold" && (
          <div className="flex items-center gap-1.5 mb-2"><Shield className="w-3.5 h-3.5" style={{ color: "#F59E0B" }} /><span className="text-[10px] font-bold" style={{ color: "#F59E0B" }}>Tiik Verified</span></div>
        )}
        {inst.verified === "grey" && (
          <div className="flex items-center gap-1.5 mb-2"><Shield className="w-3.5 h-3.5" style={{ color: "#6B7280" }} /><span className="text-[10px] font-bold" style={{ color: "#6B7280" }}>Auto-verified</span></div>
        )}
        <p className="text-[11px] text-t3">{inst.members.toLocaleString()} members · {inst.projects} projects</p>
      </div>
      <div className="flex gap-2 mt-3">
        <Button size="sm" className="flex-1" onClick={() => tiikToast.success("Request sent")}>I work here</Button>
        <Button variant="ghost" size="sm" onClick={() => tiikToast.success("Following")}>Follow</Button>
      </div>
    </div>
  );
}

// --- Swimlane section ---
function Swimlane({ title, children }: { title: string; children: React.ReactNode }) {
  const { ref, scroll } = useHScroll();
  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-[15px] font-bold text-t1">{title}</h2>
        <div className="flex items-center gap-1">
          <button onClick={() => scroll("left")} className="w-7 h-7 rounded-lg flex items-center justify-center text-t3 hover:text-t1 hover:bg-surface-2 transition-all cursor-pointer"><ChevronLeft className="w-4 h-4" /></button>
          <button onClick={() => scroll("right")} className="w-7 h-7 rounded-lg flex items-center justify-center text-t3 hover:text-t1 hover:bg-surface-2 transition-all cursor-pointer"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>
      <div ref={ref} className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
        {children}
      </div>
    </section>
  );
}

// --- Main ---
const Explore = () => {
  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);

  const toggleFilter = (arr: string[], val: string, setter: (v: string[]) => void) => {
    setter(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]);
  };

  const hasFilters = selectedRoles.length > 0 || selectedCities.length > 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-7">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <Compass className="w-6 h-6 text-brand" strokeWidth={1.8} />
        <h1 className="text-[20px] font-extrabold text-t1">Explore</h1>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Compass className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-t3" strokeWidth={1.8} />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search by name, skill, city, field..."
          className="w-full h-[48px] rounded-2xl bg-surface border border-border/50 pl-12 pr-4 text-sm text-t1 placeholder:text-t3 outline-none transition-all duration-200 focus:border-brand focus:shadow-[0_0_0_3px_var(--brand-dim)]"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
        />
      </div>

      {/* Primary category tabs — clean horizontal line */}
      <div className="flex items-center gap-0 border-b border-border/40 mb-5">
        {categoryTabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-[13px] font-semibold transition-all duration-200 relative cursor-pointer ${
              activeTab === tab ? "text-brand" : "text-t3 hover:text-t1"
            }`}
          >
            {tab}
            {activeTab === tab && (
              <motion.div layoutId="explore-tab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-brand rounded-full" />
            )}
          </button>
        ))}

        {/* Filters button */}
        <div className="ml-auto">
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={`flex items-center gap-1.5 px-3 h-8 rounded-lg text-[12px] font-semibold transition-all duration-200 cursor-pointer border ${
              hasFilters ? "border-brand text-brand bg-brand-dim" : "border-border/50 text-t3 hover:text-t1 hover:bg-surface-2"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filters{hasFilters && ` (${selectedRoles.length + selectedCities.length})`}
          </button>
        </div>
      </div>

      {/* Filter dropdown panel */}
      <AnimatePresence>
        {filtersOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-5"
          >
            <div className="rounded-2xl border border-border/50 p-5" style={{ background: "var(--surface)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[12px] font-bold text-t1">Filter results</p>
                {hasFilters && (
                  <button onClick={() => { setSelectedRoles([]); setSelectedCities([]); }} className="text-[11px] text-brand hover:underline cursor-pointer">Clear all</button>
                )}
              </div>
              <div className="mb-3">
                <p className="text-[10px] font-bold tracking-wider uppercase text-t3 mb-2">Role</p>
                <div className="flex flex-wrap gap-1.5">
                  {roleFilters.map(r => (
                    <button key={r} onClick={() => toggleFilter(selectedRoles, r, setSelectedRoles)}
                      className={`text-[11px] font-semibold px-3 h-7 rounded-full border transition-all duration-200 cursor-pointer ${
                        selectedRoles.includes(r) ? "bg-brand border-brand text-white" : "bg-surface-2 border-border/50 text-t2 hover:border-brand hover:text-brand"
                      }`}>{r}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold tracking-wider uppercase text-t3 mb-2">City</p>
                <div className="flex flex-wrap gap-1.5">
                  {cityFilters.map(c => (
                    <button key={c} onClick={() => toggleFilter(selectedCities, c, setSelectedCities)}
                      className={`text-[11px] font-semibold px-3 h-7 rounded-full border transition-all duration-200 cursor-pointer ${
                        selectedCities.includes(c) ? "bg-brand border-brand text-white" : "bg-surface-2 border-border/50 text-t2 hover:border-brand hover:text-brand"
                      }`}>{c}</button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Swimlane content based on active tab */}
      {(activeTab === "All" || activeTab === "People") && (
        <Swimlane title="Suggested Talent">
          {peopleMock.map((p, i) => <PersonCard key={i} p={p} />)}
        </Swimlane>
      )}

      {(activeTab === "All" || activeTab === "Projects") && (
        <Swimlane title="Trending Projects">
          {projectsMock.map((p, i) => <ProjectCard key={i} p={p} />)}
        </Swimlane>
      )}

      {(activeTab === "All" || activeTab === "Opportunities") && (
        <section className="mb-8">
          <h2 className="text-[15px] font-bold text-t1 mb-3 px-1">Open Opportunities</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {opportunitiesMock.map((o, i) => <OpportunityCard key={i} o={o} />)}
          </div>
        </section>
      )}

      {(activeTab === "All" || activeTab === "Institutions") && (
        <Swimlane title="Institutions">
          {institutionsMock.map((inst, i) => <InstitutionCard key={i} inst={inst} />)}
        </Swimlane>
      )}

      {/* Empty state */}
      {activeTab !== "All" && (
        <div className="text-center py-8">
          <Button variant="secondary" size="sm" onClick={() => tiikToast("Loading more results...")}>Load more</Button>
        </div>
      )}
    </div>
  );
};

export default Explore;

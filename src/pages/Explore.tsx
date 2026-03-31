import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Compass, Shield, Users, Layers, X, Target,
  Cpu, Stethoscope, Scale, Building2, Wrench, FlaskConical,
  Banknote, GraduationCap, Rocket, ArrowRight, Link2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { tiikToast } from "@/components/ui/tiik-toast";

const ROLE_COLORS: Record<string, string> = {
  Student: "#4F46E5", Professional: "#0369A1", Government: "#166534",
  Doctor: "#0E7490", Faculty: "#92400E", "Skilled Trade": "#C2410C",
  "HR/Recruiter": "#6B21A8", Aspirant: "#374151", Builder: "#7C3AED",
};

const filterChips = ["All", "People", "Projects", "Institutions", "Opportunities"];
const roleChips = ["Student", "Professional", "Government", "Doctor", "Skilled Trade", "Faculty", "Builder", "Aspirant"];

const terrainTiles = [
  { name: "Engineering", icon: Cpu, color: "#4F46E5", count: "2.4k" },
  { name: "Medicine", icon: Stethoscope, color: "#0E7490", count: "1.8k" },
  { name: "Law", icon: Scale, color: "#374151", count: "920" },
  { name: "Government", icon: Building2, color: "#166534", count: "3.1k" },
  { name: "Skilled Trades", icon: Wrench, color: "#C2410C", count: "1.2k" },
  { name: "Research", icon: FlaskConical, color: "#0369A1", count: "780" },
  { name: "Finance", icon: Banknote, color: "#92400E", count: "1.5k" },
  { name: "Education", icon: GraduationCap, color: "#92400E", count: "2.0k" },
  { name: "Startups", icon: Rocket, color: "#7C3AED", count: "1.1k" },
];

type CardType = "person" | "project" | "institution" | "opportunity";
interface ExploreCard {
  type: CardType;
  name: string; initials: string; color: string;
  role?: string; city?: string; score?: number; strands?: number; institution?: string;
  headline?: string; verified?: "gold" | "grey" | "none";
  domain?: string; status?: string; creator?: string; teamSize?: number; description?: string;
  instType?: string; memberCount?: number; projectCount?: number;
  oppType?: string; reward?: string; daysLeft?: string;
}

const mockCards: ExploreCard[] = [
  { type: "person", name: "Riya Sharma", initials: "RS", color: "#4F46E5", role: "Student", city: "Delhi", score: 68, strands: 92, institution: "DTU", headline: "Building healthcare apps for rural India", verified: "gold" },
  { type: "project", name: "SmartGrid Monitor", initials: "SM", color: "#4F46E5", domain: "IoT", status: "Active", creator: "Arjun K.", teamSize: 3, description: "IoT dashboard for electrical grid monitoring" },
  { type: "institution", name: "Delhi Technological University", initials: "DT", color: "#4F46E5", instType: "College", city: "Delhi", memberCount: 4200, projectCount: 380, verified: "gold" },
  { type: "person", name: "Dr. Manoj Patil", initials: "MP", color: "#0E7490", role: "Doctor", city: "Mumbai", score: 85, strands: 210, institution: "KEM Hospital", headline: "Rural health camps & telemedicine", verified: "gold" },
  { type: "project", name: "Rural Water IoT", initials: "RW", color: "#166534", domain: "Environment", status: "Active", creator: "Suresh R.", teamSize: 5, description: "IoT-based water quality monitoring for rural communities" },
  { type: "opportunity", name: "Cold Storage for Farmers", initials: "CS", color: "#F59E0B", oppType: "Funded Challenge", reward: "₹25,000", daysLeft: "12 days left" },
  { type: "person", name: "Sunita Devi", initials: "SD", color: "#C2410C", role: "Skilled Trade", city: "Hyderabad", score: 74, strands: 48, institution: "Independent", headline: "Certified electrician, 8+ years residential & commercial", verified: "grey" },
  { type: "person", name: "Kavita Rao", initials: "KR", color: "#6B21A8", role: "HR/Recruiter", city: "Bengaluru", score: 90, strands: 340, institution: "TCS", headline: "Talent acquisition lead, hiring for tech roles", verified: "gold" },
  { type: "institution", name: "KEM Hospital", initials: "KE", color: "#0E7490", instType: "Hospital", city: "Mumbai", memberCount: 1800, projectCount: 120, verified: "grey" },
  { type: "opportunity", name: "AI Crop Disease Detection", initials: "AC", color: "#F59E0B", oppType: "Funded Challenge", reward: "₹50,000", daysLeft: "20 days" },
  { type: "person", name: "Prof. Sharma", initials: "PS", color: "#92400E", role: "Faculty", city: "Delhi", score: 88, strands: 180, institution: "DTU", headline: "CS professor, IoT & embedded systems research", verified: "gold" },
  { type: "project", name: "AgriSense Dashboard", initials: "AD", color: "#166534", domain: "AgriTech", status: "Completed", creator: "Riya S.", teamSize: 4, description: "ML-powered crop health monitoring system" },
];

const Explore = () => {
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [activeTerrain, setActiveTerrain] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [drawerCard, setDrawerCard] = useState<ExploreCard | null>(null);

  const filtered = mockCards.filter(c => {
    if (categoryFilter === "People" && c.type !== "person") return false;
    if (categoryFilter === "Projects" && c.type !== "project") return false;
    if (categoryFilter === "Institutions" && c.type !== "institution") return false;
    if (categoryFilter === "Opportunities" && c.type !== "opportunity") return false;
    if (roleFilter && c.type === "person" && c.role !== roleFilter) return false;
    if (roleFilter && c.type !== "person") return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return c.name.toLowerCase().includes(q) || c.role?.toLowerCase().includes(q) || c.city?.toLowerCase().includes(q) || c.institution?.toLowerCase().includes(q) || c.domain?.toLowerCase().includes(q);
    }
    return true;
  });

  const VerifRing = ({ type, size = 48 }: { type?: string; size?: number }) => {
    if (type === "gold") return (
      <div className="absolute inset-0 rounded-full" style={{ boxShadow: `0 0 0 2px var(--surface), 0 0 0 4px #F59E0B, 0 0 8px rgba(245,158,11,0.5)`, width: size, height: size }} />
    );
    if (type === "grey") return (
      <div className="absolute inset-0 rounded-full" style={{ boxShadow: `0 0 0 2px var(--surface), 0 0 0 4px #6B7280`, width: size, height: size }} />
    );
    return null;
  };

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
          className="w-full h-[52px] rounded-2xl bg-surface border-[1.5px] border-[var(--border-2)] pl-12 pr-4 text-sm text-t1 placeholder:text-t3 outline-none transition-all focus:border-brand focus:shadow-[0_0_0_3px_var(--brand-dim)]"
        />
      </div>

      {/* Terrain strip */}
      <div className="mb-5">
        <p className="micro-label mb-2">Explore by field</p>
        <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-1">
          {terrainTiles.map(t => {
            const active = activeTerrain === t.name;
            const Icon = t.icon;
            return (
              <button
                key={t.name}
                onClick={() => setActiveTerrain(active ? null : t.name)}
                className="shrink-0 w-[110px] h-[72px] rounded-2xl border text-center flex flex-col items-center justify-center gap-1 transition-all cursor-pointer"
                style={{
                  background: active ? "var(--brand-dim)" : "var(--surface)",
                  borderColor: active ? "var(--brand)" : "var(--border)",
                }}
              >
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
                  <Icon className="w-5 h-5" style={{ color: t.color }} strokeWidth={1.8} />
                </div>
                <p className="text-[11px] font-bold text-t1">{t.name}</p>
                <p className="text-[9px] text-t3">{t.count} active</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Category filter chips */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 mb-2">
        {filterChips.map(chip => {
          const active = categoryFilter === chip;
          return (
            <button
              key={chip}
              onClick={() => { setCategoryFilter(chip); if (chip !== "People") setRoleFilter(null); }}
              className="whitespace-nowrap text-[11px] font-bold px-4 h-8 rounded-full transition-all shrink-0 border cursor-pointer"
              style={{
                background: active ? "var(--brand)" : "var(--surface-2)",
                borderColor: active ? "var(--brand)" : "var(--border)",
                color: active ? "#fff" : "var(--text-2)",
              }}
            >
              {chip}
            </button>
          );
        })}
      </div>

      {/* Role filter chips */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-3 mb-5">
        {roleChips.map(chip => {
          const active = roleFilter === chip;
          return (
            <button
              key={chip}
              onClick={() => { setRoleFilter(active ? null : chip); if (categoryFilter !== "People" && categoryFilter !== "All") setCategoryFilter("All"); }}
              className="whitespace-nowrap text-[11px] font-semibold px-3 h-7 rounded-full transition-all shrink-0 border cursor-pointer"
              style={{
                background: active ? "var(--brand)" : "var(--surface-2)",
                borderColor: active ? "var(--brand)" : "var(--border)",
                color: active ? "#fff" : "var(--text-2)",
              }}
            >
              {chip}
            </button>
          );
        })}
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Compass className="w-10 h-10 text-t3 mx-auto mb-3" />
          <p className="text-t2 text-sm mb-3">No results found. Try different filters.</p>
          <Button variant="secondary" size="sm" onClick={() => { setCategoryFilter("All"); setRoleFilter(null); setSearchQuery(""); setActiveTerrain(null); }}>Clear filters</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
          {filtered.map((card, i) => (
            <motion.div key={`${card.type}-${card.name}-${i}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              {/* PERSON */}
              {card.type === "person" && (
                <div className="t-card t-card-hover p-5" style={{ borderLeft: `4px solid ${ROLE_COLORS[card.role!] || "var(--brand)"}` }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="relative shrink-0" style={{ width: 48, height: 48 }}>
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ backgroundColor: ROLE_COLORS[card.role!] }}>{card.initials}</div>
                      <VerifRing type={card.verified} size={48} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link to="/app/profile" className="text-[14px] font-bold text-t1 hover:text-brand transition-colors block truncate">{card.name}</Link>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${ROLE_COLORS[card.role!]}18`, color: ROLE_COLORS[card.role!] }}>{card.role}</span>
                        <Link to="/app/institution/1" className="text-[10px] text-t3 hover:text-brand transition-colors truncate">{card.institution}</Link>
                      </div>
                    </div>
                  </div>
                  <p className="text-[13px] text-t2 mb-3 line-clamp-2 leading-relaxed">{card.headline}</p>
                  <div className="flex items-center gap-3 text-[11px] text-t3 mb-3">
                    <span className="flex items-center gap-1">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-brand" />
                      Score {card.score}
                    </span>
                    <span><Link2 className="w-3 h-3 inline" /> {card.strands} strands</span>
                  </div>
                  <Button variant="secondary" size="sm" className="w-full" onClick={() => tiikToast.success("Strand request sent")}>Connect</Button>
                </div>
              )}

              {/* PROJECT */}
              {card.type === "project" && (
                <div className="t-card t-card-hover p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{
                      backgroundColor: card.status === "Active" ? "rgba(16,185,129,0.15)" : "var(--brand-dim)",
                      color: card.status === "Active" ? "#10B981" : "var(--brand)"
                    }}>{card.status}</span>
                  </div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${card.color}18` }}>
                      <Layers className="w-5 h-5" style={{ color: card.color }} strokeWidth={1.8} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link to="/arjun/smartgrid" className="text-[15px] font-bold text-t1 hover:text-brand transition-colors block truncate">{card.name}</Link>
                      <p className="text-[12px] text-t2">by <Link to="/app/profile" className="text-brand hover:underline">{card.creator}</Link></p>
                    </div>
                  </div>
                  <p className="text-[13px] text-t2 mb-3 line-clamp-2 leading-relaxed">{card.description}</p>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-2 border border-border text-t2">{card.domain}</span>
                    <span className="text-[11px] text-t3 flex items-center gap-1"><Users className="w-3 h-3" /> {card.teamSize}</span>
                  </div>
                  <Button variant="secondary" size="sm" className="w-full" onClick={() => setDrawerCard(card)}>
                    View project <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}

              {/* INSTITUTION */}
              {card.type === "institution" && (
                <div className="t-card t-card-hover p-5" style={{ borderLeft: "4px solid var(--brand)" }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-[14px] flex items-center justify-center text-sm font-bold bg-brand-dim text-brand border border-brand/20">{card.initials}</div>
                    <div className="flex-1 min-w-0">
                      <Link to="/app/institution/1" className="text-[15px] font-bold text-t1 hover:text-brand transition-colors block truncate">{card.name}</Link>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-surface-2 text-t2">{card.instType}</span>
                        <span className="text-[10px] text-t3">{card.city}</span>
                      </div>
                    </div>
                  </div>
                  {card.verified === "gold" && (
                    <div className="flex items-center gap-1.5 mb-2">
                      <Shield className="w-3.5 h-3.5" style={{ color: "#F59E0B" }} />
                      <span className="text-[10px] font-bold" style={{ color: "#F59E0B" }}>Tiik Verified</span>
                    </div>
                  )}
                  {card.verified === "grey" && (
                    <div className="flex items-center gap-1.5 mb-2">
                      <Shield className="w-3.5 h-3.5" style={{ color: "#6B7280" }} />
                      <span className="text-[10px] font-bold" style={{ color: "#6B7280" }}>Auto-verified</span>
                    </div>
                  )}
                  <p className="text-[11px] text-t3 mb-3">{card.memberCount?.toLocaleString()} members · {card.projectCount} projects</p>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1" onClick={() => tiikToast.success("Request sent")}>I work/study here</Button>
                    <Button variant="ghost" size="sm" onClick={() => tiikToast.success("Following")}>Follow</Button>
                  </div>
                </div>
              )}

              {/* OPPORTUNITY */}
              {card.type === "opportunity" && (
                <div className="t-card t-card-hover p-5" style={{ borderLeft: "4px solid #F59E0B" }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "#F59E0B" }}>{card.oppType}</p>
                  <h3 className="text-[15px] font-bold text-t1 mb-2">{card.name}</h3>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-[12px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(245,158,11,0.12)", color: "#F59E0B" }}>{card.reward}</span>
                    <span className="text-[11px] text-t3 flex items-center gap-1">
                      <Target className="w-3 h-3" /> {card.daysLeft}
                    </span>
                  </div>
                  <Button variant="secondary" size="sm" className="w-full" onClick={() => tiikToast("Opening opportunity...")}>
                    View <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <Button variant="secondary" className="w-full mt-6" onClick={() => tiikToast("Loading more results...")}>Load more results</Button>

      {/* Project drawer */}
      <AnimatePresence>
        {drawerCard && (
          <div className="fixed inset-0 z-50 flex justify-end" style={{ background: "rgba(4,6,26,0.7)", backdropFilter: "blur(12px)" }} onClick={() => setDrawerCard(null)}>
            <motion.div
              initial={{ x: 400 }} animate={{ x: 0 }} exit={{ x: 400 }}
              transition={{ type: "spring", damping: 25 }}
              className="w-full max-w-[400px] h-full overflow-y-auto p-6"
              style={{ background: "var(--surface)", borderLeft: "1px solid var(--border)" }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-t1">Project Details</h2>
                <button onClick={() => setDrawerCard(null)} className="p-2 rounded-xl hover:bg-brand-dim transition-colors cursor-pointer"><X className="w-5 h-5 text-t2" /></button>
              </div>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: `${drawerCard.color}18` }}>
                <Layers className="w-6 h-6" style={{ color: drawerCard.color }} />
              </div>
              <h3 className="text-xl font-extrabold text-t1 mb-1">{drawerCard.name}</h3>
              <p className="text-[12px] text-t2 mb-4">by <Link to="/app/profile" className="text-brand hover:underline">{drawerCard.creator}</Link></p>
              <div className="flex gap-2 mb-4">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-2 border border-border text-t2">{drawerCard.domain}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full" style={{
                  backgroundColor: drawerCard.status === "Active" ? "rgba(16,185,129,0.15)" : "var(--brand-dim)",
                  color: drawerCard.status === "Active" ? "#10B981" : "var(--brand)"
                }}>{drawerCard.status}</span>
              </div>
              {drawerCard.description && <p className="text-sm text-t2 mb-6 leading-relaxed">{drawerCard.description}</p>}
              <Button className="w-full" onClick={() => { tiikToast.success("Opening full project view"); setDrawerCard(null); }}>View full project</Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Explore;

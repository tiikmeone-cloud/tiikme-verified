import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Compass, Shield, MapPin, Users, Layers, BarChart3, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const ROLE_COLORS: Record<string, string> = {
  Student: "#4F46E5", Professional: "#0369A1", Government: "#166534",
  Doctor: "#0E7490", Faculty: "#92400E", "Skilled Trade": "#C2410C",
  "HR/Recruiter": "#6B21A8", Aspirant: "#374151", Builder: "#7C3AED",
};
const ROLE_DIM: Record<string, [string, string]> = {
  Student: ["#EEF2FF", "#4F46E5"], Professional: ["#E0F2FE", "#0369A1"],
  Government: ["#DCFCE7", "#166534"], Doctor: ["#CCFBF1", "#0E7490"],
  Faculty: ["#FEF3C7", "#92400E"], "Skilled Trade": ["#FFEDD5", "#C2410C"],
  "HR/Recruiter": ["#F3E8FF", "#6B21A8"], Aspirant: ["#F3F4F6", "#374151"],
  Builder: ["#EDE9FE", "#7C3AED"],
};

const filterChips = ["All", "People", "Projects", "Institutions", "Opportunities", "Topics"];
const roleChips = ["Student", "Professional", "Government", "Doctor", "Skilled Trade", "Faculty", "Builder", "Aspirant"];
const terrainTiles = [
  { name: "Engineering", color: "#4F46E5", count: "2.4k" },
  { name: "Medicine", color: "#0E7490", count: "1.8k" },
  { name: "Law", color: "#374151", count: "920" },
  { name: "Government", color: "#166534", count: "3.1k" },
  { name: "Skilled Trades", color: "#C2410C", count: "1.2k" },
  { name: "Research", color: "#0369A1", count: "780" },
  { name: "Finance", color: "#92400E", count: "1.5k" },
  { name: "Education", color: "#92400E", count: "2.0k" },
  { name: "Startups", color: "#7C3AED", count: "1.1k" },
];

type CardType = "person" | "project" | "institution" | "opportunity" | "topic";
interface ExploreCard {
  type: CardType;
  name: string; initials: string; color: string;
  role?: string; city?: string; score?: number; strands?: number; institution?: string;
  headline?: string; verified?: "gold" | "grey" | "none";
  domain?: string; status?: string; creator?: string; teamSize?: number; description?: string;
  instType?: string; memberCount?: number; projectCount?: number;
  oppType?: string; reward?: string; daysLeft?: string;
  postCount?: number; contributorCount?: number;
}

const mockCards: ExploreCard[] = [
  { type: "person", name: "Riya Sharma", initials: "RS", color: "#4F46E5", role: "Student", city: "Delhi", score: 68, strands: 92, institution: "DTU", headline: "Building healthcare apps for rural India", verified: "gold" },
  { type: "project", name: "SmartGrid Monitor", initials: "SM", color: "#4F46E5", domain: "IoT", status: "Active", creator: "Arjun K.", teamSize: 3, description: "IoT dashboard for electrical grid monitoring" },
  { type: "institution", name: "Delhi Technological University", initials: "DT", color: "#4F46E5", instType: "College", city: "Delhi", memberCount: 4200, projectCount: 380, verified: "gold" },
  { type: "person", name: "Dr. Manoj Patil", initials: "MP", color: "#0E7490", role: "Doctor", city: "Mumbai", score: 85, strands: 210, institution: "KEM Hospital", headline: "Rural health camps & telemedicine", verified: "gold" },
  { type: "project", name: "Rural Water IoT", initials: "RW", color: "#166534", domain: "Environment", status: "Active", creator: "Suresh R.", teamSize: 5, description: "IoT-based water quality monitoring" },
  { type: "opportunity", name: "Cold Storage for Farmers", initials: "CS", color: "#F59E0B", oppType: "Funded Challenge", reward: "₹25,000", daysLeft: "12 days left" },
  { type: "person", name: "Sunita Devi", initials: "SD", color: "#C2410C", role: "Skilled Trade", city: "Hyderabad", score: 74, strands: 48, institution: "Independent", headline: "Certified electrician, 8+ years", verified: "grey" },
  { type: "topic", name: "HealthTech", initials: "#", color: "#5B4FFF", postCount: 234, contributorCount: 89 },
  { type: "person", name: "Kavita Rao", initials: "KR", color: "#6B21A8", role: "HR/Recruiter", city: "Bengaluru", score: 90, strands: 340, institution: "TCS", headline: "Talent acquisition lead, hiring for tech", verified: "gold" },
  { type: "institution", name: "KEM Hospital", initials: "KE", color: "#0E7490", instType: "Hospital", city: "Mumbai", memberCount: 1800, projectCount: 120, verified: "grey" },
  { type: "opportunity", name: "AI Crop Disease Detection", initials: "AC", color: "#F59E0B", oppType: "Funded Challenge", reward: "₹50,000", daysLeft: "20 days" },
  { type: "person", name: "Prof. Sharma", initials: "PS", color: "#92400E", role: "Faculty", city: "Delhi", score: 88, strands: 180, institution: "DTU", headline: "CS professor, IoT & embedded systems", verified: "gold" },
];

const Explore = () => {
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [drawerCard, setDrawerCard] = useState<ExploreCard | null>(null);

  const filtered = mockCards.filter(c => {
    if (categoryFilter === "People" && c.type !== "person") return false;
    if (categoryFilter === "Projects" && c.type !== "project") return false;
    if (categoryFilter === "Institutions" && c.type !== "institution") return false;
    if (categoryFilter === "Opportunities" && c.type !== "opportunity") return false;
    if (categoryFilter === "Topics" && c.type !== "topic") return false;
    if (roleFilter && c.type === "person" && c.role !== roleFilter) return false;
    if (roleFilter && c.type !== "person") return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return c.name.toLowerCase().includes(q) || c.role?.toLowerCase().includes(q) || c.city?.toLowerCase().includes(q) || c.institution?.toLowerCase().includes(q) || c.domain?.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-7">
      <h1 className="text-[20px] font-bold text-t1 mb-1">Explore</h1>
      <p className="text-[13px] text-t2 mb-5">Find people, projects, institutions, and opportunities across India.</p>

      {/* Search */}
      <div className="flex items-center gap-3 px-4 h-11 rounded-2xl bg-surface-2 border border-border mb-4 focus-within:border-brand transition-colors">
        <Search className="w-5 h-5 text-t3 shrink-0" />
        <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search people, projects, institutions, skills..." className="flex-1 bg-transparent text-sm outline-none placeholder:text-t3 text-t1" />
      </div>

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 mb-2">
        {filterChips.map(chip => (
          <button key={chip} onClick={() => { setCategoryFilter(chip); if (chip !== "People") setRoleFilter(null); }}
            className="whitespace-nowrap text-xs font-bold px-4 py-2 rounded-full transition-all shrink-0 border"
            style={{
              background: categoryFilter === chip ? "hsl(var(--brand))" : "hsl(var(--surface-2))",
              borderColor: categoryFilter === chip ? "hsl(var(--brand))" : "hsl(var(--border))",
              color: categoryFilter === chip ? "white" : "hsl(var(--text-2))",
            }}>
            {chip}
          </button>
        ))}
      </div>

      {/* Role chips */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-3 mb-4">
        {roleChips.map(chip => (
          <button key={chip} onClick={() => { setRoleFilter(roleFilter === chip ? null : chip); if (categoryFilter !== "People" && categoryFilter !== "All") setCategoryFilter("All"); }}
            className="whitespace-nowrap text-xs font-semibold px-3 py-1.5 rounded-full transition-all shrink-0 border"
            style={{
              background: roleFilter === chip ? "hsl(var(--brand))" : "hsl(var(--surface-2))",
              borderColor: roleFilter === chip ? "hsl(var(--brand))" : "hsl(var(--border))",
              color: roleFilter === chip ? "white" : "hsl(var(--text-2))",
            }}>
            {chip}
          </button>
        ))}
      </div>

      {/* Terrain */}
      <div className="mb-6">
        <p className="micro-label mb-2">Explore by field</p>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
          {terrainTiles.map(t => (
            <button key={t.name} className="shrink-0 w-[120px] t-card p-3 text-left hover:border-brand transition-colors">
              <div className="w-2.5 h-2.5 rounded-full mb-2" style={{ backgroundColor: t.color }} />
              <p className="text-xs font-bold text-t1">{t.name}</p>
              <p className="text-[10px] text-t3">{t.count} active</p>
            </button>
          ))}
        </div>
      </div>

      {/* Results grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Search className="w-10 h-10 text-t3 mx-auto mb-3" />
          <p className="text-t2 text-sm mb-3">No results found. Try different filters.</p>
          <Button variant="secondary" size="sm" onClick={() => { setCategoryFilter("All"); setRoleFilter(null); setSearchQuery(""); }}>Clear filters</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((card, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              {card.type === "person" && (
                <div className="t-card p-5 hover:border-[hsl(var(--border-2))] transition-colors" style={{ borderLeft: `4px solid ${ROLE_COLORS[card.role!] || "#5B4FFF"}` }}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ backgroundColor: ROLE_COLORS[card.role!] || "#5B4FFF" }}>{card.initials}</div>
                      {card.verified === "gold" && <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#F59E0B] flex items-center justify-center"><Shield className="w-2.5 h-2.5 text-white" /></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link to="/app/profile" className="text-sm font-bold text-t1 hover:text-brand transition-colors">{card.name}</Link>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: ROLE_DIM[card.role!]?.[0] || "#EEF2FF", color: ROLE_DIM[card.role!]?.[1] || "#4F46E5" }}>{card.role}</span>
                        <span className="text-[10px] text-t3">{card.institution}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-[13px] text-t2 mb-3 line-clamp-2">{card.headline}</p>
                  <div className="flex items-center gap-3 text-[11px] text-t3 mb-3">
                    <span>Score: {card.score}</span>
                    <span>{card.strands} strands</span>
                  </div>
                  <Button variant="secondary" size="sm" className="w-full" onClick={() => toast.success("Request sent ✓")}>Connect</Button>
                </div>
              )}
              {card.type === "project" && (
                <div className="t-card p-5 hover:border-[hsl(var(--border-2))] transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold text-t1">{card.name}</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: card.status === "Active" ? "rgba(16,185,129,0.15)" : "hsl(var(--brand-dim))", color: card.status === "Active" ? "#10B981" : "hsl(var(--brand))" }}>{card.status}</span>
                  </div>
                  <p className="text-[12px] text-t2 mb-2">by <Link to="/app/profile" className="text-brand hover:underline">{card.creator}</Link></p>
                  <div className="flex gap-2 mb-3">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-2 border border-border text-t2">{card.domain}</span>
                  </div>
                  <p className="text-[11px] text-t3 mb-3 flex items-center gap-1"><Users className="w-3 h-3" /> {card.teamSize} members</p>
                  <Button variant="secondary" size="sm" className="w-full" onClick={() => setDrawerCard(card)}>View project →</Button>
                </div>
              )}
              {card.type === "institution" && (
                <div className="t-card p-5 hover:border-[hsl(var(--border-2))] transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-[14px] flex items-center justify-center text-sm font-bold text-brand bg-brand-dim border border-brand">{card.initials}</div>
                    <div>
                      <Link to={`/app/institution/1`} className="text-[15px] font-bold text-t1 hover:text-brand transition-colors">{card.name}</Link>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-surface-2 text-t2">{card.instType}</span>
                        <span className="text-[10px] text-t3">{card.city}</span>
                      </div>
                    </div>
                  </div>
                  {card.verified === "gold" && <p className="text-[10px] font-bold text-[#F59E0B] mb-2">✓ Tiik Verified</p>}
                  <p className="text-[11px] text-t3 mb-3">{card.memberCount} members · {card.projectCount} projects</p>
                  <div className="flex gap-2">
                    <Button variant="default" size="sm" className="flex-1">I work/study here</Button>
                    <Button variant="ghost" size="sm">Follow</Button>
                  </div>
                </div>
              )}
              {card.type === "opportunity" && (
                <div className="t-card p-5 hover:border-[hsl(var(--border-2))] transition-colors" style={{ borderLeft: "4px solid #F59E0B" }}>
                  <p className="micro-label text-[#F59E0B] mb-1">{card.oppType}</p>
                  <h3 className="text-sm font-bold text-t1 mb-2">{card.name}</h3>
                  <div className="flex items-center gap-3 text-xs text-t3 mb-3">
                    <span className="text-[#F59E0B] font-bold">{card.reward}</span>
                    <span>{card.daysLeft}</span>
                  </div>
                  <Button variant="secondary" size="sm" className="w-full" onClick={() => toast.success("Opening...")}>View opportunity →</Button>
                </div>
              )}
              {card.type === "topic" && (
                <div className="t-card p-5 hover:border-[hsl(var(--border-2))] transition-colors" style={{ borderLeft: "4px solid hsl(var(--brand))" }}>
                  <h3 className="text-base font-bold text-t1 mb-1">#{card.name}</h3>
                  <p className="text-[11px] text-t3 mb-3">{card.postCount} posts · {card.contributorCount} contributors</p>
                  <Button variant="secondary" size="sm" className="w-full" onClick={() => toast.success("Following ✓")}>Follow topic</Button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <Button variant="secondary" className="w-full mt-6" onClick={() => toast.info("Loading more...")}>Load more results</Button>

      {/* Drawer */}
      <AnimatePresence>
        {drawerCard && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm" onClick={() => setDrawerCard(null)}>
            <motion.div initial={{ x: 400 }} animate={{ x: 0 }} exit={{ x: 400 }} transition={{ type: "spring", damping: 25 }}
              className="w-full max-w-[400px] h-full bg-surface border-l border-border p-6 overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-t1">Project Details</h2>
                <button onClick={() => setDrawerCard(null)} className="p-2 rounded-lg hover:bg-brand-dim"><X className="w-5 h-5 text-t2" /></button>
              </div>
              <h3 className="text-xl font-bold text-t1 mb-2">{drawerCard.name}</h3>
              <p className="text-xs text-t2 mb-4">by {drawerCard.creator}</p>
              {drawerCard.description && <p className="text-sm text-t2 mb-4">{drawerCard.description}</p>}
              <Button className="w-full" onClick={() => { toast.success("Opening full view..."); setDrawerCard(null); }}>View full project</Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Explore;

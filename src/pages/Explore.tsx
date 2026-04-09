import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, X, ChevronLeft, ChevronRight, Shield, Users, Layers, Target,
  ArrowRight, Cpu, Stethoscope, Scale, Building2, Wrench, Microscope,
  DollarSign, GraduationCap, Rocket, ShieldCheck, Hash, MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const ROLE_COLORS: Record<string, string> = {
  student: "#4F46E5", professional: "#0369A1", government: "#166534",
  doctor: "#0E7490", faculty: "#92400E", skilled_trade: "#C2410C",
  hr: "#6B21A8", aspirant: "#374151", builder: "#7C3AED",
};

const terrainFields = [
  { name: "Engineering", icon: Cpu, color: "#4F46E5" },
  { name: "Medicine", icon: Stethoscope, color: "#0E7490" },
  { name: "Law", icon: Scale, color: "#166534" },
  { name: "Government", icon: Building2, color: "#166534" },
  { name: "Skilled Trades", icon: Wrench, color: "#C2410C" },
  { name: "Research", icon: Microscope, color: "#92400E" },
  { name: "Finance", icon: DollarSign, color: "#0369A1" },
  { name: "Education", icon: GraduationCap, color: "#92400E" },
  { name: "Startups", icon: Rocket, color: "#7C3AED" },
  { name: "Police & Defence", icon: ShieldCheck, color: "#374151" },
];

const filterRow1 = ["All", "People"];
const filterRow2 = ["Student", "Professional", "Govt", "Doctor", "Trade", "Faculty", "Builder", "Aspirant"];
const roleMap: Record<string, string> = { Student: "student", Professional: "professional", Govt: "government", Doctor: "doctor", Trade: "skilled_trade", Faculty: "faculty", Builder: "builder", Aspirant: "aspirant" };

const ringStyle = (verified: boolean): React.CSSProperties => {
  if (verified) return { boxShadow: "0 0 0 2px var(--surface), 0 0 0 4.5px #F59E0B, 0 0 12px rgba(245,158,11,0.45)" };
  return { boxShadow: "0 0 0 2px var(--surface), 0 0 0 4px #6B7280" };
};

interface ProfileResult {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  role: string | null;
  headline: string | null;
  institution_name: string | null;
  location_city: string | null;
  location_state: string | null;
  activity_score: number | null;
  is_verified: boolean | null;
}

function PersonCard({ p }: { p: ProfileResult }) {
  const [connected, setConnected] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const name = p.full_name || p.username || "User";
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const role = p.role || "student";
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1).replace(/_/g, " ");
  const color = ROLE_COLORS[role] || "#6B7280";

  const handleStrand = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || connected) return;
    await supabase.from("strands").insert({ requester_id: user.id, receiver_id: p.id });
    setConnected(true);
  };

  return (
    <article className="glass-liquid glass-liquid-hover rounded-2xl p-4 flex flex-col cursor-pointer" style={{ borderTop: `3px solid ${color}` }}
      onClick={() => navigate(`/app/profile/${p.id}`)}>
      <div className="flex items-start justify-between mb-2">
        <div className="w-11 h-11 rounded-full flex items-center justify-center text-[13px] font-bold text-white overflow-hidden" style={{ backgroundColor: color, ...ringStyle(p.is_verified || false) }}>
          {p.avatar_url ? <img src={p.avatar_url} alt="" className="w-full h-full object-cover" /> : initials}
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${color}1F`, color }}>{roleLabel}</span>
      </div>
      <p className="text-[13px] font-bold" style={{ color: "var(--text-1)" }}>{name}</p>
      <p className="text-[11px]" style={{ color: "var(--text-3)" }}>{[p.institution_name, p.location_city].filter(Boolean).join(" · ") || "—"}</p>
      {p.headline && <p className="text-[12px] mt-1 line-clamp-2 flex-1" style={{ color: "var(--text-2)" }}>{p.headline}</p>}
      <div className="flex items-center gap-2 mt-2">
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "var(--brand-dim)", color: "var(--brand)" }}>{p.activity_score || 0}</span>
        {p.is_verified && (
          <span className="flex items-center gap-0.5 text-[9px] font-bold" style={{ color: "#F59E0B" }}>
            <Shield className="w-3 h-3" /> Tiiked
          </span>
        )}
      </div>
      {user?.id !== p.id && (
        <Button variant={connected ? "ghost" : "secondary"} size="sm" className="w-full mt-2.5 h-8 text-[11px] active:scale-95" disabled={connected}
          onClick={handleStrand}>
          {connected ? "Pending ✓" : "Strand →"}
        </Button>
      )}
    </article>
  );
}

function Swimlane({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-[14px] font-bold" style={{ color: "var(--text-1)" }}>{title} {count !== undefined && <span className="text-[12px] font-normal" style={{ color: "var(--text-3)" }}>({count})</span>}</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {children}
      </div>
    </section>
  );
}

const Explore = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [activeRoles, setActiveRoles] = useState<string[]>([]);
  const [activeTerrain, setActiveTerrain] = useState<string | null>(null);
  const [people, setPeople] = useState<ProfileResult[]>([]);
  const [loading, setLoading] = useState(true);
  const terrainRef = useRef<HTMLDivElement>(null);

  const scrollTerrain = (dir: "left" | "right") => {
    terrainRef.current?.scrollBy({ left: dir === "left" ? -200 : 200, behavior: "smooth" });
  };

  const toggleRole = (r: string) => {
    setActiveRoles(prev => prev.includes(r) ? prev.filter(v => v !== r) : [...prev, r]);
  };

  const clearFilters = () => { setActiveRoles([]); setActiveTerrain(null); setSearch(""); };
  const hasFilters = activeRoles.length > 0 || activeTerrain || search;

  const fetchPeople = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("profiles")
      .select("id, full_name, username, avatar_url, role, headline, institution_name, location_city, location_state, activity_score, is_verified")
      .eq("is_public", true)
      .order("activity_score", { ascending: false })
      .order("is_verified", { ascending: false })
      .limit(50);

    if (search.trim()) {
      query = query.or(`full_name.ilike.%${search}%,username.ilike.%${search}%,institution_name.ilike.%${search}%,headline.ilike.%${search}%`);
    }

    if (activeRoles.length > 0) {
      const dbRoles = activeRoles.map(r => roleMap[r] || r.toLowerCase());
      query = query.in("role", dbRoles);
    }

    if (user?.id) {
      query = query.neq("id", user.id);
    }

    const { data } = await query;
    setPeople((data as ProfileResult[]) || []);
    setLoading(false);
  }, [search, activeRoles, user?.id]);

  useEffect(() => {
    const timer = setTimeout(fetchPeople, 300);
    return () => clearTimeout(timer);
  }, [fetchPeople]);

  return (
    <main className="max-w-[1100px] mx-auto px-3 md:px-6 py-7">
      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: "var(--text-3)" }} />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, skill, city, institution..."
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

      {/* Filter Row - Roles */}
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
        {hasFilters && (
          <button onClick={clearFilters} className="shrink-0 h-[28px] px-3 rounded-full text-[11px] font-bold cursor-pointer" style={{ color: "#DC2626", border: "1px solid rgba(220,38,38,0.2)" }}>Clear all</button>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="glass-liquid rounded-2xl p-4 animate-pulse">
              <div className="w-11 h-11 rounded-full mb-2" style={{ background: "var(--surface-2)" }} />
              <div className="h-4 w-24 rounded mb-1" style={{ background: "var(--surface-2)" }} />
              <div className="h-3 w-32 rounded" style={{ background: "var(--surface-2)" }} />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && people.length === 0 && (
        <div className="text-center py-16">
          <Search className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--text-3)" }} />
          <p className="text-[15px] font-bold mb-2" style={{ color: "var(--text-1)" }}>No results found</p>
          <p className="text-[12px] mb-4" style={{ color: "var(--text-3)" }}>Try adjusting your filters or search term.</p>
          <Button variant="secondary" onClick={clearFilters}>Clear all filters</Button>
        </div>
      )}

      {/* Results */}
      {!loading && people.length > 0 && (
        <Swimlane title="People" count={people.length}>
          {people.map(p => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <PersonCard p={p} />
            </motion.div>
          ))}
        </Swimlane>
      )}
    </main>
  );
};

export default Explore;

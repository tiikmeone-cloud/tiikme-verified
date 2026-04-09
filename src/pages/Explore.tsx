import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, X, Shield, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const ROLE_COLORS: Record<string, string> = {
  student: "#4F46E5", professional: "#0369A1", government: "#166534",
  doctor: "#0E7490", faculty: "#92400E", skilled_trade: "#C2410C",
  hr: "#6B21A8", aspirant: "#374151", builder: "#7C3AED",
};

const roleOptions = ["All", "Student", "Professional", "Doctor", "Government", "Faculty", "Builder"];
const roleMap: Record<string, string> = { Student: "student", Professional: "professional", Doctor: "doctor", Government: "government", Faculty: "faculty", Builder: "builder" };

interface ProfileResult {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  role: string | null;
  headline: string | null;
  institution_name: string | null;
  location_city: string | null;
  is_verified: boolean | null;
  activity_score: number | null;
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
        <div className="w-11 h-11 rounded-full flex items-center justify-center text-[13px] font-bold text-white overflow-hidden" style={{ backgroundColor: color }}>
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

const Explore = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [people, setPeople] = useState<ProfileResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [roleFilter, setRoleFilter] = useState("All");
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const fetchPeople = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("profiles")
      .select("id, full_name, username, avatar_url, role, headline, institution_name, location_city, is_verified, activity_score")
      .eq("is_public", true)
      .not("full_name", "is", null)
      .order("activity_score", { ascending: false })
      .order("is_verified", { ascending: false })
      .limit(20);

    if (search.trim().length >= 2) {
      query = query.or(`full_name.ilike.%${search}%,username.ilike.%${search}%,institution_name.ilike.%${search}%,headline.ilike.%${search}%`);
    }

    if (roleFilter !== "All" && roleMap[roleFilter]) {
      query = query.eq("role", roleMap[roleFilter]);
    }

    if (verifiedOnly) {
      query = query.eq("is_verified", true);
    }

    if (user?.id) {
      query = query.neq("id", user.id);
    }

    const { data } = await query;
    setPeople((data as ProfileResult[]) || []);
    setLoading(false);
  }, [search, user?.id, roleFilter, verifiedOnly]);

  useEffect(() => {
    const timer = setTimeout(fetchPeople, 300);
    return () => clearTimeout(timer);
  }, [fetchPeople]);

  const clearFilters = () => { setRoleFilter("All"); setVerifiedOnly(false); setSearch(""); };
  const hasFilters = roleFilter !== "All" || verifiedOnly || search;

  return (
    <main className="max-w-[1100px] mx-auto px-3 md:px-6 py-7">
      {/* Search + Filter */}
      <div className="flex gap-2 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: "var(--text-3)" }} />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, username, institution..."
            className="w-full h-[52px] glass-input pl-[52px] pr-12 text-[14px] outline-none" style={{ color: "var(--text-1)" }} />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer" style={{ color: "var(--text-3)" }}>
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button onClick={() => setShowFilters(!showFilters)}
          className="w-[52px] h-[52px] glass-input flex items-center justify-center cursor-pointer shrink-0 rounded-xl"
          style={{ color: showFilters ? "var(--brand)" : "var(--text-3)", background: showFilters ? "var(--brand-dim)" : undefined }}>
          <Filter className="w-5 h-5" />
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="glass-liquid rounded-2xl p-4 mb-5 space-y-3">
          <div>
            <p className="micro-label mb-2">ROLE</p>
            <div className="flex gap-1.5 flex-wrap">
              {roleOptions.map(r => (
                <button key={r} onClick={() => setRoleFilter(r)}
                  className="h-7 px-3 rounded-full text-[11px] font-bold cursor-pointer active:scale-95"
                  style={{ background: roleFilter === r ? "var(--brand)" : "var(--surface-2)", color: roleFilter === r ? "white" : "var(--text-2)", border: roleFilter === r ? "none" : "1px solid var(--border)" }}>
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium" style={{ color: "var(--text-1)" }}>Verified only</span>
            <button onClick={() => setVerifiedOnly(!verifiedOnly)}
              className="w-11 h-6 rounded-full flex items-center px-0.5 cursor-pointer"
              style={{ background: verifiedOnly ? "var(--brand)" : "var(--border-2)", transition: "all 0.2s" }}>
              <div className="w-5 h-5 rounded-full bg-white" style={{ transition: "transform 0.2s", transform: verifiedOnly ? "translateX(20px)" : "translateX(0)" }} />
            </button>
          </div>
          {hasFilters && (
            <button onClick={clearFilters} className="text-[12px] font-bold cursor-pointer" style={{ color: "#DC2626" }}>Clear all filters</button>
          )}
        </div>
      )}

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
          <p className="text-[15px] font-bold mb-2" style={{ color: "var(--text-1)" }}>No profiles found</p>
          <p className="text-[12px] mb-4" style={{ color: "var(--text-3)" }}>Try adjusting your search or filters.</p>
          {hasFilters && <Button variant="secondary" onClick={clearFilters}>Clear all filters</Button>}
        </div>
      )}

      {/* Results */}
      {!loading && people.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {people.map(p => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <PersonCard p={p} />
            </motion.div>
          ))}
        </div>
      )}
    </main>
  );
};

export default Explore;

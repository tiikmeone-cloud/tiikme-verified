import { storageImageUrl } from "@/lib/imageTransform";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Search, X, MapPin, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  student: { bg: "rgba(109,40,217,0.12)", text: "#6D28D9" },
  professional: { bg: "rgba(22,101,52,0.12)", text: "#166534" },
  hr: { bg: "rgba(194,65,12,0.12)", text: "#C2410C" },
  government: { bg: "rgba(217,119,6,0.12)", text: "#D97706" },
  doctor: { bg: "rgba(14,116,144,0.12)", text: "#0E7490" },
  faculty: { bg: "rgba(146,64,14,0.12)", text: "#92400E" },
  skilled_trade: { bg: "rgba(194,65,12,0.12)", text: "#C2410C" },
  aspirant: { bg: "rgba(55,65,81,0.12)", text: "#374151" },
  builder: { bg: "rgba(124,58,237,0.12)", text: "#7C3AED" },
};

const ORG_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  company: { bg: "rgba(29,78,216,0.12)", text: "#1D4ED8" },
  education: { bg: "rgba(29,78,216,0.12)", text: "#1D4ED8" },
  hospital: { bg: "rgba(190,18,60,0.12)", text: "#BE123C" },
  government: { bg: "rgba(21,128,61,0.12)", text: "#15803D" },
  ngo: { bg: "rgba(109,40,217,0.12)", text: "#6D28D9" },
  individual: { bg: "rgba(217,119,6,0.12)", text: "#D97706" },
};

const FILTER_TABS = ["All", "People", "Companies", "Colleges", "Hospitals", "Government", "NGO"];
const FILTER_TYPE_MAP: Record<string, string> = {
  Companies: "company", Colleges: "education", Hospitals: "hospital", Government: "government", NGO: "ngo",
};

interface ProfileResult {
  id: string; full_name: string | null; username: string | null; avatar_url: string | null;
  role: string | null; headline: string | null; institution_name: string | null;
  location_city: string | null; is_verified: boolean | null; activity_score: number | null;
}

function PersonCard({ p, strandStatus, onStrand }: { p: ProfileResult; strandStatus: string; onStrand: () => void }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const name = p.full_name || p.username || "User";
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const role = p.role || "student";
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1).replace(/_/g, " ");
  const colors = ROLE_COLORS[role] || { bg: "rgba(107,112,148,0.12)", text: "#6B7094" };

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="glass-light cursor-pointer flex flex-col items-center text-center"
      style={{ padding: 16, borderRadius: 20, height: 230, overflow: "hidden" }}
      onClick={() => navigate(`/app/profile/${p.id}`)}>
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-[13px] font-bold shrink-0 overflow-hidden"
        style={{ backgroundColor: colors.text, color: "#fff", border: "2px solid rgba(255,255,255,0.30)", boxShadow: "0 0 12px rgba(26,26,78,0.08)" }}>
        {p.avatar_url ? <img src={storageImageUrl(p.avatar_url, "avatar")} alt="" className="w-full h-full object-cover" /> : initials}
      </div>
      <p className="text-[15px] font-semibold leading-tight w-full mt-2.5" style={{ color: "#1A1A2E", maxHeight: 40, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{name}</p>
      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full mt-1 shrink-0" style={{ background: colors.bg, color: colors.text }}>{roleLabel}</span>
      {p.location_city && (
        <p className="text-[12px] truncate w-full mt-1.5 flex items-center justify-center gap-1" style={{ color: "#6B7094" }}>
          <MapPin className="w-3 h-3 shrink-0" /> {p.location_city}
        </p>
      )}
      <div className="mt-auto w-full pt-2" style={{ flexShrink: 0 }}>
        {user?.id !== p.id && (
          <button type="button"
            disabled={strandStatus !== "none"}
            onClick={(e) => { e.stopPropagation(); onStrand(); }}
            className="w-full h-9 rounded-xl text-[12px] font-bold transition-all duration-200"
            style={
              strandStatus === "accepted"
                ? { background: "rgba(52,199,89,0.12)", color: "#34C759", border: "1px solid rgba(52,199,89,0.25)", cursor: "default" }
                : strandStatus === "pending"
                ? { background: "rgba(232,115,58,0.12)", color: "#E8733A", border: "1px solid rgba(232,115,58,0.25)", cursor: "default" }
                : { background: "rgba(255,255,255,0.20)", backdropFilter: "blur(12px)", color: "#1A1A2E", border: "1px solid rgba(255,255,255,0.25)", cursor: "pointer" }
            }>
            {strandStatus === "accepted" ? "Connected ✓" : strandStatus === "pending" ? "Requested →" : "Connect"}
          </button>
        )}
      </div>
    </motion.article>
  );
}

function OrgCard({ org }: { org: any }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [following, setFollowing] = useState(false);
  const initials = (org.name || "?").slice(0, 2).toUpperCase();
  const typeColors = ORG_TYPE_COLORS[org.type] || { bg: "rgba(107,112,148,0.12)", text: "#6B7094" };
  const typeLabel = (org.type || "org").charAt(0).toUpperCase() + (org.type || "org").slice(1);

  const toggleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    if (following) {
      await supabase.from("org_followers").delete().eq("org_id", org.id).eq("user_id", user.id);
      setFollowing(false);
    } else {
      await supabase.from("org_followers").insert({ org_id: org.id, user_id: user.id });
      setFollowing(true);
    }
  };

  useEffect(() => {
    if (!user) return;
    supabase.from("org_followers").select("id").eq("org_id", org.id).eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (data) setFollowing(true);
    });
  }, [org.id, user?.id]);

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="glass-light cursor-pointer flex flex-col items-center text-center"
      style={{ padding: 16, borderRadius: 20, height: 230, overflow: "hidden" }}
      onClick={() => navigate(`/org/${org.slug}`)}>
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-[12px] font-bold shrink-0 overflow-hidden"
        style={{ background: org.logo_url ? "rgba(255,255,255,0.50)" : "#E8733A", color: org.logo_url ? undefined : "#fff", border: "2px solid rgba(255,255,255,0.30)", boxShadow: "0 0 12px rgba(26,26,78,0.08)" }}>
        {org.logo_url ? <img src={storageImageUrl(org.logo_url, "avatar")} alt="" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} /> : initials}
      </div>
      <p className="text-[15px] font-semibold leading-tight w-full mt-2.5" style={{ color: "#1A1A2E", maxHeight: 40, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{org.name}</p>
      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full mt-1 shrink-0" style={{ background: typeColors.bg, color: typeColors.text }}>{typeLabel}</span>
      {org.city && (
        <p className="text-[12px] truncate w-full mt-1 flex items-center justify-center gap-1" style={{ color: "#6B7094" }}>
          <MapPin className="w-3 h-3 shrink-0" /> {org.city}
        </p>
      )}
      {(org.followers_count || 0) > 0 && <p className="text-[12px] mt-0.5" style={{ color: "#6B7094" }}>{org.followers_count} followers</p>}
      <div className="mt-auto w-full pt-2" style={{ flexShrink: 0 }}>
        <button type="button" onClick={toggleFollow}
          className="w-full h-9 rounded-xl text-[12px] font-bold transition-all duration-200"
          style={following
            ? { background: "rgba(52,199,89,0.12)", color: "#34C759", border: "1px solid rgba(52,199,89,0.25)", cursor: "pointer" }
            : { background: "linear-gradient(135deg, #E8733A, #FF6B9D)", color: "#fff", border: "none", cursor: "pointer", boxShadow: "0 4px 16px rgba(232,115,58,0.25)" }
          }>
          {following ? "Following ✓" : "Follow"}
        </button>
      </div>
    </motion.article>
  );
}

const SectionHeader = ({ title, count }: { title: string; count: number }) => (
  <div className="flex items-center justify-between mb-3">
    <div className="flex items-center gap-2">
      <div className="w-[3px] h-5 rounded-sm" style={{ background: "#E8733A" }} />
      <h2 className="text-[16px] font-semibold" style={{ color: "#1A1A2E" }}>{title}</h2>
    </div>
    <span className="text-[12px] font-medium" style={{ color: "#6B7094" }}>{count}</span>
  </div>
);

const Explore = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [focused, setFocused] = useState(false);
  const mountedRef = useRef(true);

  const [people, setPeople] = useState<ProfileResult[]>([]);
  const [orgs, setOrgs] = useState<any[]>([]);
  const [strandMap, setStrandMap] = useState<Record<string, string>>({});

  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: strands } = await supabase.from("strands")
        .select("requester_id, receiver_id, status")
        .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`);
      const sMap: Record<string, string> = {};
      (strands || []).forEach(s => {
        const otherId = s.requester_id === user.id ? s.receiver_id : s.requester_id;
        if (otherId) sMap[otherId] = s.status || "pending";
      });
      setStrandMap(sMap);

      const showPeople = activeFilter === "All" || activeFilter === "People";
      const showOrgs = activeFilter !== "People";

      if (showPeople) {
        let q = supabase.from("profiles")
          .select("id, full_name, username, avatar_url, role, headline, institution_name, location_city, is_verified, activity_score")
          .eq("is_public", true).not("full_name", "is", null)
          .neq("id", user.id)
          .order("activity_score", { ascending: false }).limit(50);
        if (search.trim().length >= 2) {
          q = q.or(`full_name.ilike.%${search}%,username.ilike.%${search}%,institution_name.ilike.%${search}%`);
        }
        const { data } = await q;
        if (mountedRef.current) setPeople(data || []);
      } else { setPeople([]); }

      if (showOrgs) {
        let oq = supabase.from("organizations")
          .select("id, name, slug, type, subtype, logo_url, city, state, is_verified, followers_count")
          .order("followers_count", { ascending: false }).limit(30);
        if (search.trim().length >= 2) {
          oq = oq.or(`name.ilike.%${search}%,city.ilike.%${search}%`);
        }
        const orgTypeFilter = FILTER_TYPE_MAP[activeFilter];
        if (orgTypeFilter) oq = oq.eq("type", orgTypeFilter);
        const { data } = await oq;
        if (mountedRef.current) setOrgs(data || []);
      } else { setOrgs([]); }
    } catch (err) { console.warn("[Explore] fetch error:", err); }
    if (mountedRef.current) setLoading(false);
  }, [user, search, activeFilter]);

  useEffect(() => {
    const t = setTimeout(fetchAll, 300);
    return () => clearTimeout(t);
  }, [fetchAll]);

  const handleStrand = async (personId: string) => {
    if (!user) return;
    await supabase.from("strands").insert({ requester_id: user.id, receiver_id: personId });
    setStrandMap(prev => ({ ...prev, [personId]: "pending" }));
    toast.success("Request sent");
  };

  return (
    <main className="max-w-[1100px] mx-auto px-4 md:px-6 py-4 md:py-7">
      {/* Search bar */}
      <div className="relative mb-4">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: "#6B7094" }} />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          placeholder="Search people, companies, colleges..."
          className="w-full outline-none transition-all duration-200"
          style={{
            height: 48, borderRadius: 20, paddingLeft: 48, paddingRight: 56, fontSize: 14,
            background: "rgba(255,255,255,0.20)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
            border: focused ? "1px solid rgba(232,115,58,0.40)" : "1px solid rgba(255,255,255,0.30)",
            boxShadow: focused ? "0 0 24px rgba(232,115,58,0.12)" : "none",
            color: "#1A1A2E",
          }} />
        {search && (
          <button type="button" onClick={() => setSearch("")} className="absolute right-14 top-1/2 -translate-y-1/2 cursor-pointer" style={{ color: "#6B7094" }}>
            <X className="w-4 h-4" />
          </button>
        )}
        <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200"
          style={{ background: "rgba(255,255,255,0.20)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.25)" }}>
          <Filter className="w-4 h-4" style={{ color: "#E8733A" }} />
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-6 pb-1">
        {FILTER_TABS.map(tab => (
          <button type="button" key={tab} onClick={() => setActiveFilter(tab)}
            className="shrink-0 px-5 py-2 rounded-[20px] text-[13px] font-semibold transition-all duration-200"
            style={activeFilter === tab
              ? { background: "linear-gradient(135deg, #E8733A, #FF6B9D)", color: "#fff", border: "none", boxShadow: "0 4px 16px rgba(232,115,58,0.30)", cursor: "pointer" }
              : { background: "rgba(255,255,255,0.20)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.25)", color: "#1A1A2E", cursor: "pointer" }
            }
            onMouseEnter={e => { if (activeFilter !== tab) e.currentTarget.style.background = "rgba(255,255,255,0.35)"; }}
            onMouseLeave={e => { if (activeFilter !== tab) e.currentTarget.style.background = "rgba(255,255,255,0.20)"; }}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading && (
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="rounded-[20px] glass-skeleton" style={{ height: 230 }} />
          ))}
        </div>
      )}

      {!loading && (
        <>
          {people.length > 0 && (
            <section className="mb-8">
              <SectionHeader title="People Like You" count={people.length} />
              <div className="grid gap-3 grid-cols-2 md:grid-cols-3" style={{ alignItems: "start" }}>
                {people.map(p => (
                  <PersonCard key={p.id} p={p} strandStatus={strandMap[p.id] || "none"} onStrand={() => handleStrand(p.id)} />
                ))}
              </div>
            </section>
          )}

          {orgs.length > 0 && (
            <section className="mb-8">
              <SectionHeader title="Suggested Organisations" count={orgs.length} />
              <div className="grid gap-3 grid-cols-2 md:grid-cols-3" style={{ alignItems: "start" }}>
                {orgs.map(org => (
                  <OrgCard key={org.id} org={org} />
                ))}
              </div>
            </section>
          )}

          {people.length === 0 && orgs.length === 0 && (
            <div className="text-center py-16">
              <Search className="w-12 h-12 mx-auto mb-3" style={{ color: "#6B7094" }} />
              <p className="text-[15px] font-bold mb-2" style={{ color: "#1A1A2E" }}>No results found</p>
              <p className="text-[13px]" style={{ color: "#6B7094" }}>Try a different search term or filter</p>
            </div>
          )}
        </>
      )}
    </main>
  );
};

export default Explore;

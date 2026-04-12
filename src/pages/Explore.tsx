import { storageImageUrl } from "@/lib/imageTransform";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Search, X, Building2, Users, MapPin, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  student: { bg: "#EDE9FE", text: "#6D28D9" },
  professional: { bg: "#DCFCE7", text: "#166534" },
  hr: { bg: "#FFF3EC", text: "#C2410C" },
  government: { bg: "#FEF3C7", text: "#D97706" },
  doctor: { bg: "#ECFDF5", text: "#0E7490" },
  faculty: { bg: "#FFF7ED", text: "#92400E" },
  skilled_trade: { bg: "#FFF3EC", text: "#C2410C" },
  aspirant: { bg: "#F3F4F6", text: "#374151" },
  builder: { bg: "#EDE9FE", text: "#7C3AED" },
};

const ORG_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  company: { bg: "#FFF3EC", text: "#C2410C" },
  education: { bg: "#EFF6FF", text: "#1D4ED8" },
  hospital: { bg: "#FFF1F2", text: "#BE123C" },
  government: { bg: "#F0FDF4", text: "#15803D" },
  ngo: { bg: "#FAF5FF", text: "#6D28D9" },
  individual: { bg: "#FFFBEB", text: "#D97706" },
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
  const colors = ROLE_COLORS[role] || { bg: "#F3F4F6", text: "#6B7280" };

  return (
    <article
      className="rounded-xl p-4 cursor-pointer flex flex-col items-center text-center transition-all hover:-translate-y-0.5"
      style={{ background: "#fff", border: "1px solid #F0E8E0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", height: 220, overflow: "hidden" }}
      onClick={() => navigate(`/app/profile/${p.id}`)}>
      <div className="w-16 h-16 rounded-full flex items-center justify-center text-[14px] font-bold text-white shrink-0 overflow-hidden mb-2.5"
        style={{ backgroundColor: colors.text }}>
        {p.avatar_url ? <img src={storageImageUrl(p.avatar_url, "avatar")} alt="" className="w-full h-full object-cover" /> : initials}
      </div>
      <p className="text-[15px] font-semibold leading-tight w-full" style={{ color: "#1A1A1A", maxHeight: 40, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{name}</p>
      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full mt-1 shrink-0" style={{ background: colors.bg, color: colors.text }}>{roleLabel}</span>
      {p.location_city && (
        <p className="text-[12px] truncate w-full mt-1.5 flex items-center justify-center gap-1" style={{ color: "#9CA3AF" }}>
          <MapPin className="w-3 h-3 shrink-0" /> {p.location_city}
        </p>
      )}
      <div className="mt-auto w-full pt-2" style={{ flexShrink: 0 }}>
        {user?.id !== p.id && (
          <button type="button"
            disabled={strandStatus !== "none"}
            onClick={(e) => { e.stopPropagation(); onStrand(); }}
            className="w-full h-9 rounded-xl text-[12px] font-bold"
            style={
              strandStatus === "accepted" ? { background: "transparent", color: "#16A34A", border: "1.5px solid #16A34A", cursor: "default" }
              : strandStatus === "pending" ? { background: "transparent", color: "#E8580A", border: "1.5px solid #E8580A", cursor: "default" }
              : { background: "#E8580A", color: "#fff", border: "none", cursor: "pointer" }
            }>
            {strandStatus === "accepted" ? "Connected ✓" : strandStatus === "pending" ? "Requested →" : "Connect"}
          </button>
        )}
      </div>
    </article>
  );
}

function OrgCard({ org }: { org: any }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [following, setFollowing] = useState(false);
  const initials = (org.name || "?").slice(0, 2).toUpperCase();
  const typeColors = ORG_TYPE_COLORS[org.type] || { bg: "#F3F4F6", text: "#6B7280" };
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
    <article
      className="rounded-xl p-4 cursor-pointer flex flex-col items-center text-center transition-all hover:-translate-y-0.5"
      style={{ background: "#fff", border: "1px solid #F0E8E0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", height: 220, overflow: "hidden" }}
      onClick={() => navigate(`/org/${org.slug}`)}>
      <div className="w-14 h-14 rounded-full flex items-center justify-center text-[12px] font-bold text-white shrink-0 overflow-hidden mb-2.5"
        style={{ background: org.logo_url ? "#fff" : "#E8580A", border: org.logo_url ? "2px solid #F0E8E0" : "none", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
        {org.logo_url ? <img src={org.logo_url} alt="" className="w-full h-full object-cover" /> : initials}
      </div>
      <p className="text-[15px] font-semibold leading-tight w-full" style={{ color: "#1A1A1A", maxHeight: 40, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{org.name}</p>
      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full mt-1 shrink-0" style={{ background: typeColors.bg, color: typeColors.text }}>{typeLabel}</span>
      {org.city && (
        <p className="text-[12px] truncate w-full mt-1 flex items-center justify-center gap-1" style={{ color: "#9CA3AF" }}>
          <MapPin className="w-3 h-3 shrink-0" /> {org.city}
        </p>
      )}
      {(org.followers_count || 0) > 0 && <p className="text-[12px] mt-0.5" style={{ color: "#9CA3AF" }}>{org.followers_count} followers</p>}
      <div className="mt-auto w-full pt-2" style={{ flexShrink: 0 }}>
        <button type="button" onClick={toggleFollow}
          className="w-full h-9 rounded-xl text-[12px] font-bold"
          style={following
            ? { background: "transparent", color: "#16A34A", border: "1.5px solid #16A34A", cursor: "pointer" }
            : { background: "#E8580A", color: "#fff", border: "none", cursor: "pointer" }
          }>
          {following ? "Following ✓" : "Follow"}
        </button>
      </div>
    </article>
  );
}

const SectionHeader = ({ title, count }: { title: string; count: number }) => (
  <div className="flex items-center justify-between mb-3">
    <div className="flex items-center gap-2">
      <div className="w-1 h-5 rounded-full" style={{ background: "#E8580A" }} />
      <h2 className="text-[16px] font-semibold" style={{ color: "#1A1A1A" }}>{title}</h2>
    </div>
    <span className="text-[12px] font-medium" style={{ color: "#9CA3AF" }}>{count}</span>
  </div>
);

const Explore = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [loading, setLoading] = useState(true);
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
      } else {
        setPeople([]);
      }

      if (showOrgs) {
        let oq = supabase.from("organizations")
          .select("id, name, slug, type, subtype, logo_url, city, state, is_verified, followers_count")
          .order("followers_count", { ascending: false }).limit(30);
        if (search.trim().length >= 2) {
          oq = oq.or(`name.ilike.%${search}%,city.ilike.%${search}%`);
        }
        const orgTypeFilter = FILTER_TYPE_MAP[activeFilter];
        if (orgTypeFilter) {
          oq = oq.eq("type", orgTypeFilter);
        }
        const { data } = await oq;
        if (mountedRef.current) setOrgs(data || []);
      } else {
        setOrgs([]);
      }
    } catch (err) {
      console.warn("[Explore] fetch error:", err);
    }
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
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: "#9CA3AF" }} />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search people, companies, colleges, hospitals..."
          className="w-full h-14 rounded-full pl-14 pr-14 text-[14px] outline-none"
          style={{ background: "#fff", color: "#1A1A1A", border: "1.5px solid #F0E8E0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }} />
        {search && (
          <button type="button" onClick={() => setSearch("")} className="absolute right-14 top-1/2 -translate-y-1/2 cursor-pointer" style={{ color: "#9CA3AF" }}>
            <X className="w-4 h-4" />
          </button>
        )}
        <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "#FFF3EC" }}>
          <Filter className="w-4 h-4" style={{ color: "#E8580A" }} />
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-6 pb-1">
        {FILTER_TABS.map(tab => (
          <button type="button" key={tab} onClick={() => setActiveFilter(tab)}
            className="shrink-0 h-9 px-4 rounded-full text-[13px] font-semibold"
            style={{
              background: activeFilter === tab ? "#E8580A" : "#fff",
              color: activeFilter === tab ? "#fff" : "#374151",
              border: activeFilter === tab ? "none" : "1px solid #F0E8E0",
              cursor: "pointer",
            }}>
            {tab}
          </button>
        ))}
      </div>

      {loading && (
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
          {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="rounded-xl animate-pulse" style={{ height: 220, background: "#F3F4F6" }} />)}
        </div>
      )}

      {!loading && (
        <>
          {people.length > 0 && (
            <section className="mb-8">
              <SectionHeader title="People Like You" count={people.length} />
              <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
                {people.map(p => (
                  <motion.div key={p.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
                    <PersonCard p={p} strandStatus={strandMap[p.id] || "none"} onStrand={() => handleStrand(p.id)} />
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {orgs.length > 0 && (
            <section className="mb-8">
              <SectionHeader title="Suggested Organisations" count={orgs.length} />
              <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
                {orgs.map(org => (
                  <motion.div key={org.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
                    <OrgCard org={org} />
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {people.length === 0 && orgs.length === 0 && (
            <div className="text-center py-16">
              <Search className="w-12 h-12 mx-auto mb-3" style={{ color: "#9CA3AF" }} />
              <p className="text-[15px] font-bold mb-2" style={{ color: "#1A1A1A" }}>No results found</p>
              <p className="text-[13px]" style={{ color: "#9CA3AF" }}>Try a different search term or filter</p>
            </div>
          )}
        </>
      )}
    </main>
  );
};

export default Explore;

import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Search, X, Shield, Building2, Users, Plus, Lock, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const ROLE_COLORS: Record<string, string> = {
  student: "#4F46E5", professional: "#0369A1", government: "#166534",
  doctor: "#0E7490", faculty: "#92400E", skilled_trade: "#C2410C",
  hr: "#6B21A8", aspirant: "#374151", builder: "#7C3AED",
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
  const color = ROLE_COLORS[role] || "#6B7280";

  return (
    <article className="glass-liquid glass-liquid-hover rounded-xl p-3 cursor-pointer
      min-w-[160px] w-[160px] md:min-w-0 md:w-auto shrink-0 md:shrink
      flex flex-col md:flex-row items-center md:items-center gap-2 md:gap-3"
      onClick={() => navigate(`/app/profile/${p.id}`)}>
      <div className="w-11 h-11 rounded-full flex items-center justify-center text-[12px] font-bold text-white shrink-0 overflow-hidden" style={{ backgroundColor: color }}>
        {p.avatar_url ? <img src={p.avatar_url} alt="" className="w-full h-full object-cover" /> : initials}
      </div>
      <div className="flex-1 min-w-0 text-center md:text-left">
        <div className="flex items-center justify-center md:justify-start gap-1.5">
          <p className="text-[13px] font-bold truncate" style={{ color: "var(--text-1)" }}>{name}</p>
          {p.is_verified && <Shield className="w-3 h-3 shrink-0" style={{ color: "#F59E0B" }} />}
        </div>
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${color}1F`, color }}>{roleLabel}</span>
        <p className="text-[11px] truncate" style={{ color: "var(--text-3)" }}>{[p.institution_name, p.location_city].filter(Boolean).join(" · ") || "—"}</p>
      </div>
      {user?.id !== p.id && (
        <Button
          variant={strandStatus === "accepted" ? "ghost" : strandStatus === "pending" ? "ghost" : "secondary"}
          size="sm" className="shrink-0 h-8 md:h-7 text-[11px] active:scale-95 w-full md:w-auto min-h-[36px] md:min-h-0"
          disabled={strandStatus !== "none"}
          onClick={(e) => { e.stopPropagation(); onStrand(); }}
          style={strandStatus === "accepted" ? { color: "#10B981" } : strandStatus === "pending" ? { color: "var(--text-3)" } : {}}>
          {strandStatus === "accepted" ? "Connected" : strandStatus === "pending" ? "Requested" : "Strand"}
        </Button>
      )}
    </article>
  );
}

function OrgCard({ org }: { org: any }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [following, setFollowing] = useState(false);
  const initials = (org.name || "?").slice(0, 2).toUpperCase();

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
    <article className="glass-liquid glass-liquid-hover rounded-xl p-3 flex items-center gap-3 cursor-pointer"
      onClick={() => navigate(`/org/${org.slug}`)}>
      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-[11px] font-bold text-white shrink-0 overflow-hidden" style={{ background: "var(--brand)" }}>
        {org.logo_url ? <img src={org.logo_url} alt="" className="w-full h-full object-cover" /> : initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-[13px] font-bold truncate" style={{ color: "var(--text-1)" }}>{org.name}</p>
          {org.is_verified && <Shield className="w-3 h-3 shrink-0" style={{ color: "#F59E0B" }} />}
        </div>
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "var(--surface-2)", color: "var(--text-3)" }}>
          {(org.type || "org").charAt(0).toUpperCase() + (org.type || "org").slice(1)}
        </span>
        <p className="text-[11px] truncate" style={{ color: "var(--text-3)" }}>
          {[org.city, org.state].filter(Boolean).join(", ") || "—"}
          {org.followers_count ? ` · ${org.followers_count} followers` : ""}
        </p>
      </div>
      <Button variant={following ? "ghost" : "secondary"} size="sm" className="shrink-0 h-7 text-[11px] active:scale-95"
        onClick={toggleFollow}>
        {following ? "Following" : "Follow"}
      </Button>
    </article>
  );
}

/* Section wrapper — horizontal scroll on mobile, grid on desktop */
const ExploreSection = ({ title, icon: Icon, children, count, onViewAll }: { title: string; icon: any; children: React.ReactNode; count: number; onViewAll?: () => void }) => {
  if (count === 0) return null;
  return (
    <section className="mb-6 md:mb-8">
      <div className="flex items-center justify-between mb-3 px-4 md:px-0">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 rounded-full" style={{ background: "var(--brand)" }} />
          <Icon className="w-4 h-4" style={{ color: "var(--brand)" }} />
          <h2 className="text-[15px] font-extrabold" style={{ color: "var(--text-1)" }}>{title}</h2>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: "var(--surface-2)", color: "var(--text-3)" }}>{count}</span>
        </div>
        {onViewAll && (
          <button type="button" onClick={onViewAll} className="flex items-center gap-0.5 text-[12px] font-bold cursor-pointer" style={{ color: "var(--brand)" }}>
            View all <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {/* Mobile: horizontal scroll; Desktop: grid */}
      <div className="flex md:hidden gap-2 overflow-x-auto scrollbar-hide px-4 pb-2">
        {children}
      </div>
      <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
        {children}
      </div>
    </section>
  );
};

const Explore = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  // Data
  const [sameOrg, setSameOrg] = useState<ProfileResult[]>([]);
  const [sameRole, setSameRole] = useState<ProfileResult[]>([]);
  const [nearYou, setNearYou] = useState<ProfileResult[]>([]);
  const [allPeople, setAllPeople] = useState<ProfileResult[]>([]);
  const [orgs, setOrgs] = useState<any[]>([]);
  const [strandMap, setStrandMap] = useState<Record<string, string>>({});

  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    // Fetch strands for current user
    const { data: strands, error: strandsErr } = await supabase.from("strands")
      .select("requester_id, receiver_id, status")
      .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`);
    if (strandsErr) console.warn("[Explore] strands fetch failed:", strandsErr.message);

    const sMap: Record<string, string> = {};
    (strands || []).forEach(s => {
      const otherId = s.requester_id === user.id ? s.receiver_id : s.requester_id;
      if (otherId) sMap[otherId] = s.status || "pending";
    });
    setStrandMap(sMap);

    // Fetch user's work items for org matching
    const { data: myItems, error: itemsErr } = await supabase.from("work_items")
      .select("company_name, institution_name_edu, institution_name")
      .eq("owner_id", user.id);
    if (itemsErr) console.warn("[Explore] work_items fetch failed:", itemsErr.message);

    const myOrgNames = new Set<string>();
    (myItems || []).forEach(item => {
      if (item.company_name) myOrgNames.add(item.company_name.toLowerCase());
      if (item.institution_name_edu) myOrgNames.add(item.institution_name_edu.toLowerCase());
      if (item.institution_name) myOrgNames.add(item.institution_name.toLowerCase());
    });

    // Fetch people
    let peopleQuery = supabase.from("profiles")
      .select("id, full_name, username, avatar_url, role, headline, institution_name, location_city, is_verified, activity_score")
      .eq("is_public", true).not("full_name", "is", null)
      .neq("id", user.id)
      .order("activity_score", { ascending: false }).limit(50);

    if (search.trim().length >= 2) {
      peopleQuery = peopleQuery.or(`full_name.ilike.%${search}%,username.ilike.%${search}%,institution_name.ilike.%${search}%`);
    }

    const [peopleRes, orgsRes] = await Promise.allSettled([
      peopleQuery,
      supabase.from("organizations")
        .select("id, name, slug, type, subtype, logo_url, city, state, is_verified, followers_count")
        .order("followers_count", { ascending: false }).limit(20),
    ]);

    if (!mountedRef.current) return;

    if (peopleRes.status === "rejected") console.warn("[Explore] people fetch failed:", peopleRes.reason);
    if (orgsRes.status === "rejected") console.warn("[Explore] orgs fetch failed:", orgsRes.reason);
    const people = (peopleRes.status === "fulfilled" ? (peopleRes.value as any).data : []) as ProfileResult[] || [];
    setAllPeople(people);

    // Categorize people
    const fromOrg: ProfileResult[] = [];
    const byRole: ProfileResult[] = [];
    const nearby: ProfileResult[] = [];
    const seenIds = new Set<string>();

    people.forEach(p => {
      // Same org: check if their institution matches any of our orgs
      if (p.institution_name && myOrgNames.has(p.institution_name.toLowerCase()) && !seenIds.has(p.id)) {
        fromOrg.push(p);
        seenIds.add(p.id);
      }
    });

    people.forEach(p => {
      if (seenIds.has(p.id)) return;
      if (p.role === profile?.role) {
        byRole.push(p);
        seenIds.add(p.id);
      }
    });

    people.forEach(p => {
      if (seenIds.has(p.id)) return;
      if (profile?.location_city && p.location_city &&
        p.location_city.toLowerCase() === profile.location_city.toLowerCase()) {
        nearby.push(p);
        seenIds.add(p.id);
      }
    });

    setSameOrg(fromOrg.slice(0, 8));
    setSameRole(byRole.slice(0, 8));
    setNearYou(nearby.slice(0, 8));
    setOrgs(orgsRes.status === "fulfilled" ? (orgsRes.value as any).data || [] : []);
    setLoading(false);
  }, [user, profile, search]);

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

  const renderPeople = (list: ProfileResult[]) =>
    list.map(p => (
      <motion.div key={p.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
        <PersonCard p={p} strandStatus={strandMap[p.id] || "none"} onStrand={() => handleStrand(p.id)} />
      </motion.div>
    ));

  return (
    <main className="max-w-[1100px] mx-auto px-0 md:px-6 py-4 md:py-7">
      {/* Search */}
      <div className="flex gap-2 mb-5 md:mb-6 px-4 md:px-0">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: "var(--text-3)" }} />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search people, organizations..."
            className="w-full h-[48px] md:h-[52px] glass-input pl-[52px] pr-12 text-[14px] outline-none" style={{ color: "var(--text-1)" }} />
          {search && <button type="button" onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer w-10 h-10 flex items-center justify-center" style={{ color: "var(--text-3)" }}><X className="w-4 h-4" /></button>}
        </div>
      </div>

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
          {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="glass-liquid rounded-xl p-3 animate-pulse h-[72px]" />)}
        </div>
      )}

      {!loading && (
        <>
          {/* From Your Organisation */}
          <ExploreSection title="From Your Organisation" icon={Building2} count={sameOrg.length}>
            {renderPeople(sameOrg)}
          </ExploreSection>

          {/* People Like You */}
          <ExploreSection title="People Like You" icon={Users} count={sameRole.length}>
            {renderPeople(sameRole)}
          </ExploreSection>

          {/* Near You */}
          <ExploreSection title="Near You" icon={Users} count={nearYou.length}>
            {renderPeople(nearYou)}
          </ExploreSection>

          {/* Organisations You May Follow */}
          <ExploreSection title="Organisations You May Follow" icon={Building2} count={orgs.length}>
            {orgs.map(org => (
              <motion.div key={org.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
                <OrgCard org={org} />
              </motion.div>
            ))}
          </ExploreSection>

          {/* Show all people if no sections matched */}
          {sameOrg.length === 0 && sameRole.length === 0 && nearYou.length === 0 && allPeople.length > 0 && (
            <ExploreSection title="Discover People" icon={Users} count={allPeople.length}>
              {renderPeople(allPeople)}
            </ExploreSection>
          )}

          {allPeople.length === 0 && orgs.length === 0 && (
            <div className="text-center py-16">
              <Search className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--text-3)" }} />
              <p className="text-[15px] font-bold mb-2" style={{ color: "var(--text-1)" }}>No results found</p>
              <p className="text-[13px]" style={{ color: "var(--text-3)" }}>Try a different search term</p>
            </div>
          )}

          {/* Create org CTA */}
          <div className="text-center mt-4 mb-8">
            <Button variant="secondary" onClick={() => navigate("/create-organization")} className="gap-2">
              <Plus className="w-4 h-4" /> Create organisation
            </Button>
          </div>
        </>
      )}
    </main>
  );
};

export default Explore;

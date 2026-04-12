import { storageImageUrl } from "@/lib/imageTransform";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Search, X, Shield, Building2, Users, Plus, ChevronRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  student: { bg: "#EDE9FE", text: "#7C3AED" },
  professional: { bg: "#DCFCE7", text: "#16A34A" },
  hr: { bg: "#FFF3EC", text: "#E8580A" },
  government: { bg: "#FEF3C7", text: "#D97706" },
  doctor: { bg: "#ECFDF5", text: "#0E7490" },
  faculty: { bg: "#FFF7ED", text: "#92400E" },
  skilled_trade: { bg: "#FFF3EC", text: "#C2410C" },
  aspirant: { bg: "#F3F4F6", text: "#374151" },
  builder: { bg: "#EDE9FE", text: "#7C3AED" },
};

const ORG_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  company: { bg: "#FFF3EC", text: "#E8580A" },
  education: { bg: "#EFF6FF", text: "#2563EB" },
  hospital: { bg: "#FFF1F2", text: "#E11D48" },
  government: { bg: "#FEF3C7", text: "#D97706" },
  ngo: { bg: "#ECFDF5", text: "#16A34A" },
};

interface ProfileResult {
  id: string; full_name: string | null; username: string | null; avatar_url: string | null;
  role: string | null; headline: string | null; institution_name: string | null;
  location_city: string | null; is_verified: boolean | null; activity_score: number | null;
}

/* ── PERSON CARD — fixed 200px height, vertical layout ── */
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
      className="rounded-xl p-4 cursor-pointer flex flex-col items-center text-center"
      style={{ background: "#fff", border: "1px solid #F0E8E0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", width: 160, height: 200, minWidth: 160 }}
      onClick={() => navigate(`/app/profile/${p.id}`)}>
      <div className="w-16 h-16 rounded-full flex items-center justify-center text-[14px] font-bold text-white shrink-0 overflow-hidden mb-2"
        style={{ backgroundColor: colors.text }}>
        {p.avatar_url ? <img src={storageImageUrl(p.avatar_url, "avatar")} alt="" className="w-full h-full object-cover" /> : initials}
      </div>
      <p className="text-[15px] font-semibold leading-tight line-clamp-2 w-full" style={{ color: "#1A1A1A" }}>{name}</p>
      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full mt-1 shrink-0" style={{ background: colors.bg, color: colors.text }}>{roleLabel}</span>
      {p.location_city && (
        <p className="text-[12px] truncate w-full mt-0.5 flex items-center justify-center gap-1" style={{ color: "#9CA3AF" }}>
          <MapPin className="w-3 h-3 shrink-0" /> {p.location_city}
        </p>
      )}
      <div className="mt-auto w-full pt-1">
        {user?.id !== p.id && (
          <Button
            variant={strandStatus === "accepted" ? "ghost" : strandStatus === "pending" ? "ghost" : "default"}
            size="sm" className="w-full h-8 text-[11px]"
            disabled={strandStatus !== "none"}
            onClick={(e) => { e.stopPropagation(); onStrand(); }}
            style={
              strandStatus === "accepted" ? { background: "rgba(16,185,129,0.08)", color: "#10B981", border: "1px solid rgba(16,185,129,0.2)" }
              : strandStatus === "pending" ? { background: "#F3F4F6", color: "#9CA3AF" }
              : { background: "#E8580A", color: "#fff" }
            }>
            {strandStatus === "accepted" ? "Connected ✓" : strandStatus === "pending" ? "Requested" : "Connect"}
          </Button>
        )}
      </div>
    </article>
  );
}

/* ── ORG CARD — fixed 200px height, vertical layout ── */
function OrgCard({ org }: { org: any }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [following, setFollowing] = useState(false);
  const initials = (org.name || "?").slice(0, 2).toUpperCase();
  const typeColors = ORG_TYPE_COLORS[org.type] || { bg: "#F3F4F6", text: "#6B7280" };

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
      className="rounded-xl p-4 cursor-pointer flex flex-col items-center text-center"
      style={{ background: "#fff", border: "1px solid #F0E8E0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", width: 160, height: 200, minWidth: 160 }}
      onClick={() => navigate(`/org/${org.slug}`)}>
      <div className="w-14 h-14 rounded-full flex items-center justify-center text-[12px] font-bold text-white shrink-0 overflow-hidden mb-2"
        style={{ background: org.logo_url ? "#fff" : "#E8580A", border: org.logo_url ? "2px solid #F0E8E0" : "none", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
        {org.logo_url ? <img src={org.logo_url} alt="" className="w-full h-full object-cover" /> : initials}
      </div>
      <p className="text-[15px] font-semibold leading-tight line-clamp-2 w-full" style={{ color: "#1A1A1A" }}>{org.name}</p>
      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full mt-1 shrink-0" style={{ background: typeColors.bg, color: typeColors.text }}>
        {(org.type || "org").charAt(0).toUpperCase() + (org.type || "org").slice(1)}
      </span>
      {org.city && (
        <p className="text-[12px] truncate w-full mt-0.5 flex items-center justify-center gap-1" style={{ color: "#9CA3AF" }}>
          <MapPin className="w-3 h-3 shrink-0" /> {org.city}
        </p>
      )}
      {org.followers_count > 0 && <p className="text-[12px] mt-0.5" style={{ color: "#9CA3AF" }}>{org.followers_count} followers</p>}
      <div className="mt-auto w-full pt-1">
        <Button variant={following ? "ghost" : "default"} size="sm" className="w-full h-8 text-[11px]"
          onClick={toggleFollow}
          style={following ? { background: "rgba(16,185,129,0.08)", color: "#16A34A", border: "1px solid rgba(16,185,129,0.2)" } : { background: "#E8580A", color: "#fff" }}>
          {following ? "Following ✓" : "Follow"}
        </Button>
      </div>
    </article>
  );
}

/* ── Section ── */
const ExploreSection = ({ title, icon: Icon, children, count }: { title: string; icon: any; children: React.ReactNode; count: number }) => {
  if (count === 0) return null;
  return (
    <section className="mb-6 md:mb-8">
      <div className="flex items-center justify-between mb-3 px-4 md:px-0">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 rounded-full" style={{ background: "#E8580A" }} />
          <Icon className="w-4 h-4" style={{ color: "#E8580A" }} />
          <h2 className="text-[15px] font-extrabold" style={{ color: "#1A1A1A" }}>{title}</h2>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#F3F4F6", color: "#9CA3AF" }}>{count}</span>
        </div>
      </div>
      {/* Mobile: horizontal scroll; Desktop: CSS grid with equal-height rows */}
      <div className="flex md:hidden gap-3 overflow-x-auto scrollbar-hide px-4 pb-2">
        {children}
      </div>
      <div className="hidden md:grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, 160px)" }}>
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

    const { data: strands } = await supabase.from("strands")
      .select("requester_id, receiver_id, status")
      .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`);

    const sMap: Record<string, string> = {};
    (strands || []).forEach(s => {
      const otherId = s.requester_id === user.id ? s.receiver_id : s.requester_id;
      if (otherId) sMap[otherId] = s.status || "pending";
    });
    setStrandMap(sMap);

    const { data: myItems } = await supabase.from("work_items")
      .select("company_name, institution_name_edu, institution_name")
      .eq("owner_id", user.id);

    const myOrgNames = new Set<string>();
    (myItems || []).forEach(item => {
      if (item.company_name) myOrgNames.add(item.company_name.toLowerCase());
      if (item.institution_name_edu) myOrgNames.add(item.institution_name_edu.toLowerCase());
      if (item.institution_name) myOrgNames.add(item.institution_name.toLowerCase());
    });

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

    const people = (peopleRes.status === "fulfilled" ? (peopleRes.value as any).data : []) as ProfileResult[] || [];
    setAllPeople(people);

    const fromOrg: ProfileResult[] = [];
    const byRole: ProfileResult[] = [];
    const nearby: ProfileResult[] = [];
    const seenIds = new Set<string>();

    people.forEach(p => {
      if (p.institution_name && myOrgNames.has(p.institution_name.toLowerCase()) && !seenIds.has(p.id)) {
        fromOrg.push(p); seenIds.add(p.id);
      }
    });
    people.forEach(p => {
      if (seenIds.has(p.id)) return;
      if (p.role === profile?.role) { byRole.push(p); seenIds.add(p.id); }
    });
    people.forEach(p => {
      if (seenIds.has(p.id)) return;
      if (profile?.location_city && p.location_city && p.location_city.toLowerCase() === profile.location_city.toLowerCase()) {
        nearby.push(p); seenIds.add(p.id);
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
      {/* Search bar */}
      <div className="flex gap-2 mb-5 md:mb-6 px-4 md:px-0">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: "#9CA3AF" }} />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search people, companies, colleges..."
            className="w-full h-[52px] rounded-full pl-[52px] pr-12 text-[14px] outline-none"
            style={{ background: "#fff", color: "#1A1A1A", border: "1px solid #F0E8E0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }} />
          {search && <button type="button" onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer w-10 h-10 flex items-center justify-center" style={{ color: "#9CA3AF" }}><X className="w-4 h-4" /></button>}
        </div>
      </div>

      {loading && (
        <div className="grid gap-3 px-4 md:px-0" style={{ gridTemplateColumns: "repeat(auto-fill, 160px)" }}>
          {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="rounded-xl animate-pulse" style={{ width: 160, height: 200, background: "#F3F4F6" }} />)}
        </div>
      )}

      {!loading && (
        <>
          <ExploreSection title="From Your Organisation" icon={Building2} count={sameOrg.length}>{renderPeople(sameOrg)}</ExploreSection>
          <ExploreSection title="People Like You" icon={Users} count={sameRole.length}>{renderPeople(sameRole)}</ExploreSection>
          <ExploreSection title="Near You" icon={Users} count={nearYou.length}>{renderPeople(nearYou)}</ExploreSection>
          <ExploreSection title="Suggested Organisations" icon={Building2} count={orgs.length}>
            {orgs.map(org => (
              <motion.div key={org.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
                <OrgCard org={org} />
              </motion.div>
            ))}
          </ExploreSection>

          {sameOrg.length === 0 && sameRole.length === 0 && nearYou.length === 0 && allPeople.length > 0 && (
            <ExploreSection title="Discover People" icon={Users} count={allPeople.length}>{renderPeople(allPeople)}</ExploreSection>
          )}

          {allPeople.length === 0 && orgs.length === 0 && (
            <div className="text-center py-16">
              <Search className="w-12 h-12 mx-auto mb-3" style={{ color: "#9CA3AF" }} />
              <p className="text-[15px] font-bold mb-2" style={{ color: "#1A1A1A" }}>No results found</p>
              <p className="text-[13px]" style={{ color: "#9CA3AF" }}>Try a different search term</p>
            </div>
          )}

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

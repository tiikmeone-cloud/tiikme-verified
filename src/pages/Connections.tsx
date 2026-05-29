import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { PageSEO } from "@/hooks/usePageSEO";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import AvatarSquare from "@/components/ui/AvatarSquare";
import { Link2, Search, Compass, MoreHorizontal, Clock, UserPlus, UserX, BellOff, Ban, Flag, ChevronDown, Eye } from "lucide-react";
import { toast } from "sonner";
import { sendNotification } from "@/lib/notify";
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { connectionButtonStyle } from "@/hooks/useConnectionStatus";
import VerifiedBadge from "@/components/VerifiedBadge";
import PrimaryTabs from "@/components/filters/PrimaryTabs";
import FilterBar, { useScrollPastThreshold } from "@/components/filters/FilterBar";
import BottomSheet from "@/components/ui/BottomSheet";
import { useFilterFlag, useFilterParam } from "@/lib/useFilterParam";
import { getDisplayFlags, safeDisplayName } from "@/utils/displayProfile";

const ROLE_COLORS: Record<string, string> = {
  student: "#FF5A1F", professional: "#C44A1F", government: "#166534",
  doctor: "#2D7A4F", faculty: "#92400E", skilled_trade: "#C2410C",
  hr: "#B7640A", aspirant: "#6B6B6B", builder: "#FF5A1F",
};

interface ProfileLite {
  id: string; full_name: string | null; avatar_url: string | null; role: string | null;
  role_subtype?: string | null; institution_name: string | null; is_verified?: boolean | null;
  last_active_date?: string | null; updated_at?: string | null;
  display_preference?: string | null;
  currently_working_at?: string | null;
  designation?: string | null;
  headline?: string | null;
}
interface StrandRow {
  id: string; requester_id: string; receiver_id: string; status: string; created_at: string;
  requester?: ProfileLite;
  receiver?: ProfileLite;
}

type TabKey = "all" | "following" | "requests";
type SortKey = "recent_activity" | "alphabetical" | "mutual" | "recently_connected";

const roleLabel = (r: string) => r ? r.charAt(0).toUpperCase() + r.slice(1).replace(/_/g, " ") : "";

function getTimeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const SkeletonRow = () => (
  <div className="glass-card animate-pulse flex items-center gap-3" style={{ padding: 12, borderRadius: 12, height: 72 }}>
    <div style={{ width: 44, height: 44, borderRadius: 10, background: "var(--surface-2)" }} />
    <div className="flex-1 space-y-2">
      <div style={{ height: 12, width: "40%", borderRadius: 6, background: "var(--surface-2)" }} />
      <div style={{ height: 10, width: "65%", borderRadius: 6, background: "var(--border-glass)" }} />
    </div>
    <div style={{ width: 70, height: 32, borderRadius: 8, background: "var(--surface-2)" }} />
  </div>
);

const Connections = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [tab, setTab] = useState<TabKey>("all");
  const [followedOrgs, setFollowedOrgs] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("recent_activity");
  const [sortOpen, setSortOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);
  const scrolled = useScrollPastThreshold(120);

  // URL-backed filters
  const [verifiedOnly, setVerifiedOnly] = useFilterFlag("verified");
  const [withCompany, setWithCompany] = useFilterFlag("with_company");
  const [activeRecent, setActiveRecent] = useFilterFlag("recent");
  const [roleFilter, setRoleFilter] = useFilterParam("role", "");
  const [moreOpen, setMoreOpen] = useState(false);
  const filterCount = (verifiedOnly ? 1 : 0) + (withCompany ? 1 : 0) + (activeRecent ? 1 : 0) + (roleFilter ? 1 : 0);
  const clearAllFilters = () => { setVerifiedOnly(false); setWithCompany(false); setActiveRecent(false); setRoleFilter(null); };

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (openMenuId && menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenMenuId(null);
      if (sortOpen && sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpenMenuId(null); setSortOpen(false); } };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [openMenuId, sortOpen]);

  const fetchStrandsData = useCallback(async () => {
    if (!user) return { connected: [], pendingIncoming: [], pendingSent: [], suggested: [] };
    const [acceptedRes, incomingRes, sentRes] = await Promise.allSettled([
      supabase.from("strands")
        .select("id, requester_id, receiver_id, status, created_at, requester:profiles!strands_requester_id_fkey(id, full_name, avatar_url, role, role_subtype, institution_name, is_verified, last_active_date, updated_at, display_preference, currently_working_at, designation, headline, profession_type), receiver:profiles!strands_receiver_id_fkey(id, full_name, avatar_url, role, role_subtype, institution_name, is_verified, last_active_date, updated_at, display_preference, currently_working_at, designation, headline, profession_type)")
        .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`).eq("status", "accepted"),
      supabase.from("strands")
        .select("id, requester_id, receiver_id, status, created_at, requester:profiles!strands_requester_id_fkey(id, full_name, avatar_url, role, role_subtype, institution_name, is_verified, display_preference, currently_working_at, designation, headline, profession_type)")
        .eq("receiver_id", user.id).eq("status", "pending"),
      supabase.from("strands")
        .select("id, requester_id, receiver_id, status, created_at, receiver:profiles!strands_receiver_id_fkey(id, full_name, avatar_url, role, role_subtype, institution_name, is_verified, display_preference, currently_working_at, designation, headline, profession_type)")
        .eq("requester_id", user.id).eq("status", "pending"),
    ]);
    const accepted = acceptedRes.status === "fulfilled" ? (acceptedRes.value as any).data || [] : [];
    const incomingData = incomingRes.status === "fulfilled" ? (incomingRes.value as any).data || [] : [];
    const sentData = sentRes.status === "fulfilled" ? (sentRes.value as any).data || [] : [];

    const connectedIds = new Set<string>();
    accepted.forEach((s: any) => { connectedIds.add(s.requester_id); connectedIds.add(s.receiver_id); });
    incomingData.forEach((s: any) => connectedIds.add(s.requester_id));
    sentData.forEach((s: any) => connectedIds.add(s.receiver_id));
    connectedIds.add(user.id);

    const { data: suggestedData } = await supabase.from("profiles")
      .select("id, full_name, avatar_url, role, institution_name, location_city, display_preference, role_subtype, currently_working_at, designation, headline")
      .eq("is_public", true)
      .not("id", "in", `(${Array.from(connectedIds).join(",")})`)
      .order("activity_score", { ascending: false }).limit(12);

    return { connected: accepted, pendingIncoming: incomingData, pendingSent: sentData, suggested: suggestedData || [] };
  }, [user]);

  // Load orgs followed by current user
  useEffect(() => {
    if (!user) return;
    supabase.from("org_followers")
      .select("org_id, followed_at, org:organizations(id, name, slug, logo_url, type, sub_type, followers_count)")
      .eq("user_id", user.id)
      .order("followed_at", { ascending: false })
      .then(({ data }) => setFollowedOrgs(data || []));
  }, [user]);

  const qc = useQueryClient();
  const queryKey = ["connections", user?.id];
  const { data: strandsData, isLoading: loading, refetch: fetchStrands } = useQuery({
    queryKey,
    queryFn: fetchStrandsData,
    enabled: !!user,
    staleTime: 0,
  });

  const connected = strandsData?.connected || [];
  const pendingIncoming = strandsData?.pendingIncoming || [];
  const pendingSent = strandsData?.pendingSent || [];
  const suggested = strandsData?.suggested || [];

  const getOther = (s: StrandRow) => s.requester_id === user?.id ? s.receiver : s.requester;

  // Helper: mutate the cached query data without a network round-trip
  const patchCache = (mutator: (d: NonNullable<typeof strandsData>) => typeof strandsData) => {
    qc.setQueryData(queryKey, (old: any) => old ? mutator(old) : old);
  };

  const handleAccept = async (s: StrandRow) => {
    const prev = qc.getQueryData(queryKey);
    // Optimistic: move from pendingIncoming → connected
    patchCache((d) => ({
      ...d,
      pendingIncoming: d.pendingIncoming.filter((x: any) => x.id !== s.id),
      connected: [{ ...s, status: "accepted" }, ...d.connected],
    }));
    const { error } = await supabase.from("strands").update({ status: "accepted" }).eq("id", s.id);
    if (error) { qc.setQueryData(queryKey, prev); toast.error("Couldn't accept — try again"); return; }
    if (user) {
      try { await supabase.rpc("increment_score", { uid: user.id, amount: 3 }); } catch {}
      const otherId = s.requester_id === user.id ? s.receiver_id : s.requester_id;
      try { await supabase.rpc("increment_score", { uid: otherId, amount: 3 }); } catch {}
      sendNotification({
        userId: s.requester_id, actorId: user.id, type: "connection_accepted",
        title: `${profile?.full_name || "Someone"} accepted your connection`,
        actionUrl: `/app/profile/${user.id}`,
      });
    }
    toast.success("Connected!");
  };

  const handleDecline = async (s: StrandRow) => {
    const prev = qc.getQueryData(queryKey);
    patchCache((d) => ({ ...d, pendingIncoming: d.pendingIncoming.filter((x: any) => x.id !== s.id) }));
    const { error } = await supabase.from("strands").update({ status: "declined" }).eq("id", s.id);
    if (error) { qc.setQueryData(queryKey, prev); toast.error("Couldn't decline — try again"); return; }
    toast.info("Declined");
  };

  const handleWithdraw = async (s: StrandRow) => {
    const prev = qc.getQueryData(queryKey);
    patchCache((d) => ({ ...d, pendingSent: d.pendingSent.filter((x: any) => x.id !== s.id) }));
    const { error } = await supabase.from("strands").delete().eq("id", s.id);
    if (error) { qc.setQueryData(queryKey, prev); toast.error("Couldn't withdraw — try again"); return; }
    toast.info("Request withdrawn");
  };

  const handleDisconnect = (s: StrandRow) => {
    const other = getOther(s);
    const name = other?.full_name || "this user";
    toast(`Remove connection with ${name}?`, {
      action: { label: "Disconnect", onClick: async () => {
        const prev = qc.getQueryData(queryKey);
        patchCache((d) => ({ ...d, connected: d.connected.filter((x: any) => x.id !== s.id) }));
        const { error } = await supabase.from("strands").delete().eq("id", s.id);
        if (error) { qc.setQueryData(queryKey, prev); toast.error(error.message); return; }
        toast.success(`Connection with ${name} removed`);
      }},
      cancel: { label: "Cancel", onClick: () => {} },
      duration: 5000,
    });
  };

  const handleMute = async (otherId: string) => {
    if (!user || !otherId) return;
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const { error } = await (supabase as any).frm("user_mutes").upsert({
      muter_id: user.id, muted_id: otherId, expires_at: expires,
    }, { onConflict: "muter_id,muted_id" });
    if (error) { toast.error("Could not mute"); return; }
    toast.success("Muted for 30 days");
  };

  const filteredConnected = useMemo(() => {
    let list = connected.filter(s => getOther(s)?.id !== user?.id);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(s => (getOther(s)?.full_name || "").toLowerCase().includes(q));
    }
    if (verifiedOnly) list = list.filter(s => getOther(s)?.is_verified);
    if (withCompany) list = list.filter(s => !!(getOther(s)?.institution_name || getOther(s)?.currently_working_at));
    if (activeRecent) {
      const week = Date.now() - 7 * 86400000;
      list = list.filter(s => {
        const ts = getOther(s)?.last_active_date || getOther(s)?.updated_at;
        return ts && new Date(ts).getTime() > week;
      });
    }
    if (roleFilter) list = list.filter(s => {
      const other = getOther(s);
      return other?.role === roleFilter || (other as any)?.profession_type === roleFilter;
    });
    list.sort((a, b) => {
      const oa = getOther(a), ob = getOther(b);
      switch (sortBy) {
        case "alphabetical":
          return (oa?.full_name || "").localeCompare(ob?.full_name || "");
        case "recently_connected":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "mutual":
          return new Date(ob?.last_active_date || ob?.updated_at || 0).getTime()
               - new Date(oa?.last_active_date || oa?.updated_at || 0).getTime();
        case "recent_activity":
        default:
          return new Date(ob?.last_active_date || ob?.updated_at || 0).getTime()
               - new Date(oa?.last_active_date || oa?.updated_at || 0).getTime();
      }
    });
    return list;
  }, [connected, search, sortBy, user?.id, verifiedOnly, withCompany, activeRecent, roleFilter]);

  const sortLabels: Record<SortKey, string> = {
    recent_activity: "Recent activity",
    alphabetical: "Alphabetical",
    mutual: "Mutual connections",
    recently_connected: "Recently connected",
  };

  const totalConnections = connected.length;
  const totalRequests = pendingIncoming.length;

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: 16 }}>
      <PageSEO title="My Connections | Tiikme" description="Manage your professional connections and pending requests on Tiikme." noIndex />
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Link2 style={{ width: 22, height: 22, color: "#FF5A1F" }} />
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-1)" }}>My Connections</h1>
        </div>
        <div className="flex items-center gap-1.5"
          style={{ height: 32, padding: "0 12px", borderRadius: 999,
            background: "rgba(255,90,31,0.10)", border: "1px solid rgba(255,90,31,0.20)",
            fontSize: 12, fontWeight: 700, color: "#FF5A1F" }}>
          {totalConnections} {totalConnections === 1 ? "connection" : "connections"}
        </div>
      </div>

      {/* Sticky 2-row header: Tabs + Filters */}
      <div className="sticky z-30" style={{ top: 0, background: "var(--bg-page)", backdropFilter: "blur(14px)", marginInline: -16, paddingInline: 16, borderBottom: "1px solid var(--border-subtle)" }}>
        <PrimaryTabs<TabKey>
          tabs={[
            { key: "all", label: "Connected", badge: totalConnections },
            { key: "following", label: "Following", badge: followedOrgs.length },
            { key: "requests", label: "Requests", badge: totalRequests },
          ]}
          active={tab}
          onChange={setTab}
        />
        {tab === "all" && (
          <FilterBar
            condensed={scrolled}
            activeCount={filterCount}
            onClearAll={clearAllFilters}
            onMore={() => setMoreOpen(true)}
            chips={[
              { key: "verified", label: "Verified", active: verifiedOnly, onToggle: () => setVerifiedOnly(!verifiedOnly) },
              { key: "with_company", label: "With company", active: withCompany, onToggle: () => setWithCompany(!withCompany) },
              { key: "recent", label: "Active this week", active: activeRecent, onToggle: () => setActiveRecent(!activeRecent) },
              { key: "role_student", label: "Students", active: roleFilter === "student", onToggle: () => setRoleFilter(roleFilter === "student" ? null : "student") },
              { key: "role_working", label: "Working", active: roleFilter === "working", onToggle: () => setRoleFilter(roleFilter === "working" ? null : "working") },
              { key: "role_healthcare", label: "Healthcare", active: roleFilter === "healthcare", onToggle: () => setRoleFilter(roleFilter === "healthcare" ? null : "healthcare") },
              { key: "role_creator", label: "Creators", active: roleFilter === "creator", onToggle: () => setRoleFilter(roleFilter === "creator" ? null : "creator") },
              { key: "role_founder", label: "Founders", active: roleFilter === "founder", onToggle: () => setRoleFilter(roleFilter === "founder" ? null : "founder") },
              { key: "role_government", label: "Government", active: roleFilter === "government", onToggle: () => setRoleFilter(roleFilter === "government" ? null : "government") },
            ]}
          />
        )}
      </div>

      <div style={{ height: 12 }} />

      <BottomSheet
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        title="Filter connections"
        description="Narrow down your network"
        footer={
          <>
            <button type="button" onClick={() => { clearAllFilters(); }}
              className="flex-1 cursor-pointer"
              style={{ height: 40, borderRadius: 10, fontSize: 13, fontWeight: 600, background: "var(--surface-2)", color: "var(--text-1)", border: "none" }}>
              Reset
            </button>
            <button type="button" onClick={() => setMoreOpen(false)}
              className="flex-1 cursor-pointer"
              style={{ height: 40, borderRadius: 10, fontSize: 13, fontWeight: 700, background: "#FF5A1F", color: "#fff", border: "none" }}>
              Apply
            </button>
          </>
        }>
        <div className="space-y-5">
          <div>
            <p className="mb-2" style={{ fontSize: 12, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: 0.5 }}>Status</p>
            <label className="flex items-center gap-2 py-2 cursor-pointer">
              <input type="checkbox" checked={verifiedOnly} onChange={e => setVerifiedOnly(e.target.checked)} />
              <span style={{ fontSize: 13, color: "var(--text-1)" }}>Verified profiles only</span>
            </label>
            <label className="flex items-center gap-2 py-2 cursor-pointer">
              <input type="checkbox" checked={withCompany} onChange={e => setWithCompany(e.target.checked)} />
              <span style={{ fontSize: 13, color: "var(--text-1)" }}>Has company / institution</span>
            </label>
            <label className="flex items-center gap-2 py-2 cursor-pointer">
              <input type="checkbox" checked={activeRecent} onChange={e => setActiveRecent(e.target.checked)} />
              <span style={{ fontSize: 13, color: "var(--text-1)" }}>Active this week</span>
            </label>
          </div>
          <div>
            <p className="mb-2" style={{ fontSize: 12, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: 0.5 }}>Role</p>
            <div className="flex flex-wrap gap-2">
              {["student", "professional", "doctor", "faculty", "government", "skilled_trade", "hr", "builder"].map(r => {
                const active = roleFilter === r;
                return (
                  <button key={r} type="button" onClick={() => setRoleFilter(active ? null : r)}
                    className="cursor-pointer"
                    style={{
                      height: 32, padding: "0 12px", borderRadius: 999, fontSize: 12, fontWeight: 600,
                      background: active ? "#FF5A1F" : "var(--surface-2)",
                      color: active ? "#fff" : "var(--text-1)", border: "none",
                    }}>
                    {roleLabel(r)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </BottomSheet>

      {/* ALL TAB */}
      {tab === "all" && (
        <>
          {/* Search + Sort */}
          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2" style={{ width: 16, height: 16, color: "var(--text-3)" }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search connections..."
                className="w-full outline-none transition-all"
                style={{ height: 40, borderRadius: 12, paddingLeft: 36, paddingRight: 12, fontSize: 13,
                  background: "var(--bg-input, var(--surface-2))", backdropFilter: "blur(20px)",
                  border: "1px solid var(--border-glass)", color: "var(--text-1)" }} />
            </div>
            <div className="relative" ref={sortRef}>
              <button type="button" onClick={() => setSortOpen(o => !o)}
                aria-label="Sort connections"
                className="flex items-center gap-1.5 cursor-pointer"
                style={{ height: 40, padding: "0 14px", borderRadius: 12, fontSize: 13, fontWeight: 600,
                  background: "var(--surface-2)", backdropFilter: "blur(20px)",
                  border: "1px solid var(--border-glass)", color: "var(--text-1)", whiteSpace: "nowrap" }}>
                {sortLabels[sortBy]}
                <ChevronDown style={{ width: 14, height: 14 }} />
              </button>
              {sortOpen && (
                <div className="absolute right-0 top-11 z-50"
                  style={{ minWidth: 200, borderRadius: 12, padding: "4px 0",
                    background: "var(--bg-card)", backdropFilter: "blur(20px)",
                    border: "1px solid var(--border-glass)", boxShadow: "var(--shadow-lg)" }}>
                  {(Object.keys(sortLabels) as SortKey[]).map(k => (
                    <button type="button" key={k}
                      onClick={() => { setSortBy(k); setSortOpen(false); }}
                      className="w-full text-left cursor-pointer hover:bg-surface-2 transition-colors"
                      style={{ padding: "9px 14px", fontSize: 13,
                        color: sortBy === k ? "#FF5A1F" : "var(--text-1)",
                        fontWeight: sortBy === k ? 700 : 500 }}>
                      {sortLabels[k]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {loading ? (
            <div className="space-y-2">{[1, 2, 3].map(i => <SkeletonRow key={i} />)}</div>
          ) : filteredConnected.length > 0 ? (
            <div className="space-y-2">
              {filteredConnected.map(s => {
                const other = getOther(s);
                const lastActiveSrc = other?.last_active_date || other?.updated_at;
                const flags = getDisplayFlags(other);
                const cardName = flags.showName ? (other?.full_name || "User") : "Tiikme member";
                const subtype = other?.role_subtype;
                const company = other?.currently_working_at || other?.institution_name;
                return (
                  <div key={s.id} className="glass-card flex items-center gap-3 cursor-pointer transition-all duration-200 hover:shadow-sm"
                    style={{ padding: 12, borderRadius: 12, minHeight: 72 }}
                    onClick={() => navigate(`/app/profile/${other?.id}`)}>
                    <AvatarSquare src={other?.avatar_url} name={cardName} size={44} bgColor={ROLE_COLORS[other?.role || ""] || "#6B7280"} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate" style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)" }}>{cardName}</p>
                        {other?.is_verified && <VerifiedBadge size={14} />}
                      </div>
                      {flags.showRole && (
                        <p className="truncate" style={{ fontSize: 12, color: "var(--text-2)" }}>
                          {roleLabel(other?.role || "")}
                          {subtype && <span style={{ opacity: 0.75 }}> · {subtype}</span>}
                          {flags.showCompany && company && <span> · {company}</span>}
                        </p>
                      )}
                      {lastActiveSrc && (
                        <p className="truncate" style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>
                          Last active {getTimeAgo(lastActiveSrc)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <div className="relative" ref={openMenuId === s.id ? menuRef : undefined}>
                        <button type="button"
                          onClick={e => { e.stopPropagation(); setOpenMenuId(openMenuId === s.id ? null : s.id); }}
                          aria-label="More options"
                          className="cursor-pointer flex items-center justify-center transition-all"
                          style={{ height: 34, width: 34, borderRadius: 8,
                            background: "rgba(255,90,31,0.08)", color: "#FF5A1F", border: "1px solid rgba(255,90,31,0.20)" }}>
                          <MoreHorizontal style={{ width: 14, height: 14 }} />
                        </button>
                        {openMenuId === s.id && (
                          <div className="absolute right-0 top-10 z-50"
                            style={{ minWidth: 220, borderRadius: 12,
                              background: "var(--bg-card)", backdropFilter: "blur(20px)",
                              border: "1px solid var(--border-glass)", boxShadow: "var(--shadow-lg)", padding: "4px 0" }}>
                            <button type="button"
                              onClick={e => { e.stopPropagation(); setOpenMenuId(null); navigate(`/app/profile/${other?.id}`); }}
                              className="w-full text-left flex items-center gap-2.5 cursor-pointer hover:bg-surface-2 transition-colors"
                              style={{ padding: "9px 14px", fontSize: 13, color: "var(--text-1)" }}>
                              <Eye style={{ width: 14, height: 14, color: "var(--text-3)" }} /> View profile
                            </button>
                            <button type="button"
                              onClick={e => { e.stopPropagation(); setOpenMenuId(null); if (other?.id) handleMute(other.id); }}
                              className="w-full text-left flex items-center gap-2.5 cursor-pointer hover:bg-surface-2 transition-colors"
                              style={{ padding: "9px 14px", fontSize: 13, color: "var(--text-1)" }}>
                              <BellOff style={{ width: 14, height: 14, color: "var(--text-3)" }} /> Mute notifications for 30 days
                            </button>
                            <div style={{ height: 1, background: "var(--border-subtle)", margin: "4px 0" }} />
                            <button type="button"
                              onClick={e => { e.stopPropagation(); setOpenMenuId(null); handleDisconnect(s); }}
                              className="w-full text-left flex items-center gap-2.5 cursor-pointer hover:bg-[#FFF5F5] transition-colors"
                              style={{ padding: "9px 14px", fontSize: 13, color: "#EF4444" }}>
                              <UserX style={{ width: 14, height: 14 }} /> Remove Connection
                            </button>
                            <button type="button"
                              onClick={e => { e.stopPropagation(); setOpenMenuId(null); toast.info("Block — coming soon"); }}
                              className="w-full text-left flex items-center gap-2.5 cursor-pointer hover:bg-[#FFF5F5] transition-colors"
                              style={{ padding: "9px 14px", fontSize: 13, color: "#EF4444" }}>
                              <Ban style={{ width: 14, height: 14 }} /> Block
                            </button>
                            <button type="button"
                              onClick={e => { e.stopPropagation(); setOpenMenuId(null); toast.info("Report — coming soon"); }}
                              className="w-full text-left flex items-center gap-2.5 cursor-pointer hover:bg-[#FFF5F5] transition-colors"
                              style={{ padding: "9px 14px", fontSize: 13, color: "#EF4444" }}>
                              <Flag style={{ width: 14, height: 14 }} /> Report
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "48px 0" }}>
              <Link2 style={{ width: 40, height: 40, margin: "0 auto 12px", color: "var(--text-3)" }} />
              <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>
                {search ? "No connections match your search" : "No connections yet"}
              </p>
              <button type="button" onClick={() => navigate("/app/explore")}
                className="flex items-center gap-1.5 mx-auto mt-3 cursor-pointer"
                style={{ height: 40, padding: "0 20px", borderRadius: 12, fontSize: 13, fontWeight: 600,
                  background: "var(--surface-2)", backdropFilter: "blur(12px)",
                  border: "1px solid var(--border-glass)", color: "var(--text-1)" }}>
                <Compass style={{ width: 16, height: 16 }} /> Find people
              </button>
            </div>
          )}

          {/* Suggestions strip when there are connections */}
          {!loading && filteredConnected.length > 0 && suggested.length > 0 && (
            <div className="mt-6">
              <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)", marginBottom: 10 }}>People you may know</h2>
              <div className="space-y-2">
                {suggested.slice(0, 4).map((person: any) => {
                  const flags = getDisplayFlags(person);
                  const cardName = flags.showName ? (person.full_name || "User") : "Tiikme member";
                  const company = person.currently_working_at || person.institution_name;
                  return (
                    <div key={person.id} className="glass-card flex items-center gap-3 cursor-pointer transition-all hover:shadow-sm"
                      style={{ padding: 12, borderRadius: 12 }}
                      onClick={() => navigate(`/app/profile/${person.id}`)}>
                      <AvatarSquare src={person.avatar_url} name={cardName} size={44} bgColor={ROLE_COLORS[person.role || ""] || "#6B7280"} />
                      <div className="flex-1 min-w-0">
                        <p className="truncate" style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)" }}>{cardName}</p>
                        {flags.showRole && (
                          <p className="truncate" style={{ fontSize: 12, color: "var(--text-2)" }}>
                            {roleLabel(person.role || "")}
                            {person.location_city && ` · ${person.location_city}`}
                            {flags.showCompany && company && ` · ${company}`}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* FOLLOWING TAB — orgs the user follows */}
      {tab === "following" && (
        <div>
          {followedOrgs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 0" }}>
              <Compass style={{ width: 40, height: 40, margin: "0 auto 12px", color: "var(--text-3)" }} />
              <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>Not following any organizations yet</p>
              <button type="button" onClick={() => navigate("/app/explore")}
                className="flex items-center gap-1.5 mx-auto mt-3 cursor-pointer"
                style={{ height: 40, padding: "0 20px", borderRadius: 12, fontSize: 13, fontWeight: 600,
                  background: "var(--surface-2)", backdropFilter: "blur(12px)",
                  border: "1px solid var(--border-glass)", color: "var(--text-1)" }}>
                <Compass style={{ width: 16, height: 16 }} /> Discover organizations
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {followedOrgs.map((row: any) => {
                const org = row.org;
                if (!org) return null;
                return (
                  <div key={row.org_id}
                    className="glass-card flex items-center gap-3 cursor-pointer transition-all hover:shadow-sm"
                    style={{ padding: 12, borderRadius: 12, minHeight: 72 }}
                    onClick={() => navigate(`/org/${org.slug}`)}>
                    <AvatarSquare src={org.logo_url} name={org.name || "Org"} size={44} />
                    <div className="flex-1 min-w-0">
                      <p className="truncate" style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)" }}>{org.name}</p>
                      {org.type && (
                        <p className="truncate" style={{ fontSize: 12, color: "var(--text-2)" }}>
                          {org.type.charAt(0).toUpperCase() + org.type.slice(1).replace(/_/g, " ")}
                          {org.followers_count != null && ` · ${org.followers_count} followers`}
                        </p>
                      )}
                    </div>
                    <button type="button"
                      onClick={e => {
                        e.stopPropagation();
                        const name = org.name || "this organization";
                        toast(`Unfollow ${name}?`, {
                          action: { label: "Unfollow", onClick: async () => {
                            await supabase.from("org_followers").delete().eq("org_id", row.org_id).eq("user_id", user!.id);
                            setFollowedOrgs(prev => prev.filter(r => r.org_id !== row.org_id));
                            toast.success(`Unfollowed ${name}`);
                          }},
                          cancel: { label: "Cancel", onClick: () => {} },
                          duration: 5000,
                        });
                      }}
                      className="cursor-pointer shrink-0 transition-all"
                      style={{ height: 34, padding: "0 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                        background: "rgba(20,184,166,0.10)", color: "#0D9488",
                        border: "1px solid rgba(20,184,166,0.25)" }}>
                      Following ✓
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* REQUESTS TAB */}
      {tab === "requests" && (
        <div className="space-y-6">
          {/* Received */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>Received ({pendingIncoming.length})</h2>
            </div>
            {loading ? (
              <div className="space-y-2">{[1, 2].map(i => <SkeletonRow key={i} />)}</div>
            ) : pendingIncoming.length === 0 ? (
              <div className="glass-card" style={{ padding: "32px 16px", borderRadius: 12, textAlign: "center" }}>
                <UserPlus style={{ width: 36, height: 36, margin: "0 auto 10px", color: "var(--text-3)" }} />
                <p style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 12 }}>No pending requests</p>
                <button type="button" onClick={() => navigate("/app/explore")}
                  className="inline-flex items-center gap-1.5 cursor-pointer"
                  style={{ height: 36, padding: "0 16px", borderRadius: 10, fontSize: 12, fontWeight: 600,
                    background: "rgba(255,90,31,0.10)", color: "#FF5A1F", border: "1px solid rgba(255,90,31,0.20)" }}>
                  <Compass style={{ width: 14, height: 14 }} /> Find people
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingIncoming.map(s => {
                  const flags = getDisplayFlags(s.requester);
                  const cardName = flags.showName ? (s.requester?.full_name || "User") : "Tiikme member";
                  const company = s.requester?.currently_working_at || s.requester?.institution_name;
                  return (
                    <div key={s.id} className="glass-card flex items-center gap-3" style={{ padding: 12, borderRadius: 12, minHeight: 72 }}>
                      <AvatarSquare src={s.requester?.avatar_url} name={cardName} size={44} bgColor={ROLE_COLORS[s.requester?.role || ""] || "#6B7280"} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate" style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)" }}>{cardName}</p>
                          {s.requester?.is_verified && <VerifiedBadge size={14} />}
                        </div>
                        {flags.showRole && (
                          <p className="truncate" style={{ fontSize: 12, color: "var(--text-2)" }}>
                            {roleLabel(s.requester?.role || "")}
                            {s.requester?.role_subtype && <span style={{ opacity: 0.75 }}> · {s.requester.role_subtype}</span>}
                            {flags.showCompany && company && <span> · {company}</span>}
                          </p>
                        )}
                        <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>{getTimeAgo(s.created_at)}</p>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <button type="button" onClick={() => handleAccept(s)} className="cursor-pointer transition-all"
                          style={{ height: 34, padding: "0 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, ...connectionButtonStyle("pending_received") }}>
                          Accept
                        </button>
                        <button type="button" onClick={() => handleDecline(s)} className="cursor-pointer transition-all"
                          style={{ height: 34, padding: "0 12px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                            background: "transparent", color: "#EF4444", border: "1px solid rgba(239,68,68,0.25)" }}>
                          Decline
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Sent */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>Sent ({pendingSent.length})</h2>
            </div>
            {loading ? (
              <div className="space-y-2">{[1, 2].map(i => <SkeletonRow key={`s${i}`} />)}</div>
            ) : pendingSent.length === 0 ? (
              <div className="glass-card" style={{ padding: "24px 16px", borderRadius: 12, textAlign: "center" }}>
                <Clock style={{ width: 32, height: 32, margin: "0 auto 8px", color: "var(--text-3)" }} />
                <p style={{ fontSize: 13, color: "var(--text-3)" }}>No pending requests sent</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingSent.map(s => {
                  const flags = getDisplayFlags(s.receiver);
                  const cardName = flags.showName ? (s.receiver?.full_name || "User") : "Tiikme member";
                  const company = s.receiver?.currently_working_at || s.receiver?.institution_name;
                  return (
                    <div key={s.id} className="glass-card flex items-center gap-3" style={{ padding: 12, borderRadius: 12, minHeight: 72 }}>
                      <AvatarSquare src={s.receiver?.avatar_url} name={cardName} size={44} bgColor={ROLE_COLORS[s.receiver?.role || ""] || "#6B7280"} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate" style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)" }}>{cardName}</p>
                          {s.receiver?.is_verified && <VerifiedBadge size={14} />}
                        </div>
                        {flags.showRole && (
                          <p className="truncate" style={{ fontSize: 12, color: "var(--text-2)" }}>
                            {roleLabel(s.receiver?.role || "")}
                            {s.receiver?.role_subtype && <span style={{ opacity: 0.75 }}> · {s.receiver.role_subtype}</span>}
                            {flags.showCompany && company && <span> · {company}</span>}
                          </p>
                        )}
                        <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>Sent {getTimeAgo(s.created_at)}</p>
                      </div>
                      <button type="button" onClick={() => handleWithdraw(s)} className="cursor-pointer transition-all shrink-0"
                        style={{ height: 34, padding: "0 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, ...connectionButtonStyle("pending_sent") }}>
                        Withdraw
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
};

export default Connections;

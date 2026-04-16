import { useState, useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import AvatarSquare from "@/components/ui/AvatarSquare";
import { Link2, Search, MessageCircle, Compass, MoreHorizontal, X, Clock, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { sendNotification } from "@/lib/notify";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { connectionButtonStyle } from "@/hooks/useConnectionStatus";

const ROLE_COLORS: Record<string, string> = {
  student: "#4F46E5", professional: "#0369A1", government: "#166534",
  doctor: "#0E7490", faculty: "#92400E", skilled_trade: "#C2410C",
  hr: "#6B21A8", aspirant: "#374151", builder: "#7C3AED",
};

interface StrandRow {
  id: string; requester_id: string; receiver_id: string; status: string; created_at: string;
  requester?: { id: string; full_name: string | null; avatar_url: string | null; role: string | null; institution_name: string | null };
  receiver?: { id: string; full_name: string | null; avatar_url: string | null; role: string | null; institution_name: string | null };
}

type TabKey = "connected" | "pending" | "sent" | "suggested";

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

const Connections = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<TabKey>("connected");
  const [search, setSearch] = useState("");

  const fetchStrandsData = useCallback(async () => {
    if (!user) return { connected: [], pendingIncoming: [], pendingSent: [], suggested: [] };
    const [acceptedRes, incomingRes, sentRes] = await Promise.allSettled([
      supabase.from("strands")
        .select("id, requester_id, receiver_id, status, created_at, requester:profiles!strands_requester_id_fkey(id, full_name, avatar_url, role, institution_name), receiver:profiles!strands_receiver_id_fkey(id, full_name, avatar_url, role, institution_name)")
        .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`).eq("status", "accepted"),
      supabase.from("strands")
        .select("id, requester_id, receiver_id, status, created_at, requester:profiles!strands_requester_id_fkey(id, full_name, avatar_url, role, institution_name)")
        .eq("receiver_id", user.id).eq("status", "pending"),
      supabase.from("strands")
        .select("id, requester_id, receiver_id, status, created_at, receiver:profiles!strands_receiver_id_fkey(id, full_name, avatar_url, role, institution_name)")
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
      .select("id, full_name, avatar_url, role, institution_name, location_city")
      .eq("is_public", true)
      .not("id", "in", `(${Array.from(connectedIds).join(",")})`)
      .order("activity_score", { ascending: false }).limit(12);

    return { connected: accepted, pendingIncoming: incomingData, pendingSent: sentData, suggested: suggestedData || [] };
  }, [user]);

  const { data: strandsData, isLoading: loading, refetch: fetchStrands } = useQuery({
    queryKey: ["connections", user?.id],
    queryFn: fetchStrandsData,
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const connected = strandsData?.connected || [];
  const pendingIncoming = strandsData?.pendingIncoming || [];
  const pendingSent = strandsData?.pendingSent || [];
  const suggested = strandsData?.suggested || [];

  const getOther = (s: StrandRow) => s.requester_id === user?.id ? s.receiver : s.requester;

  const handleAccept = async (s: StrandRow) => {
    await supabase.from("strands").update({ status: "accepted" }).eq("id", s.id);
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
    fetchStrands();
  };

  const handleDecline = async (s: StrandRow) => {
    await supabase.from("strands").update({ status: "declined" }).eq("id", s.id);
    toast.info("Declined");
    fetchStrands();
  };

  const handleWithdraw = async (s: StrandRow) => {
    await supabase.from("strands").delete().eq("id", s.id);
    toast.info("Request withdrawn");
    fetchStrands();
  };

  const handleConnect = async (profileId: string) => {
    if (!user) return;
    const { sendConnectionRequest } = await import("@/hooks/useConnectionStatus");
    const result = await sendConnectionRequest(user.id, profileId, profile?.full_name || "Someone");
    if (result === null) { toast.info("Request already exists"); return; }
    toast.success(result === "accepted" ? "Connected!" : "Request sent!");
    fetchStrands();
  };

  const filteredConnected = useMemo(() => connected.filter(s => {
    if (!search) return true;
    const other = getOther(s);
    return (other?.full_name || "").toLowerCase().includes(search.toLowerCase());
  }), [connected, search, user?.id]);

  const tabs: { key: TabKey; label: string; badge?: number }[] = [
    { key: "connected", label: `All Connections (${connected.length})` },
    { key: "pending", label: "Requests", badge: pendingIncoming.length },
    { key: "sent", label: `Sent (${pendingSent.length})` },
    { key: "suggested", label: "Suggestions" },
  ];

  if (loading) return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: 16 }}>
      <div className="space-y-2">
        {[1, 2, 3, 4].map(i => <div key={i} className="glass-card animate-pulse" style={{ height: 56, borderRadius: 10 }} />)}
      </div>
    </main>
  );

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: 16 }}>
      <div className="flex items-center gap-3 mb-3">
        <Link2 style={{ width: 22, height: 22, color: "#E8733A" }} />
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#1A1A2E" }}>My Connections</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-4 pb-1">
        {tabs.map(t => (
          <button type="button" key={t.key} onClick={() => setTab(t.key)}
            className="shrink-0 flex items-center gap-1.5 cursor-pointer transition-all duration-200"
            style={{
              height: 34, padding: "0 18px", borderRadius: 12, fontSize: 13, fontWeight: 600, whiteSpace: "nowrap",
              ...(tab === t.key
                ? { background: "linear-gradient(135deg, #E8733A, #FF6B9D)", color: "#fff", border: "none", boxShadow: "0 4px 16px rgba(232,115,58,0.30)" }
                : { background: "rgba(255,255,255,0.20)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.25)", color: "#1A1A2E" }),
            }}>
            {t.label}
            {t.badge && t.badge > 0 && tab !== t.key && (
              <span style={{ minWidth: 18, height: 18, borderRadius: 9, background: "#E8733A", color: "#fff", fontSize: 10, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ALL CONNECTIONS */}
      {tab === "connected" && (
        <div>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2" style={{ width: 16, height: 16, color: "#6B7094" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search connections..."
              className="w-full outline-none transition-all"
              style={{ height: 40, borderRadius: 12, paddingLeft: 36, paddingRight: 12, fontSize: 13, background: "rgba(255,255,255,0.20)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.30)", color: "#1A1A2E" }} />
          </div>
          {filteredConnected.length > 0 ? (
            <div className="space-y-1.5">
              {filteredConnected.map(s => {
                const other = getOther(s);
                return (
                  <div key={s.id} className="glass-card flex items-center gap-2.5 cursor-pointer transition-all duration-200 hover:shadow-sm"
                    style={{ padding: 10, borderRadius: 10 }}
                    onClick={() => navigate(`/app/profile/${other?.id}`)}>
                    <AvatarSquare src={other?.avatar_url} name={other?.full_name || "U"} size={40} bgColor={ROLE_COLORS[other?.role || ""] || "#6B7280"} />
                    <div className="flex-1 min-w-0">
                      <p className="truncate" style={{ fontSize: 14, fontWeight: 600, color: "#1A1A2E" }}>{other?.full_name || "User"}</p>
                      <p className="truncate" style={{ fontSize: 12, color: "#6B7094" }}>{roleLabel(other?.role || "")} · {other?.institution_name || "—"}</p>
                    </div>
                    <button type="button"
                      onClick={e => { e.stopPropagation(); navigate("/app/pings"); }}
                      className="flex items-center gap-1 cursor-pointer transition-all"
                      style={{ height: 32, padding: "0 10px", borderRadius: 8, fontSize: 12, fontWeight: 600, background: "rgba(255,255,255,0.20)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.25)", color: "#1A1A2E" }}>
                      <MessageCircle style={{ width: 14, height: 14 }} /> Ping
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "48px 0" }}>
              <Link2 style={{ width: 40, height: 40, margin: "0 auto 12px", color: "#6B7094" }} />
              <p style={{ fontSize: 14, fontWeight: 700, color: "#1A1A2E" }}>No connections yet</p>
              <button type="button" onClick={() => navigate("/app/explore")}
                className="flex items-center gap-1.5 mx-auto mt-3 cursor-pointer"
                style={{ height: 40, padding: "0 20px", borderRadius: 12, fontSize: 13, fontWeight: 600, background: "rgba(255,255,255,0.20)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.25)", color: "#1A1A2E" }}>
                <Compass style={{ width: 16, height: 16 }} /> Explore
              </button>
            </div>
          )}
        </div>
      )}

      {/* REQUESTS */}
      {tab === "pending" && (
        <div className="space-y-1.5">
          {pendingIncoming.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 0" }}>
              <UserPlus style={{ width: 40, height: 40, margin: "0 auto 12px", color: "#6B7094" }} />
              <p style={{ fontSize: 14, color: "#6B7094" }}>No pending requests</p>
            </div>
          ) : pendingIncoming.map(s => (
            <div key={s.id} className="glass-card flex items-center gap-2.5" style={{ padding: 10, borderRadius: 10 }}>
              <AvatarSquare src={s.requester?.avatar_url} name={s.requester?.full_name || "U"} size={40} bgColor={ROLE_COLORS[s.requester?.role || ""] || "#6B7280"} />
              <div className="flex-1 min-w-0">
                <p className="truncate" style={{ fontSize: 14, fontWeight: 600, color: "#1A1A2E" }}>{s.requester?.full_name || "User"}</p>
                <p className="truncate" style={{ fontSize: 12, color: "#6B7094" }}>
                  {roleLabel(s.requester?.role || "")} · {getTimeAgo(s.created_at)}
                </p>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button type="button" onClick={() => handleAccept(s)} className="cursor-pointer transition-all"
                  style={{ height: 32, padding: "0 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, ...connectionButtonStyle("pending_received") }}>
                  Accept
                </button>
                <button type="button" onClick={() => handleDecline(s)} className="cursor-pointer transition-all"
                  style={{ height: 32, padding: "0 10px", borderRadius: 8, fontSize: 12, fontWeight: 700, background: "transparent", color: "#EF4444", border: "1px solid rgba(239,68,68,0.25)" }}>
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SENT */}
      {tab === "sent" && (
        <div className="space-y-1.5">
          {pendingSent.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 0" }}>
              <Clock style={{ width: 40, height: 40, margin: "0 auto 12px", color: "#6B7094" }} />
              <p style={{ fontSize: 14, color: "#6B7094" }}>No pending requests sent</p>
            </div>
          ) : pendingSent.map(s => (
            <div key={s.id} className="glass-card flex items-center gap-2.5" style={{ padding: 10, borderRadius: 10 }}>
              <AvatarSquare src={s.receiver?.avatar_url} name={s.receiver?.full_name || "U"} size={40} bgColor={ROLE_COLORS[s.receiver?.role || ""] || "#6B7280"} />
              <div className="flex-1 min-w-0">
                <p className="truncate" style={{ fontSize: 14, fontWeight: 600, color: "#1A1A2E" }}>{s.receiver?.full_name || "User"}</p>
                <p style={{ fontSize: 12, color: "#6B7094" }}>{getTimeAgo(s.created_at)}</p>
              </div>
              <button type="button" onClick={() => handleWithdraw(s)} className="cursor-pointer transition-all"
                style={{ height: 32, padding: "0 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, ...connectionButtonStyle("pending_sent") }}>
                Withdraw
              </button>
            </div>
          ))}
        </div>
      )}

      {/* SUGGESTIONS */}
      {tab === "suggested" && (
        <div className="space-y-1.5">
          {suggested.length > 0 ? suggested.map(person => (
            <div key={person.id} className="glass-card flex items-center gap-2.5 cursor-pointer transition-all duration-200 hover:shadow-sm"
              style={{ padding: 10, borderRadius: 10 }}
              onClick={() => navigate(`/app/profile/${person.id}`)}>
              <AvatarSquare src={person.avatar_url} name={person.full_name || "U"} size={48} bgColor={ROLE_COLORS[person.role || ""] || "#6B7280"} />
              <div className="flex-1 min-w-0">
                <p className="truncate" style={{ fontSize: 14, fontWeight: 600, color: "#1A1A2E" }}>{person.full_name || "User"}</p>
                <p className="truncate" style={{ fontSize: 12, color: "#6B7094" }}>
                  {roleLabel(person.role || "")} {person.location_city ? `· ${person.location_city}` : ""} {person.institution_name ? `· ${person.institution_name}` : ""}
                </p>
              </div>
              <button type="button" onClick={e => { e.stopPropagation(); handleConnect(person.id); }}
                className="cursor-pointer transition-all"
                style={{ height: 32, padding: "0 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, ...connectionButtonStyle("none") }}>
                Connect
              </button>
            </div>
          )) : (
            <div style={{ textAlign: "center", padding: "48px 0" }}>
              <p style={{ fontSize: 14, color: "#6B7094" }}>No suggestions right now</p>
            </div>
          )}
        </div>
      )}
    </main>
  );
};

export default Connections;

import { storageImageUrl } from "@/lib/imageTransform";
import { useState, useEffect, useCallback } from "react";
import { Link2, Check, X, Search, MessageCircle, Compass } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const ROLE_COLORS: Record<string, string> = {
  student: "#4F46E5", professional: "#0369A1", government: "#166534",
  doctor: "#0E7490", faculty: "#92400E", skilled_trade: "#C2410C",
  hr: "#6B21A8", aspirant: "#374151", builder: "#7C3AED",
};

interface StrandRow {
  id: string; requester_id: string; receiver_id: string; status: string; created_at: string;
  requester?: { id: string; full_name: string | null; avatar_url: string | null; role: string | null; institution_name: string | null; location_city?: string | null };
  receiver?: { id: string; full_name: string | null; avatar_url: string | null; role: string | null; institution_name: string | null; location_city?: string | null };
}

const Strands = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState<"connected" | "pending" | "sent" | "suggested">("connected");
  const [search, setSearch] = useState("");
  const [connected, setConnected] = useState<StrandRow[]>([]);
  const [pendingIncoming, setPendingIncoming] = useState<StrandRow[]>([]);
  const [pendingSent, setPendingSent] = useState<StrandRow[]>([]);
  const [suggested, setSuggested] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStrands = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
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
      setConnected(accepted);
      setPendingIncoming(incomingData);
      setPendingSent(sentData);

      const connectedIds = new Set<string>();
      accepted.forEach((s: any) => { connectedIds.add(s.requester_id); connectedIds.add(s.receiver_id); });
      incomingData.forEach((s: any) => connectedIds.add(s.requester_id));
      sentData.forEach((s: any) => connectedIds.add(s.receiver_id));
      connectedIds.add(user.id);

      const { data: suggestedData } = await supabase.from("profiles")
        .select("id, full_name, avatar_url, role, institution_name")
        .eq("is_public", true)
        .not("id", "in", `(${Array.from(connectedIds).join(",")})`)
        .order("activity_score", { ascending: false }).limit(6);
      setSuggested(suggestedData || []);
    } catch (e) {
      console.warn("[Strands] fetch exception:", e);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchStrands(); }, [fetchStrands]);

  const getOther = (s: StrandRow) => s.requester_id === user?.id ? s.receiver : s.requester;
  const handleAccept = async (s: StrandRow) => {
    await supabase.from("strands").update({ status: "accepted" }).eq("id", s.id);
    if (user) {
      await supabase.rpc("increment_score", { uid: user.id, amount: 3 });
      await supabase.rpc("increment_score", { uid: s.requester_id === user.id ? s.receiver_id : s.requester_id, amount: 3 });
    }
    toast.success("Connected!");
    fetchStrands();
  };
  const handleDecline = async (s: StrandRow) => { await supabase.from("strands").update({ status: "declined" }).eq("id", s.id); toast.info("Declined"); fetchStrands(); };
  const handleCancel = async (s: StrandRow) => { await supabase.from("strands").delete().eq("id", s.id); toast.info("Request cancelled"); fetchStrands(); };
  const handleConnect = async (profileId: string) => {
    if (!user) return;
    const { data: existing } = await supabase.from("strands")
      .select("id, status, requester_id")
      .or(`and(requester_id.eq.${user.id},receiver_id.eq.${profileId}),and(requester_id.eq.${profileId},receiver_id.eq.${user.id})`)
      .maybeSingle();
    if (existing) {
      if (existing.status === "pending") { toast.info("Request already sent"); return; }
      if (existing.status === "accepted") { toast.info("Already connected"); return; }
    }
    await supabase.from("strands").insert({ requester_id: user.id, receiver_id: profileId });
    toast.success("Request sent!");
    fetchStrands();
  };

  const filteredConnected = connected.filter(s => {
    if (!search) return true;
    const other = getOther(s);
    return (other?.full_name || "").toLowerCase().includes(search.toLowerCase());
  });

  const tabs = [
    { key: "connected" as const, label: `Connected (${connected.length})` },
    { key: "pending" as const, label: `Requests (${pendingIncoming.length})` },
    { key: "sent" as const, label: `Sent (${pendingSent.length})` },
    { key: "suggested" as const, label: "Suggested" },
  ];

  const Avatar = ({ person }: { person: any }) => {
    const name = person?.full_name || "U";
    const initials = name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
    const color = ROLE_COLORS[person?.role || ""] || "#6B7280";
    return (
      <div className="w-11 h-11 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0 overflow-hidden"
        style={{ backgroundColor: color, border: "2px solid rgba(255,255,255,0.25)", boxShadow: "0 0 8px rgba(26,26,78,0.08)" }}>
        {person?.avatar_url ? <img src={storageImageUrl(person.avatar_url, "avatar")} alt="" className="w-full h-full object-cover" /> : initials}
      </div>
    );
  };

  const roleLabel = (r: string) => r ? r.charAt(0).toUpperCase() + r.slice(1).replace(/_/g, " ") : "";

  if (loading) return (
    <main className="max-w-4xl mx-auto px-4 py-6 space-y-2">
      {[1,2,3].map(i => <div key={i} className="glass-light animate-pulse" style={{ height: 64, borderRadius: 16, padding: 12 }} />)}
    </main>
  );

  return (
    <main className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-2">
        <Link2 className="w-6 h-6" style={{ color: "#E8733A" }} />
        <h1 className="text-[20px] font-bold" style={{ color: "#1A1A2E" }}>Connections</h1>
      </div>

      {/* Glass pill tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-5 pb-1">
        {tabs.map(t => (
          <button type="button" key={t.key} onClick={() => setTab(t.key)}
            className="shrink-0 px-5 py-2 rounded-[20px] text-[13px] font-semibold transition-all duration-200 whitespace-nowrap min-h-[44px]"
            style={tab === t.key
              ? { background: "linear-gradient(135deg, #E8733A, #FF6B9D)", color: "#fff", border: "none", boxShadow: "0 4px 16px rgba(232,115,58,0.30)", cursor: "pointer" }
              : { background: "rgba(255,255,255,0.20)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.25)", color: "#1A1A2E", cursor: "pointer" }
            }>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "connected" && (
        <div>
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#6B7094" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search connections..."
              className="w-full h-11 rounded-[16px] pl-11 pr-4 text-[13px] outline-none transition-all duration-200"
              style={{ background: "rgba(255,255,255,0.20)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.30)", color: "#1A1A2E" }} />
          </div>
          {filteredConnected.length > 0 ? (
            <div className="space-y-2">
              {filteredConnected.map(s => {
                const other = getOther(s);
                return (
                  <div key={s.id} className="glass-light flex items-center gap-3 cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
                    style={{ padding: 12, borderRadius: 16 }}
                    onClick={() => navigate(`/app/profile/${other?.id}`)}>
                    <Avatar person={other} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold truncate" style={{ color: "#1A1A2E" }}>{other?.full_name || "User"}</p>
                      <p className="text-[12px]" style={{ color: "#6B7094" }}>{roleLabel(other?.role || "")} · {other?.institution_name || "—"}</p>
                    </div>
                    <button type="button"
                      onClick={e => { e.stopPropagation(); navigate("/app/pings"); }}
                      className="h-8 px-3 rounded-xl text-[12px] font-semibold flex items-center gap-1 transition-all duration-200"
                      style={{ background: "rgba(255,255,255,0.20)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.25)", color: "#1A1A2E", cursor: "pointer" }}>
                      <MessageCircle className="w-3 h-3" /> Ping
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Link2 className="w-10 h-10 mx-auto mb-3" style={{ color: "#6B7094" }} />
              <p className="text-[14px] font-bold" style={{ color: "#1A1A2E" }}>No connections yet</p>
              <button type="button" onClick={() => navigate("/app/explore")}
                className="mt-3 h-10 px-5 rounded-xl text-[13px] font-semibold flex items-center gap-1.5 mx-auto transition-all duration-200"
                style={{ background: "rgba(255,255,255,0.20)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.25)", color: "#1A1A2E", cursor: "pointer" }}>
                <Compass className="w-4 h-4" /> Explore
              </button>
            </div>
          )}
        </div>
      )}

      {tab === "pending" && (
        <div className="space-y-2">
          {pendingIncoming.length === 0 ? (
            <div className="text-center py-12"><Check className="w-10 h-10 mx-auto mb-3" style={{ color: "#6B7094" }} /><p className="text-[14px]" style={{ color: "#6B7094" }}>No pending requests</p></div>
          ) : pendingIncoming.map(s => (
            <div key={s.id} className="glass-light flex items-center gap-3" style={{ padding: 12, borderRadius: 16 }}>
              <Avatar person={s.requester} />
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold truncate" style={{ color: "#1A1A2E" }}>{s.requester?.full_name || "User"}</p>
                <p className="text-[12px]" style={{ color: "#6B7094" }}>{roleLabel(s.requester?.role || "")} · {s.requester?.institution_name || "—"}</p>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button type="button" onClick={() => handleAccept(s)}
                  className="h-9 px-4 rounded-xl text-[12px] font-bold min-w-[70px] transition-all duration-200"
                  style={{ background: "linear-gradient(135deg, #E8733A, #FF6B9D)", color: "#fff", border: "none", cursor: "pointer", boxShadow: "0 4px 12px rgba(232,115,58,0.25)" }}>
                  <Check className="w-3 h-3 inline mr-1" /> Accept
                </button>
                <button type="button" onClick={() => handleDecline(s)}
                  className="h-9 px-3 rounded-xl text-[12px] font-bold min-w-[60px] transition-all duration-200"
                  style={{ background: "rgba(255,255,255,0.20)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.25)", color: "#1A1A2E", cursor: "pointer" }}>
                  <X className="w-3 h-3 inline mr-1" /> Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "sent" && (
        <div className="space-y-2">
          {pendingSent.length === 0 ? (
            <div className="text-center py-12"><p className="text-[14px]" style={{ color: "#6B7094" }}>No pending requests sent</p></div>
          ) : pendingSent.map(s => (
            <div key={s.id} className="glass-light flex items-center gap-3" style={{ padding: 12, borderRadius: 16 }}>
              <Avatar person={s.receiver} />
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold truncate" style={{ color: "#1A1A2E" }}>{s.receiver?.full_name || "User"}</p>
                <p className="text-[12px]" style={{ color: "#6B7094" }}>Request sent</p>
              </div>
              <button type="button" onClick={() => handleCancel(s)}
                className="h-8 px-3 rounded-xl text-[12px] font-bold transition-all duration-200"
                style={{ background: "rgba(239,68,68,0.10)", color: "#EF4444", border: "none", cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === "suggested" && (
        <div className="space-y-2">
          {suggested.length > 0 ? suggested.map(person => (
            <div key={person.id} className="glass-light flex items-center gap-3 cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
              style={{ padding: 12, borderRadius: 16 }}
              onClick={() => navigate(`/app/profile/${person.id}`)}>
              <Avatar person={person} />
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold truncate" style={{ color: "#1A1A2E" }}>{person.full_name || "User"}</p>
                <p className="text-[12px]" style={{ color: "#6B7094" }}>{person.institution_name || "—"}</p>
              </div>
              <button type="button" onClick={e => { e.stopPropagation(); handleConnect(person.id); }}
                className="h-8 px-4 rounded-xl text-[12px] font-bold transition-all duration-200"
                style={{ background: "rgba(255,255,255,0.20)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.25)", color: "#1A1A2E", cursor: "pointer" }}>
                Connect
              </button>
            </div>
          )) : (
            <div className="text-center py-12"><p className="text-[14px]" style={{ color: "#6B7094" }}>No suggestions right now</p></div>
          )}
        </div>
      )}
    </main>
  );
};

export default Strands;

import { useState, useEffect, useCallback } from "react";
import { Link2, Check, X, Search, MessageCircle, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
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
      if (acceptedRes.status === "rejected") console.warn("[Strands] accepted fetch failed:", acceptedRes.reason);
      if (incomingRes.status === "rejected") console.warn("[Strands] incoming fetch failed:", incomingRes.reason);
      if (sentRes.status === "rejected") console.warn("[Strands] sent fetch failed:", sentRes.reason);
      setConnected(accepted);
      setPendingIncoming(incomingData);
      setPendingSent(sentData);

      const connectedIds = new Set<string>();
      accepted.forEach((s: any) => { connectedIds.add(s.requester_id); connectedIds.add(s.receiver_id); });
      incomingData.forEach((s: any) => connectedIds.add(s.requester_id));
      sentData.forEach((s: any) => connectedIds.add(s.receiver_id));
      connectedIds.add(user.id);

      const { data: suggestedData, error: sugErr } = await supabase.from("profiles")
        .select("id, full_name, avatar_url, role, institution_name")
        .eq("is_public", true)
        .not("id", "in", `(${Array.from(connectedIds).join(",")})`)
        .order("activity_score", { ascending: false }).limit(6);
      if (sugErr) console.warn("[Strands] suggested fetch failed:", sugErr.message);
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
    // Award score for accepted connection
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
    // Check for existing strand
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
      <div className="w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0 overflow-hidden" style={{ backgroundColor: color }}>
        {person?.avatar_url ? <img src={person.avatar_url} alt="" className="w-full h-full object-cover" /> : initials}
      </div>
    );
  };

  const roleLabel = (r: string) => r ? r.charAt(0).toUpperCase() + r.slice(1).replace(/_/g, " ") : "";

  if (loading) return (
    <main className="max-w-4xl mx-auto px-4 py-6 space-y-3">
      {[1,2,3].map(i => <div key={i} className="t-card p-4 animate-pulse h-16" />)}
    </main>
  );

  return (
    <main className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-2">
        <Link2 className="w-6 h-6" style={{ color: "var(--brand)" }} />
        <h1 className="text-[20px] text-emboss">Connections</h1>
      </div>

      <div className="flex gap-0 border-b mb-5 overflow-x-auto" style={{ borderColor: "var(--border)", scrollbarWidth: "none" }}>
        {tabs.map(t => (
          <button type="button" key={t.key} onClick={() => setTab(t.key)} className="flex-1 md:flex-none px-4 py-2.5 text-[12px] font-semibold relative cursor-pointer whitespace-nowrap min-h-[44px]"
            style={{ color: tab === t.key ? "var(--brand)" : "var(--text-3)" }}>
            {t.label}
            {tab === t.key && <div className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full" style={{ background: "var(--brand)" }} />}
          </button>
        ))}
      </div>

      {tab === "connected" && (
        <div>
          <div className="flex items-center gap-3 px-4 mb-4 h-[38px] glass-input">
            <Search className="w-4 h-4" style={{ color: "var(--text-3)" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="flex-1 bg-transparent text-sm outline-none" style={{ color: "var(--text-1)" }} />
          </div>
          {filteredConnected.length > 0 ? (
            <div className="space-y-1">
              {filteredConnected.map(s => {
                const other = getOther(s);
                return (
                  <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-[var(--surface-2)] transition-all"
                    onClick={() => navigate(`/app/profile/${other?.id}`)}>
                    <Avatar person={other} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold truncate" style={{ color: "var(--text-1)" }}>{other?.full_name || "User"}</p>
                      <p className="text-[11px]" style={{ color: "var(--text-3)" }}>{roleLabel(other?.role || "")} · {other?.institution_name || "—"}</p>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 text-[11px]" onClick={e => { e.stopPropagation(); navigate("/app/pings"); }}>
                      <MessageCircle className="w-3 h-3 mr-1" /> Ping
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Link2 className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--text-3)" }} />
              <p className="text-[14px] font-bold" style={{ color: "var(--text-1)" }}>No connections yet</p>
              <Button variant="secondary" className="mt-3" onClick={() => navigate("/app/explore")}><Compass className="w-4 h-4 mr-1" /> Explore</Button>
            </div>
          )}
        </div>
      )}

      {tab === "pending" && (
        <div className="space-y-1">
          {pendingIncoming.length === 0 ? (
            <div className="text-center py-12"><Check className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--text-3)" }} /><p className="text-[14px]" style={{ color: "var(--text-2)" }}>No pending requests</p></div>
          ) : pendingIncoming.map(s => (
            <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "var(--surface-2)" }}>
              <Avatar person={s.requester} />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold truncate" style={{ color: "var(--text-1)" }}>{s.requester?.full_name || "User"}</p>
                <p className="text-[11px]" style={{ color: "var(--text-3)" }}>{roleLabel(s.requester?.role || "")} · {s.requester?.institution_name || "—"}</p>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <Button size="sm" className="h-9 text-[11px] min-w-[70px]" onClick={() => handleAccept(s)}><Check className="w-3 h-3 mr-1" /> Accept</Button>
                <Button variant="ghost" size="sm" className="h-9 text-[11px] min-w-[60px]" onClick={() => handleDecline(s)}><X className="w-3 h-3 mr-1" /> Decline</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "sent" && (
        <div className="space-y-1">
          {pendingSent.length === 0 ? (
            <div className="text-center py-12"><p className="text-[14px]" style={{ color: "var(--text-2)" }}>No pending requests sent</p></div>
          ) : pendingSent.map(s => (
            <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "var(--surface-2)" }}>
              <Avatar person={s.receiver} />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold truncate" style={{ color: "var(--text-1)" }}>{s.receiver?.full_name || "User"}</p>
                <p className="text-[11px]" style={{ color: "var(--text-3)" }}>Request sent</p>
              </div>
              <Button variant="ghost" size="sm" className="h-7 text-[11px]" style={{ color: "#DC2626" }} onClick={() => handleCancel(s)}>Cancel</Button>
            </div>
          ))}
        </div>
      )}

      {tab === "suggested" && (
        <div className="space-y-1">
          {suggested.length > 0 ? suggested.map(person => (
            <div key={person.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--surface-2)] cursor-pointer" onClick={() => navigate(`/app/profile/${person.id}`)}>
              <Avatar person={person} />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold truncate" style={{ color: "var(--text-1)" }}>{person.full_name || "User"}</p>
                <p className="text-[11px]" style={{ color: "var(--text-3)" }}>{person.institution_name || "—"}</p>
              </div>
              <Button size="sm" className="h-7 text-[11px]" onClick={e => { e.stopPropagation(); handleConnect(person.id); }}>Connect</Button>
            </div>
          )) : (
            <div className="text-center py-12"><p className="text-[14px]" style={{ color: "var(--text-2)" }}>No suggestions right now</p></div>
          )}
        </div>
      )}
    </main>
  );
};

export default Strands;

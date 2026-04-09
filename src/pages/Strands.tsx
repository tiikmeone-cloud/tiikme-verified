import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
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
  id: string;
  requester_id: string;
  receiver_id: string;
  status: string;
  created_at: string;
  requester?: { id: string; full_name: string | null; avatar_url: string | null; role: string | null; institution_name: string | null; is_verified: boolean | null };
  receiver?: { id: string; full_name: string | null; avatar_url: string | null; role: string | null; institution_name: string | null; is_verified: boolean | null };
}

const Avatar = ({ name, avatarUrl, role, size = 44 }: { name: string; avatarUrl?: string | null; role: string; size?: number }) => {
  const initials = (name || "U").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const color = ROLE_COLORS[role] || "#6B7280";
  return (
    <div className="rounded-full flex items-center justify-center text-white font-bold shrink-0 overflow-hidden"
      style={{ backgroundColor: color, width: size, height: size, fontSize: size * 0.28 }}>
      {avatarUrl ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" /> : initials}
    </div>
  );
};

const Strands = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState<"connected" | "pending" | "suggested">("connected");
  const [search, setSearch] = useState("");
  const [connected, setConnected] = useState<StrandRow[]>([]);
  const [pending, setPending] = useState<StrandRow[]>([]);
  const [suggested, setSuggested] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStrands = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const [{ data: accepted }, { data: pendingData }] = await Promise.all([
      supabase.from("strands")
        .select("id, requester_id, receiver_id, status, created_at, requester:profiles!strands_requester_id_fkey(id, full_name, avatar_url, role, institution_name, is_verified), receiver:profiles!strands_receiver_id_fkey(id, full_name, avatar_url, role, institution_name, is_verified)")
        .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .eq("status", "accepted"),
      supabase.from("strands")
        .select("id, requester_id, receiver_id, status, created_at, requester:profiles!strands_requester_id_fkey(id, full_name, avatar_url, role, institution_name, is_verified), receiver:profiles!strands_receiver_id_fkey(id, full_name, avatar_url, role, institution_name, is_verified)")
        .eq("receiver_id", user.id)
        .eq("status", "pending"),
    ]);

    setConnected((accepted as any) || []);
    setPending((pendingData as any) || []);

    // Suggested: profiles not already connected
    const connectedIds = new Set<string>();
    (accepted || []).forEach((s: any) => { connectedIds.add(s.requester_id); connectedIds.add(s.receiver_id); });
    (pendingData || []).forEach((s: any) => { connectedIds.add(s.requester_id); });
    connectedIds.add(user.id);

    const { data: suggestedData } = await supabase.from("profiles")
      .select("id, full_name, avatar_url, role, institution_name, is_verified")
      .eq("is_public", true)
      .not("id", "in", `(${Array.from(connectedIds).join(",")})`)
      .order("activity_score", { ascending: false })
      .limit(6);
    setSuggested(suggestedData || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchStrands(); }, [fetchStrands]);

  const getOther = (s: StrandRow) => s.requester_id === user?.id ? s.receiver : s.requester;

  const handleAccept = async (s: StrandRow) => {
    await supabase.from("strands").update({ status: "accepted" }).eq("id", s.id);
    toast.success("Strand accepted!");
    fetchStrands();
  };

  const handleDecline = async (s: StrandRow) => {
    await supabase.from("strands").update({ status: "declined" }).eq("id", s.id);
    toast.info("Request declined");
    fetchStrands();
  };

  const handleConnect = async (profileId: string) => {
    if (!user) return;
    await supabase.from("strands").insert({ requester_id: user.id, receiver_id: profileId });
    toast.success("Strand request sent!");
    fetchStrands();
  };

  const filteredConnected = connected.filter(s => {
    if (!search) return true;
    const other = getOther(s);
    return (other?.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (other?.institution_name || "").toLowerCase().includes(search.toLowerCase());
  });

  const tabs = [
    { key: "connected" as const, label: `My strands (${connected.length})` },
    { key: "pending" as const, label: `Pending (${pending.length})` },
    { key: "suggested" as const, label: "Suggested" },
  ];

  if (loading) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="t-card p-5 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full" style={{ background: "var(--surface-2)" }} />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 rounded" style={{ background: "var(--surface-2)" }} />
                  <div className="h-3 w-48 rounded" style={{ background: "var(--surface-2)" }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    );
  }

  const renderCard = (person: any, actions: React.ReactNode, subtitle: string) => (
    <article className="glass-liquid glass-liquid-hover rounded-2xl md:rounded-3xl p-5 flex flex-col items-center text-center">
      <button onClick={() => navigate(`/app/profile/${person?.id}`)} className="cursor-pointer mb-3">
        <Avatar name={person?.full_name || "User"} avatarUrl={person?.avatar_url} role={person?.role || "student"} size={48} />
      </button>
      <button onClick={() => navigate(`/app/profile/${person?.id}`)} className="text-[14px] font-bold hover:text-[var(--brand)] transition-colors cursor-pointer" style={{ color: "var(--text-1)" }}>{person?.full_name || "User"}</button>
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full mt-1" style={{ backgroundColor: `${ROLE_COLORS[person?.role || ""] || "#6B7280"}14`, color: ROLE_COLORS[person?.role || ""] || "#6B7280" }}>
        {(person?.role || "user").charAt(0).toUpperCase() + (person?.role || "user").slice(1).replace(/_/g, " ")}
      </span>
      <p className="text-[11px] mt-1.5 line-clamp-1" style={{ color: "var(--text-3)" }}>{subtitle}</p>
      <div className="flex gap-1.5 mt-3 w-full justify-center">{actions}</div>
    </article>
  );

  return (
    <main className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-2">
        <Link2 className="w-6 h-6" style={{ color: "var(--brand)" }} />
        <h1 className="text-[20px] text-emboss">My Strands</h1>
      </div>
      <p className="text-[13px] mb-5" style={{ color: "var(--text-2)" }}>Mutual connections — people who chose you and you chose back.</p>

      <div className="flex gap-0 border-b mb-5" style={{ borderColor: "var(--border)" }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="px-4 py-2.5 text-[12px] font-semibold transition-all duration-200 relative cursor-pointer"
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
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search your strands..."
              className="flex-1 bg-transparent text-sm outline-none" style={{ color: "var(--text-1)" }} />
          </div>
          {filteredConnected.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredConnected.map((s, i) => {
                const other = getOther(s);
                return (
                  <motion.div key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                    {renderCard(other, (
                      <>
                        <Button variant="ghost" size="sm" className="active:scale-95" onClick={() => navigate(`/app/profile/${other?.id}`)}>View</Button>
                        <Button variant="secondary" size="sm" className="active:scale-95" onClick={() => navigate("/app/pings")}>
                          <MessageCircle className="w-3 h-3 mr-1" /> Ping
                        </Button>
                      </>
                    ), other?.institution_name || "—")}
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Link2 className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--text-3)" }} />
              <p className="text-[14px] font-bold mb-1" style={{ color: "var(--text-1)" }}>No strands yet</p>
              <p className="text-[13px] mb-4" style={{ color: "var(--text-3)" }}>Explore people and connect →</p>
              <Button variant="secondary" onClick={() => navigate("/app/explore")}><Compass className="w-4 h-4 mr-1" /> Explore people</Button>
            </div>
          )}
        </div>
      )}

      {tab === "pending" && (
        <div>
          {pending.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pending.map((s, i) => (
                <motion.div key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  {renderCard(s.requester, (
                    <>
                      <Button size="sm" className="active:scale-95" onClick={() => handleAccept(s)}>
                        <Check className="w-3 h-3 mr-1" /> Accept
                      </Button>
                      <Button variant="ghost" size="sm" className="active:scale-95" onClick={() => handleDecline(s)}>
                        <X className="w-3 h-3" />
                      </Button>
                    </>
                  ), s.requester?.institution_name || "—")}
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Check className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--text-3)" }} />
              <p className="text-[14px]" style={{ color: "var(--text-2)" }}>No pending requests. You're all caught up!</p>
            </div>
          )}
        </div>
      )}

      {tab === "suggested" && (
        <div>
          {suggested.length > 0 ? (
            <>
              <p className="text-[13px] font-bold mb-3" style={{ color: "var(--text-1)" }}>People you might know</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {suggested.map((person, i) => (
                  <motion.div key={person.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                    {renderCard(person, (
                      <Button size="sm" className="active:scale-95" onClick={() => handleConnect(person.id)}>Connect</Button>
                    ), person.institution_name || "—")}
                  </motion.div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <Compass className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--text-3)" }} />
              <p className="text-[14px]" style={{ color: "var(--text-2)" }}>No suggestions right now.</p>
              <Button variant="secondary" className="mt-3" onClick={() => navigate("/app/explore")}>Explore people</Button>
            </div>
          )}
        </div>
      )}
    </main>
  );
};

export default Strands;

import { useEffect, useMemo, useState } from "react";
import { X, Briefcase, Send, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { sendNotification } from "@/lib/notify";
import { toast } from "sonner";
import AvatarSquare from "@/components/ui/AvatarSquare";

interface Props {
  open: boolean;
  onClose: () => void;
  targetUser?: { id: string; full_name: string | null } | null;
  opportunity?: any;
}

export default function SendJDModal({ open, onClose, targetUser = null, opportunity }: Props) {
  const { user, profile } = useAuth();
  const [opps, setOpps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);
  const [connections, setConnections] = useState<any[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<{ id: string; full_name: string | null; avatar_url?: string | null; headline?: string | null } | null>(targetUser || null);
  const [search, setSearch] = useState("");

  const filteredConnections = useMemo(() => {
    if (!search.trim()) return connections;
    const q = search.trim().toLowerCase();
    return connections.filter((connection) =>
      (connection.full_name || "").toLowerCase().includes(q) ||
      (connection.headline || "").toLowerCase().includes(q)
    );
  }, [connections, search]);

  useEffect(() => {
    if (!open || !user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const opportunityPromise = opportunity
        ? Promise.resolve({ data: [opportunity] })
        : supabase
            .from("opportunities")
            .select("id, title, type, location, org:organizations!opportunities_org_id_fkey(name)")
            .eq("poster_id", user.id)
            .eq("is_open", true)
            .eq("status", "active")
            .order("created_at", { ascending: false })
            .limit(20);
      const connectionsPromise = targetUser
        ? Promise.resolve({ data: [] })
        : (async () => {
            const { data: strands } = await supabase
              .from("strands")
              .select("requester_id, receiver_id")
              .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
              .eq("status", "accepted");
            const connectionIds = [...new Set((strands || []).map((strand: any) => strand.requester_id === user.id ? strand.receiver_id : strand.requester_id).filter(Boolean))];
            if (!connectionIds.length) return { data: [] };
            return supabase
              .from("profiles")
              .select("id, full_name, avatar_url, headline")
              .in("id", connectionIds)
              .order("full_name", { ascending: true });
          })();
      const [opportunitiesRes, connectionsRes] = await Promise.all([opportunityPromise, connectionsPromise]);
      if (!cancelled) {
        setOpps(opportunitiesRes.data || []);
        setConnections((connectionsRes as any).data || []);
        setSelectedTarget(targetUser || null);
        setSearch("");
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, user, targetUser, opportunity]);

  if (!open) return null;

  const handleSend = async (opp: any) => {
    if (!user || sending || !selectedTarget?.id) return;
    setSending(opp.id);

    const { error } = await supabase.from("opportunity_referrals").insert({
      opportunity_id: opp.id,
      referrer_id: user.id,
      referred_user_id: selectedTarget.id,
    } as any);

    if (error) {
      if (error.code === "23505") toast.info("Already sent this JD to them");
      else toast.error(error.message);
      setSending(null);
      return;
    }

    sendNotification({
      userId: selectedTarget.id,
      actorId: user.id,
      type: "referral",
      title: `${profile?.full_name || "An organisation"} sent you a JD: ${opp.title}`,
      body: opp.org?.name ? `at ${opp.org.name}` : undefined,
      actionUrl: `/app/opportunities?tab=referrals`,
      data: { opportunity_id: opp.id },
    });

    toast.success(`JD sent to ${selectedTarget.full_name || "candidate"}`);
    setSending(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center md:pl-[230px]" style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)" }} onClick={onClose}>
      <div className="w-full max-w-[420px] mx-4 rounded-2xl overflow-hidden" style={{ background: "#fff", boxShadow: "0 24px 64px rgba(0,0,0,0.18)" }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <Send className="w-5 h-5" style={{ color: "#E8733A" }} />
            <span className="text-[15px] font-bold" style={{ color: "var(--text-1)" }}>{opportunity ? "Refer this role" : "Send a JD"}</span>
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer" style={{ background: "var(--surface-2)" }}>
            <X className="w-4 h-4" style={{ color: "var(--text-3)" }} />
          </button>
        </div>

        <p className="px-5 text-[13px] mb-3" style={{ color: "var(--text-3)" }}>
          {opportunity
            ? "Choose one of your connections and send this opportunity directly."
            : `Select an opportunity to share with ${selectedTarget?.full_name ? `"${selectedTarget.full_name}"` : "a connection"}`}
        </p>

        <div className="px-5 pb-5 space-y-3">
          {!targetUser && (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-3)" }} />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search your connections..."
                  className="w-full h-10 rounded-xl pl-9 pr-4 text-[13px] outline-none glass-input"
                />
              </div>
              <div className="max-h-[220px] overflow-y-auto space-y-1.5">
                {loading && <p className="text-[12px] py-3 text-center" style={{ color: "var(--text-3)" }}>Loading connections…</p>}
                {!loading && filteredConnections.length === 0 && (
                  <div className="text-center py-5">
                    <p className="text-[12px]" style={{ color: "var(--text-3)" }}>
                      {connections.length === 0 ? "No accepted connections yet." : "No matching connections."}
                    </p>
                  </div>
                )}
                {filteredConnections.map(connection => {
                  const active = selectedTarget?.id === connection.id;
                  return (
                    <button
                      key={connection.id}
                      type="button"
                      onClick={() => setSelectedTarget(connection)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl text-left cursor-pointer transition-all"
                      style={{
                        background: active ? "rgba(232,115,58,0.06)" : "var(--surface-2)",
                        border: active ? "1.5px solid #E8733A" : "1px solid var(--border)",
                      }}
                    >
                      <AvatarSquare src={connection.avatar_url} name={connection.full_name || "U"} size={36} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold truncate" style={{ color: "var(--text-1)" }}>{connection.full_name || "Connection"}</p>
                        {connection.headline && <p className="text-[11px] truncate" style={{ color: "var(--text-3)" }}>{connection.headline}</p>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
          <div className="max-h-[320px] overflow-y-auto space-y-1.5">
          {loading && <p className="text-[12px] py-3 text-center" style={{ color: "var(--text-3)" }}>Loading…</p>}
          {!loading && opps.length === 0 && (
            <div className="text-center py-6">
              <Briefcase className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--text-3)" }} />
              <p className="text-[12px]" style={{ color: "var(--text-3)" }}>
                {opportunity ? "This opportunity could not be loaded." : "You have no active opportunities to send."}
              </p>
            </div>
          )}
          {opps.map(o => (
            <button
              key={o.id} type="button" disabled={sending === o.id}
              onClick={() => handleSend(o)}
              className="w-full flex items-center gap-3 p-3 rounded-xl text-left cursor-pointer transition-all hover:bg-[var(--surface-2)] disabled:opacity-50"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(232,115,58,0.12)" }}>
                <Briefcase className="w-4 h-4" style={{ color: "#E8733A" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold truncate" style={{ color: "var(--text-1)" }}>{o.title}</p>
                <p className="text-[11px] truncate" style={{ color: "var(--text-3)" }}>
                  {o.org?.name || "Your organisation"}{o.location ? ` · ${o.location}` : ""}
                </p>
              </div>
              <Send className="w-4 h-4 shrink-0" style={{ color: sending === o.id ? "var(--text-3)" : "#E8733A" }} />
            </button>
          ))}
          </div>
        </div>
      </div>
    </div>
  );
}

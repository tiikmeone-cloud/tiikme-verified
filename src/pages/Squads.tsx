import { useState, useEffect } from "react";
import { Shield, Users, Check, X as XIcon, Building2, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { sendNotification } from "@/lib/notify";
import PageSEO from "@/components/PageSEO";

const TIER_LABELS: Record<string, string> = {
  peer_claimed: "Peer-claimed",
  squad_verified: "Squad Verified",
  org_confirmed: "Org Confirmed",
};
const TIER_COLORS: Record<string, string> = {
  peer_claimed: "#FFB800",
  squad_verified: "#6366F1",
  org_confirmed: "#16A34A",
};

interface IncomingRequest {
  id: string;
  user_a: string;
  company_name: string;
  date_overlap_ok: boolean;
  testimonial: string | null;
  created_at: string;
  profile: {
    full_name: string;
    avatar_url: string | null;
    headline: string | null;
    username: string | null;
  } | null;
}

interface SquadEntry {
  org_ref: string;
  scope: string;
  tier: string;
  score: number;
  coworker_count: number;
  independent_count: number;
  display_name: string;
}

export default function Squads() {
  const [userId, setUserId] = useState<string | null>(null);
  const [incoming, setIncoming] = useState<IncomingRequest[]>([]);
  const [squads, setSquads] = useState<SquadEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<"squads" | "requests">("squads");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);

    Promise.all([
      // Incoming pending requests
      (supabase
        .from("squad_edges" as any)
        .select(`id, user_a, date_overlap_ok, testimonial, created_at, provisional_orgs!org_ref(display_name)`)
        .eq("user_b", userId)
        .eq("status", "claimed")
        .order("created_at", { ascending: false }) as any),
      // User's squad trust entries
      (supabase
        .from("squad_trust" as any)
        .select(`org_ref, scope, tier, score, coworker_count, independent_count, provisional_orgs!org_ref(display_name)`)
        .eq("user_id", userId)
        .order("score", { ascending: false }) as any),
    ]).then(([edgesRes, trustRes]) => {
      const edges = edgesRes.data || [];
      const trust = trustRes.data || [];

      // For each edge, fetch the sender profile
      const senderIds = [...new Set(edges.map((e: any) => e.user_a))];
      if (senderIds.length > 0) {
        (supabase
          .from("profiles")
          .select("id, full_name, avatar_url, headline, username")
          .in("id", senderIds) as any)
          .then(({ data: profiles }: { data: any[] }) => {
            const profileMap = Object.fromEntries((profiles || []).map((p: any) => [p.id, p]));
            setIncoming(edges.map((e: any) => ({
              ...e,
              company_name: e.provisional_orgs?.display_name || "Unknown",
              profile: profileMap[e.user_a] || null,
            })));
          });
      } else {
        setIncoming([]);
      }

      setSquads(trust.map((t: any) => ({
        org_ref: t.org_ref,
        scope: t.scope,
        tier: t.tier,
        score: t.score,
        coworker_count: t.coworker_count,
        independent_count: t.independent_count,
        display_name: t.provisional_orgs?.display_name || "Unknown",
      })));

      setLoading(false);
    });
  }, [userId]);

  const handleRespond = async (edgeId: string, accept: boolean, request: IncomingRequest) => {
    if (!userId) return;
    setResponding(prev => new Set([...prev, edgeId]));
    try {
      const { error } = await (supabase.rpc as any)("respond_cosign", {
        p_edge_id: edgeId,
        p_accept: accept,
      });
      if (error) throw error;

      setIncoming(prev => prev.filter(r => r.id !== edgeId));
      if (accept) {
        sendNotification({
          userId: request.user_a,
          actorId: userId,
          type: "cosign_accepted",
          title: "Co-sign accepted",
          body: `Your co-sign request for ${request.company_name} was accepted`,
          actionUrl: "/app/squads",
        });
        toast.success("Co-sign accepted");
      } else {
        toast("Request declined");
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed to respond");
    } finally {
      setResponding(prev => { const n = new Set(prev); n.delete(edgeId); return n; });
    }
  };

  const pendingCount = incoming.length;

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 16px" }}>
      <PageSEO title="My Squads · Tiikme" description="Manage your peer co-signs and squad trust." />

      <div style={{ marginBottom: 24 }}>
        <div className="flex items-center" style={{ gap: 10, marginBottom: 6 }}>
          <Shield style={{ width: 22, height: 22, color: "#6366F1" }} />
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-1)" }}>Squads</h1>
        </div>
        <p style={{ fontSize: 14, color: "var(--text-3)", lineHeight: "20px" }}>
          Peer co-signs build your verified work graph. Each co-sign from a real coworker raises your trust tier.
        </p>
      </div>

      {/* Tab pills */}
      <div className="flex" style={{ gap: 6, marginBottom: 20 }}>
        {(["squads", "requests"] as const).map(tab => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            style={{
              height: 34, padding: "0 18px", borderRadius: 20, fontSize: 13, fontWeight: 500,
              background: activeTab === tab ? "#E8733A" : "transparent",
              color: activeTab === tab ? "#fff" : "var(--text-2)",
              border: `1px solid ${activeTab === tab ? "#E8733A" : "var(--border-glass)"}`,
              cursor: "pointer",
            }}
          >
            {tab === "requests" ? `Requests${pendingCount > 0 ? ` (${pendingCount})` : ""}` : "My Squads"}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center" style={{ padding: "60px 0" }}>
          <div className="animate-pulse" style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--surface-2)" }} />
          <p style={{ fontSize: 13, color: "var(--text-3)", marginTop: 14 }}>Loading…</p>
        </div>
      )}

      {/* Squads tab */}
      {!loading && activeTab === "squads" && (
        <>
          {squads.length === 0 ? (
            <div className="glass-card flex flex-col items-center justify-center" style={{ padding: "48px 24px", borderRadius: 16 }}>
              <Users style={{ width: 32, height: 32, color: "var(--text-3)", marginBottom: 12 }} />
              <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text-2)" }}>No squads yet</p>
              <p style={{ fontSize: 13, color: "var(--text-3)", marginTop: 6, textAlign: "center", lineHeight: "19px" }}>
                Open an experience on your profile and invite coworkers to co-sign.
              </p>
              <Link
                to="/app/profile"
                style={{ marginTop: 16, padding: "8px 20px", borderRadius: 20, background: "#E8733A", color: "#fff", fontSize: 13, fontWeight: 600, textDecoration: "none" }}
              >
                Go to my profile
              </Link>
            </div>
          ) : (
            <div className="flex flex-col" style={{ gap: 10 }}>
              {squads.map(squad => (
                <div key={`${squad.org_ref}-${squad.scope}`} className="glass-card" style={{ padding: "16px 20px", borderRadius: 14 }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center" style={{ gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--surface-2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Building2 style={{ width: 18, height: 18, color: "var(--text-3)" }} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>{squad.display_name}</p>
                        <p style={{ fontSize: 12, color: "var(--text-3)" }}>
                          {squad.coworker_count} coworker{squad.coworker_count !== 1 ? "s" : ""}
                          {squad.independent_count > 0 ? ` · ${squad.independent_count} independent` : ""}
                        </p>
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20,
                        background: `${TIER_COLORS[squad.tier]}15`,
                        color: TIER_COLORS[squad.tier],
                        border: `1px solid ${TIER_COLORS[squad.tier]}30`,
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}
                    >
                      {TIER_LABELS[squad.tier]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Requests tab */}
      {!loading && activeTab === "requests" && (
        <>
          {incoming.length === 0 ? (
            <div className="glass-card flex flex-col items-center justify-center" style={{ padding: "48px 24px", borderRadius: 16 }}>
              <Shield style={{ width: 32, height: 32, color: "var(--text-3)", marginBottom: 12 }} />
              <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text-2)" }}>No pending requests</p>
              <p style={{ fontSize: 13, color: "var(--text-3)", marginTop: 6, textAlign: "center" }}>
                Co-sign requests from coworkers will appear here.
              </p>
            </div>
          ) : (
            <div className="flex flex-col" style={{ gap: 10 }}>
              {incoming.map(req => {
                const initials = (req.profile?.full_name || "?").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
                const isProcessing = responding.has(req.id);
                return (
                  <div key={req.id} className="glass-card" style={{ padding: "16px 20px", borderRadius: 14 }}>
                    <div className="flex items-start" style={{ gap: 12 }}>
                      <Avatar style={{ width: 44, height: 44, flexShrink: 0 }}>
                        <AvatarImage src={req.profile?.avatar_url || undefined} />
                        <AvatarFallback style={{ background: "var(--surface-2)", color: "var(--text-2)", fontSize: 14, fontWeight: 600 }}>{initials}</AvatarFallback>
                      </Avatar>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="flex items-center" style={{ gap: 6, flexWrap: "wrap" }}>
                          {req.profile?.username ? (
                            <Link to={`/app/profile/${req.user_a}`} style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)", textDecoration: "none" }}>
                              {req.profile.full_name}
                            </Link>
                          ) : (
                            <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>{req.profile?.full_name || "Someone"}</p>
                          )}
                          {req.date_overlap_ok && (
                            <span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 10, background: "rgba(99,102,241,0.08)", color: "#6366F1", border: "1px solid rgba(99,102,241,0.20)" }}>
                              Tenure overlap
                            </span>
                          )}
                        </div>
                        {req.profile?.headline && (
                          <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{req.profile.headline}</p>
                        )}
                        <p style={{ fontSize: 12, color: "var(--text-2)", marginTop: 6 }}>
                          Wants to co-sign your work at <strong>{req.company_name}</strong>
                        </p>
                        {req.testimonial && (
                          <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 6, fontStyle: "italic", lineHeight: "18px" }}>"{req.testimonial}"</p>
                        )}
                      </div>
                    </div>
                    <div className="flex" style={{ gap: 8, marginTop: 14 }}>
                      <button
                        type="button"
                        onClick={() => handleRespond(req.id, true, req)}
                        disabled={isProcessing}
                        className="flex items-center"
                        style={{ gap: 5, height: 34, padding: "0 18px", borderRadius: 20, background: "#16A34A", color: "#fff", fontSize: 13, fontWeight: 600, border: "none", cursor: isProcessing ? "not-allowed" : "pointer", opacity: isProcessing ? 0.6 : 1 }}
                      >
                        <Check style={{ width: 14, height: 14 }} />
                        Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRespond(req.id, false, req)}
                        disabled={isProcessing}
                        className="flex items-center"
                        style={{ gap: 5, height: 34, padding: "0 18px", borderRadius: 20, background: "transparent", color: "var(--text-2)", fontSize: 13, fontWeight: 500, border: "1px solid var(--border-glass)", cursor: isProcessing ? "not-allowed" : "pointer" }}
                      >
                        <XIcon style={{ width: 14, height: 14 }} />
                        Decline
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { UserCheck, Users, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { sendNotification } from "@/lib/notify";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Candidate {
  user_b: string;
  full_name: string;
  avatar_url: string | null;
  headline: string | null;
  overlap: boolean;
}

interface Props {
  workItemId: string;
  companyName: string;
  onClose: () => void;
}

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

export default function CoSignSheet({ workItemId, companyName, onClose }: Props) {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState<Set<string>>(new Set());
  const [requested, setRequested] = useState<Set<string>>(new Set());
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUser(user.id);
    });
  }, []);

  useEffect(() => {
    if (!workItemId) return;
    setLoading(true);
    (supabase.rpc as any)("suggest_coworkers", { p_work_item_id: workItemId })
      .then(({ data, error }: { data: Candidate[] | null; error: any }) => {
        if (error) {
          console.error("[CoSignSheet] suggest_coworkers", error);
          setCandidates([]);
        } else {
          setCandidates(data || []);
        }
        setLoading(false);
      });
  }, [workItemId]);

  // Check already-sent requests
  useEffect(() => {
    if (!currentUser || !workItemId) return;
    (supabase
      .from("squad_edges" as any)
      .select("user_b")
      .eq("user_a", currentUser) as any)
      .then(({ data }: { data: Array<{ user_b: string }> | null }) => {
        if (data) setRequested(new Set(data.map(r => r.user_b)));
      });
  }, [currentUser, workItemId]);

  const handleRequest = async (candidate: Candidate) => {
    if (!currentUser) return;
    setRequesting(prev => new Set([...prev, candidate.user_b]));
    try {
      const { error } = await (supabase.rpc as any)("request_cosign", {
        p_work_item_id: workItemId,
        p_user_b: candidate.user_b,
        p_company_name: companyName,
        p_testimonial: null,
        p_date_overlap_ok: candidate.overlap,
      });
      if (error) throw error;
      setRequested(prev => new Set([...prev, candidate.user_b]));
      sendNotification({
        userId: candidate.user_b,
        actorId: currentUser,
        type: "cosign_request",
        title: "Co-sign request",
        body: `Someone wants to co-sign your work at ${companyName}`,
        actionUrl: "/app/squads",
      });
      toast.success(`Co-sign request sent to ${candidate.full_name}`);
    } catch (e: any) {
      toast.error(e?.message || "Failed to send request");
    } finally {
      setRequesting(prev => { const n = new Set(prev); n.delete(candidate.user_b); return n; });
    }
  };

  const overlap = candidates.filter(c => c.overlap);
  const noOverlap = candidates.filter(c => !c.overlap);

  return (
    <Sheet open onOpenChange={o => { if (!o) onClose(); }}>
      <SheetContent
        side="right"
        className="flex flex-col"
        style={{ width: "min(380px, 92vw)", background: "var(--bg-card)", borderLeft: "1px solid var(--border-glass)", padding: 0, gap: 0 }}
      >
        <SheetHeader style={{ padding: "16px 20px 12px", borderBottom: "1px solid var(--border-glass)", flexShrink: 0 }}>
          <SheetTitle style={{ fontSize: 14, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Co-sign coworkers
          </SheetTitle>
          <p style={{ fontSize: 13, color: "var(--text-2)", marginTop: 4 }}>{companyName}</p>
        </SheetHeader>

        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px 32px" }}>
          {loading && (
            <div className="flex flex-col items-center justify-center" style={{ padding: "40px 0" }}>
              <div className="animate-pulse" style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--surface-2)" }} />
              <p style={{ fontSize: 13, color: "var(--text-3)", marginTop: 12 }}>Finding coworkers…</p>
            </div>
          )}

          {!loading && candidates.length === 0 && (
            <div className="flex flex-col items-center justify-center" style={{ padding: "40px 0" }}>
              <Users style={{ width: 28, height: 28, color: "var(--text-3)", marginBottom: 10 }} />
              <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text-2)" }}>No coworkers found</p>
              <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 4, textAlign: "center", lineHeight: "18px" }}>
                As more people from {companyName} join Tiikme, you'll see them here.
              </p>
            </div>
          )}

          {!loading && overlap.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
                Tenure overlap
              </p>
              {overlap.map(c => (
                <CandidateRow
                  key={c.user_b}
                  candidate={c}
                  isRequested={requested.has(c.user_b)}
                  isRequesting={requesting.has(c.user_b)}
                  onRequest={handleRequest}
                />
              ))}
            </div>
          )}

          {!loading && noOverlap.length > 0 && (
            <div>
              {overlap.length > 0 && (
                <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
                  Also at {companyName}
                </p>
              )}
              {noOverlap.map(c => (
                <CandidateRow
                  key={c.user_b}
                  candidate={c}
                  isRequested={requested.has(c.user_b)}
                  isRequesting={requesting.has(c.user_b)}
                  onRequest={handleRequest}
                  dimmed
                />
              ))}
            </div>
          )}

          <div style={{ marginTop: 24, padding: "14px 16px", borderRadius: 12, background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)" }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#6366F1", marginBottom: 6 }}>How co-signs work</p>
            <p style={{ fontSize: 12, color: "var(--text-3)", lineHeight: "18px" }}>
              Co-signs are peer attestations from people who worked with you. Each confirmed co-sign raises your trust tier at that company.
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function CandidateRow({
  candidate, isRequested, isRequesting, onRequest, dimmed,
}: {
  candidate: Candidate;
  isRequested: boolean;
  isRequesting: boolean;
  onRequest: (c: Candidate) => void;
  dimmed?: boolean;
}) {
  const initials = candidate.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div
      className="flex items-center"
      style={{ gap: 12, padding: "10px 0", borderBottom: "1px solid var(--border-subtle)", opacity: dimmed ? 0.65 : 1 }}
    >
      <Avatar style={{ width: 40, height: 40, flexShrink: 0 }}>
        <AvatarImage src={candidate.avatar_url || undefined} />
        <AvatarFallback style={{ background: "var(--surface-2)", color: "var(--text-2)", fontSize: 13, fontWeight: 600 }}>{initials}</AvatarFallback>
      </Avatar>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{candidate.full_name}</p>
        {candidate.headline && (
          <p style={{ fontSize: 12, color: "var(--text-3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{candidate.headline}</p>
        )}
        {candidate.overlap && (
          <p style={{ fontSize: 11, color: "#6366F1", marginTop: 2 }}>Tenure overlaps</p>
        )}
      </div>
      {isRequested ? (
        <span
          className="flex items-center"
          style={{ gap: 4, fontSize: 12, fontWeight: 500, padding: "5px 12px", borderRadius: 20, background: "rgba(22,163,74,0.08)", color: "#16A34A", border: "1px solid rgba(22,163,74,0.20)", whiteSpace: "nowrap", flexShrink: 0 }}
        >
          <UserCheck style={{ width: 12, height: 12 }} />
          Requested
        </span>
      ) : (
        <button
          type="button"
          onClick={() => onRequest(candidate)}
          disabled={isRequesting}
          style={{ fontSize: 12, fontWeight: 600, padding: "5px 14px", borderRadius: 20, background: "#E8733A", color: "#fff", border: "none", cursor: isRequesting ? "not-allowed" : "pointer", flexShrink: 0, opacity: isRequesting ? 0.6 : 1 }}
        >
          {isRequesting ? "…" : "Co-sign"}
        </button>
      )}
    </div>
  );
}

export { TIER_LABELS, TIER_COLORS };

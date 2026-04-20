/**
 * VerificationStatusCard
 * Shows the current user's latest verification request status with a re-apply button if rejected.
 */
import { useEffect, useState } from "react";
import { ShieldCheck, Clock, XCircle, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import GetVerifiedModal from "./GetVerifiedModal";

type Req = {
  id: string;
  status: string;
  requested_role: string | null;
  rejection_reason: string | null;
  created_at: string;
  org_id: string | null;
  org_name?: string | null;
};

export default function VerificationStatusCard() {
  const { user } = useAuth();
  const [req, setReq] = useState<Req | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);

    const [{ data: prof }, { data: latest }] = await Promise.all([
      supabase.from("profiles").select("is_verified").eq("id", user.id).maybeSingle(),
      supabase
        .from("verification_requests")
        .select("id, status, requested_role, rejection_reason, created_at, org_id")
        .eq("requester_id", user.id)
        .eq("entity_type", "user_org")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    setIsVerified(!!prof?.is_verified);

    if (latest && latest.org_id) {
      const { data: org } = await supabase
        .from("organizations").select("name").eq("id", latest.org_id).maybeSingle();
      setReq({ ...latest, org_name: org?.name || null });
    } else {
      setReq(latest as Req | null);
    }
    setLoading(false);
  };

  useEffect(() => { refresh(); }, [user]);

  if (loading) return null;
  if (isVerified) return null; // Hide card once verified

  // No request yet → CTA
  if (!req) {
    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full flex items-center gap-3 p-3 rounded-xl text-left cursor-pointer hover:opacity-90 transition-opacity"
          style={{
            background: "linear-gradient(135deg, rgba(232,115,58,0.08), rgba(255,107,157,0.08))",
            border: "1px solid var(--brand-dim)",
          }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--brand)" }}>
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold" style={{ color: "var(--text-1)" }}>Get verified</p>
            <p className="text-[11px]" style={{ color: "var(--text-2)" }}>Confirm your role at an organisation.</p>
          </div>
        </button>
        <GetVerifiedModal open={open} onClose={() => setOpen(false)} onSubmitted={refresh} />
      </>
    );
  }

  const statusUI = (() => {
    if (req.status === "pending" || req.status === "more_info_requested") {
      return {
        bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.30)", color: "#B45309",
        icon: Clock,
        title: req.status === "more_info_requested" ? "More info requested" : "Pending review",
        body: req.org_name ? `Sent to ${req.org_name}` : "Awaiting reviewer",
      };
    }
    if (req.status === "rejected") {
      return {
        bg: "rgba(220,38,38,0.06)", border: "rgba(220,38,38,0.30)", color: "#B91C1C",
        icon: XCircle,
        title: "Verification rejected",
        body: req.rejection_reason || "You can re-apply with updated documents.",
      };
    }
    return {
      bg: "var(--surface-2)", border: "var(--border)", color: "var(--text-2)",
      icon: ShieldCheck, title: req.status, body: "",
    };
  })();

  const Icon = statusUI.icon;

  return (
    <>
      <div
        className="p-3 rounded-xl"
        style={{ background: statusUI.bg, border: `1px solid ${statusUI.border}` }}
      >
        <div className="flex items-start gap-2.5">
          <Icon className="w-4 h-4 mt-0.5 shrink-0" style={{ color: statusUI.color }} />
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-bold" style={{ color: statusUI.color }}>{statusUI.title}</p>
            {statusUI.body && (
              <p className="text-[11px] mt-0.5" style={{ color: "var(--text-2)" }}>{statusUI.body}</p>
            )}
            {req.requested_role && (
              <p className="text-[11px] mt-0.5" style={{ color: "var(--text-3)" }}>Role: {req.requested_role}</p>
            )}
            {req.status === "rejected" && (
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="mt-2 inline-flex items-center gap-1 h-7 px-2.5 rounded-lg text-[11px] font-bold cursor-pointer"
                style={{ background: "var(--brand)", color: "#fff" }}
              >
                <RefreshCw className="w-3 h-3" /> Re-apply
              </button>
            )}
          </div>
        </div>
      </div>
      <GetVerifiedModal open={open} onClose={() => setOpen(false)} onSubmitted={refresh} />
    </>
  );
}

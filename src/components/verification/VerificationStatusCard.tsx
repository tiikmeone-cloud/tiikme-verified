/**
 * VerificationStatusCard
 * Shows the current user's verification state with clear next-step guidance.
 * - If user has no experience/education → prompt to fill profile first
 * - If has experience → CTA shows those orgs as quick-pick suggestions
 * - While pending → shows status with org name
 * - If verified → green "Verified" card
 * - If rejected → red card with re-apply button
 */
import { useEffect, useState } from "react";
import { ShieldCheck, Clock, XCircle, RefreshCw, CheckCircle2, Info, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import GetVerifiedModal from "./GetVerifiedModal";
import { Link } from "react-router-dom";

type Req = {
  id: string;
  status: string;
  requested_role: string | null;
  rejection_reason: string | null;
  requested_doc_message: string | null;
  created_at: string;
  org_id: string | null;
  review_queue: string;
  org_name?: string | null;
};

export type ExpSuggestion = {
  company_name: string;
  job_title: string;
  org?: { id: string; name: string; slug: string; logo_url: string | null } | null;
};

export default function VerificationStatusCard() {
  const { user } = useAuth();
  const [req, setReq] = useState<Req | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<ExpSuggestion[]>([]);
  const [hasProfileFields, setHasProfileFields] = useState(true);

  const refresh = async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);

    const [{ data: prof }, { data: latest }, { data: workItems }] = await Promise.all([
      supabase.from("profiles").select("is_verified").eq("id", user.id).maybeSingle(),
      supabase
        .from("verification_requests")
        .select("id, status, requested_role, rejection_reason, requested_doc_message, created_at, org_id, review_queue")
        .eq("requester_id", user.id)
        .eq("entity_type", "user_org")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("work_items")
        .select("id, company_name, job_title, item_type, is_current")
        .eq("owner_id", user.id)
        .in("item_type", ["experience", "education"])
        .order("is_current", { ascending: false })
        .limit(5),
    ]);

    setIsVerified(!!prof?.is_verified);

    // Check if user has any profile fields worth verifying
    const expItems = (workItems || []).filter((w: any) => w.item_type === "experience");
    const eduItems = (workItems || []).filter((w: any) => w.item_type === "education");
    setHasProfileFields(expItems.length > 0 || eduItems.length > 0);

    // Build suggestions: try to match each experience company to an org in DB
    const rawSuggestions: ExpSuggestion[] = [];
    for (const item of (workItems || [])) {
      const name = item.company_name || "";
      if (!name) continue;
      const { data: org } = await supabase
        .from("organizations")
        .select("id, name, slug, logo_url")
        .ilike("name", name)
        .limit(1)
        .maybeSingle();
      rawSuggestions.push({
        company_name: name,
        job_title: item.job_title || "",
        org: org || null,
      });
    }
    setSuggestions(rawSuggestions);

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

  // Already fully verified → green card, no CTA
  if (isVerified) {
    return (
      <div className="p-3 rounded-xl" style={{ background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.30)" }}>
        <div className="flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#15803D" }} />
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-bold" style={{ color: "#15803D" }}>Verified ✓</p>
            <p className="text-[11px] mt-0.5" style={{ color: "var(--text-2)" }}>
              {req?.org_name
                ? `Your role at ${req.org_name} has been verified.`
                : "Your professional identity is verified on Tiikme."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // No request yet → check if profile has fields
  if (!req) {
    if (!hasProfileFields) {
      return (
        <div className="p-3 rounded-xl" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.25)" }}>
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#B45309" }} />
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-bold" style={{ color: "#B45309" }}>Add your role to get verified</p>
              <p className="text-[11px] mt-0.5" style={{ color: "var(--text-2)" }}>
                Add at least one experience or education entry so we know what to verify.
              </p>
              <Link
                to="/app/profile"
                className="mt-2 inline-block text-[11px] font-bold"
                style={{ color: "var(--brand)" }}
              >
                Update your profile →
              </Link>
            </div>
          </div>
        </div>
      );
    }

    // Has profile fields → show CTA
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
            <p className="text-[13px] font-bold" style={{ color: "var(--text-1)" }}>Verify your role</p>
            <p className="text-[11px]" style={{ color: "var(--text-2)" }}>
              {suggestions.length > 0
                ? `Request verification at ${suggestions[0].company_name}${suggestions.length > 1 ? ` or ${suggestions.length - 1} other${suggestions.length > 2 ? "s" : ""}` : ""}.`
                : "Request workplace or institution verification."}
            </p>
          </div>
        </button>
        <GetVerifiedModal open={open} onClose={() => setOpen(false)} onSubmitted={refresh} suggestions={suggestions} />
      </>
    );
  }

  // Has request — determine state
  const daysUntilExpiry = req ? (() => {
    const created = new Date(req.created_at).getTime();
    const expiresAt = created + 30 * 24 * 60 * 60 * 1000;
    return Math.max(0, Math.ceil((expiresAt - Date.now()) / (24 * 60 * 60 * 1000)));
  })() : null;

  const statusUI = (() => {
    if (req.status === "expired") {
      return {
        bg: "rgba(107,114,128,0.08)", border: "rgba(107,114,128,0.30)", color: "#6B7280",
        icon: Clock,
        title: "Verification request expired",
        body: "No response was received within 30 days. You can submit a new request at any time.",
        nextStep: "",
        showReapply: true,
      };
    }
    if (req.status === "pending") {
      const expiryNote = daysUntilExpiry !== null && daysUntilExpiry <= 7
        ? ` Expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? "s" : ""} if no response.`
        : "";
      if (req.review_queue === "platform") {
        return {
          bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.30)", color: "#B45309",
          icon: Clock,
          title: "Awaiting Tiikme platform review",
          body: req.org_name
            ? `We couldn't route this to an independent reviewer at ${req.org_name}, so Tiikme will review it.`
            : "Tiikme will review this request directly.",
          nextStep: `No action needed. Check back here for updates.${expiryNote}`,
          showReapply: false,
        };
      }
      return {
        bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.30)", color: "#B45309",
        icon: Clock,
        title: "Pending organisation review",
        body: req.org_name ? `Sent to ${req.org_name} for review.` : "Awaiting organisation review.",
        nextStep: `You'll be notified once the organisation responds.${expiryNote}`,
        showReapply: false,
      };
    }
    if (req.status === "more_info_requested") {
      return {
        bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.30)", color: "#B45309",
        icon: Info,
        title: "More information requested",
        body: req.requested_doc_message || "A reviewer asked for more supporting information.",
        nextStep: "Reopen the request and upload the proof or details asked for.",
        showReapply: true,
      };
    }
    if (req.status === "rejected") {
      return {
        bg: "rgba(220,38,38,0.06)", border: "rgba(220,38,38,0.30)", color: "#B91C1C",
        icon: XCircle,
        title: "Not approved",
        body: req.rejection_reason || "This request was not approved.",
        nextStep: "Review the reason, update your documents or role details, and re-apply.",
        showReapply: true,
      };
    }
    return {
      bg: "var(--surface-2)", border: "var(--border)", color: "var(--text-2)",
      icon: ShieldCheck, title: req.status, body: "", nextStep: "", showReapply: false,
    };
  })();

  const Icon = statusUI.icon;

  return (
    <>
      <div className="p-3 rounded-xl" style={{ background: statusUI.bg, border: `1px solid ${statusUI.border}` }}>
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
            {statusUI.nextStep && (
              <p className="text-[11px] mt-2" style={{ color: "var(--text-2)" }}>{statusUI.nextStep}</p>
            )}
            {statusUI.showReapply && (
              <div className="flex gap-2 flex-wrap mt-2">
                {req.status === "more_info_requested" ? (
                  <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg text-[11px] font-bold cursor-pointer"
                    style={{ background: "var(--brand)", color: "#fff" }}
                  >
                    <RefreshCw className="w-3 h-3" /> Add more info
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg text-[11px] font-bold cursor-pointer"
                    style={{ background: "var(--brand)", color: "#fff" }}
                  >
                    <RefreshCw className="w-3 h-3" /> Re-apply
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <GetVerifiedModal
        open={open}
        onClose={() => setOpen(false)}
        onSubmitted={refresh}
        suggestions={suggestions}
        amendRequestId={req?.status === "more_info_requested" ? req.id : undefined}
      />
    </>
  );
}

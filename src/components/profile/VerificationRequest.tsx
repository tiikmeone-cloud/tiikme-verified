import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  Send,
  ShieldCheck,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  domainsMatch,
  extractDomain,
  sendWorkEmailOtp,
  verifyWorkEmailOtp,
} from "@/lib/verificationOtp";

interface VerificationRequestProps {
  item: any;
  itemType: "experience" | "project" | "education" | "achievement";
  onStatusChange: (itemId: string, status: string, verifierName?: string) => void;
}

type Step = "ask_current" | "otp_email" | "otp_code" | "org_review" | "done";

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 9999,
  background: "rgba(26,26,78,0.45)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 16,
};

const cardStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 480,
  borderRadius: 24,
  background: "#fff",
  border: "1px solid rgba(0,0,0,0.08)",
  boxShadow: "0 32px 80px rgba(26,26,78,0.18)",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
};

export default function VerificationRequest({ item, itemType, onStatusChange }: VerificationRequestProps) {
  const { user, profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("ask_current");
  const [matchedOrg, setMatchedOrg] = useState<any>(null);
  const [orgLoading, setOrgLoading] = useState(false);

  const [workEmail, setWorkEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [note, setNote] = useState("");

  const companyName =
    item.company_name ||
    item.institution_name ||
    item.institution_name_edu ||
    "this organisation";

  const orgDomain = matchedOrg?.email_domain?.trim().toLowerCase() || "";
  const emailLooksValid = /\S+@\S+\.\S+/.test(workEmail.trim());
  const emailDomainMatches = emailLooksValid && orgDomain ? domainsMatch(workEmail.trim(), orgDomain) : false;

  // Load matched org whenever modal opens
  useEffect(() => {
    if (!open || itemType === "achievement") return;
    let cancelled = false;
    setOrgLoading(true);
    (async () => {
      const exact = await supabase
        .from("organizations")
        .select("id, name, email_domain")
        .ilike("name", companyName)
        .limit(1)
        .maybeSingle();
      if (!cancelled && exact.data) { setMatchedOrg(exact.data); setOrgLoading(false); return; }
      const loose = await supabase
        .from("organizations")
        .select("id, name, email_domain")
        .ilike("name", `%${companyName}%`)
        .limit(1)
        .maybeSingle();
      if (!cancelled) { setMatchedOrg(loose.data || null); setOrgLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [open, companyName, itemType]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") resetAndClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", handler); document.body.style.overflow = ""; };
  }, [open]);

  const resetAndClose = () => {
    setOpen(false);
    setStep("ask_current");
    setWorkEmail(""); setOtp("");
    setNote("");
  };

  const updateVerifiedState = async (status: "verified" | "pending") => {
    if (!user || itemType === "achievement") return;
    await supabase.from("work_items").update({
      verification_status: status,
      verified_at: status === "verified" ? new Date().toISOString() : null,
    }).eq("id", item.id).eq("owner_id", user.id);
    onStatusChange(item.id, status);
  };

  const createVerifRequest = async (status: "pending" | "approved", verifierEmail?: string, message?: string) => {
    if (!user || itemType === "achievement") return;
    await supabase.from("item_verification_requests").insert({
      requester_id: user.id,
      work_item_id: item.id,
      org_id: matchedOrg?.id || null,
      verifier_email: verifierEmail || null,
      status,
      message: message || null,
    });
  };

  // Step: Send OTP to work email
  const handleSendOtp = async () => {
    if (!emailDomainMatches) {
      toast.error(`Use your ${orgDomain || "company"} work email`);
      return;
    }
    setSendingOtp(true);
    const result = await sendWorkEmailOtp(workEmail.trim().toLowerCase());
    setSendingOtp(false);
    if (!result.ok) { toast.error(result.error || "Could not send code"); return; }
    toast.success(`Verification code sent to ${workEmail.trim().toLowerCase()}`);
    setStep("otp_code");
  };

  // Step: Verify OTP → instant verification
  const handleVerifyOtp = async () => {
    if (otp.trim().length !== 6) return;
    setVerifyingOtp(true);
    const result = await verifyWorkEmailOtp(workEmail.trim().toLowerCase(), otp.trim());
    if (!result.ok) {
      setVerifyingOtp(false);
      toast.error(result.error || "Invalid code. Try again.");
      return;
    }
    try {
      await createVerifRequest("approved", workEmail.trim().toLowerCase(), `Verified via work email OTP (${extractDomain(workEmail)})`);
      await updateVerifiedState("verified");
      toast.success(`Role verified at ${companyName}! ✓`);
      setStep("done");
      setTimeout(resetAndClose, 1800);
    } catch (e: any) {
      toast.error(e?.message || "Could not complete verification");
    } finally {
      setVerifyingOtp(false);
    }
  };

  // Step: Request org review (for past employees or if no domain match)
  const handleOrgReview = async () => {
    if (!user) return;
    setSubmittingRequest(true);
    try {
      // Notify org admins if org is on Tiikme
      if (matchedOrg?.id) {
        const { data: adminRows } = await supabase
          .from("org_admins").select("user_id").eq("org_id", matchedOrg.id);
        const toNotify = (adminRows || []).map((a: any) => a.user_id).filter((id: string) => id !== user.id);
        const notifInserts = toNotify.map((uid: string) => ({
          user_id: uid,
          type: "verification_request",
          title: "New verification request",
          body: `${profile?.full_name || "Someone"} requested verification for "${item.job_title || item.title}" at ${companyName}.`,
          action_url: "/app/verification-inbox",
          data: { org_id: matchedOrg.id, requester_id: user.id },
        }));
        if (notifInserts.length > 0) await supabase.from("notifications").insert(notifInserts);
      }
      await createVerifRequest("pending", undefined, note.trim() || undefined);
      await updateVerifiedState("pending");
      toast.success("Verification request sent — you'll be notified once reviewed");
      setStep("done");
      setTimeout(resetAndClose, 1800);
    } catch (e: any) {
      toast.error(e?.message || "Could not submit request");
    } finally {
      setSubmittingRequest(false);
    }
  };

  // ── Badge states (when modal is closed) ──
  if (item.verification_status === "verified") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0"
        style={{ background: "rgba(34,197,94,0.10)", color: "#15803D", border: "1px solid rgba(34,197,94,0.30)" }}>
        <CheckCircle className="w-3 h-3" /> Verified
      </span>
    );
  }
  if (item.verification_status === "pending") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0"
        style={{ background: "rgba(245,158,11,0.10)", color: "#D97706", border: "1px solid rgba(245,158,11,0.25)" }}>
        <Clock className="w-3 h-3" /> Pending review
      </span>
    );
  }
  if (itemType === "achievement") return null;

  return (
    <div className="shrink-0">
      <button type="button" onClick={() => { setOpen(true); setStep("ask_current"); }}
        className="inline-flex items-center gap-1 text-[10px] font-bold px-3 py-1 rounded-full cursor-pointer transition-all hover:shadow-md"
        style={{ color: "#E8733A", border: "1.5px solid #E8733A", background: "transparent" }}>
        <ShieldCheck className="w-3 h-3" /> Verify
      </button>

      {open && createPortal(
        <div style={overlayStyle} onClick={resetAndClose}>
          <div style={cardStyle} onClick={e => e.stopPropagation()}>

            {/* ── Header ── */}
            <div className="flex items-center gap-3 shrink-0"
              style={{ padding: "16px 20px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
              {step !== "ask_current" && step !== "done" && (
                <button type="button" onClick={() => setStep("ask_current")} className="cursor-pointer p-1" style={{ color: "#9CA3C0" }}>
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "rgba(232,115,58,0.10)" }}>
                  <ShieldCheck className="w-4 h-4" style={{ color: "#E8733A" }} />
                </div>
                <div className="min-w-0">
                  <p className="font-bold truncate" style={{ fontSize: 15, color: "#1A1A2E" }}>
                    Verify {itemType === "education" ? "your education" : "your role"}
                  </p>
                  <p className="text-xs truncate" style={{ color: "#9CA3C0" }}>
                    {item.job_title || item.title} · {companyName}
                    {orgLoading ? " · matching…" : orgDomain ? ` · ${orgDomain}` : ""}
                  </p>
                </div>
              </div>
              <button type="button" onClick={resetAndClose} className="p-1.5 cursor-pointer" style={{ color: "#9CA3C0" }}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ── Body ── */}
            <div style={{ padding: "24px 20px 28px" }}>

              {/* STEP 1: Are you currently working here? */}
              {step === "ask_current" && (
                <div>
                  <p className="text-[14px] font-semibold mb-1" style={{ color: "#1A1A2E" }}>
                    Are you currently working at {companyName}?
                  </p>
                  <p className="text-[12px] mb-5" style={{ color: "#9CA3C0" }}>
                    This determines the fastest verification path.
                  </p>
                  <div className="flex flex-col gap-3">
                    <button type="button"
                      onClick={() => setStep(orgDomain ? "otp_email" : "org_review")}
                      className="w-full rounded-2xl p-4 text-left cursor-pointer transition-all hover:shadow-md"
                      style={{ border: "1.5px solid rgba(232,115,58,0.35)", background: "rgba(232,115,58,0.04)" }}>
                      <p className="text-[14px] font-bold" style={{ color: "#E8733A" }}>Yes, I currently work here</p>
                      <p className="text-[12px] mt-0.5" style={{ color: "#9CA3C0" }}>
                        {orgDomain
                          ? `Verify instantly using your ${orgDomain} work email`
                          : "We'll send your request to the organisation for approval"}
                      </p>
                    </button>
                    <button type="button"
                      onClick={() => setStep("org_review")}
                      className="w-full rounded-2xl p-4 text-left cursor-pointer transition-all hover:shadow-md"
                      style={{ border: "1px solid rgba(0,0,0,0.08)", background: "#fff" }}>
                      <p className="text-[14px] font-bold" style={{ color: "#1A1A2E" }}>No, I left this organisation</p>
                      <p className="text-[12px] mt-0.5" style={{ color: "#9CA3C0" }}>
                        Request organisation review — they'll verify or ask for a relieving letter
                      </p>
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2A: Enter work email */}
              {step === "otp_email" && (
                <div>
                  <p className="text-[14px] font-semibold mb-1" style={{ color: "#1A1A2E" }}>Enter your work email</p>
                  <p className="text-[12px] mb-4" style={{ color: "#9CA3C0" }}>
                    We'll send a 6-digit code to your {orgDomain} email.
                  </p>
                  <input
                    value={workEmail}
                    onChange={e => setWorkEmail(e.target.value)}
                    placeholder={orgDomain ? `you@${orgDomain}` : "you@company.com"}
                    autoFocus
                    type="email"
                    inputMode="email"
                    style={{
                      width: "100%", height: 48, borderRadius: 12,
                      border: "1.5px solid rgba(0,0,0,0.10)",
                      padding: "0 14px", fontSize: 14, color: "#1A1A2E", outline: "none",
                      marginBottom: 8,
                    }}
                  />
                  {workEmail && (
                    <p className="text-[11px] mb-4" style={{ color: emailDomainMatches ? "#16A34A" : "#EF4444" }}>
                      {emailDomainMatches
                        ? `✓ Domain matches — ready to send code`
                        : orgDomain ? `Must use @${orgDomain}` : "Domain could not be matched"}
                    </p>
                  )}
                  <button type="button"
                    disabled={sendingOtp || !emailDomainMatches}
                    onClick={handleSendOtp}
                    className="w-full h-12 rounded-2xl text-[14px] font-bold cursor-pointer disabled:opacity-50 transition-all"
                    style={{ background: emailDomainMatches ? "#E8733A" : "#E5E7EB", color: emailDomainMatches ? "#fff" : "#9CA3AF", border: "none" }}>
                    {sendingOtp ? "Sending…" : "Send verification code →"}
                  </button>
                  <button type="button" onClick={() => setStep("org_review")}
                    className="w-full mt-2 text-[12px] cursor-pointer py-1"
                    style={{ color: "#9CA3C0", background: "none", border: "none" }}>
                    Don't have access to this email? Request org review instead
                  </button>
                </div>
              )}

              {/* STEP 2B: Enter OTP code */}
              {step === "otp_code" && (
                <div>
                  <p className="text-[14px] font-semibold mb-1" style={{ color: "#1A1A2E" }}>Enter the 6-digit code</p>
                  <p className="text-[12px] mb-4" style={{ color: "#9CA3C0" }}>
                    Code sent to <strong>{workEmail}</strong>. Check your inbox.
                  </p>
                  <input
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="• • • • • •"
                    autoFocus
                    inputMode="numeric"
                    maxLength={6}
                    style={{
                      width: "100%", height: 56, borderRadius: 12,
                      border: `1.5px solid ${otp.length === 6 ? "#16A34A" : "rgba(0,0,0,0.10)"}`,
                      padding: "0 14px", fontSize: 24, letterSpacing: "0.4em",
                      textAlign: "center", color: "#1A1A2E", outline: "none",
                      marginBottom: 16, transition: "border-color 200ms",
                    }}
                  />
                  <button type="button"
                    disabled={verifyingOtp || otp.length !== 6}
                    onClick={handleVerifyOtp}
                    className="w-full h-12 rounded-2xl text-[14px] font-bold cursor-pointer disabled:opacity-50 transition-all"
                    style={{ background: otp.length === 6 ? "#E8733A" : "#E5E7EB", color: otp.length === 6 ? "#fff" : "#9CA3AF", border: "none" }}>
                    {verifyingOtp ? "Verifying…" : "Confirm & verify ✓"}
                  </button>
                  <button type="button" onClick={() => setStep("otp_email")}
                    className="w-full mt-2 text-[12px] cursor-pointer py-1"
                    style={{ color: "#9CA3C0", background: "none", border: "none" }}>
                    Resend code
                  </button>
                </div>
              )}

              {/* STEP 3: Request org review (past employee or no domain) */}
              {step === "org_review" && (
                <div>
                  <p className="text-[14px] font-semibold mb-1" style={{ color: "#1A1A2E" }}>
                    Request organisation verification
                  </p>
                  <p className="text-[12px] mb-4" style={{ color: "#9CA3C0" }}>
                    {matchedOrg
                      ? `Your request will be sent to ${companyName}'s admins on Tiikme. They may approve it directly or ask for a relieving letter.`
                      : `Since ${companyName} isn't on Tiikme, our team will review your request. We may ask for an offer or relieving letter.`}
                  </p>
                  <div className="rounded-xl p-3 mb-4" style={{ background: "rgba(232,115,58,0.06)", border: "1px solid rgba(232,115,58,0.18)" }}>
                    <p className="text-[12px] font-semibold mb-1" style={{ color: "#1A1A2E" }}>
                      {item.job_title || item.title} at {companyName}
                    </p>
                    <p className="text-[11px]" style={{ color: "#9CA3C0" }}>
                      {item.start_date ? `From ${item.start_date}` : ""}
                      {item.end_date ? ` to ${item.end_date}` : item.is_current ? " · Present" : ""}
                    </p>
                  </div>
                  <div className="mb-4">
                    <label className="block text-[12px] font-semibold mb-1.5" style={{ color: "#1A1A2E" }}>
                      Optional note to reviewer
                    </label>
                    <textarea
                      value={note}
                      onChange={e => setNote(e.target.value.slice(0, 300))}
                      placeholder="Any context that helps confirm your role…"
                      rows={3}
                      style={{
                        width: "100%", borderRadius: 12, border: "1px solid rgba(0,0,0,0.10)",
                        padding: "10px 14px", fontSize: 13, color: "#1A1A2E", outline: "none", resize: "none",
                      }}
                    />
                  </div>
                  <button type="button"
                    disabled={submittingRequest}
                    onClick={handleOrgReview}
                    className="w-full h-12 rounded-2xl text-[14px] font-bold cursor-pointer disabled:opacity-50"
                    style={{ background: "#E8733A", color: "#fff", border: "none" }}>
                    {submittingRequest ? "Submitting…" : "Submit verification request →"}
                  </button>
                </div>
              )}

              {/* STEP DONE */}
              {step === "done" && (
                <div className="text-center py-4">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
                    style={{ background: "rgba(34,197,94,0.10)" }}>
                    <CheckCircle className="w-7 h-7" style={{ color: "#16A34A" }} />
                  </div>
                  <p className="text-[16px] font-bold mb-1" style={{ color: "#1A1A2E" }}>Done!</p>
                  <p className="text-[13px]" style={{ color: "#9CA3C0" }}>
                    You'll get a notification in Alerts once reviewed.
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

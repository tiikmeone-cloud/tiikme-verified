import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  Briefcase,
  CheckCircle,
  Clock,
  Mail,
  Send,
  ShieldCheck,
  Upload,
  UserCheck,
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

type VerifyMethod = "otp" | "upload" | "manager";

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 9999,
  background: "rgba(26,26,78,0.40)",
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 16,
};

const cardStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 560,
  maxHeight: "88vh",
  borderRadius: 20,
  background: "#fff",
  border: "1px solid rgba(0,0,0,0.08)",
  boxShadow: "0 24px 80px rgba(26,26,78,0.20)",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
};

export default function VerificationRequest({ item, itemType, onStatusChange }: VerificationRequestProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<VerifyMethod>("otp");
  const [matchedOrg, setMatchedOrg] = useState<any>(null);
  const [orgLoading, setOrgLoading] = useState(false);

  const [workEmail, setWorkEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const [offerFile, setOfferFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const [managerEmail, setManagerEmail] = useState("");
  const [managerNote, setManagerNote] = useState("");
  const [submittingManager, setSubmittingManager] = useState(false);

  const companyName =
    item.company_name ||
    item.institution_name ||
    item.institution_name_edu ||
    "this company";

  const titleText =
    itemType === "education"
      ? `Verify your education at ${companyName}`
      : itemType === "project"
        ? `Verify your project at ${companyName}`
        : `Verify your role at ${companyName}`;

  const orgDomain = matchedOrg?.email_domain?.trim().toLowerCase() || "";
  const emailLooksValid = /\S+@\S+\.\S+/.test(workEmail.trim());
  const emailDomainMatches = emailLooksValid && orgDomain ? domainsMatch(workEmail.trim(), orgDomain) : false;

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      if (!companyName || itemType === "achievement") return;
      setOrgLoading(true);
      const exact = await supabase
        .from("organizations")
        .select("id, name, email_domain")
        .ilike("name", companyName)
        .limit(1)
        .maybeSingle();

      if (!cancelled && exact.data) {
        setMatchedOrg(exact.data);
        setOrgLoading(false);
        return;
      }

      const loose = await supabase
        .from("organizations")
        .select("id, name, email_domain")
        .ilike("name", `%${companyName}%`)
        .limit(1)
        .maybeSingle();

      if (!cancelled) {
        setMatchedOrg(loose.data || null);
        setOrgLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, companyName, itemType]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [open]);

  const resetAndClose = () => {
    setOpen(false);
    setMethod("otp");
    setWorkEmail("");
    setOtp("");
    setOtpSent(false);
    setOfferFile(null);
    setManagerEmail("");
    setManagerNote("");
  };

  const updateVerifiedState = async (status: "verified" | "pending") => {
    if (!user || itemType === "achievement") return;
    const patch: any = {
      verification_status: status,
      verified_at: status === "verified" ? new Date().toISOString() : null,
    };
    const { error } = await supabase
      .from("work_items")
      .update(patch)
      .eq("id", item.id)
      .eq("owner_id", user.id);

    if (error) throw error;
    onStatusChange(item.id, status);
  };

  const createVerificationRequest = async ({
    status,
    verifierEmail,
    message,
  }: {
    status: "pending" | "approved";
    verifierEmail?: string | null;
    message?: string | null;
  }) => {
    if (!user || itemType === "achievement") return;
    const { error } = await supabase.from("item_verification_requests").insert({
      requester_id: user.id,
      work_item_id: item.id,
      org_id: matchedOrg?.id || null,
      verifier_email: verifierEmail || null,
      status,
      message: message || null,
    });
    if (error) throw error;
  };

  const handleSendOtp = async () => {
    if (!orgDomain) {
      toast.error("No verified company domain found for this role yet.");
      return;
    }
    if (!emailDomainMatches) {
      toast.error(`Use your ${orgDomain} work email to continue.`);
      return;
    }

    setSendingOtp(true);
    const result = await sendWorkEmailOtp(workEmail.trim().toLowerCase());
    setSendingOtp(false);
    if (!result.ok) {
      toast.error(result.error || "Could not send verification code.");
      return;
    }
    setOtpSent(true);
    toast.success(`Verification code sent to ${workEmail.trim().toLowerCase()}`);
  };

  const handleVerifyOtp = async () => {
    if (!otpSent || otp.trim().length !== 6) return;
    setVerifyingOtp(true);
    const result = await verifyWorkEmailOtp(workEmail.trim().toLowerCase(), otp.trim());
    if (!result.ok) {
      setVerifyingOtp(false);
      toast.error(result.error || "Invalid verification code.");
      return;
    }

    try {
      await createVerificationRequest({
        status: "approved",
        verifierEmail: workEmail.trim().toLowerCase(),
        message: `Verified via work email OTP (${extractDomain(workEmail)})`,
      });
      await updateVerifiedState("verified");
      toast.success(`Role verified at ${companyName}!`);
      resetAndClose();
    } catch (error: any) {
      toast.error(error?.message || "Could not complete verification.");
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleOfferUpload = async () => {
    if (!user || !offerFile) {
      toast.error("Attach your offer letter first.");
      return;
    }
    setUploading(true);
    try {
      const ext = offerFile.name.split(".").pop() || "pdf";
      const path = `role-verification/${user.id}/${item.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("verification-docs")
        .upload(path, offerFile, { upsert: false, contentType: offerFile.type || undefined });
      if (uploadError) throw uploadError;

      await createVerificationRequest({
        status: "pending",
        message: `Offer letter uploaded to verification-docs: ${path}`,
      });
      await updateVerifiedState("pending");
      toast.success(`Verification submitted for ${companyName}.`);
      resetAndClose();
    } catch (error: any) {
      toast.error(error?.message || "Could not submit offer letter.");
    } finally {
      setUploading(false);
    }
  };

  const handleManagerReference = async () => {
    if (!user) return;
    const email = managerEmail.trim().toLowerCase();
    if (!/\S+@\S+\.\S+/.test(email)) {
      toast.error("Enter a valid manager email.");
      return;
    }

    setSubmittingManager(true);
    try {
      await createVerificationRequest({
        status: "pending",
        verifierEmail: email,
        message: managerNote.trim()
          ? `Manager reference requested. Note: ${managerNote.trim()}`
          : "Manager reference requested.",
      });
      await updateVerifiedState("pending");
      toast.success("Manager reference request submitted.");
      resetAndClose();
    } catch (error: any) {
      toast.error(error?.message || "Could not submit manager reference.");
    } finally {
      setSubmittingManager(false);
    }
  };

  const methodCards = useMemo(() => ([
    {
      key: "otp" as const,
      title: "Work email OTP",
      subtitle: orgDomain ? `Instant verification using ${orgDomain}` : "Needs a matched company domain",
      icon: ShieldCheck,
    },
    {
      key: "upload" as const,
      title: "Upload offer letter",
      subtitle: "Submit proof for review",
      icon: Upload,
    },
    {
      key: "manager" as const,
      title: "Manager reference",
      subtitle: "Send a reference request",
      icon: UserCheck,
    },
  ]), [orgDomain]);

  if (item.verification_status === "verified") {
    return (
      <span
        className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0"
        style={{ background: "rgba(34,197,94,0.10)", color: "#15803D", border: "1px solid rgba(34,197,94,0.30)" }}
      >
        <CheckCircle className="w-3 h-3" /> Verified
      </span>
    );
  }

  if (item.verification_status === "pending") {
    return (
      <span
        className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0"
        style={{ background: "rgba(245,158,11,0.10)", color: "#D97706", border: "1px solid rgba(245,158,11,0.25)" }}
      >
        <Clock className="w-3 h-3" /> Pending
      </span>
    );
  }

  if (itemType === "achievement") return null;

  return (
    <div className="shrink-0">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-[10px] font-bold px-3 py-1 rounded-full cursor-pointer transition-all hover:shadow-md"
        style={{ color: "#E8733A", border: "1.5px solid #E8733A", background: "transparent" }}
      >
        Verify
      </button>

      {open && createPortal(
        <div style={overlayStyle} onClick={resetAndClose}>
          <div style={cardStyle} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 shrink-0" style={{ padding: "14px 20px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
              <button type="button" onClick={resetAndClose} className="cursor-pointer p-1" style={{ color: "#1A1A2E" }}>
                <ArrowLeft className="w-5 h-5" />
              </button>
              <p className="flex-1 truncate" style={{ fontSize: 16, fontWeight: 700, color: "#1A1A2E" }}>{titleText}</p>
              <button type="button" onClick={resetAndClose} className="p-1 cursor-pointer" style={{ color: "#9CA3C0" }}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="shrink-0" style={{ padding: "10px 20px", background: "rgba(0,0,0,0.02)", borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#1A1A2E" }}>{item.job_title || item.title}</p>
              <p style={{ fontSize: 12, color: "#9CA3C0" }}>
                {companyName}
                {orgDomain ? ` · ${orgDomain}` : orgLoading ? " · matching company..." : " · no company domain found"}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto" style={{ padding: "16px 20px 20px" }}>
              <div className="grid gap-2 md:grid-cols-3">
                {methodCards.map(({ key, title, subtitle, icon: Icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setMethod(key)}
                    className="text-left rounded-2xl p-3 transition-all cursor-pointer"
                    style={{
                      border: method === key ? "1.5px solid #E8733A" : "1px solid rgba(0,0,0,0.08)",
                      background: method === key ? "rgba(232,115,58,0.05)" : "#fff",
                    }}
                  >
                    <Icon className="w-4 h-4 mb-2" style={{ color: method === key ? "#E8733A" : "#6B7094" }} />
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#1A1A2E" }}>{title}</p>
                    <p style={{ fontSize: 11, color: "#9CA3C0", marginTop: 2 }}>{subtitle}</p>
                  </button>
                ))}
              </div>

              {method === "otp" && (
                <div className="mt-4 space-y-3">
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#1A1A2E", marginBottom: 6 }}>Work email</label>
                    <input
                      value={workEmail}
                      onChange={(e) => setWorkEmail(e.target.value)}
                      placeholder={orgDomain ? `you@${orgDomain}` : "you@company.com"}
                      style={{ width: "100%", height: 42, borderRadius: 10, border: "1px solid rgba(0,0,0,0.10)", padding: "0 12px", fontSize: 13, color: "#1A1A2E", outline: "none" }}
                    />
                    {!!workEmail && (
                      <p style={{ fontSize: 11, marginTop: 6, color: emailDomainMatches ? "#16A34A" : "#EF4444" }}>
                        {orgDomain
                          ? emailDomainMatches
                            ? "Domain matched. You can send a verification code."
                            : `Email must match ${orgDomain}`
                          : "OTP is available after a company domain is matched."}
                      </p>
                    )}
                  </div>
                  {otpSent && (
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#1A1A2E", marginBottom: 6 }}>Enter 6-digit code</label>
                      <input
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="123456"
                        inputMode="numeric"
                        maxLength={6}
                        style={{ width: "100%", height: 42, borderRadius: 10, border: "1px solid rgba(0,0,0,0.10)", padding: "0 12px", fontSize: 18, letterSpacing: "0.35em", textAlign: "center", color: "#1A1A2E", outline: "none" }}
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={sendingOtp || !emailDomainMatches}
                      onClick={handleSendOtp}
                      style={{
                        height: 40, padding: "0 16px", borderRadius: 10, fontSize: 13, fontWeight: 600,
                        background: emailDomainMatches ? "#FFF3EC" : "#F3F4F6",
                        color: emailDomainMatches ? "#E8733A" : "#9CA3AF",
                        border: "1px solid rgba(232,115,58,0.18)",
                      }}
                    >
                      {sendingOtp ? "Sending..." : "Send OTP"}
                    </button>
                    <button
                      type="button"
                      disabled={verifyingOtp || otp.length !== 6}
                      onClick={handleVerifyOtp}
                      style={{
                        height: 40, padding: "0 16px", borderRadius: 10, fontSize: 13, fontWeight: 700,
                        background: otp.length === 6 ? "linear-gradient(135deg, #E8733A, #FF6B9D)" : "#E5E7EB",
                        color: otp.length === 6 ? "#fff" : "#9CA3AF",
                        border: "none",
                      }}
                    >
                      {verifyingOtp ? "Verifying..." : "Confirm & verify"}
                    </button>
                  </div>
                </div>
              )}

              {method === "upload" && (
                <div className="mt-4 space-y-3">
                  <div
                    style={{
                      border: "1.5px dashed rgba(232,115,58,0.35)",
                      borderRadius: 14,
                      padding: 16,
                      background: "rgba(232,115,58,0.03)",
                    }}
                  >
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#1A1A2E", marginBottom: 8 }}>Upload offer letter</label>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.webp"
                      onChange={(e) => setOfferFile(e.target.files?.[0] || null)}
                      style={{ fontSize: 13, color: "#1A1A2E" }}
                    />
                    <p style={{ fontSize: 11, color: "#9CA3C0", marginTop: 8 }}>
                      Your file will be stored in the verification documents bucket and submitted for review.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={!offerFile || uploading}
                    onClick={handleOfferUpload}
                    style={{
                      height: 40, padding: "0 16px", borderRadius: 10, fontSize: 13, fontWeight: 700,
                      background: offerFile ? "linear-gradient(135deg, #E8733A, #FF6B9D)" : "#E5E7EB",
                      color: offerFile ? "#fff" : "#9CA3AF",
                      border: "none",
                    }}
                  >
                    {uploading ? "Submitting..." : "Submit offer letter"}
                  </button>
                </div>
              )}

              {method === "manager" && (
                <div className="mt-4 space-y-3">
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#1A1A2E", marginBottom: 6 }}>Manager email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#9CA3C0" }} />
                      <input
                        value={managerEmail}
                        onChange={(e) => setManagerEmail(e.target.value)}
                        placeholder="manager@company.com"
                        style={{ width: "100%", height: 42, borderRadius: 10, border: "1px solid rgba(0,0,0,0.10)", padding: "0 12px 0 38px", fontSize: 13, color: "#1A1A2E", outline: "none" }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#1A1A2E", marginBottom: 6 }}>Optional note</label>
                    <textarea
                      value={managerNote}
                      onChange={(e) => setManagerNote(e.target.value.slice(0, 240))}
                      placeholder="Add context for the reviewer..."
                      rows={3}
                      style={{ width: "100%", borderRadius: 10, border: "1px solid rgba(0,0,0,0.10)", padding: 12, fontSize: 13, color: "#1A1A2E", outline: "none", resize: "vertical" }}
                    />
                  </div>
                  <button
                    type="button"
                    disabled={submittingManager || !managerEmail.trim()}
                    onClick={handleManagerReference}
                    style={{
                      height: 40, padding: "0 16px", borderRadius: 10, fontSize: 13, fontWeight: 700,
                      background: managerEmail.trim() ? "linear-gradient(135deg, #E8733A, #FF6B9D)" : "#E5E7EB",
                      color: managerEmail.trim() ? "#fff" : "#9CA3AF",
                      border: "none",
                    }}
                  >
                    {submittingManager ? "Submitting..." : "Send manager reference"}
                  </button>
                </div>
              )}
            </div>

            <div className="shrink-0" style={{ padding: "12px 20px", borderTop: "1px solid rgba(0,0,0,0.06)", background: "#fff" }}>
              <p style={{ fontSize: 11, color: "#9CA3C0", lineHeight: "16px" }}>
                Work email OTP can verify instantly when the company domain matches. Offer letter and manager reference requests are submitted for review using the existing verification request table.
              </p>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

/**
 * VerifyEmployerDialog
 * 4-step wizard: pick org → enter role → enter work email → OTP verify.
 * Decentralized: NO Tiikme-staff approval. Admins of the org endorse.
 */
import { useState, useEffect, useRef } from "react";
import { Search, Building2, Check, Mail, ShieldCheck, ArrowLeft } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  domainsMatch,
  extractDomain,
  isDisposableDomain,
  sendWorkEmailOtp,
  verifyWorkEmailOtp,
} from "@/lib/verificationOtp";
import { sendNotification } from "@/lib/notify";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultOrgId?: string;
  defaultRole?: string;
}

type Org = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  email_domain: string | null;
  type: string | null;
};

export default function VerifyEmployerDialog({ open, onOpenChange, defaultOrgId, defaultRole }: Props) {
  const { user } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Org[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Org | null>(null);
  const [role, setRole] = useState("");
  const [workEmail, setWorkEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const otpInputRef = useRef<HTMLInputElement>(null);

  // Reset on open
  useEffect(() => {
    if (open) {
      setStep(defaultOrgId ? 2 : 1);
      setSearch("");
      setResults([]);
      setRole(defaultRole || "");
      setWorkEmail("");
      setOtp("");
      if (defaultOrgId) {
        supabase.from("organizations").select("id,name,slug,logo_url,email_domain,type")
          .eq("id", defaultOrgId).maybeSingle()
          .then(({ data }) => { if (data) setSelectedOrg(data as Org); });
      } else {
        setSelectedOrg(null);
      }
    }
  }, [open, defaultOrgId, defaultRole]);

  // Org search (debounced)
  useEffect(() => {
    if (step !== 1) return;
    const t = setTimeout(async () => {
      if (search.trim().length < 2) { setResults([]); return; }
      const { data } = await supabase
        .from("organizations")
        .select("id,name,slug,logo_url,email_domain,type")
        .ilike("name", `%${search.trim()}%`)
        .limit(10);
      setResults((data as Org[]) || []);
    }, 200);
    return () => clearTimeout(t);
  }, [search, step]);

  // Resend cooldown
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setInterval(() => setResendIn(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [resendIn]);

  // Focus OTP field when on step 4
  useEffect(() => {
    if (step === 4) setTimeout(() => otpInputRef.current?.focus(), 60);
  }, [step]);

  const handleSendCode = async () => {
    if (!user || !selectedOrg) return;
    if (!workEmail.includes("@")) { toast.info("Enter a valid email"); return; }
    if (await isDisposableDomain(workEmail)) {
      toast.error("Disposable email domains aren't allowed");
      return;
    }
    if (selectedOrg.email_domain && !domainsMatch(workEmail, selectedOrg.email_domain)) {
      toast.error(`Email must end with @${selectedOrg.email_domain}`);
      return;
    }
    setSending(true);
    const res = await sendWorkEmailOtp(workEmail);
    setSending(false);
    if (!res.ok) { toast.error(res.error || "Couldn't send code"); return; }
    toast.success("Code sent — check your work inbox");
    setResendIn(45);
    setStep(4);
  };

  const handleVerify = async () => {
    if (!user || !selectedOrg) return;
    if (otp.replace(/\D/g, "").length !== 6) { toast.info("Enter the 6-digit code"); return; }
    setVerifying(true);
    const res = await verifyWorkEmailOtp(workEmail, otp.replace(/\D/g, ""));
    if (!res.ok) {
      setVerifying(false);
      toast.error(res.error || "Invalid code");
      return;
    }

    // Insert / upsert verification request
    const payload = {
      requester_id: user.id,
      org_id: selectedOrg.id,
      requested_role: role.trim(),
      work_email: workEmail.trim().toLowerCase(),
      email_verified: true,
      status: "pending" as const,
    };
    const { error: upErr } = await supabase
      .from("employer_endorsement_requests")
      .upsert(payload, { onConflict: "requester_id,org_id,requested_role" });

    if (upErr) {
      setVerifying(false);
      toast.error("Couldn't submit: " + upErr.message);
      return;
    }

    // Notify all admins of the org
    const { data: admins } = await supabase
      .from("org_admins")
      .select("user_id")
      .eq("org_id", selectedOrg.id)
      .in("role", ["owner", "admin"]);

    for (const a of admins || []) {
      sendNotification({
        userId: a.user_id,
        actorId: user.id,
        type: "verification_request",
        title: `New verification request for ${selectedOrg.name}`,
        body: `Someone proved @${extractDomain(workEmail)} ownership and is requesting endorsement as "${role}".`,
        actionUrl: `/app/alerts`,
        data: { org_id: selectedOrg.id, org_name: selectedOrg.name, requested_role: role },
      });
    }

    setVerifying(false);
    setStep(5);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" style={{ color: "var(--brand)" }} />
            {step === 5 ? "Submitted!" : "Verify your employment"}
          </DialogTitle>
        </DialogHeader>

        {/* Step 1: Pick org */}
        {step === 1 && (
          <div className="space-y-3">
            <p className="text-[13px]" style={{ color: "var(--text-2)" }}>
              Search for your organisation. We'll route the verification to its admins — not Tiikme staff.
            </p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-3)" }} />
              <Input
                placeholder="Search company, college, hospital..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
                autoFocus
              />
            </div>
            <div className="max-h-[280px] overflow-y-auto space-y-1.5">
              {results.map(org => (
                <button
                  key={org.id}
                  type="button"
                  onClick={() => { setSelectedOrg(org); setStep(2); }}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-colors"
                  style={{ background: "var(--surface-2)", border: "1px solid var(--border)", cursor: "pointer" }}
                >
                  <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 flex items-center justify-center" style={{ background: "var(--brand-dim)" }}>
                    {org.logo_url
                      ? <img src={org.logo_url} alt="" className="w-full h-full object-cover" />
                      : <Building2 className="w-4 h-4" style={{ color: "var(--brand)" }} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-bold truncate" style={{ color: "var(--text-1)" }}>{org.name}</p>
                    <p className="text-[11px] truncate" style={{ color: "var(--text-3)" }}>
                      {org.email_domain || org.type || "Page"}
                    </p>
                  </div>
                </button>
              ))}
              {search.length >= 2 && results.length === 0 && (
                <div className="text-center py-6">
                  <p className="text-[13px] mb-2" style={{ color: "var(--text-3)" }}>No organisation found</p>
                  <a href="/create-page" className="text-[12px] font-bold underline" style={{ color: "var(--brand)" }}>
                    Create a Page for it →
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Role */}
        {step === 2 && selectedOrg && (
          <div className="space-y-3">
            <button type="button" onClick={() => setStep(1)} className="flex items-center gap-1 text-[12px]" style={{ color: "var(--text-2)", cursor: "pointer" }}>
              <ArrowLeft className="w-3 h-3" /> Change organisation
            </button>
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "var(--brand-dim)" }}>
              <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-white flex items-center justify-center">
                {selectedOrg.logo_url
                  ? <img src={selectedOrg.logo_url} alt="" className="w-full h-full object-cover" />
                  : <Building2 className="w-5 h-5" style={{ color: "var(--brand)" }} />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-bold truncate" style={{ color: "var(--text-1)" }}>{selectedOrg.name}</p>
                {selectedOrg.email_domain && (
                  <p className="text-[11px]" style={{ color: "var(--text-2)" }}>@{selectedOrg.email_domain}</p>
                )}
              </div>
            </div>
            <div>
              <label className="text-[12px] font-bold mb-1 block" style={{ color: "var(--text-2)" }}>Your role / title</label>
              <Input
                placeholder="e.g. SDE-2, Cardiologist, Asst. Professor"
                value={role}
                onChange={e => setRole(e.target.value)}
                autoFocus
              />
            </div>
            <Button onClick={() => setStep(3)} disabled={!role.trim()} className="w-full">
              Continue
            </Button>
          </div>
        )}

        {/* Step 3: Work email */}
        {step === 3 && selectedOrg && (
          <div className="space-y-3">
            <button type="button" onClick={() => setStep(2)} className="flex items-center gap-1 text-[12px]" style={{ color: "var(--text-2)", cursor: "pointer" }}>
              <ArrowLeft className="w-3 h-3" /> Back
            </button>
            <div>
              <label className="text-[12px] font-bold mb-1 block" style={{ color: "var(--text-2)" }}>
                Work email
                {selectedOrg.email_domain && (
                  <span className="font-normal" style={{ color: "var(--text-3)" }}> — must be @{selectedOrg.email_domain}</span>
                )}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-3)" }} />
                <Input
                  type="email"
                  placeholder={selectedOrg.email_domain ? `you@${selectedOrg.email_domain}` : "you@company.com"}
                  value={workEmail}
                  onChange={e => setWorkEmail(e.target.value)}
                  className="pl-9"
                  autoFocus
                />
              </div>
              <p className="text-[11px] mt-1.5" style={{ color: "var(--text-3)" }}>
                We'll email a 6-digit code to prove you control this address. Tiikme will never read your inbox.
              </p>
            </div>
            <Button onClick={handleSendCode} disabled={sending || !workEmail.includes("@")} className="w-full">
              {sending ? "Sending code..." : "Send code"}
            </Button>
          </div>
        )}

        {/* Step 4: OTP */}
        {step === 4 && (
          <div className="space-y-3">
            <p className="text-[13px]" style={{ color: "var(--text-2)" }}>
              We sent a 6-digit code to <strong>{workEmail}</strong>. Enter it below.
            </p>
            <Input
              ref={otpInputRef}
              inputMode="numeric"
              maxLength={6}
              placeholder="123456"
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="text-center tracking-[0.5em] font-mono text-[18px]"
            />
            <Button onClick={handleVerify} disabled={verifying || otp.length !== 6} className="w-full">
              {verifying ? "Verifying..." : "Verify & submit"}
            </Button>
            <div className="flex items-center justify-between text-[12px]">
              <button
                type="button"
                onClick={() => setStep(3)}
                style={{ color: "var(--text-2)", cursor: "pointer" }}
              >
                Wrong email?
              </button>
              <button
                type="button"
                disabled={resendIn > 0 || sending}
                onClick={async () => {
                  setSending(true);
                  const r = await sendWorkEmailOtp(workEmail);
                  setSending(false);
                  if (r.ok) { toast.success("Code resent"); setResendIn(45); }
                  else toast.error(r.error || "Couldn't resend");
                }}
                style={{ color: resendIn > 0 ? "var(--text-3)" : "var(--brand)", cursor: resendIn > 0 ? "default" : "pointer", fontWeight: 700 }}
              >
                {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend code"}
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Done */}
        {step === 5 && selectedOrg && (
          <div className="text-center py-2 space-y-3">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto" style={{ background: "rgba(16,185,129,0.15)" }}>
              <Check className="w-7 h-7" style={{ color: "#10B981" }} />
            </div>
            <h3 className="text-[16px] font-bold" style={{ color: "var(--text-1)" }}>Email verified</h3>
            <p className="text-[13px]" style={{ color: "var(--text-2)" }}>
              Your request is now in {selectedOrg.name}'s admin queue. You'll be notified when an admin endorses you.
            </p>
            <Button onClick={() => onOpenChange(false)} className="w-full">Done</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

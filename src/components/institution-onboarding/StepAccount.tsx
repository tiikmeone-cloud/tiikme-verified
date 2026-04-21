import { useState } from "react";
import { Eye, EyeOff, Building2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { InstitutionFormData } from "@/pages/JoinAsInstitution";

const PERSONAL_DOMAINS = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "rediffmail.com", "proton.me", "icloud.com", "live.com", "aol.com"];

const inputStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(255,255,255,0.15)", borderRadius: 14,
  color: "#FAFAF7", height: 48, width: "100%", padding: "0 14px", fontSize: 14,
  outline: "none",
};

interface Props {
  form: InstitutionFormData;
  update: (p: Partial<InstitutionFormData>) => void;
  onNext: () => void;
}

export default function StepAccount({ form, update, onNext }: Props) {
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const emailDomain = form.email.includes("@") ? form.email.split("@")[1].toLowerCase() : "";
  const isPersonal = PERSONAL_DOMAINS.includes(emailDomain);
  const hasValidEmail = form.email.includes("@") && emailDomain.length > 2;

  const handleSubmit = async () => {
    if (!form.email || !form.password) { toast.info("Fill in all fields"); return; }
    if (form.password.length < 8) { toast.info("Password must be 8+ characters"); return; }
    if (isPersonal && !form.phone) { toast.info("Phone number required for personal email domains"); return; }

    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { account_type: "institution" } },
      });
      if (error) { toast.error(error.message); setSubmitting(false); return; }

      // Send OTP for verification
      await supabase.auth.signInWithOtp({ email: form.email });
      sessionStorage.setItem("inst_email", form.email);
      toast.success("Verification code sent to " + form.email);
      onNext();
    } catch (e: any) {
      toast.error(e.message || "Something went wrong");
    }
    setSubmitting(false);
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: "var(--brand-dim)" }}>
          <Building2 className="w-5 h-5" style={{ color: "var(--brand)" }} />
        </div>
        <div>
          <h1 className="text-[22px] font-extrabold" style={{ color: "var(--text-1)" }}>Register your Organisation</h1>
          <p className="text-[13px]" style={{ color: "var(--text-3)" }}>Create an official presence on Tiikme</p>
        </div>
      </div>

      <div className="space-y-4 mt-6">
        <div>
          <label className="text-[12px] font-bold mb-1 block" style={{ color: "var(--text-2)" }}>Official Email</label>
          <input
            type="email" placeholder="admin@company.com" value={form.email}
            onChange={e => update({ email: e.target.value })}
            style={inputStyle}
          />
          {hasValidEmail && (
            <div className="flex items-center gap-1.5 mt-2 text-[12px] font-medium" style={{ color: isPersonal ? "#D97706" : "#16A34A" }}>
              {isPersonal ? <AlertTriangle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              {isPersonal ? "Personal email detected — phone verification required" : "Organisation email detected"}
            </div>
          )}
        </div>

        <div>
          <label className="text-[12px] font-bold mb-1 block" style={{ color: "var(--text-2)" }}>Password</label>
          <div className="relative">
            <input
              type={showPw ? "text" : "password"} placeholder="Min 8 characters" value={form.password}
              onChange={e => update({ password: e.target.value })}
              style={inputStyle}
            />
            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer" style={{ color: "var(--text-3)" }}>
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {isPersonal && (
          <div>
            <label className="text-[12px] font-bold mb-1 block" style={{ color: "var(--text-2)" }}>Mobile Number</label>
            <input
              type="tel" placeholder="+91 XXXXX XXXXX" value={form.phone}
              onChange={e => update({ phone: e.target.value })}
              style={inputStyle}
            />
            <p className="text-[11px] mt-1" style={{ color: "var(--text-3)" }}>Required for personal email domains for identity verification</p>
          </div>
        )}

        <Button onClick={handleSubmit} disabled={submitting} size="xl" className="w-full mt-2">
          {submitting ? "Creating account..." : "Continue →"}
        </Button>
      </div>
    </div>
  );
}

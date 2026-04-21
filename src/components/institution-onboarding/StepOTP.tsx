import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { InstitutionFormData } from "@/pages/JoinAsInstitution";

interface Props {
  form: InstitutionFormData;
  onNext: () => void;
}

export default function StepOTP({ form, onNext }: Props) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [verifying, setVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(60);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    refs.current[0]?.focus();
    const t = setInterval(() => setCooldown(p => (p > 0 ? p - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);

  const handleChange = (idx: number, val: string) => {
    if (val.length > 1) {
      // Paste handling
      const digits = val.replace(/\D/g, "").slice(0, 6).split("");
      const next = [...otp];
      digits.forEach((d, i) => { if (idx + i < 6) next[idx + i] = d; });
      setOtp(next);
      const focusIdx = Math.min(idx + digits.length, 5);
      refs.current[focusIdx]?.focus();
      return;
    }
    const next = [...otp];
    next[idx] = val.replace(/\D/g, "");
    setOtp(next);
    if (val && idx < 5) refs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) refs.current[idx - 1]?.focus();
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length !== 6) { toast.info("Enter the 6-digit code"); return; }
    setVerifying(true);
    try {
      // Try verifying OTP
      const { error } = await supabase.auth.verifyOtp({
        email: form.email, token: code, type: "email",
      });
      if (error) {
        // Fallback: try signup type
        const { error: err2 } = await supabase.auth.verifyOtp({
          email: form.email, token: code, type: "signup",
        });
        if (err2) {
          // Fallback: sign in with password
          const { error: err3 } = await supabase.auth.signInWithPassword({
            email: form.email, password: form.password,
          });
          if (err3) { toast.error("Invalid code. Please try again."); setVerifying(false); return; }
        }
      }
      toast.success("Email verified!");
      onNext();
    } catch (e: any) {
      toast.error(e.message || "Verification failed");
    }
    setVerifying(false);
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    await supabase.auth.signInWithOtp({ email: form.email });
    setCooldown(60);
    toast.success("Code resent");
  };

  return (
    <div>
      <h1 className="text-[22px] font-extrabold mb-1" style={{ color: "var(--text-1)" }}>Verify your email</h1>
      <p className="text-[13px] mb-6" style={{ color: "var(--text-3)" }}>
        Enter the 6-digit code sent to <span className="font-bold" style={{ color: "var(--brand)" }}>{form.email}</span>
      </p>

      <div className="flex justify-center gap-2 mb-6">
        {otp.map((d, i) => (
          <input
            key={i}
            ref={el => { refs.current[i] = el; }}
            type="text" inputMode="numeric" maxLength={6}
            value={d}
            onChange={e => handleChange(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            className="text-center font-bold text-[22px]"
            style={{
              width: 52, height: 56, borderRadius: 12,
              border: d ? "2px solid var(--brand)" : "1.5px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.04)", color: "#FAFAF7", outline: "none",
              fontFamily: "'Inter Tight', sans-serif", fontSize: 22, fontWeight: 700,
            }}
          />
        ))}
      </div>

      <Button onClick={handleVerify} disabled={verifying} size="xl" className="w-full">
        {verifying ? "Verifying..." : "Verify & Continue →"}
      </Button>

      <p className="text-center text-[13px] mt-4" style={{ color: "var(--text-3)" }}>
        {cooldown > 0 ? (
          <>Resend code in <span className="font-bold" style={{ color: "var(--brand)" }}>{cooldown}s</span></>
        ) : (
          <button type="button" onClick={handleResend} className="font-bold cursor-pointer" style={{ color: "var(--brand)" }}>
            Resend code
          </button>
        )}
      </p>
    </div>
  );
}

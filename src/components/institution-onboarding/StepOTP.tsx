import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cardStyle } from "./constants";

interface Props {
  email: string;
  hasMobile: boolean;
  onNext: () => void;
}

export default function StepOTP({ email, hasMobile, onNext }: Props) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [countdown, setCountdown] = useState(60);
  const [submitting, setSubmitting] = useState(false);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown]);

  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  const handleChange = (i: number, v: string) => {
    if (v.length > 1) {
      // Paste handling
      const chars = v.replace(/\D/g, "").slice(0, 6).split("");
      const next = [...otp];
      chars.forEach((c, idx) => { if (i + idx < 6) next[i + idx] = c; });
      setOtp(next);
      const focusIdx = Math.min(i + chars.length, 5);
      refs.current[focusIdx]?.focus();
      return;
    }
    const digit = v.replace(/\D/g, "");
    const next = [...otp];
    next[i] = digit;
    setOtp(next);
    if (digit && i < 5) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) {
      refs.current[i - 1]?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) { toast.info("Enter the 6-digit code"); return; }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: "signup",
      });
      if (error) { toast.error(error.message); setSubmitting(false); return; }
      toast.success("Email verified!");
      onNext();
    } catch (err: any) {
      console.warn("[StepOTP] verify error:", err);
      toast.error("Verification failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    try {
      await supabase.auth.resend({ type: "signup", email });
      setCountdown(60);
      toast.success("Code resent");
    } catch (err: any) {
      console.warn("[StepOTP] resend error:", err);
      toast.error("Failed to resend");
    }
  };

  return (
    <form onSubmit={handleVerify} style={cardStyle}>
      <h2 style={{ fontSize: 24, fontWeight: 800, color: "#1A1A1A", textAlign: "center", marginBottom: 4 }}>
        Verify your email
      </h2>
      <p style={{ fontSize: 14, color: "#6B6B6B", textAlign: "center", marginBottom: 32 }}>
        We sent a 6-digit code to <strong>{email}</strong>
      </p>

      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 24 }}>
        {otp.map((d, i) => (
          <input
            key={i}
            ref={el => { refs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={d}
            onChange={e => handleChange(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            style={{
              width: 52, height: 56, textAlign: "center", fontSize: 22, fontWeight: 700,
              border: d ? "2px solid #E8580A" : "1.5px solid #E5E7EB",
              borderRadius: 8, outline: "none", color: "#1A1A1A", background: "#FFFFFF",
            }}
            onFocus={e => e.target.select()}
          />
        ))}
      </div>

      <div style={{ textAlign: "center", marginBottom: 24 }}>
        {countdown > 0 ? (
          <p style={{ fontSize: 13, color: "#9CA3AF" }}>Resend code in {countdown}s</p>
        ) : (
          <button type="button" onClick={handleResend}
            style={{ fontSize: 13, color: "#E8580A", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>
            Resend code
          </button>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={submitting}
        style={{ height: 52, background: "#E8580A", borderRadius: 8, fontSize: 15, fontWeight: 700 }}>
        {submitting ? "Verifying..." : "Verify →"}
      </Button>
    </form>
  );
}

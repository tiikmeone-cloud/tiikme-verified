import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import AuthLayout from "@/components/layouts/AuthLayout";
import { AuthButton } from "@/components/layouts/AuthPrimitives";

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const email = sessionStorage.getItem("ob_email") || "";
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(60);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!email) { navigate("/signup", { replace: true }); return; }
    refs.current[0]?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const setDigit = (i: number, v: string) => {
    if (v && !/^\d$/.test(v)) return;
    const next = [...digits];
    next[i] = v;
    setDigits(next);
    setError("");
    if (v && i < 5) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      const next = [...digits]; next[i - 1] = ""; setDigits(next);
      refs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length === 6) {
      e.preventDefault();
      setDigits(text.split(""));
      refs.current[5]?.focus();
    }
  };

  const allFilled = digits.every((d) => d !== "");

  const handleVerify = async () => {
    if (!allFilled) return;
    setSubmitting(true);
    const { error: err } = await supabase.auth.verifyOtp({
      email, token: digits.join(""), type: "signup",
    });
    setSubmitting(false);
    if (err) {
      setError("Code is invalid or expired. Try again.");
      setShake(true);
      setTimeout(() => { setShake(false); setDigits(["", "", "", "", "", ""]); refs.current[0]?.focus(); }, 500);
      return;
    }
    toast.success("Email verified!");
    navigate("/onboarding");
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    const { error: err } = await supabase.auth.resend({ type: "signup", email });
    if (err) { toast.error(err.message); return; }
    toast.success("Code resent!");
    setCooldown(60);
  };

  return (
    <AuthLayout step={2} totalSteps={5} showBack backTo="/signup">
      <div className="text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-brand/15">
          <Mail className="h-8 w-8 text-brand" strokeWidth={1.8} />
        </div>

        <h1 className="mb-1 text-[26px] font-bold text-paper">Check your inbox</h1>
        <p className="text-[14px] text-paper/60">We sent a 6-digit code to</p>
        <p className="mb-6 text-[14px] font-semibold text-brand">{email}</p>

        <div className={`mb-4 flex justify-center gap-2.5 ${shake ? "animate-shake" : ""}`} onPaste={handlePaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { refs.current[i] = el; }}
              type="text" inputMode="numeric" maxLength={1}
              value={d}
              onChange={(e) => setDigit(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="num h-14 w-12 rounded-xl border-2 bg-white/[0.04] text-center text-[22px] text-brand outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/40"
              style={{
                borderColor: d ? "#FF5A1F" : error ? "#EF4444" : "rgba(255,255,255,0.15)",
                background: d ? "rgba(255, 90, 31,0.10)" : "rgba(255,255,255,0.04)",
              }}
            />
          ))}
        </div>

        {error && <p className="mb-3 text-[13px] font-medium text-destructive">{error}</p>}

        <AuthButton onClick={handleVerify} disabled={!allFilled} loading={submitting} className="mb-4">
          Verify email →
        </AuthButton>

        <p className="text-[13px] text-paper/45">
          {cooldown > 0 ? `Resend code in ${cooldown}s…` : (
            <button type="button" onClick={handleResend} className="font-semibold text-brand hover:underline cursor-pointer">
              Resend code →
            </button>
          )}
        </p>

        <button
          type="button" onClick={() => navigate("/signup")}
          className="mt-3 text-[13px] text-paper/55 hover:text-paper transition cursor-pointer"
        >
          Wrong email? ← Change it
        </button>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }
        .animate-shake { animation: shake 0.4s ease-in-out; }
      `}</style>
    </AuthLayout>
  );
}

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import OnboardingShell from "@/components/onboarding/OnboardingShell";

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
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
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

  const allFilled = digits.every(d => d !== "");

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
    navigate("/onboarding/role");
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    const { error: err } = await supabase.auth.resend({ type: "signup", email });
    if (err) { toast.error(err.message); return; }
    toast.success("Code resent!");
    setCooldown(60);
  };

  return (
    <OnboardingShell step={2} showBack backTo="/signup">
      <div className="rounded-3xl p-8 sm:p-10 text-center" style={{ background: "#fff", border: "1px solid #F3F4F6", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
        <div className="w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center" style={{ background: "rgba(232,88,10,0.1)" }}>
          <Mail className="w-8 h-8" style={{ color: "#E8580A" }} strokeWidth={1.8} />
        </div>

        <h1 className="text-[28px] font-extrabold mb-1" style={{ color: "#111827" }}>Check your inbox</h1>
        <p className="text-[14px] mb-1" style={{ color: "#6B7280" }}>We sent a 6-digit code to</p>
        <p className="text-[14px] font-bold mb-7" style={{ color: "#E8580A" }}>{email}</p>

        {/* OTP boxes */}
        <div
          className={`flex justify-center gap-3 mb-4 ${shake ? "animate-shake" : ""}`}
          onPaste={handlePaste}
        >
          {digits.map((d, i) => (
            <input
              key={i}
              ref={el => { refs.current[i] = el; }}
              type="text" inputMode="numeric" maxLength={1}
              value={d}
              onChange={e => setDigit(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              className="text-center outline-none transition-all duration-200"
              style={{
                width: 52, height: 64, borderRadius: 14, fontSize: 22,
                fontFamily: "'Press Start 2P', cursive",
                border: `2px solid ${d ? "#E8580A" : error ? "#DC2626" : "#E5E7EB"}`,
                background: d ? "#FFF8F2" : "#fff",
                color: "#E8580A",
              }}
            />
          ))}
        </div>

        {error && <p className="text-[13px] font-medium mb-4" style={{ color: "#DC2626" }}>{error}</p>}

        <button
          onClick={handleVerify} disabled={!allFilled || submitting}
          className="w-full h-12 rounded-2xl text-[15px] font-bold text-white cursor-pointer transition-all hover:opacity-90 disabled:opacity-50 mb-5"
          style={{ background: "#E8580A" }}
        >
          {submitting ? "Verifying..." : "Verify email →"}
        </button>

        <p className="text-[13px]" style={{ color: "#9CA3AF" }}>
          {cooldown > 0 ? `Resend code in ${cooldown}s...` : (
            <button type="button" onClick={handleResend} className="font-semibold cursor-pointer hover:underline" style={{ color: "#E8580A" }}>Resend code →</button>
          )}
        </p>

        <button type="button" onClick={() => navigate("/signup")} className="text-[13px] mt-3 cursor-pointer hover:underline" style={{ color: "#6B7280" }}>
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
    </OnboardingShell>
  );
}

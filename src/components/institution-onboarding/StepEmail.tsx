import { useState } from "react";
import { Eye, EyeOff, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PERSONAL_DOMAINS, inputStyle, cardStyle } from "./constants";

interface Props {
  onNext: (data: { email: string; password: string; mobile?: string }) => void;
}

export default function StepEmail({ onNext }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mobile, setMobile] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [emailError, setEmailError] = useState("");

  const domain = email.includes("@") ? email.split("@")[1]?.toLowerCase() : "";
  const isPersonal = PERSONAL_DOMAINS.includes(domain);
  const isOrg = domain.length > 0 && !isPersonal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");
    if (!email.trim() || !password) { toast.info("Fill all required fields"); return; }
    if (password.length < 8) { toast.info("Password must be at least 8 characters"); return; }
    if (password !== confirmPassword) { toast.info("Passwords don't match"); return; }
    if (isPersonal && !mobile.trim()) { toast.info("Mobile number is required for personal email"); return; }

    setSubmitting(true);
    try {
      // Step 1: Sign up — Supabase sends a confirmation OTP automatically
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: "", role: "institution_admin" },
        },
      });

      if (signUpError) {
        if (signUpError.message.includes("already registered") || signUpError.message.includes("already been registered")) {
          setEmailError("An account with this email already exists.");
          setSubmitting(false);
          return;
        }
        toast.error(signUpError.message);
        setSubmitting(false);
        return;
      }

      // Check if user was already registered (signUp returns user with identities: [])
      if (signUpData.user && signUpData.user.identities && signUpData.user.identities.length === 0) {
        setEmailError("An account with this email already exists.");
        setSubmitting(false);
        return;
      }

      // Step 2: Send a separate OTP for 6-digit verification
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
      });
      if (otpError) console.warn("[StepEmail] OTP send error:", otpError.message);

      onNext({ email: email.trim(), password, mobile: mobile.trim() || undefined });
    } catch (err: any) {
      console.warn("[StepEmail] error:", err);
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={cardStyle}>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1A1A1A", textAlign: "center", marginBottom: 4 }}>
        Create your institution account
      </h2>
      <p style={{ fontSize: 14, color: "#6B6B6B", textAlign: "center", marginBottom: 28 }}>
        One account. Your entire organisation's verified identity.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <Input type="email" placeholder="Work email *" value={email}
            onChange={e => { setEmail(e.target.value); setEmailError(""); }}
            style={{ ...inputStyle, height: 48 }} required />
          {emailError && (
            <div style={{ marginTop: 8, padding: "10px 12px", borderRadius: 8, background: "#FEF2F2", border: "1px solid #FECACA", display: "flex", gap: 8, alignItems: "flex-start" }}>
              <AlertTriangle style={{ width: 16, height: 16, color: "#DC2626", flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 13, color: "#991B1B", lineHeight: 1.4 }}>
                {emailError}{" "}
                <Link to="/signin" style={{ color: "#E8580A", fontWeight: 600, textDecoration: "underline" }}>Sign in instead</Link>
              </p>
            </div>
          )}
          {isPersonal && !emailError && (
            <div style={{ marginTop: 8, padding: "12px", borderRadius: "0 8px 8px 8px", background: "#FFF8E1", borderLeft: "3px solid #D97706" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <AlertTriangle style={{ width: 14, height: 14, color: "#92400E" }} />
                <p style={{ fontSize: 13, fontWeight: 600, color: "#92400E" }}>Personal email detected</p>
              </div>
              <p style={{ fontSize: 13, color: "#92400E", lineHeight: 1.4 }}>
                A mobile number is required to verify your organisation is real.
              </p>
            </div>
          )}
          {isOrg && !emailError && (
            <div style={{ marginTop: 8, padding: "8px 12px", borderRadius: 8, background: "#F0FDF4", border: "1px solid #BBF7D0", display: "flex", gap: 6, alignItems: "center" }}>
              <CheckCircle2 style={{ width: 14, height: 14, color: "#16A34A" }} />
              <p style={{ fontSize: 13, color: "#166534" }}>Organisation email detected</p>
            </div>
          )}
        </div>

        {isPersonal && (
          <div>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ ...inputStyle, width: 72, height: 48, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, color: "#6B6B6B", flexShrink: 0 }}>
                +91
              </div>
              <Input type="tel" placeholder="Mobile number *" value={mobile}
                onChange={e => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                style={{ ...inputStyle, flex: 1, height: 48 }} required={isPersonal} />
            </div>
            <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>
              We'll verify this. Unverified pages using personal email will be held for review after 30 days.
            </p>
          </div>
        )}

        {!isPersonal && domain.length > 0 && (
          <Input type="tel" placeholder="Mobile number (optional)" value={mobile}
            onChange={e => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
            style={{ ...inputStyle, height: 48 }} />
        )}

        <div style={{ position: "relative" }}>
          <Input type={showPw ? "text" : "password"} placeholder="Password *" value={password}
            onChange={e => setPassword(e.target.value)} style={{ ...inputStyle, height: 48 }} required minLength={8} />
          <button type="button" onClick={() => setShowPw(!showPw)}
            style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            {showPw ? <EyeOff style={{ width: 18, height: 18, color: "#9CA3AF" }} /> : <Eye style={{ width: 18, height: 18, color: "#9CA3AF" }} />}
          </button>
        </div>

        <Input type={showPw ? "text" : "password"} placeholder="Confirm password *" value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)} style={{ ...inputStyle, height: 48 }} required minLength={8} />
      </div>

      <Button type="submit" className="w-full mt-6" disabled={submitting}
        style={{ height: 52, background: "#E8580A", borderRadius: 12, fontSize: 15, fontWeight: 700 }}>
        {submitting ? "Creating account..." : "Continue"}
      </Button>

      <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 12, textAlign: "center", lineHeight: 1.5 }}>
        Already have an account?{" "}
        <Link to="/signin" style={{ color: "#E8580A", fontWeight: 600 }}>Sign in</Link>
      </p>
    </form>
  );
}
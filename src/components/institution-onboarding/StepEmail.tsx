import { useState } from "react";
import { ArrowRight, Eye, EyeOff, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PERSONAL_DOMAINS, inputStyle, cardStyle } from "./constants";

interface Props {
  onNext: (data: { email: string; password: string; mobile?: string }) => void;
}

export default function StepEmail({ onNext }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mobile, setMobile] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const domain = email.includes("@") ? email.split("@")[1]?.toLowerCase() : "";
  const isPersonal = PERSONAL_DOMAINS.includes(domain);
  const isOrg = domain.length > 0 && !isPersonal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) { toast.info("Fill all required fields"); return; }
    if (password.length < 8) { toast.info("Password must be at least 8 characters"); return; }
    if (isPersonal && !mobile.trim()) { toast.info("Mobile number is required for personal email"); return; }

    setSubmitting(true);
    try {
      // Try to sign in first (returning user)
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (!signInError) {
        // Already have an account — proceed
        onNext({ email: email.trim(), password, mobile: mobile.trim() || undefined });
        return;
      }

      // If sign-in fails, create a new account
      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: window.location.origin + "/app/feed",
          data: { full_name: "", role: "institution_admin" },
        },
      });

      if (signUpError) {
        // User exists but wrong password
        if (signUpError.message.includes("already registered") || signUpError.message.includes("already been registered")) {
          toast.error("An account with this email exists. Check your password.");
        } else {
          toast.error(signUpError.message);
        }
        setSubmitting(false);
        return;
      }

      // Now send a login OTP (this always includes the 6-digit code in the email)
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
      });

      if (otpError) {
        console.warn("[StepEmail] OTP send error:", otpError);
        // Don't block — the signup confirmation email may still have a code
      }

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
      <h2 style={{ fontSize: 24, fontWeight: 800, color: "#1A1A1A", textAlign: "center", marginBottom: 4 }}>
        Create your Institution Page
      </h2>
      <p style={{ fontSize: 13, color: "#6B6B6B", textAlign: "center", marginBottom: 28 }}>
        Free for 6 months · No credit card · 5 minutes
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <Input
            type="email"
            placeholder="Organisation email *"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={inputStyle}
            required
          />
          {isPersonal && (
            <div style={{
              marginTop: 8, padding: "10px 12px", borderRadius: 8,
              background: "#FFFBEB", border: "1px solid #FDE68A",
              display: "flex", gap: 8, alignItems: "flex-start",
            }}>
              <AlertTriangle style={{ width: 16, height: 16, color: "#D97706", flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 13, color: "#92400E", lineHeight: 1.4 }}>
                Personal email detected. A mobile number is required to verify your organisation is real.
              </p>
            </div>
          )}
          {isOrg && (
            <div style={{
              marginTop: 8, padding: "8px 12px", borderRadius: 8,
              background: "#F0FDF4", border: "1px solid #BBF7D0",
              display: "flex", gap: 6, alignItems: "center",
            }}>
              <CheckCircle2 style={{ width: 14, height: 14, color: "#16A34A" }} />
              <p style={{ fontSize: 13, color: "#166534" }}>Organisation email detected</p>
            </div>
          )}
        </div>

        {isPersonal && (
          <div>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{
                ...inputStyle, width: 72, display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 600, color: "#6B6B6B", flexShrink: 0,
              }}>
                +91
              </div>
              <Input
                type="tel"
                placeholder="Mobile number *"
                value={mobile}
                onChange={e => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                style={{ ...inputStyle, flex: 1 }}
                required={isPersonal}
              />
            </div>
            <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>
              We'll send an OTP to verify. Unverified pages using personal email will be held for review after 30 days.
            </p>
          </div>
        )}

        {!isPersonal && domain.length > 0 && (
          <Input
            type="tel"
            placeholder="Mobile number (optional)"
            value={mobile}
            onChange={e => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
            style={inputStyle}
          />
        )}

        <div style={{ position: "relative" }}>
          <Input
            type={showPw ? "text" : "password"}
            placeholder="Password *"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={inputStyle}
            required
            minLength={8}
          />
          <button
            type="button"
            onClick={() => setShowPw(!showPw)}
            style={{
              position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", cursor: "pointer", padding: 4,
            }}
          >
            {showPw ? <EyeOff style={{ width: 18, height: 18, color: "#9CA3AF" }} /> : <Eye style={{ width: 18, height: 18, color: "#9CA3AF" }} />}
          </button>
        </div>
      </div>

      <Button type="submit" className="w-full mt-6" disabled={submitting}
        style={{ height: 52, background: "#E8580A", borderRadius: 8, fontSize: 15, fontWeight: 700 }}>
        {submitting ? "Creating account..." : "Continue →"}
      </Button>

      <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 12, textAlign: "center", lineHeight: 1.5 }}>
        By continuing you agree to Tiikme's Terms. Institution pages that cannot be verified will be held for 30 days then removed.
      </p>
    </form>
  );
}

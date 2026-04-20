import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import OnboardingShell from "@/components/onboarding/OnboardingShell";
import { checkPassword, MIN_PASSWORD_LENGTH } from "@/lib/passwordStrength";
import { markRecentAuth } from "@/lib/idleLogout";

const TERMS_VERSION = "2025-04-20";

const validatePassword = (pw: string, email: string) => {
  if (pw.length < MIN_PASSWORD_LENGTH) return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  const result = checkPassword(pw, email ? [email, email.split("@")[0]] : []);
  if (!result.ok) return result.feedback || "Choose a stronger password";
  return null;
};

const inputStyle: React.CSSProperties = {
  background: "#fff", border: "1.5px solid #E5E7EB", borderRadius: 14,
  color: "#111827", height: 48, width: "100%", padding: "0 14px", fontSize: 14,
  outline: "none", fontFamily: "'Plus Jakarta Sans', sans-serif",
};
const inputErrorStyle: React.CSSProperties = { ...inputStyle, borderColor: "#EF4444" };

export default function SignupPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect");
  const safeRedirect = redirectTo && redirectTo.startsWith("/") ? redirectTo : null;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Persist deep-link target so the onboarding flow can return the user there
  useEffect(() => {
    if (safeRedirect) sessionStorage.setItem("post_auth_redirect", safeRedirect);
  }, [safeRedirect]);

  useEffect(() => {
    if (user) {
      navigate("/onboarding/role", { replace: true });
    }
  }, [user]);

  const strength = useMemo(
    () => checkPassword(password, email ? [email, email.split("@")[0]] : []),
    [password, email]
  );
  const strengthPct = ((strength.score + 1) / 5) * 100;

  const clearError = (field: string) => setErrors(p => ({ ...p, [field]: "" }));

  const handleGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/onboarding/role" },
    });
    if (error) toast.error(error.message);
  };

  const handleSubmit = async () => {
    const errs: Record<string, string> = {};
    if (!email) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Invalid email format";

    const pwErr = validatePassword(password, email);
    if (!password) errs.password = "Password is required";
    else if (pwErr) errs.password = pwErr;

    if (!confirmPassword) errs.confirmPassword = "Please confirm your password";
    else if (password !== confirmPassword) errs.confirmPassword = "Passwords do not match";

    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/onboarding/role`,
        data: { account_type: "user" },
      },
    });
    setSubmitting(false);

    if (error) { toast.error(error.message); return; }

    // Supabase returns identities=[] for already-registered emails
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      setErrors({ email: "This email is already registered. Please sign in instead." });
      return;
    }

    sessionStorage.setItem("ob_email", email);
    markRecentAuth();
    navigate("/verify-email");
  };

  const FieldError = ({ field }: { field: string }) => {
    if (!errors[field]) return null;
    return (
      <p className="flex items-center gap-1 mt-1" style={{ fontSize: 12, color: "#EF4444" }}>
        <AlertCircle style={{ width: 12, height: 12, flexShrink: 0 }} /> {errors[field]}
      </p>
    );
  };

  return (
    <OnboardingShell step={1}>
      <div className="rounded-3xl p-8 sm:p-10" style={{ background: "#fff", border: "1px solid #F3F4F6", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
        <h1 className="text-[28px] font-extrabold text-center mb-1" style={{ color: "#111827", letterSpacing: "-0.02em" }}>Create your account</h1>
        <p className="text-center text-[14px] mb-7" style={{ color: "#6B7280" }}>Your verified professional identity starts here.</p>

        {/* Google */}
        <button
          type="button"
          onClick={handleGoogle}
          className="w-full flex items-center justify-center gap-3 h-12 rounded-2xl text-[14px] font-semibold cursor-pointer transition-all hover:shadow-md"
          style={{ background: "#fff", border: "1.5px solid #E5E7EB", color: "#111827" }}
        >
          <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
          Continue with Google
        </button>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px" style={{ background: "#E5E7EB" }} />
          <span className="text-[12px] font-medium" style={{ color: "#9CA3AF" }}>or</span>
          <div className="flex-1 h-px" style={{ background: "#E5E7EB" }} />
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <input
              type="email" placeholder="Email address" value={email}
              onChange={e => { setEmail(e.target.value); clearError("email"); }}
              style={errors.email ? inputErrorStyle : inputStyle}
            />
            <FieldError field="email" />
          </div>

          {/* Password */}
          <div>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"} placeholder={`Password (min ${MIN_PASSWORD_LENGTH} chars, mix letters/numbers)`}
                value={password} onChange={e => { setPassword(e.target.value); clearError("password"); }}
                style={{ ...(errors.password ? inputErrorStyle : inputStyle), paddingRight: 44 }}
              />
              <button
                type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                style={{ color: "#9CA3AF" }}
              >
                {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <FieldError field="password" />
            {/* Strength bar */}
            {password.length > 0 && !errors.password && (
              <div className="space-y-1.5 mt-2">
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#F3F4F6" }}>
                  <div className="h-full rounded-full transition-all duration-300" style={{ width: `${strengthPct}%`, background: strength.color }} />
                </div>
                <p className="text-[12px] font-medium" style={{ color: strength.color }}>
                  {strength.label}{strength.feedback ? ` — ${strength.feedback}` : ""}
                </p>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <input
              type="password" placeholder="Confirm password"
              value={confirmPassword}
              onChange={e => { setConfirmPassword(e.target.value); clearError("confirmPassword"); }}
              style={errors.confirmPassword ? inputErrorStyle : inputStyle}
            />
            <FieldError field="confirmPassword" />
          </div>

          <button
            type="button"
            onClick={handleSubmit} disabled={submitting}
            className="w-full h-12 rounded-2xl text-[15px] font-bold text-white cursor-pointer transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: "#E8580A" }}
          >
            {submitting ? "Creating..." : "Create account →"}
          </button>
        </div>

        <p className="text-center text-[13px] mt-5" style={{ color: "#6B7280" }}>
          Already have an account?{" "}
          <Link to="/signin" className="font-semibold hover:underline" style={{ color: "#E8580A" }}>Sign in →</Link>
        </p>
      </div>
    </OnboardingShell>
  );
}

import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import OnboardingShell from "@/components/onboarding/OnboardingShell";
import { checkPassword, MIN_PASSWORD_LENGTH } from "@/lib/passwordStrength";
import { markRecentAuth } from "@/lib/idleLogout";
import { PageSEO } from "@/hooks/usePageSEO";
import { AuthButton, AuthInput } from "@/components/layouts/AuthPrimitives";
import { safeInternalRedirect, storePostAuthRedirect } from "@/lib/safeRedirect";

const TERMS_VERSION = "2025-04-20";

const validatePassword = (pw: string, email: string) => {
  if (pw.length < MIN_PASSWORD_LENGTH) return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  const result = checkPassword(pw, email ? [email, email.split("@")[0]] : []);
  if (!result.ok) return result.feedback || "Choose a stronger password";
  return null;
};

export default function SignupPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect");
  const safeRedirect = safeInternalRedirect(redirectTo);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    storePostAuthRedirect(safeRedirect);
  }, [safeRedirect]);

  useEffect(() => {
    if (user) navigate("/onboarding", { replace: true });
  }, [user, navigate]);

  const strength = useMemo(
    () => checkPassword(password, email ? [email, email.split("@")[0]] : []),
    [password, email]
  );
  const strengthPct = ((strength.score + 1) / 5) * 100;

  const clearError = (field: string) => setErrors((p) => ({ ...p, [field]: "" }));

  const handleGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { access_type: "offline", prompt: "select_account" },
      },
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

    if (!agreed) errs.agreed = "You must agree to the Terms and Privacy Policy";

    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: { account_type: "user" },
      },
    });
    setSubmitting(false);

    if (error) {
      const msg = error.message || "";
      if (/already.*registered|already.*exists|user.*exists/i.test(msg)) {
        toast.error("This email is already in use. Sign in instead.");
        setTimeout(() => navigate(`/signin?email=${encodeURIComponent(email)}`), 1200);
        return;
      }
      toast.error(msg);
      return;
    }

    if (data.user && data.user.identities && data.user.identities.length === 0) {
      toast.error("This email is already in use. Sign in instead.");
      setTimeout(() => navigate(`/signin?email=${encodeURIComponent(email)}`), 1200);
      return;
    }

    if (data.user?.id) {
      supabase.from("profiles").update({
        terms_accepted_at: new Date().toISOString(),
        terms_version: TERMS_VERSION,
      }).eq("id", data.user.id).then(({ error: updErr }) => {
        if (updErr) console.warn("[Signup] Failed to stamp terms consent:", updErr.message);
      });
    }

    sessionStorage.setItem("ob_email", email);
    markRecentAuth();
    navigate("/verify-email");
  };

  const FieldError = ({ field }: { field: string }) =>
    errors[field] ? (
      <p className="mt-1 flex items-center gap-1 text-[12px] text-destructive">
        <AlertCircle className="h-3 w-3 shrink-0" /> {errors[field]}
      </p>
    ) : null;

  return (
    <OnboardingShell step={1}>
      <PageSEO
        title="Sign Up — Tiikme"
        description="Create your free Tiikme profile. Join India's verified professional identity platform."
        canonical="https://tiikme.com/signup"
      />

      <h1 className="mb-1 text-center text-[26px] font-bold tracking-[-0.02em] text-paper">Create your account</h1>
      <p className="mb-6 text-center text-[14px] text-paper/55">Your verified professional identity starts here.</p>

      <AuthButton variant="secondary" type="button" onClick={handleGoogle} className="mb-5">
        <svg width={20} height={20} viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
        Continue with Google
      </AuthButton>

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-white/15" />
        <span className="text-[12px] font-medium text-paper/40">or</span>
        <div className="h-px flex-1 bg-white/15" />
      </div>

      <div className="space-y-4">
        <div>
          <AuthInput
            type="email" placeholder="Email address" autoComplete="email" value={email}
            onChange={(e) => { setEmail(e.target.value); clearError("email"); }}
            error={!!errors.email}
          />
          <FieldError field="email" />
        </div>

        <div>
          <div className="relative">
            <AuthInput
              type={showPw ? "text" : "password"}
              placeholder={`Password (min ${MIN_PASSWORD_LENGTH} chars, mix letters/numbers)`}
              value={password} onChange={(e) => { setPassword(e.target.value); clearError("password"); }}
              error={!!errors.password}
              className="pr-12"
            />
            <button
              type="button" onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-paper/40 hover:text-paper transition cursor-pointer"
            >
              {showPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          <FieldError field="password" />
          {password.length > 0 && !errors.password && (
            <div className="mt-2 space-y-1.5">
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${strengthPct}%`, background: strength.color }}
                />
              </div>
              <p className="text-[12px] font-medium" style={{ color: strength.color }}>
                {strength.label}{strength.feedback ? ` — ${strength.feedback}` : ""}
              </p>
            </div>
          )}
        </div>

        <div>
          <AuthInput
            type="password" placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); clearError("confirmPassword"); }}
            error={!!errors.confirmPassword}
          />
          <FieldError field="confirmPassword" />
        </div>

        <label className="flex cursor-pointer items-start gap-3 text-[13px] leading-snug text-paper/70">
          <input
            type="checkbox" checked={agreed}
            onChange={(e) => { setAgreed(e.target.checked); clearError("agreed"); }}
            className="mt-0.5 h-4 w-4 shrink-0 accent-brand"
          />
          <span>
            I have read and agree to the
            <Link to="/terms" target="_blank" className="mx-1 text-brand underline">Terms of Service</Link>
            and
            <Link to="/privacy" target="_blank" className="mx-1 text-brand underline">Privacy Policy</Link>
            of Tiikme. I confirm I am 18 years or older.
          </span>
        </label>
        <FieldError field="agreed" />

        <AuthButton type="button" onClick={handleSubmit} loading={submitting} disabled={!agreed}>
          Create account →
        </AuthButton>
      </div>

      <p className="mt-5 text-center text-[13px] text-paper/55">
        Already have an account?{" "}
        <Link to="/signin" className="font-semibold text-brand hover:underline">Sign in →</Link>
      </p>
    </OnboardingShell>
  );
}

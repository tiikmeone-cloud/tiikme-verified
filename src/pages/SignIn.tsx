import { useEffect, useState } from "react";
import { Eye, EyeOff, Building2 } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageSEO } from "@/hooks/usePageSEO";
import AuthLayout from "@/components/layouts/AuthLayout";
import { AuthButton, AuthInput } from "@/components/layouts/AuthPrimitives";

const SignIn = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect");
  const safeRedirect = redirectTo && redirectTo.startsWith("/") ? redirectTo : null;
  const prefillEmail = searchParams.get("email") || "";
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get("error") === "oauth_failed") toast.error("Google sign-in failed. Please try again.");
    if (searchParams.get("link") === "google") toast.info("This email already has a password account. Sign in with your password to link Google.");
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.info("Please fill in all fields"); return; }
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    const { markRecentAuth } = await import("@/lib/idleLogout");
    markRecentAuth();

    const stored = sessionStorage.getItem("post_auth_redirect");
    const finalRedirect = safeRedirect || (stored && stored.startsWith("/") ? stored : null);
    if (finalRedirect) {
      sessionStorage.removeItem("post_auth_redirect");
      navigate(finalRedirect);
    } else {
      const userId = data.user?.id;
      if (userId) {
        const { data: prof } = await supabase.from("profiles").select("account_type").eq("id", userId).maybeSingle();
        navigate(prof?.account_type === "institution" ? "/app/workspace" : "/app/feed");
      } else {
        navigate("/app/feed");
      }
    }
    toast.success("Welcome back!");
  };

  const handleGoogleAuth = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { access_type: "offline", prompt: "select_account" },
      },
    });
    if (error) {
      const msg = error.message || "";
      if (/different.*provider|already.*exists/i.test(msg)) {
        toast.error("This email already has a password account. Sign in with your password to link Google.");
        if (email) navigate(`/signin?email=${encodeURIComponent(email)}&link=google`);
        return;
      }
      toast.error(msg);
    }
  };

  const handleForgotPassword = async () => {
    const targetEmail = forgotEmail || email;
    if (!targetEmail) { toast.info("Enter your email first"); return; }
    setForgotLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(targetEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setForgotLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("If this email is registered, you'll receive a reset link.");
    setShowForgot(false);
  };

  return (
    <AuthLayout>
      <PageSEO
        title="Sign In — Tiikme"
        description="Sign in to Tiikme, India's verified professional identity platform."
        canonical="https://tiikme.com/signin"
      />

      <h1 className="mb-1 text-[28px] font-bold tracking-[-0.02em] text-paper">Welcome back.</h1>
      <p className="mb-6 text-[13px] text-paper/55">
        New here?{" "}
        <Link
          to={safeRedirect ? `/signup?redirect=${encodeURIComponent(safeRedirect)}` : "/signup"}
          className="text-brand hover:underline"
        >
          Create your profile
        </Link>
      </p>

      {/* Google */}
      <AuthButton variant="secondary" type="button" onClick={handleGoogleAuth} className="mb-5">
        <svg className="shrink-0" width={20} height={20} viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Continue with Google
      </AuthButton>

      {/* Divider */}
      <div className="my-5 flex items-center">
        <div className="h-px flex-1 bg-white/15" />
        <span className="px-3 text-[12px] text-paper/40">or</span>
        <div className="h-px flex-1 bg-white/15" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <AuthInput
          type="email" placeholder="Email address" autoComplete="email"
          value={email} onChange={(e) => setEmail(e.target.value)}
        />
        <div className="relative">
          <AuthInput
            type={showPassword ? "text" : "password"} placeholder="Password" autoComplete="current-password"
            value={password} onChange={(e) => setPassword(e.target.value)}
            className="pr-12"
          />
          <button
            type="button" onClick={() => setShowPassword((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-paper/40 hover:text-paper transition cursor-pointer"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>

        <div className="text-right">
          <button
            type="button" onClick={() => setShowForgot(true)}
            className="text-[12px] text-paper/55 hover:text-paper transition cursor-pointer"
          >
            Forgot password?
          </button>
        </div>

        <AuthButton type="submit" loading={loading}>Sign in</AuthButton>
      </form>

      {/* Register org */}
      <div className="mt-5 text-center">
        <Link
          to="/join-as-institution"
          className="inline-flex items-center gap-2 text-[13px] text-paper/45 transition hover:text-brand"
        >
          <Building2 className="h-3.5 w-3.5" /> Register as an Organisation
        </Link>
      </div>

      <p className="mt-4 text-center text-[11px] leading-4 text-paper/30">
        By signing in, you agree to our{" "}
        <Link to="/terms" className="text-paper/50 hover:underline">Terms</Link> and{" "}
        <Link to="/privacy" className="text-paper/50 hover:underline">Privacy Policy</Link>
      </p>

      {/* Forgot password modal */}
      {showForgot && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          onClick={() => setShowForgot(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-white/14 bg-midnight/95 p-6 shadow-[0_25px_60px_rgba(0,0,0,0.4)] backdrop-blur-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-2 text-[20px] font-bold text-paper">Reset your password</h2>
            <p className="mb-5 text-[13px] text-paper/55">Enter your email and we'll send you a reset link.</p>
            <AuthInput
              type="email" placeholder="Email address"
              value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)}
              className="mb-4"
            />
            <div className="flex gap-3">
              <AuthButton variant="secondary" type="button" onClick={() => setShowForgot(false)} className="h-11">
                Cancel
              </AuthButton>
              <AuthButton type="button" loading={forgotLoading} onClick={handleForgotPassword} className="h-11">
                Send Reset Link
              </AuthButton>
            </div>
          </div>
        </div>
      )}
    </AuthLayout>
  );
};

export default SignIn;

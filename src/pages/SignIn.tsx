import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Building2 } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import ThemeLogo from "@/components/ThemeLogo";
import { PageSEO } from "@/hooks/usePageSEO";

const SignIn = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect");
  const safeRedirect = redirectTo && redirectTo.startsWith("/") ? redirectTo : null;
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  // Surface OAuth callback failures
  useEffect(() => {
    if (searchParams.get("error") === "oauth_failed") {
      toast.error("Google sign-in failed. Please try again.");
    }
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

    // Honor ?redirect= (or pending post_auth_redirect) deep link first, otherwise route by account type
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
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });
    if (error) toast.error(error.message);
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

  const darkInputStyle: React.CSSProperties = {
    width: "100%", height: 44, padding: "0 14px",
    background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)",
    borderRadius: 10, fontSize: 14, color: "#F0F2F7", outline: "none",
    transition: "border-color 200ms ease, box-shadow 200ms ease",
  };

  const focusStyle = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = "rgba(232,115,58,0.50)";
    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(232,115,58,0.10)";
  };
  const blurStyle = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)";
    e.currentTarget.style.boxShadow = "none";
  };

  return (
    <div className="relative flex items-center justify-center overflow-hidden"
      style={{ width: "100vw", minHeight: "100vh", background: "linear-gradient(135deg, #1A1A4E 0%, #0D0D2B 100%)" }}>
      <PageSEO
        title="Sign In — Tiikme"
        description="Sign in to Tiikme, India's professional network for students, freelancers, founders, and creators."
        ogTitle="Sign In — Tiikme"
        ogDescription="Built for the ones who build."
        ogImage="https://tiikme.com/og-image.png"
        twitterCard="summary_large_image"
        canonical="https://tiikme.com/signin"
      />
      {/* Animated blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute rounded-full" style={{ width: 800, height: 800, top: "10%", left: "20%", background: "radial-gradient(circle 400px at center, rgba(232,115,58,0.12) 0%, transparent 100%)", animation: "driftBlob1 20s ease-in-out infinite alternate" }} />
        <div className="absolute rounded-full" style={{ width: 700, height: 700, top: "30%", left: "55%", background: "radial-gradient(circle 350px at center, rgba(139,92,246,0.10) 0%, transparent 100%)", animation: "driftBlob2 25s ease-in-out infinite alternate" }} />
      </div>

      {/* Sign-in card */}
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="relative z-10 mx-4"
        style={{
          width: 400, maxWidth: "90vw", padding: 32,
          background: "linear-gradient(145deg, rgba(26,26,78,0.88), rgba(45,45,122,0.78))",
          backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
          border: "1px solid rgba(255,255,255,0.15)", borderRadius: 20,
          boxShadow: "0 25px 80px rgba(26,26,78,0.50), 0 0 60px rgba(232,115,58,0.08), inset 0 1px 0 rgba(255,255,255,0.15)",
        }}>
        {/* Logo */}
        <div className="flex justify-center" style={{ marginBottom: 24 }}>
          <Link to="/">
            <div style={{ filter: "brightness(10) drop-shadow(0 0 20px rgba(232,115,58,0.35))" }}>
              <ThemeLogo className="h-9 w-auto" />
            </div>
          </Link>
        </div>

        <h1 style={{ fontSize: 28, fontWeight: 700, lineHeight: "36px", color: "#F0F2F7", marginBottom: 4, letterSpacing: "-0.02em" }}>
          Welcome back.
        </h1>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginBottom: 24 }}>
          New here?{" "}
          <Link to={safeRedirect ? `/signup?redirect=${encodeURIComponent(safeRedirect)}` : "/signup"} style={{ color: "rgba(232,115,58,0.90)", cursor: "pointer" }}
            onMouseEnter={e => (e.currentTarget.style.textDecoration = "underline")}
            onMouseLeave={e => (e.currentTarget.style.textDecoration = "none")}>
            Create your profile
          </Link>
        </p>

        {/* Google OAuth */}
        <button type="button" onClick={handleGoogleAuth} className="cursor-pointer active:scale-[0.98]"
          style={{
            width: "100%", height: 44, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.20)",
            borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            fontSize: 14, fontWeight: 500, color: "#F0F2F7", marginBottom: 20, transition: "background 200ms ease",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.14)")}
          onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}>
          <svg className="shrink-0" width={20} height={20} viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div className="flex items-center" style={{ margin: "20px 0" }}>
          <div className="flex-1" style={{ height: 1, background: "rgba(255,255,255,0.15)" }} />
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.40)", padding: "0 12px" }}>or</span>
          <div className="flex-1" style={{ height: 1, background: "rgba(255,255,255,0.15)" }} />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <input type="email" placeholder="Email address" value={email}
            onChange={e => setEmail(e.target.value)} style={darkInputStyle}
            onFocus={focusStyle} onBlur={blurStyle} />
          <div className="relative" style={{ marginTop: 12, marginBottom: 8 }}>
            <input type={showPassword ? "text" : "password"} placeholder="Password" value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ ...darkInputStyle, paddingRight: 44 }}
              onFocus={focusStyle} onBlur={blurStyle} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute cursor-pointer"
              style={{ right: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.40)", transition: "color 200ms ease" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.40)")}>
              {showPassword ? <EyeOff style={{ width: 20, height: 20 }} /> : <Eye style={{ width: 20, height: 20 }} />}
            </button>
          </div>

          {/* Forgot password */}
          <div style={{ textAlign: "right", marginBottom: 20 }}>
            <button type="button" onClick={() => setShowForgot(true)} className="cursor-pointer"
              style={{ fontSize: 12, color: "rgba(255,255,255,0.50)", background: "none", border: "none", transition: "color 200ms ease" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.50)")}>
              Forgot password?
            </button>
          </div>

          <button type="submit" disabled={loading} className="cursor-pointer active:opacity-95"
            style={{
              width: "100%", height: 48, background: "linear-gradient(135deg, #E8733A 0%, #FF6B9D 100%)",
              border: "none", borderRadius: 12, fontSize: 15, fontWeight: 600, color: "white",
              boxShadow: "0 4px 24px rgba(232,115,58,0.40), inset 0 1px 0 rgba(255,255,255,0.20)",
              marginBottom: 16, transition: "all 200ms ease", opacity: loading ? 0.6 : 1,
            }}
            onMouseEnter={e => { if (!loading) { e.currentTarget.style.boxShadow = "0 6px 32px rgba(232,115,58,0.55), inset 0 1px 0 rgba(255,255,255,0.20)"; e.currentTarget.style.transform = "translateY(-1px)"; } }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 4px 24px rgba(232,115,58,0.40), inset 0 1px 0 rgba(255,255,255,0.20)"; e.currentTarget.style.transform = "translateY(0)"; }}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        {/* Register org link */}
        <div className="text-center" style={{ marginBottom: 16 }}>
          <Link to="/join-as-institution" className="inline-flex items-center gap-2"
            style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", transition: "color 200ms ease" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#E8733A")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.45)")}>
            <Building2 style={{ width: 14, height: 14 }} /> Register as an Organisation
          </Link>
        </div>

        {/* Terms */}
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.30)", lineHeight: "16px", textAlign: "center" }}>
          By signing in, you agree to our{" "}
          <Link to="/terms" style={{ color: "rgba(255,255,255,0.50)" }}
            onMouseEnter={e => (e.currentTarget.style.textDecoration = "underline")}
            onMouseLeave={e => (e.currentTarget.style.textDecoration = "none")}>Terms</Link>{" "}and{" "}
          <Link to="/privacy" style={{ color: "rgba(255,255,255,0.50)" }}
            onMouseEnter={e => (e.currentTarget.style.textDecoration = "underline")}
            onMouseLeave={e => (e.currentTarget.style.textDecoration = "none")}>Privacy Policy</Link>
        </p>
      </motion.div>

      {/* Forgot Password Modal */}
      {showForgot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.60)" }} onClick={() => setShowForgot(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="mx-4" onClick={e => e.stopPropagation()}
            style={{
              width: 400, maxWidth: "90vw", padding: 28,
              background: "linear-gradient(145deg, rgba(26,26,78,0.95), rgba(45,45,122,0.90))",
              backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
              border: "1px solid rgba(255,255,255,0.15)", borderRadius: 16,
              boxShadow: "0 25px 60px rgba(0,0,0,0.40)",
            }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#F0F2F7", marginBottom: 8 }}>Reset your password</h2>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginBottom: 20 }}>
              Enter your email and we'll send you a reset link.
            </p>
            <input type="email" placeholder="Email address" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
              style={{ ...darkInputStyle, marginBottom: 16 }} onFocus={focusStyle} onBlur={blurStyle} />
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowForgot(false)}
                style={{ flex: 1, height: 40, borderRadius: 10, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)", color: "#F0F2F7", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
                Cancel
              </button>
              <button type="button" onClick={handleForgotPassword} disabled={forgotLoading}
                style={{ flex: 1, height: 40, borderRadius: 10, background: "linear-gradient(135deg, #E8733A, #FF6B9D)", border: "none", color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: forgotLoading ? 0.6 : 1 }}>
                {forgotLoading ? "Sending..." : "Send Reset Link"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default SignIn;

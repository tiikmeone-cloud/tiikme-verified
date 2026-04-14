import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Building2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import ThemeLogo from "@/components/ThemeLogo";

const SignIn = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.info("Please fill in all fields"); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Welcome back!");
      navigate("/app/feed");
    }
  };

  const handleGoogleAuth = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/app/feed" },
    });
    if (error) toast.error(error.message);
  };

  const handleForgotPassword = async () => {
    if (!email) { toast.info("Enter your email first"); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(error.message);
    else toast.success("Reset link sent to " + email);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #1A1A4E 0%, #0D0D2B 100%)" }}
    >
      {/* Animated background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute w-[600px] h-[600px] rounded-full"
          style={{
            top: "20%",
            left: "15%",
            background: "radial-gradient(circle, rgba(232,115,58,0.15) 0%, transparent 70%)",
            filter: "blur(60px)",
            animation: "driftBlob1 20s ease-in-out infinite",
          }}
        />
        <div
          className="absolute w-[500px] h-[500px] rounded-full"
          style={{
            top: "40%",
            right: "10%",
            background: "radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)",
            filter: "blur(60px)",
            animation: "driftBlob2 25s ease-in-out infinite",
          }}
        />
      </div>

      {/* Glass card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="glass-dark w-full max-w-[420px] p-8 relative z-10 mx-4"
      >
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 mb-8">
          <ThemeLogo className="h-10 w-auto" style={{ filter: "brightness(10) drop-shadow(0 0 20px rgba(232,115,58,0.4))" }} />
        </Link>

        {/* Heading */}
        <h1 className="text-[28px] font-bold mb-1" style={{ color: "#F0F2F7", letterSpacing: "-0.02em" }}>
          Welcome back.
        </h1>
        <p className="text-[14px] mb-6" style={{ color: "rgba(255,255,255,0.55)" }}>
          New here?{" "}
          <Link to="/signup" className="font-semibold" style={{ color: "rgba(232,115,58,0.9)" }}>
            Create your profile
          </Link>
        </p>

        {/* Google OAuth */}
        <button
          type="button"
          onClick={handleGoogleAuth}
          className="w-full h-12 rounded-2xl flex items-center justify-center gap-2 text-[14px] font-semibold mb-5 cursor-pointer transition-all duration-150 active:scale-[0.98]"
          style={{
            background: "rgba(255, 255, 255, 0.10)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255, 255, 255, 0.25)",
            color: "#F0F2F7",
          }}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-5">
          <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.20)" }} />
          <span className="text-[12px]" style={{ color: "rgba(255,255,255,0.40)" }}>or</span>
          <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.20)" }} />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(255,255,255,0.50)" }} />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="glass-input-dark w-full pl-10 h-11"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(255,255,255,0.50)" }} />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="glass-input-dark w-full pl-10 pr-10 h-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer"
              style={{ color: "rgba(255,255,255,0.50)" }}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              className="text-[13px] font-medium cursor-pointer transition-colors"
              style={{ color: "rgba(255,255,255,0.60)" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.60)")}
              onClick={handleForgotPassword}
            >
              Forgot password?
            </button>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-liquid-primary w-full h-12 flex items-center justify-center gap-1 text-[15px] cursor-pointer disabled:opacity-60"
          >
            {loading ? <span className="animate-pulse">Signing in...</span> : <>Sign in <ArrowRight className="w-4 h-4 ml-1" /></>}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-[12px] mt-5" style={{ color: "rgba(255,255,255,0.40)" }}>
          By signing in, you agree to our{" "}
          <Link to="/terms" style={{ color: "rgba(232,115,58,0.7)" }}>Terms</Link> and{" "}
          <Link to="/privacy" style={{ color: "rgba(232,115,58,0.7)" }}>Privacy Policy</Link>
        </p>
        <div className="mt-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.10)" }}>
          <Link
            to="/join-as-institution"
            className="flex items-center justify-center gap-2 text-[13px] font-bold transition-colors"
            style={{ color: "rgba(255,255,255,0.50)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#E8733A")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.50)")}
          >
            <Building2 className="w-4 h-4" /> Register as an Organisation →
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default SignIn;

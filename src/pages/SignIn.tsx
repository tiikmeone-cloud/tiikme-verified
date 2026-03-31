import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

const SignIn = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.info("Please fill in all fields"); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); navigate("/app/feed"); toast.success("Welcome back!"); }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden" style={{ background: "#04061A" }}>
      {/* Orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[20%] left-[15%] w-[400px] h-[400px] rounded-full" style={{ background: "radial-gradient(circle, rgba(61,90,241,0.12) 0%, transparent 70%)", animation: "floatOrb1 12s ease-in-out infinite", filter: "blur(40px)" }} />
        <div className="absolute bottom-[15%] right-[10%] w-[300px] h-[300px] rounded-full" style={{ background: "radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 70%)", animation: "floatOrb3 18s ease-in-out infinite", filter: "blur(50px)" }} />
      </div>

      <div className="flex w-full max-w-4xl relative z-10 gap-8 items-center">
        {/* Glassmorphism form card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md mx-auto lg:mx-0 rounded-2xl p-8"
          style={{
            background: "rgba(255,255,255,0.04)",
            backdropFilter: "blur(40px)",
            WebkitBackdropFilter: "blur(40px)",
            boxShadow: "0 0 0 1px rgba(255,255,255,0.06), 0 24px 48px rgba(0,0,0,0.4)",
          }}
        >
          <Link to="/" className="text-2xl font-extrabold mb-6 block text-[#EEF0FF]">Tiikme</Link>
          <h1 className="text-[28px] font-extrabold mb-1 text-[#EEF0FF]">Welcome back</h1>
          <p className="text-[14px] mb-7" style={{ color: "rgba(238,240,255,0.5)" }}>Sign in to your verified profile</p>

          {/* Google OAuth */}
          <Button variant="secondary" size="lg" className="w-full mb-5 h-12 rounded-xl active:scale-95 transition-all duration-200"
            style={{ background: "rgba(238,240,255,0.06)", border: "1.5px solid rgba(238,240,255,0.1)", color: "#EEF0FF" }}
            onClick={() => toast.info("Google OAuth")}>
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </Button>

          <div className="flex items-center gap-4 mb-5">
            <div className="flex-1 h-px" style={{ background: "rgba(238,240,255,0.1)" }} />
            <span className="text-[11px]" style={{ color: "rgba(238,240,255,0.3)" }}>or</span>
            <div className="flex-1 h-px" style={{ background: "rgba(238,240,255,0.1)" }} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(238,240,255,0.3)" }} />
              <Input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)}
                className="pl-10 h-12 rounded-xl" style={{ background: "rgba(238,240,255,0.05)", border: "1.5px solid rgba(238,240,255,0.1)", color: "#EEF0FF" }} />
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(238,240,255,0.3)" }} />
              <Input type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
                className="pl-10 pr-10 h-12 rounded-xl" style={{ background: "rgba(238,240,255,0.05)", border: "1.5px solid rgba(238,240,255,0.1)", color: "#EEF0FF" }} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer" style={{ color: "rgba(238,240,255,0.3)" }}>
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex justify-end">
              <button type="button" className="text-[12px] font-medium cursor-pointer" style={{ color: "var(--brand)" }} onClick={() => toast.info("Reset link sent")}>Forgot password?</button>
            </div>
            <Button size="lg" className="w-full h-12 rounded-xl active:scale-95 transition-all duration-200" disabled={loading}>
              {loading ? <span className="animate-pulse">Signing in...</span> : <>Sign in <ArrowRight className="w-4 h-4" /></>}
            </Button>
          </form>

          <p className="text-center text-[13px] mt-6" style={{ color: "rgba(238,240,255,0.4)" }}>
            Don't have an account? <Link to="/signup" className="font-semibold hover:underline" style={{ color: "var(--brand)" }}>Create profile</Link>
          </p>
        </motion.div>

        {/* Testimonial side (desktop) */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="hidden lg:block flex-1 max-w-md"
        >
          <div className="rounded-2xl p-8" style={{ background: "rgba(238,240,255,0.04)", border: "1px solid rgba(238,240,255,0.07)", backdropFilter: "blur(20px)" }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-full flex items-center justify-center text-[12px] font-bold text-white" style={{ backgroundColor: "#4F46E5" }}>PK</div>
              <div>
                <p className="text-[14px] font-bold text-[#EEF0FF]">Priya Kapoor</p>
                <p className="text-[11px]" style={{ color: "rgba(238,240,255,0.4)" }}>Final Year, IIT Delhi</p>
              </div>
            </div>
            <p className="text-[14px] leading-[1.8]" style={{ color: "rgba(238,240,255,0.7)" }}>
              "Tiikme let me showcase my capstone project with faculty verification.
              Got 3 interview calls within a week — recruiters actually checked my work,
              not just my resume."
            </p>
            <div className="mt-4 flex items-center gap-1">
              {[1, 2, 3, 4, 5].map(s => (
                <div key={s} className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--brand)" }} />
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SignIn;

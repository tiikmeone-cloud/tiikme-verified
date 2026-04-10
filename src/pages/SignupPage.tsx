import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import OnboardingShell from "@/components/onboarding/OnboardingShell";

const getStrength = (pw: string) => {
  if (pw.length < 8) return { level: 0, label: "Weak", color: "#DC2626", pct: 20 };
  const hasMixed = /[a-z]/.test(pw) && /[A-Z]/.test(pw) && /\d/.test(pw);
  const hasSpecial = /[^a-zA-Z0-9]/.test(pw);
  if (pw.length >= 12 && hasMixed && hasSpecial) return { level: 2, label: "Strong", color: "#10B981", pct: 100 };
  if (hasMixed) return { level: 1, label: "Fair", color: "#F59E0B", pct: 60 };
  return { level: 0, label: "Weak", color: "#DC2626", pct: 30 };
};

const inputStyle: React.CSSProperties = {
  background: "#fff", border: "1.5px solid #E5E7EB", borderRadius: 14,
  color: "#111827", height: 48, width: "100%", padding: "0 14px", fontSize: 14,
  outline: "none", fontFamily: "'Plus Jakarta Sans', sans-serif",
};

export default function SignupPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      navigate("/onboarding/role", { replace: true });
    }
  }, [user]);

  const strength = getStrength(password);

  const handleGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/onboarding/role" },
    });
    if (error) toast.error(error.message);
  };

  const handleSubmit = async () => {
    if (!email || !password) { toast.info("Please fill in all fields"); return; }
    if (password.length < 8) { toast.info("Password must be at least 8 characters"); return; }
    setSubmitting(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    sessionStorage.setItem("ob_email", email);
    navigate("/verify-email");
  };

  return (
    <OnboardingShell step={1}>
      <div className="rounded-3xl p-8 sm:p-10" style={{ background: "#fff", border: "1px solid #F3F4F6", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
        <h1 className="text-[28px] font-extrabold text-center mb-1" style={{ color: "#111827", letterSpacing: "-0.02em" }}>Create your account</h1>
        <p className="text-center text-[14px] mb-7" style={{ color: "#6B7280" }}>Your verified professional identity starts here.</p>

        {/* Google */}
        <button
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

        {/* Email */}
        <div className="space-y-4">
          <input
            type="email" placeholder="Email address" value={email}
            onChange={e => setEmail(e.target.value)} style={inputStyle}
          />

          {/* Password */}
          <div className="relative">
            <input
              type={showPw ? "text" : "password"} placeholder="Password (min 8 characters)"
              value={password} onChange={e => setPassword(e.target.value)} style={inputStyle}
            />
            <button
              type="button" onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
              style={{ color: "#9CA3AF" }}
            >
              {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {/* Strength bar */}
          {password.length > 0 && (
            <div className="space-y-1.5">
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#F3F4F6" }}>
                <div className="h-full rounded-full transition-all duration-300" style={{ width: `${strength.pct}%`, background: strength.color }} />
              </div>
              <p className="text-[12px] font-medium" style={{ color: strength.color }}>{strength.label}</p>
            </div>
          )}

          <button
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

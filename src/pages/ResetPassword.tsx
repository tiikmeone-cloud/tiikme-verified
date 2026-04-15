import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ThemeLogo from "@/components/ThemeLogo";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleReset = async () => {
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (!/[A-Z]/.test(password)) { setError("Password must contain at least 1 uppercase letter"); return; }
    if (!/\d/.test(password)) { setError("Password must contain at least 1 number"); return; }
    if (password !== confirm) { setError("Passwords do not match"); return; }
    setError("");
    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) { toast.error(err.message); return; }
    setDone(true);
    toast.success("Password updated successfully");
    setTimeout(() => navigate("/signin"), 2500);
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
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute rounded-full" style={{ width: 800, height: 800, top: "10%", left: "20%", background: "radial-gradient(circle 400px at center, rgba(232,115,58,0.12) 0%, transparent 100%)", animation: "driftBlob1 20s ease-in-out infinite alternate" }} />
      </div>

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 mx-4"
        style={{
          width: 400, maxWidth: "90vw", padding: 32,
          background: "linear-gradient(145deg, rgba(26,26,78,0.88), rgba(45,45,122,0.78))",
          backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
          border: "1px solid rgba(255,255,255,0.15)", borderRadius: 20,
          boxShadow: "0 25px 80px rgba(26,26,78,0.50), inset 0 1px 0 rgba(255,255,255,0.15)",
        }}>
        <div className="flex justify-center" style={{ marginBottom: 24 }}>
          <Link to="/">
            <div style={{ filter: "brightness(10) drop-shadow(0 0 20px rgba(232,115,58,0.35))" }}>
              <ThemeLogo className="h-9 w-auto" />
            </div>
          </Link>
        </div>

        {done ? (
          <div className="text-center">
            <CheckCircle2 style={{ width: 48, height: 48, color: "#34C759", margin: "0 auto 16px" }} />
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#F0F2F7", marginBottom: 8 }}>Password updated</h1>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.55)" }}>Redirecting to sign in...</p>
          </div>
        ) : (
          <>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#F0F2F7", marginBottom: 4 }}>Set your new password</h1>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginBottom: 24 }}>
              Enter a new password for your account.
            </p>

            <div className="relative" style={{ marginBottom: 12 }}>
              <input type={showPassword ? "text" : "password"} placeholder="New password (min 8 chars, 1 uppercase, 1 number)"
                value={password} onChange={e => { setPassword(e.target.value); setError(""); }}
                style={{ ...darkInputStyle, paddingRight: 44 }} onFocus={focusStyle} onBlur={blurStyle} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute cursor-pointer"
                style={{ right: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.40)" }}>
                {showPassword ? <EyeOff style={{ width: 18, height: 18 }} /> : <Eye style={{ width: 18, height: 18 }} />}
              </button>
            </div>

            <input type="password" placeholder="Confirm password" value={confirm}
              onChange={e => { setConfirm(e.target.value); setError(""); }}
              style={{ ...darkInputStyle, marginBottom: error ? 8 : 20 }} onFocus={focusStyle} onBlur={blurStyle} />

            {error && (
              <p className="flex items-center gap-1" style={{ fontSize: 12, color: "#EF4444", marginBottom: 16 }}>
                <AlertCircle style={{ width: 12, height: 12, flexShrink: 0 }} /> {error}
              </p>
            )}

            <button type="button" onClick={handleReset} disabled={loading} className="cursor-pointer active:opacity-95"
              style={{
                width: "100%", height: 48, background: "linear-gradient(135deg, #E8733A 0%, #FF6B9D 100%)",
                border: "none", borderRadius: 12, fontSize: 15, fontWeight: 600, color: "white",
                boxShadow: "0 4px 24px rgba(232,115,58,0.40)", opacity: loading ? 0.6 : 1,
              }}>
              {loading ? "Updating..." : "Update Password"}
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default ResetPassword;

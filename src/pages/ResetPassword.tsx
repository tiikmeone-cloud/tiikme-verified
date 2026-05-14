import { PageSEO } from "@/hooks/usePageSEO";
import { useState } from "react";
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AuthLayout from "@/components/layouts/AuthLayout";
import { AuthButton, AuthInput } from "@/components/layouts/AuthPrimitives";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleReset = async () => {
    if (password.length < 8) return setError("Password must be at least 8 characters");
    if (!/[A-Z]/.test(password)) return setError("Password must contain at least 1 uppercase letter");
    if (!/\d/.test(password)) return setError("Password must contain at least 1 number");
    if (password !== confirm) return setError("Passwords do not match");
    setError("");
    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) { toast.error(err.message); return; }
    setDone(true);
    toast.success("Password updated successfully");
    setTimeout(() => navigate("/signin"), 2500);
  };

  return (
    <>
    <PageSEO title="Reset Password | Tiikme" description="Set a new password for your Tiikme account." noIndex />
    <AuthLayout>
      {done ? (
        <div className="text-center">
          <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-[#34C759]" />
          <h1 className="mb-2 text-[24px] font-bold text-paper">Password updated</h1>
          <p className="text-[14px] text-paper/55">Redirecting to sign in…</p>
        </div>
      ) : (
        <>
          <h1 className="mb-1 text-[24px] font-bold text-paper">Set your new password</h1>
          <p className="mb-6 text-[13px] text-paper/55">Enter a new password for your account.</p>

          <div className="relative mb-3">
            <AuthInput
              type={showPassword ? "text" : "password"}
              placeholder="New password (min 8 chars, 1 uppercase, 1 number)"
              value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }}
              className="pr-12"
            />
            <button
              type="button" onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-paper/40 hover:text-paper transition cursor-pointer"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>

          <AuthInput
            type="password" placeholder="Confirm password"
            value={confirm} onChange={(e) => { setConfirm(e.target.value); setError(""); }}
            className="mb-4"
          />

          {error && (
            <p className="mb-4 flex items-center gap-1 text-[12px] text-destructive">
              <AlertCircle className="h-3 w-3 shrink-0" /> {error}
            </p>
          )}

          <AuthButton onClick={handleReset} loading={loading}>Update Password</AuthButton>

          <p className="mt-5 text-center text-[13px] text-paper/55">
            Remember it?{" "}
            <Link to="/signin" className="font-semibold text-brand hover:underline">Sign in</Link>
          </p>
        </>
      )}
    </AuthLayout>
    </>
  );
};

export default ResetPassword;

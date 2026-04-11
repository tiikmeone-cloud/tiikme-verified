import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import ThemeLogo from "@/components/ThemeLogo";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleReset = async () => {
    if (password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    if (password !== confirm) { toast.error("Passwords do not match"); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    setDone(true);
    toast.success("Password updated successfully");
    setTimeout(() => navigate("/signin"), 2500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#FFF8F2" }}>
      <div className="w-full max-w-[400px] text-center">
        <ThemeLogo className="h-10 w-auto mx-auto mb-8" />
        {done ? (
          <div>
            <h1 className="text-[24px] font-extrabold mb-3" style={{ color: "#04061A" }}>Password updated</h1>
            <p className="text-[14px]" style={{ color: "#6B7280" }}>Redirecting to sign in...</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8" style={{ border: "1px solid #E5E7EB" }}>
            <h1 className="text-[24px] font-extrabold mb-2" style={{ color: "#04061A" }}>Set your new password</h1>
            <p className="text-[14px] mb-6" style={{ color: "#6B7280" }}>Enter a new password for your account.</p>
            <div className="space-y-3 mb-6">
              <Input type="password" placeholder="New password (min 8 chars)" value={password} onChange={e => setPassword(e.target.value)} className="h-[44px]" />
              <Input type="password" placeholder="Confirm password" value={confirm} onChange={e => setConfirm(e.target.value)} className="h-[44px]" />
            </div>
            <Button onClick={handleReset} disabled={loading} className="w-full h-[44px]" style={{ backgroundColor: "#E8580A" }}>
              {loading ? "Updating..." : "Update Password"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;

/**
 * /accept-admin-invite?token=...
 * Invitee must be logged in AND OTP-verify the invited email before
 * the org_admins row is inserted.
 */
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ShieldCheck, Building2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { sendWorkEmailOtp, verifyWorkEmailOtp } from "@/lib/verificationOtp";

export default function AcceptAdminInvite() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const token = params.get("token") || "";

  const [invite, setInvite] = useState<any>(null);
  const [org, setOrg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<"intro" | "otp" | "done">("intro");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      if (!token) { setLoading(false); return; }
      const { data: inv } = await supabase
        .from("org_admin_invites")
        .select("*")
        .eq("token", token)
        .maybeSingle();
      if (!inv) { setLoading(false); return; }
      const { data: o } = await supabase
        .from("organizations")
        .select("id,name,slug,logo_url,email_domain")
        .eq("id", inv.org_id)
        .maybeSingle();
      setInvite(inv);
      setOrg(o);
      setLoading(false);
    })();
  }, [token]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading…</div>;

  if (!invite || !org) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass-card p-8 max-w-[420px] text-center">
          <h1 className="text-[20px] font-bold mb-2" style={{ color: "var(--text-1)" }}>Invite not found</h1>
          <p className="text-[13px]" style={{ color: "var(--text-2)" }}>This invite link is invalid or has expired.</p>
        </div>
      </div>
    );
  }

  if (invite.consumed_at) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass-card p-8 max-w-[420px] text-center">
          <h1 className="text-[20px] font-bold mb-2" style={{ color: "var(--text-1)" }}>Already accepted</h1>
          <p className="text-[13px]" style={{ color: "var(--text-2)" }}>This invite has already been used.</p>
        </div>
      </div>
    );
  }

  if (new Date(invite.expires_at) < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass-card p-8 max-w-[420px] text-center">
          <h1 className="text-[20px] font-bold mb-2" style={{ color: "var(--text-1)" }}>Invite expired</h1>
          <p className="text-[13px]" style={{ color: "var(--text-2)" }}>Ask the page owner to send a new invite.</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass-card p-8 max-w-[420px] text-center">
          <h1 className="text-[20px] font-bold mb-2" style={{ color: "var(--text-1)" }}>Sign in to accept</h1>
          <p className="text-[13px] mb-4" style={{ color: "var(--text-2)" }}>You need a Tiikme account to become an admin of {org.name}.</p>
          <Button onClick={() => navigate("/signin?next=" + encodeURIComponent(window.location.pathname + window.location.search))}>
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  const sendCode = async () => {
    setBusy(true);
    const r = await sendWorkEmailOtp(invite.invited_email);
    setBusy(false);
    if (!r.ok) { toast.error(r.error || "Couldn't send code"); return; }
    toast.success("Code sent to " + invite.invited_email);
    setStep("otp");
  };

  const verify = async () => {
    setBusy(true);
    const r = await verifyWorkEmailOtp(invite.invited_email, otp.replace(/\D/g, ""));
    if (!r.ok) { setBusy(false); toast.error(r.error || "Invalid code"); return; }

    // Insert org_admins row
    const { error: insErr } = await supabase.from("org_admins").insert({
      org_id: invite.org_id,
      user_id: user.id,
      role: invite.role || "admin",
      invited_by: invite.invited_by,
    });
    if (insErr && !insErr.message.includes("duplicate")) {
      setBusy(false); toast.error("Couldn't add: " + insErr.message); return;
    }

    // Mark invite consumed
    await supabase.from("org_admin_invites")
      .update({ consumed_at: new Date().toISOString(), consumed_by: user.id })
      .eq("id", invite.id);

    setBusy(false);
    setStep("done");
    setTimeout(() => navigate(`/org/${org.slug}`), 1200);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="glass-card p-8 max-w-[420px] w-full">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center" style={{ background: "var(--brand-dim)" }}>
            {org.logo_url
              ? <img src={org.logo_url} alt="" className="w-full h-full object-cover" />
              : <Building2 className="w-6 h-6" style={{ color: "var(--brand)" }} />}
          </div>
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wider" style={{ color: "var(--text-3)" }}>Admin invite</p>
            <h1 className="text-[18px] font-bold truncate" style={{ color: "var(--text-1)" }}>{org.name}</h1>
          </div>
        </div>

        {step === "intro" && (
          <>
            <p className="text-[13px] mb-4" style={{ color: "var(--text-2)" }}>
              You've been invited as <strong>{invite.role}</strong> for {org.name}. To accept, prove you control{" "}
              <strong>{invite.invited_email}</strong> by entering a 6-digit code.
            </p>
            <Button onClick={sendCode} disabled={busy} className="w-full">
              <ShieldCheck className="w-4 h-4 mr-1" /> {busy ? "Sending..." : "Send verification code"}
            </Button>
          </>
        )}

        {step === "otp" && (
          <>
            <p className="text-[13px] mb-3" style={{ color: "var(--text-2)" }}>
              Enter the code sent to <strong>{invite.invited_email}</strong>
            </p>
            <Input
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="123456"
              inputMode="numeric"
              maxLength={6}
              className="text-center tracking-[0.5em] font-mono text-[18px] mb-3"
              autoFocus
            />
            <Button onClick={verify} disabled={busy || otp.length !== 6} className="w-full">
              {busy ? "Verifying..." : "Accept admin role"}
            </Button>
          </>
        )}

        {step === "done" && (
          <div className="text-center py-4">
            <ShieldCheck className="w-10 h-10 mx-auto mb-2" style={{ color: "#10B981" }} />
            <p className="text-[14px] font-bold" style={{ color: "var(--text-1)" }}>You're now an admin of {org.name}</p>
          </div>
        )}
      </div>
    </div>
  );
}

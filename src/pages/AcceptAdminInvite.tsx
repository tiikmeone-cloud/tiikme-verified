/**
 * /accept-admin-invite?token=...
 * Invitee must be logged in AND OTP-verify the invited email before
 * the org_admins row is inserted. Renders inside the unified Tiikme
 * AuthLayout (Glass on Midnight).
 */
import { PageSEO } from "@/hooks/usePageSEO";
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ShieldCheck, Building2 } from "lucide-react";
import { toast } from "sonner";
import AuthLayout from "@/components/layouts/AuthLayout";
import { AuthButton, AuthInput } from "@/components/layouts/AuthPrimitives";
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

  const message = (title: string, body: string) => (
    <AuthLayout>
      <div className="text-center">
        <h1 className="text-[22px] font-extrabold mb-2 text-paper">{title}</h1>
        <p className="text-[13px] text-paper/65">{body}</p>
      </div>
    </AuthLayout>
  );

  if (loading) return message("Loading…", "Checking your invite.");
  if (!invite || !org) return message("Invite not found", "This invite link is invalid or has expired.");
  if (invite.consumed_at) return message("Already accepted", "This invite has already been used.");
  if (new Date(invite.expires_at) < new Date()) return message("Invite expired", "Ask the page owner to send a new invite.");

  if (!user) {
    return (
      <AuthLayout>
        <div className="text-center">
          <h1 className="text-[22px] font-extrabold mb-2 text-paper">Sign in to accept</h1>
          <p className="text-[13px] text-paper/65 mb-5">
            You need a Tiikme account to become an admin of {org.name}.
          </p>
          <AuthButton
            onClick={() => navigate("/signin?next=" + encodeURIComponent(window.location.pathname + window.location.search))}
          >
            Sign in
          </AuthButton>
        </div>
      </AuthLayout>
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

    const { error: insErr } = await supabase.from("org_admins").insert({
      org_id: invite.org_id,
      user_id: user.id,
      role: invite.role || "admin",
      invited_by: invite.invited_by,
    });
    if (insErr && !insErr.message.includes("duplicate")) {
      setBusy(false); toast.error("Couldn't add: " + insErr.message); return;
    }

    await supabase.from("org_admin_invites")
      .update({ consumed_at: new Date().toISOString(), consumed_by: user.id })
      .eq("id", invite.id);

    setBusy(false);
    setStep("done");
    setTimeout(() => navigate(`/org/${org.slug}`), 1200);
  };

  return (
    <>
    <PageSEO title="Accept Admin Invite | Tiikme" description="Accept your organization admin invitation on Tiikme." noIndex />
    <AuthLayout>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center bg-brand/15">
          {org.logo_url
            ? <img src={org.logo_url} alt="" className="w-full h-full object-cover" />
            : <Building2 className="w-6 h-6 text-brand" />}
        </div>
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wider text-paper/55">Admin invite</p>
          <h1 className="text-[18px] font-bold truncate text-paper">{org.name}</h1>
        </div>
      </div>

      {step === "intro" && (
        <>
          <p className="text-[13px] mb-5 text-paper/75">
            You've been invited as <strong className="text-paper">{invite.role}</strong> for {org.name}. To accept, prove you control{" "}
            <strong className="text-paper">{invite.invited_email}</strong> by entering a 6-digit code.
          </p>
          <AuthButton onClick={sendCode} loading={busy}>
            <ShieldCheck className="w-4 h-4" /> Send verification code
          </AuthButton>
        </>
      )}

      {step === "otp" && (
        <>
          <p className="text-[13px] mb-3 text-paper/75">
            Enter the code sent to <strong className="text-paper">{invite.invited_email}</strong>
          </p>
          <AuthInput
            value={otp}
            onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="123456"
            inputMode="numeric"
            maxLength={6}
            className="text-center tracking-[0.5em] font-mono text-[18px] mb-3"
            autoFocus
          />
          <AuthButton onClick={verify} disabled={otp.length !== 6} loading={busy}>
            Accept admin role
          </AuthButton>
        </>
      )}

      {step === "done" && (
        <div className="text-center py-4">
          <ShieldCheck className="w-10 h-10 mx-auto mb-2 text-emerald-400" />
          <p className="text-[14px] font-bold text-paper">You're now an admin of {org.name}</p>
        </div>
      )}
    </AuthLayout>
    </>
  );
}

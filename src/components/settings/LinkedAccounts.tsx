import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { tiikToast } from "@/components/ui/tiik-toast";
import { Button } from "@/components/ui/button";

type Identity = { provider: string; id: string; identity_id?: string };

const LinkedAccounts = () => {
  const [identities, setIdentities] = useState<Identity[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [confirmUnlink, setConfirmUnlink] = useState(false);

  const refresh = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.getUserIdentities();
    if (error) {
      console.warn("[LinkedAccounts] getUserIdentities:", error.message);
      setIdentities([]);
    } else {
      setIdentities((data?.identities || []) as Identity[]);
    }
    setLoading(false);
  };

  useEffect(() => { refresh(); }, []);

  const hasGoogle = identities.some(i => i.provider === "google");
  const hasEmail = identities.some(i => i.provider === "email");

  const linkGoogle = async () => {
    setBusy(true);
    const { error } = await supabase.auth.linkIdentity({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { access_type: "offline", prompt: "select_account" },
      },
    });
    setBusy(false);
    if (error) tiikToast.error(error.message);
    // On success the browser is redirected to Google; no further action here.
  };

  const unlinkGoogle = async () => {
    const googleIdentity = identities.find(i => i.provider === "google");
    if (!googleIdentity) return;
    if (identities.length <= 1) {
      tiikToast.error("You need at least one sign-in method. Set a password first.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.unlinkIdentity(googleIdentity as any);
    setBusy(false);
    if (error) {
      tiikToast.error(error.message);
    } else {
      tiikToast.success("Google account unlinked");
      setConfirmUnlink(false);
      refresh();
    }
  };

  return (
    <div className="glass-light" style={{ padding: 16, borderRadius: 20 }}>
      <h3 className="text-[16px] font-semibold mb-1" style={{ color: "#1A1A2E" }}>Linked Accounts</h3>
      <p className="text-[13px] mb-4" style={{ color: "#6B7094" }}>
        Sign in with multiple methods. Linking lets you use either to access the same account.
      </p>

      <div className="flex items-center justify-between py-3" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
        <div className="flex items-center gap-3">
          <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden>
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          <div>
            <div className="text-[14px] font-medium" style={{ color: "#1A1A2E" }}>Google</div>
            <div className="text-[12px]" style={{ color: "#6B7094" }}>
              {loading ? "Checking…" : hasGoogle ? "Linked" : "Not linked"}
            </div>
          </div>
        </div>
        {!loading && (
          hasGoogle ? (
            !confirmUnlink ? (
              <Button variant="ghost" size="sm" disabled={busy} onClick={() => setConfirmUnlink(true)}>
                Unlink
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setConfirmUnlink(false)}>Cancel</Button>
                <Button variant="destructive" size="sm" disabled={busy} onClick={unlinkGoogle}>
                  {busy ? "Unlinking…" : "Confirm"}
                </Button>
              </div>
            )
          ) : (
            <Button variant="default" size="sm" disabled={busy} onClick={linkGoogle}>
              {busy ? "Opening…" : "Link Google"}
            </Button>
          )
        )}
      </div>

      {hasEmail && (
        <div className="flex items-center justify-between py-3" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
          <div>
            <div className="text-[14px] font-medium" style={{ color: "#1A1A2E" }}>Email & Password</div>
            <div className="text-[12px]" style={{ color: "#6B7094" }}>Linked</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LinkedAccounts;

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AuthLayout from "@/components/layouts/AuthLayout";
import { getStoredPostAuthRedirect } from "@/lib/safeRedirect";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error || !session) {
          navigate("/signin?error=oauth_failed", { replace: true });
          return;
        }

        const { markRecentAuth } = await import("@/lib/idleLogout");
        markRecentAuth();

        const stored = getStoredPostAuthRedirect();
        if (stored) {
          sessionStorage.removeItem("post_auth_redirect");
          navigate(stored, { replace: true });
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("id, onboarding_complete, account_type")
          .eq("id", session.user.id)
          .maybeSingle();

        if (!profile || profile.onboarding_complete === false) {
          navigate("/onboarding/1", { replace: true });
        } else if (profile.account_type === "institution") {
          navigate("/app/workspace", { replace: true });
        } else {
          navigate("/app/feed", { replace: true });
        }
        toast.success("Welcome!");
      } catch (e: any) {
        console.error("[AuthCallback]", e);
        navigate("/signin?error=oauth_failed", { replace: true });
      }
    })();
  }, [navigate]);

  return (
    <AuthLayout hideLogo maxWidth={360}>
      <div className="flex flex-col items-center gap-3 py-2 text-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        <p className="text-[14px] text-paper/70">Signing you in…</p>
      </div>
    </AuthLayout>
  );
};

export default AuthCallback;

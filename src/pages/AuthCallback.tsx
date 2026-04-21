import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import PageLoader from "@/components/PageLoader";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        // Supabase parses the OAuth code/hash automatically (detectSessionInUrl: true)
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error || !session) {
          navigate("/signin?error=oauth_failed", { replace: true });
          return;
        }

        const { markRecentAuth } = await import("@/lib/idleLogout");
        markRecentAuth();

        // Honor pending deep-link redirect if present
        const stored = sessionStorage.getItem("post_auth_redirect");
        if (stored && stored.startsWith("/")) {
          sessionStorage.removeItem("post_auth_redirect");
          navigate(stored, { replace: true });
          return;
        }

        // Decide onboarding vs feed based on profile.onboarding_complete
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

  return <PageLoader />;
};

export default AuthCallback;

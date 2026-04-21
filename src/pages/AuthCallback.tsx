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
        // Supabase auto-parses the OAuth hash/code on load via detectSessionInUrl.
        // We just need to read the resulting session and route accordingly.
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (!session?.user) {
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

        // Route by onboarding completion + account type
        const { data: prof } = await supabase
          .from("profiles")
          .select("account_type, onboarding_complete")
          .eq("id", session.user.id)
          .maybeSingle();

        if (!prof?.onboarding_complete) {
          navigate("/onboarding/1", { replace: true });
        } else if (prof.account_type === "institution") {
          navigate("/app/workspace", { replace: true });
        } else {
          navigate("/app/feed", { replace: true });
        }
        toast.success("Welcome!");
      } catch (e: any) {
        console.error("[AuthCallback]", e);
        toast.error(e?.message || "Sign-in failed");
        navigate("/signin", { replace: true });
      }
    })();
  }, [navigate]);

  return <PageLoader />;
};

export default AuthCallback;

import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { safeInternalRedirect } from "@/lib/safeRedirect";
import { Navigate, useLocation } from "react-router-dom";

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
    <div
      className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
      style={{ borderColor: "var(--brand)", borderTopColor: "transparent" }}
    />
  </div>
);

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, profile, loading, profileReady, profileError, refreshProfile } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner />;
  if (!user) {
    // Preserve the deep link so we can return after sign-in
    const intended = `${location.pathname}${location.search}${location.hash}`;
    const redirectParam = intended && intended !== "/" ? `?redirect=${encodeURIComponent(intended)}` : "";
    return <Navigate to={`/signin${redirectParam}`} replace />;
  }

  // While the profile row hasn't loaded yet (just after Google signup the
  // handle_new_user trigger is still firing), don't bounce — show the spinner
  // so we never flash the wrong screen and never lose the deep link.
  if (!profile && !profileReady) return <Spinner />;
  if (!profile && profileReady) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--bg)" }}>
        <div className="max-w-md w-full rounded-2xl border p-6 text-center bg-white shadow-sm" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
          <h1 className="text-lg font-semibold" style={{ color: "var(--text-1)" }}>We couldn&apos;t load your profile</h1>
          <p className="mt-2 text-sm" style={{ color: "var(--text-3)" }}>
            {profileError || "Your session is active, but profile data did not finish loading."}
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => void refreshProfile()}
              className="px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ background: "#FF5A1F", color: "#fff", border: "none" }}
            >
              Retry
            </button>
            <button
              type="button"
              onClick={() => void supabase.auth.signOut()}
              className="px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ background: "rgba(0,0,0,0.06)", color: "var(--text-1)", border: "none" }}
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Institution accounts skip the personal onboarding flow entirely.
  // Also send users with null profession_type through onboarding even if they
  // previously marked complete (old 1-step onboarding didn't save profession_type).
  // Only send to onboarding if onboarding_complete is explicitly false/null.
  // Don't gate on profession_type — old users may have null there despite completing onboarding.
  const needsOnboarding =
    profile.account_type !== "institution" &&
    !profile.onboarding_complete;

  if (needsOnboarding && !location.pathname.startsWith("/onboarding")) {
    return <Navigate to="/onboarding" replace />;
  }

  // If they finished onboarding, never let them back into /onboarding/*
  if (!needsOnboarding && location.pathname.startsWith("/onboarding")) {
    return <Navigate to="/app/feed" replace />;
  }

  return <>{children}</>;
};

export const PublicOnlyRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Spinner />;
  if (user) {
    // Honor ?redirect= so users land back on the deep link after auth
    const params = new URLSearchParams(location.search);
    const redirect = safeInternalRedirect(params.get("redirect"));
    // If they haven't onboarded yet, route them through onboarding first
    if (profile && profile.account_type !== "institution" && !profile.onboarding_complete) {
      return <Navigate to="/onboarding" replace />;
    }
    return <Navigate to={redirect || "/app/feed"} replace />;
  }
  return <>{children}</>;
};

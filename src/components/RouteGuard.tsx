import { useAuth } from "@/contexts/AuthContext";
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
  const { user, profile, loading } = useAuth();
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
  if (!profile) return <Spinner />;

  // Institution accounts skip the personal onboarding flow entirely.
  const needsOnboarding =
    profile.account_type !== "institution" && !profile.onboarding_complete;

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
    const redirect = params.get("redirect");
    // If they haven't onboarded yet, route them through onboarding first
    if (profile && profile.account_type !== "institution" && !profile.onboarding_complete) {
      return <Navigate to="/onboarding" replace />;
    }
    return <Navigate to={redirect && redirect.startsWith("/") ? redirect : "/app/feed"} replace />;
  }
  return <>{children}</>;
};

import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useLocation } from "react-router-dom";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}><div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--brand)", borderTopColor: "transparent" }} /></div>;
  if (!user) {
    // Preserve the deep link so we can return after sign-in
    const intended = `${location.pathname}${location.search}${location.hash}`;
    const redirectParam = intended && intended !== "/" ? `?redirect=${encodeURIComponent(intended)}` : "";
    return <Navigate to={`/signin${redirectParam}`} replace />;
  }

  // Redirect new users to onboarding if incomplete (only for accounts < 10 minutes old)
  const isNewAccount = user.created_at && (Date.now() - new Date(user.created_at).getTime()) < 600000;
  const needsOnboarding = profile && !profile.onboarding_complete && isNewAccount && profile.account_type !== 'institution';

  if (needsOnboarding && !location.pathname.startsWith("/onboarding")) {
    return <Navigate to="/onboarding/role" replace />;
  }

  return <>{children}</>;
};

export const PublicOnlyRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}><div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--brand)", borderTopColor: "transparent" }} /></div>;
  if (user) {
    // Honor ?redirect= so users land back on the deep link after auth
    const params = new URLSearchParams(location.search);
    const redirect = params.get("redirect");
    return <Navigate to={redirect && redirect.startsWith("/") ? redirect : "/app/feed"} replace />;
  }
  return <>{children}</>;
};

import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}><div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--brand)", borderTopColor: "transparent" }} /></div>;
  if (!user) return <Navigate to="/signin" replace />;
  return <>{children}</>;
};

export const PublicOnlyRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}><div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--brand)", borderTopColor: "transparent" }} /></div>;
  if (user) return <Navigate to="/app/feed" replace />;
  return <>{children}</>;
};

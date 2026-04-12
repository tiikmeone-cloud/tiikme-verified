import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useOrgIdentity } from "@/contexts/OrgIdentityContext";
import PageLoader from "@/components/PageLoader";

/**
 * When an institution account visits /app/profile,
 * redirect them to their org page at /org/{slug}.
 */
export default function InstitutionProfile() {
  const { profile, loading } = useAuth();
  const { isInstitution, org, loading: orgLoading } = useOrgIdentity();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || orgLoading) return;
    if (isInstitution && org?.slug && org.slug.length > 0) {
      navigate(`/org/${org.slug}`, { replace: true });
      return;
    }
    // If not institution, go to feed immediately
    if (!isInstitution) {
      navigate("/app/feed", { replace: true });
    }
  }, [loading, orgLoading, isInstitution, org, navigate]);

  // Safety timeout: if org slug never resolves after 3s, bail to feed
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!org?.slug || org.slug.length === 0) {
        navigate("/app/feed", { replace: true });
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [org, navigate]);

  return <PageLoader />;
}

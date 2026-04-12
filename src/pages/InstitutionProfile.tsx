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
    if (isInstitution && org?.slug) {
      navigate(`/org/${org.slug}`, { replace: true });
    } else {
      // Fallback — shouldn't happen but safety net
      navigate("/app/feed", { replace: true });
    }
  }, [loading, orgLoading, isInstitution, org, navigate]);

  return <PageLoader />;
}

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useOrgIdentity } from "@/contexts/OrgIdentityContext";
import PageLoader from "@/components/PageLoader";

export default function InstitutionProfile() {
  const navigate = useNavigate();
  const { isInstitution, org, loading } = useOrgIdentity();

  useEffect(() => {
    if (loading) return;
    if (isInstitution && org?.slug && org.slug.length > 0) {
      navigate(`/org/${org.slug}`, { replace: true });
      return;
    }
    if (!isInstitution) {
      navigate("/app/feed", { replace: true });
    }
  }, [loading, isInstitution, org, navigate]);

  // Safety timeout
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

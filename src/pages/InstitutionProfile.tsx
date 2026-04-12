import { useOrgIdentity } from "@/contexts/OrgIdentityContext";
import PageLoader from "@/components/PageLoader";
import OrgHero from "@/components/org/OrgHero";
import OrgTabs from "@/components/org/OrgTabs";

export default function InstitutionProfile() {
  const { isInstitution, org, loading } = useOrgIdentity();
  if (loading) return <PageLoader />;
  if (!isInstitution || !org) return <PageLoader />;
  return (
    <div className="min-h-screen bg-[#FFF8F2]">
      <OrgHero org={org} isOwner={true} />
      <OrgTabs org={org} isOwner={true} />
    </div>
  );
}

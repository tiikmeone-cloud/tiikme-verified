/**
 * In-app org creation flow. Wraps the existing 5-step institution wizard
 * so users land here from the app shell (e.g. "Create organization" CTA)
 * instead of going through a fresh signup.
 *
 * Lives at /app/organizations/create. The previous public
 * /join-as-institution route now redirects here for any signed-in user.
 */
import { lazy, Suspense } from "react";
import PageLoader from "@/components/PageLoader";

const JoinAsInstitution = lazy(() => import("./JoinAsInstitution"));

export default function OrganizationCreate() {
  return (
    <Suspense fallback={<PageLoader />}>
      <JoinAsInstitution />
    </Suspense>
  );
}

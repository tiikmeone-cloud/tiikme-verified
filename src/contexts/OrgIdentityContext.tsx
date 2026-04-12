import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface OrgIdentity {
  id: string;
  name: string;
  slug: string;
  type: string;
  logo_url: string | null;
  cover_url: string | null;
  tagline: string | null;
  description: string | null;
  city: string | null;
  state: string | null;
  website_url: string | null;
  followers_count: number;
  is_verified: boolean;
  email: string | null;
  phone: string | null;
  employee_count: string | null;
  founded_year: number | null;
  social_links: any;
  allow_messages: boolean;
  allow_employee_requests: boolean;
}

interface OrgIdentityContextValue {
  /** True if the logged-in user is an institution account */
  isInstitution: boolean;
  /** The org record for institution accounts, null otherwise */
  org: OrgIdentity | null;
  /** Loading state */
  loading: boolean;
  /** Display name — org name for institutions, user name otherwise */
  identityName: string;
  /** Avatar URL — org logo for institutions, user avatar otherwise */
  identityAvatar: string | null;
  /** Initials for avatar fallback */
  identityInitials: string;
  /** Refresh org data */
  refreshOrg: () => Promise<void>;
}

const OrgIdentityContext = createContext<OrgIdentityContextValue>({
  isInstitution: false,
  org: null,
  loading: false,
  identityName: "",
  identityAvatar: null,
  identityInitials: "U",
  refreshOrg: async () => {},
});

export const useOrgIdentity = () => useContext(OrgIdentityContext);

export const OrgIdentityProvider = ({ children }: { children: ReactNode }) => {
  const { user, profile, displayName, initials } = useAuth();
  const [org, setOrg] = useState<OrgIdentity | null>(null);
  const [loading, setLoading] = useState(false);

  const isInstitution = profile?.account_type === "institution" && !!(profile as any)?.org_id;

  const fetchOrg = useCallback(async () => {
    const orgId = (profile as any)?.org_id;
    if (!orgId) { setOrg(null); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", orgId)
        .maybeSingle();
      if (error) { console.warn("[OrgIdentity] fetch error:", error.message); setOrg(null); }
      else if (data) {
        setOrg({
          id: data.id,
          name: data.name,
          slug: data.slug,
          type: data.type,
          logo_url: data.logo_url,
          cover_url: data.cover_url,
          tagline: data.tagline,
          description: data.description,
          city: data.city,
          state: data.state,
          website_url: data.website_url,
          followers_count: data.followers_count || 0,
          is_verified: data.is_verified || false,
          email: data.email,
          phone: data.phone,
          employee_count: data.employee_count,
          founded_year: data.founded_year,
          social_links: data.social_links,
          allow_messages: data.allow_messages ?? true,
          allow_employee_requests: data.allow_employee_requests ?? true,
        });
      } else { setOrg(null); }
    } catch (e) { console.warn("[OrgIdentity] exception:", e); setOrg(null); }
    setLoading(false);
  }, [(profile as any)?.org_id]);

  useEffect(() => {
    if (isInstitution) fetchOrg();
    else setOrg(null);
  }, [isInstitution, fetchOrg]);

  const identityName = isInstitution && org ? org.name : displayName;
  const identityAvatar = isInstitution && org ? org.logo_url : profile?.avatar_url || null;
  const identityInitials = identityName
    ? identityName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
    : "U";

  return (
    <OrgIdentityContext.Provider value={{
      isInstitution,
      org,
      loading,
      identityName,
      identityAvatar,
      identityInitials,
      refreshOrg: fetchOrg,
    }}>
      {children}
    </OrgIdentityContext.Provider>
  );
};

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export interface UserProfile {
  id: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  role: string | null;
  role_subtype: string | null;
  headline: string | null;
  bio: string | null;
  avatar_url: string | null;
  institution_name: string | null;
  location_city: string | null;
  location_state: string | null;
  activity_score: number | null;
  is_public: boolean | null;
  custom_links: any[];
  open_to_work: boolean | null;
  designation: string | null;
  sector: string | null;
  languages: string[] | null;
  department: string | null;
  is_verified: boolean | null;
  role_metadata: Record<string, any> | null;
  about_qa: Record<string, any> | null;
  verification_badge_text: string | null;
  verification_type: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  initials: string;
  displayName: string;
  refreshProfile: () => Promise<void>;
  refetchProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  loading: true,
  initials: "",
  displayName: "",
  refreshProfile: async () => {},
  refetchProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

const getProfileCacheKey = (userId: string) => `tiikme-profile:${userId}`;

const readCachedProfile = (userId: string): UserProfile | null => {
  try {
    const cached = localStorage.getItem(getProfileCacheKey(userId));
    return cached ? (JSON.parse(cached) as UserProfile) : null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("Profile fetch error:", error);
        setProfile(readCachedProfile(userId));
      } else {
        setProfile(data as any);
        if (data) {
          localStorage.setItem(getProfileCacheKey(userId), JSON.stringify(data));
        } else {
          localStorage.removeItem(getProfileCacheKey(userId));
        }
      }
    } catch (e) {
      console.error("Profile fetch exception:", e);
      setProfile(readCachedProfile(userId));
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const hydrateAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!isMounted) return;

      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        const cachedProfile = readCachedProfile(currentUser.id);
        if (cachedProfile) setProfile(cachedProfile);
        void fetchProfile(currentUser.id);
      } else {
        setProfile(null);
      }

      setLoading(false);
    };

    void hydrateAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!isMounted) return;

        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          const cachedProfile = readCachedProfile(currentUser.id);
          if (cachedProfile) setProfile(cachedProfile);
          void fetchProfile(currentUser.id);
        } else {
          setProfile(null);
        }

        setLoading(false);
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const refreshProfile = useCallback(async () => {
    if (user?.id) await fetchProfile(user.id);
  }, [user?.id, fetchProfile]);

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "";
  const initials = displayName
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "U";

  return (
    <AuthContext.Provider value={{ user, profile, loading, initials, displayName, refreshProfile, refetchProfile: refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

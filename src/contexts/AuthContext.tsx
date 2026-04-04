import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UserProfile {
  id: string;
  full_name: string;
  first_name: string | null;
  last_name: string | null;
  username: string;
  role: string;
  role_subtype: string | null;
  headline: string | null;
  bio: string | null;
  avatar_url: string | null;
  institution_name: string | null;
  location_city: string | null;
  location_state: string | null;
  activity_score: number;
  is_public: boolean;
  custom_links: any[];
  open_to_work: boolean;
  designation: string | null;
  sector: string | null;
  languages: string[] | null;
}

interface AuthContextValue {
  user: any | null;
  profile: UserProfile | null;
  loading: boolean;
  initials: string;
  displayName: string;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  loading: true,
  initials: "",
  displayName: "",
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string, meta?: any) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (data) {
      setProfile(data as any);
    } else if (error?.code === "PGRST116") {
      // Profile doesn't exist — create one
      const fallbackName = meta?.full_name || meta?.first_name || "";
      const { data: newProfile } = await supabase.from("profiles").insert({
        id: userId,
        full_name: fallbackName,
        first_name: meta?.first_name || null,
        last_name: meta?.last_name || null,
        role: meta?.role || "student",
        username: (meta?.first_name || "user").toLowerCase().replace(/[^a-z0-9]/g, "") + "_" + userId.substring(0, 6),
      }).select().single();
      if (newProfile) setProfile(newProfile as any);
    }
  };

  const refreshProfile = async () => {
    if (user?.id) await fetchProfile(user.id, user.user_metadata);
  };

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id, session.user.user_metadata);
      }
      setLoading(false);
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id, session.user.user_metadata);
      } else {
        setUser(null);
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "";
  const initials = displayName
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "U";

  return (
    <AuthContext.Provider value={{ user, profile, loading, initials, displayName, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

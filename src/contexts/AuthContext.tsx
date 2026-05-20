import { createContext, useContext, useEffect, useState, useCallback, ReactNode, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PROFILE_SELECT_COLUMNS } from "@/lib/profileColumns";
import type { User } from "@supabase/supabase-js";
// NOTE: messageEncryption (libsodium ~50KB) is dynamically imported inside the
// effect below so anonymous landing-page visitors never pay for it.

export interface UserProfile {
  id: string;
  full_name: string | null;
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
  otw_visibility: string | null;
  designation: string | null;
  sector: string | null;
  languages: string[] | null;
  department: string | null;
  is_verified: boolean | null;
  public_key: string | null;
  key_created_at: string | null;
  role_metadata: Record<string, any> | null;
  about_qa: Record<string, any> | null;
  verification_badge_text: string | null;
  verification_type: string | null;
  created_at: string | null;
  updated_at: string | null;
  onboarding_complete: boolean | null;
  account_type: string | null;
  org_id: string | null;
  skills: string[] | null;
  display_preference: string | null;
  profession_type: string | null;
  currently_working_at: string | null;
  is_moderator: boolean | null;
}

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isReady: boolean;
  profileReady: boolean;
  profileError: string | null;
  initials: string;
  displayName: string;
  refreshProfile: () => Promise<void>;
  refetchProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  loading: true,
  isReady: false,
  profileReady: false,
  profileError: null,
  initials: "",
  displayName: "",
  refreshProfile: async () => {},
  refetchProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

const PROFILE_CACHE_VERSION = 2;
const PROFILE_CACHE_KEY = (id: string) => `tiikme-profile:v${PROFILE_CACHE_VERSION}:${id}`;

const readCache = (id: string): UserProfile | null => {
  try {
    const raw = localStorage.getItem(PROFILE_CACHE_KEY(id));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [profileReady, setProfileReady] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchProfile = useCallback(async (userId: string) => {
    setProfileError(null);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select(PROFILE_SELECT_COLUMNS)
        .eq("id", userId)
        .maybeSingle();

      if (!mountedRef.current) return;

      if (error) {
        console.error("Profile fetch error:", error);
        const cached = readCache(userId);
        setProfile(prev => prev || cached);
        if (!cached) {
          setProfileError(error.message || "We could not load your profile.");
        }
      } else {
        setProfile(data as any);
        if (data) localStorage.setItem(PROFILE_CACHE_KEY(userId), JSON.stringify(data));
        else localStorage.removeItem(PROFILE_CACHE_KEY(userId));
        if (!data) {
          setProfileError("We could not find a profile for this account.");
        }
      }
    } catch (e) {
      if (!mountedRef.current) return;
      console.error("Profile fetch exception:", e);
      const cached = readCache(userId);
      setProfile(prev => prev || cached);
      if (!cached) {
        setProfileError(e instanceof Error ? e.message : "We could not load your profile.");
      }
    } finally {
      if (mountedRef.current) setProfileReady(true);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    // 1. Restore session from storage — this is the ONLY blocking call
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mountedRef.current) return;
      const u = session?.user ?? null;
      setUser(u);
      setIsReady(true); // App can render immediately

      if (u) {
        // Show cached profile instantly, then refresh in background
        const cached = readCache(u.id);
        setProfileReady(!!cached);
        if (cached) setProfile(cached);
        // Fire-and-forget — never block on this
        fetchProfile(u.id);
      } else {
        setProfile(null);
        setProfileReady(true);
        setProfileError(null);
      }
    });

    // 2. Listen for future auth changes (sign-in, sign-out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mountedRef.current) return;
        const u = session?.user ?? null;
        setUser(u);
        setIsReady(true);

        if (u) {
          const cached = readCache(u.id);
          setProfileReady(!!cached);
          if (cached) setProfile(cached);
          // Non-blocking profile refresh
          fetchProfile(u.id);
        } else {
          setProfile(null);
          setProfileReady(true);
          setProfileError(null);
        }
      }
    );

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const refreshProfile = useCallback(async () => {
    if (user?.id) await fetchProfile(user.id);
  }, [user?.id, fetchProfile]);

  // Ensure the user has an E2EE keypair generated (in IndexedDB) and published (on profile).
  // Runs once profile is loaded; safe to re-run because publish is no-op if keys already match.
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      try {
        const { ensurePublishedKey } = await import("@/lib/messageEncryption");
        await ensurePublishedKey(user.id, profile?.public_key ?? null);
        if (!cancelled && !profile?.public_key) {
          // Refresh profile so consumers see the new public_key without a reload
          fetchProfile(user.id);
        }
      } catch (e) {
        console.warn("[E2EE] keypair init failed:", e);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id, profile?.public_key, fetchProfile]);

  // Activity Score V2: bump days_active once per session per calendar day.
  // The DB function is idempotent on the same calendar date, but we also
  // session-dedupe to avoid extra round-trips during a single tab lifetime.
  useEffect(() => {
    if (!user?.id) return;
    const key = `tiikme:days-active:${user.id}:${new Date().toISOString().slice(0, 10)}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    supabase.rpc("increment_days_active", { uid: user.id }).then(({ error }) => {
      if (error) console.warn("[ActivityScore] increment_days_active failed:", error.message);
    });
  }, [user?.id]);

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "";
  const initials = displayName
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "U";

  return (
    <AuthContext.Provider value={{
      user, profile,
      loading: !isReady,
      isReady,
      profileReady,
      profileError,
      initials, displayName,
      refreshProfile, refetchProfile: refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

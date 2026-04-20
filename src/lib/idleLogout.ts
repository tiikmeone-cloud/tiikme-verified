/**
 * Idle auto sign-out: signs the user out after `IDLE_MS` of no activity.
 * Mounted once at the App level via useIdleLogout().
 */
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const IDLE_MS = 24 * 60 * 60 * 1000; // 24 hours
const ACTIVITY_KEY = "tiikme:last-activity";

export function useIdleLogout() {
  useEffect(() => {
    const bump = () => {
      try {
        localStorage.setItem(ACTIVITY_KEY, String(Date.now()));
      } catch {
        // ignore (private mode etc.)
      }
    };

    // Initial bump
    bump();

    const events = ["mousedown", "keydown", "touchstart", "scroll", "visibilitychange"];
    events.forEach((e) => window.addEventListener(e, bump, { passive: true }));

    const interval = setInterval(async () => {
      try {
        const last = parseInt(localStorage.getItem(ACTIVITY_KEY) || "0", 10);
        if (last && Date.now() - last > IDLE_MS) {
          const { data } = await supabase.auth.getSession();
          if (data.session) {
            await supabase.auth.signOut();
            localStorage.removeItem(ACTIVITY_KEY);
            window.location.href = "/signin";
          }
        }
      } catch {
        // ignore
      }
    }, 5 * 60 * 1000); // check every 5 minutes

    return () => {
      events.forEach((e) => window.removeEventListener(e, bump));
      clearInterval(interval);
    };
  }, []);
}

/**
 * Returns ms since the user last completed a sign-in event.
 * Used to gate critical actions (delete account, change password) — re-auth if > 5 min.
 */
const REAUTH_KEY = "tiikme:last-auth";

export function markRecentAuth() {
  try {
    localStorage.setItem(REAUTH_KEY, String(Date.now()));
  } catch {
    // ignore
  }
}

export function isRecentlyAuthed(maxAgeMs = 5 * 60 * 1000): boolean {
  try {
    const last = parseInt(localStorage.getItem(REAUTH_KEY) || "0", 10);
    return last > 0 && Date.now() - last < maxAgeMs;
  } catch {
    return false;
  }
}

/**
 * Verified badge expires 6 months after verified_at.
 */
export function isVerificationActive(verifiedAt: string | null | undefined): boolean {
  if (!verifiedAt) return false;
  const t = new Date(verifiedAt).getTime();
  if (!t) return false;
  const sixMonthsMs = 183 * 24 * 60 * 60 * 1000;
  return Date.now() - t < sixMonthsMs;
}

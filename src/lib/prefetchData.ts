import { QueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Tier 2/3 data prefetchers — keyed by route prefix (first 3 segments).
 * Queries here MUST match the queryKeys used by the actual page hooks for
 * cache-hit on navigation. When a page uses a different queryKey shape, we
 * still warm up the row cache via Supabase response, which the page-level
 * fetch will then read from network — so prefer matching keys when possible.
 */
export const ROUTE_PREFETCHERS: Record<string, (qc: QueryClient, userId: string) => Promise<unknown>> = {
  "/app/feed": async (qc, uid) => {
    await qc.prefetchQuery({
      queryKey: ["feed", "prefetch", uid],
      staleTime: 5 * 60 * 1000,
      queryFn: async () => {
        const { data } = await supabase
          .from("posts")
          .select("*, author:profiles!posts_author_id_fkey(id, full_name, username, avatar_url, role, is_verified)")
          .order("created_at", { ascending: false })
          .limit(20);
        return data || [];
      },
    });
  },
  "/app/opportunities": async (qc, uid) => {
    await qc.prefetchQuery({
      queryKey: ["opportunities", "prefetch", uid],
      staleTime: 5 * 60 * 1000,
      queryFn: async () => {
        const { data } = await supabase
          .from("opportunities")
          .select("*")
          .eq("is_open", true)
          .order("created_at", { ascending: false })
          .limit(20);
        return data || [];
      },
    });
  },
  "/app/circles": async (qc) => {
    await qc.prefetchQuery({
      queryKey: ["circles", "prefetch"],
      staleTime: 5 * 60 * 1000,
      queryFn: async () => {
        const { data } = await supabase
          .from("circles")
          .select("*")
          .eq("visibility", "public")
          .order("member_count", { ascending: false })
          .limit(30);
        return data || [];
      },
    });
  },
  "/app/explore": async (qc, uid) => {
    await qc.prefetchQuery({
      queryKey: ["explore", "prefetch", uid],
      staleTime: 5 * 60 * 1000,
      queryFn: async () => {
        const [people, orgs] = await Promise.all([
          supabase.from("profiles").select("id, full_name, username, avatar_url, role, headline, activity_score").neq("id", uid).limit(15),
          supabase.from("organizations").select("id, name, slug, logo_url, type, tagline").limit(10),
        ]);
        return { people: people.data || [], orgs: orgs.data || [] };
      },
    });
  },
  "/app/connections": async (qc, uid) => {
    await qc.prefetchQuery({
      queryKey: ["connections", "prefetch", uid],
      staleTime: 5 * 60 * 1000,
      queryFn: async () => {
        const { data } = await supabase
          .from("strands")
          .select("*, requester:profiles!strands_requester_id_fkey(id, full_name, username, avatar_url, role), receiver:profiles!strands_receiver_id_fkey(id, full_name, username, avatar_url, role)")
          .or(`requester_id.eq.${uid},receiver_id.eq.${uid}`)
          .eq("status", "accepted")
          .limit(50);
        return data || [];
      },
    });
  },
  "/app/pings": async (qc, uid) => {
    await qc.prefetchQuery({
      queryKey: ["pings", "prefetch", uid],
      staleTime: 2 * 60 * 1000,
      queryFn: async () => {
        const { data } = await supabase
          .from("conversations")
          .select("*, p1:profiles!conversations_participant_1_fkey(id, full_name, username, avatar_url), p2:profiles!conversations_participant_2_fkey(id, full_name, username, avatar_url)")
          .or(`participant_1.eq.${uid},participant_2.eq.${uid}`)
          .order("last_message_at", { ascending: false, nullsFirst: false })
          .limit(30);
        return data || [];
      },
    });
  },
  "/app/profile": async (qc, uid) => {
    await qc.prefetchQuery({
      queryKey: ["profile", "prefetch", uid],
      staleTime: 5 * 60 * 1000,
      queryFn: async () => {
        const [profile, work] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
          supabase.from("work_items").select("*").eq("owner_id", uid).order("start_date", { ascending: false }),
        ]);
        return { profile: profile.data, work: work.data || [] };
      },
    });
  },
  "/app/alerts": async (qc, uid) => {
    await qc.prefetchQuery({
      queryKey: ["alerts", "prefetch", uid],
      staleTime: 60 * 1000,
      queryFn: async () => {
        const [alerts, notifs] = await Promise.all([
          supabase.from("alerts").select("*").eq("user_id", uid).order("created_at", { ascending: false }).limit(30),
          supabase.from("notifications").select("*").eq("user_id", uid).order("created_at", { ascending: false }).limit(30),
        ]);
        return { alerts: alerts.data || [], notifs: notifs.data || [] };
      },
    });
  },
};

const _inFlight = new Set<string>();

/** Normalize "/app/profile/abc" → "/app/profile" so prefetch dedupes correctly. */
function normalizeKey(path: string): string {
  return path.split("/").slice(0, 3).join("/");
}

export async function prefetchOnHover(qc: QueryClient, path: string, userId?: string): Promise<void> {
  if (!userId) return;
  const key = normalizeKey(path);
  if (_inFlight.has(key)) return;
  const fn = ROUTE_PREFETCHERS[key];
  if (!fn) return;
  _inFlight.add(key);
  try {
    await fn(qc, userId);
  } catch {
    /* swallow — page fetch will retry naturally */
  } finally {
    _inFlight.delete(key);
  }
}

/** Idle-time prefetch of adjacent routes (Tier 3). */
export const ADJACENT_ROUTES: Record<string, string[]> = {
  "/app/feed":          ["/app/opportunities", "/app/circles", "/app/pings"],
  "/app/profile":       ["/app/feed", "/app/opportunities"],
  "/app/opportunities": ["/app/feed", "/app/profile", "/app/connections"],
  "/app/circles":       ["/app/feed", "/app/connections"],
  "/app/explore":       ["/app/feed", "/app/connections"],
  "/app/connections":   ["/app/pings", "/app/feed"],
  "/app/pings":         ["/app/connections", "/app/feed"],
  "/app/alerts":        ["/app/feed", "/app/pings"],
};

export function prefetchAdjacentData(qc: QueryClient, path: string, userId?: string): void {
  if (!userId) return;
  const key = normalizeKey(path);
  const adj = ADJACENT_ROUTES[key];
  if (!adj?.length) return;
  const idle: (cb: () => void) => number =
    (window as unknown as { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback
      ? (cb) => (window as any).requestIdleCallback(cb, { timeout: 2000 })
      : (cb) => window.setTimeout(cb, 200);
  idle(() => {
    adj.forEach((a) => { void prefetchOnHover(qc, a, userId); });
  });
}

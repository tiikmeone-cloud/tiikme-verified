/**
 * Prefetch helpers — warm the dynamic-import code chunks for adjacent routes
 * on hover. Idempotent: dynamic import cache deduplicates calls.
 */
const cache = new Set<string>();

const importers: Record<string, () => Promise<unknown>> = {
  "/app/feed": () => import("@/pages/Feed"),
  "/app/explore": () => import("@/pages/Explore"),
  "/app/opportunities": () => import("@/pages/Opportunities"),
  "/app/workspace": () => import("@/pages/Workspace"),
  "/app/connections": () => import("@/pages/Connections"),
  "/app/pings": () => import("@/pages/Pings"),
  "/app/alerts": () => import("@/pages/Alerts"),
  "/app/settings": () => import("@/pages/Settings"),
  "/app/profile": () => import("@/pages/Profile"),
};

export function prefetchRoute(path: string) {
  const key = path.split("?")[0];
  if (cache.has(key)) return;
  const fn = importers[key];
  if (!fn) return;
  cache.add(key);
  // Fire-and-forget; ignore failures (will retry naturally on real nav)
  fn().catch(() => cache.delete(key));
}

/** Idle-time prefetch of common adjacent pages from a current route. */
const adjacency: Record<string, string[]> = {
  "/app/feed": ["/app/explore", "/app/pings"],
  "/app/explore": ["/app/opportunities", "/app/feed"],
  "/app/opportunities": ["/app/explore", "/app/profile"],
  "/app/profile": ["/app/connections", "/app/workspace"],
  "/app/pings": ["/app/feed", "/app/alerts"],
};

export function prefetchAdjacent(currentPath: string) {
  const key = currentPath.split("?")[0];
  const list = adjacency[key];
  if (!list) return;
  const idle = (window as any).requestIdleCallback || ((cb: () => void) => setTimeout(cb, 800));
  idle(() => list.forEach(prefetchRoute));
}

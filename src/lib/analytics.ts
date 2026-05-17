import { supabase } from "@/integrations/supabase/client";

let _surface = "unknown";

/** Set the current product surface (e.g. "feed", "explore", "profile"). */
export function obsSetSurface(surface: string) {
  _surface = surface;
}

/** Fire-and-forget event to obs-ingest-event edge function. */
export function trackEvent(
  event: string,
  properties?: Record<string, unknown>
) {
  supabase.functions
    .invoke("obs-ingest-event", {
      body: {
        event,
        surface: _surface,
        ts: Date.now(),
        url: typeof window !== "undefined" ? window.location.pathname : null,
        ...properties,
      },
    })
    .catch(() => {/* swallow — observability must never break the app */});
}

/** Track a page view. Call inside a useEffect on mount. */
export function trackPageView(page: string, properties?: Record<string, unknown>) {
  obsSetSurface(page);
  trackEvent("page_view", { page, ...properties });
}

const SUPABASE_URL = "https://fpyprwenlqpuspskewgq.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZweXByd2VubHFwdXNwc2tld2dxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MjIzNjEsImV4cCI6MjA5MDE5ODM2MX0.O1k0uiOh1QdGZDn0MselNwBw4YRsd--yHjaURB7KbnM";

let _surface = "unknown";

export function obsSetSurface(surface: string) {
  _surface = surface;
}

export function trackEvent(event: string, properties?: Record<string, unknown>) {
  const payload = {
    events: [{
      event,
      surface: _surface,
      ts: new Date().toISOString(),
      url: typeof window !== "undefined" ? window.location.pathname : null,
      ...properties,
    }],
  };
  fetch(`${SUPABASE_URL}/functions/v1/obs-ingest-event`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {});
}

export function trackPageView(page: string, properties?: Record<string, unknown>) {
  obsSetSurface(page);
  trackEvent("page_view", { page, ...properties });
}

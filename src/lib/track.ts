/**
 * Lightweight event tracking — writes to obs_events via Supabase.
 * Fire-and-forget: never throws, never blocks UI.
 */
import { supabase } from "@/integrations/supabase/client";

export function track(event: string, properties: Record<string, unknown> = {}) {
  supabase.auth.getUser().then(({ data: { user } }) => {
    supabase
      .from("obs_events" as any)
      .insert({ event, properties: properties ?? {}, surface: "other", user_id: user?.id ?? null })
      .then(() => {})
      .catch(() => {});
  });
}

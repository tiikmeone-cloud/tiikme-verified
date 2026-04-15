import { supabase } from "@/integrations/supabase/client";

/**
 * Fire-and-forget notification insert.
 * Skips if targetUserId === actorId (never notify yourself).
 */
export function sendNotification({
  userId,
  actorId,
  type,
  title,
  body,
  actionUrl,
  data,
}: {
  userId: string;
  actorId?: string;
  type: string;
  title: string;
  body?: string;
  actionUrl?: string;
  data?: Record<string, any>;
}) {
  if (!userId) return;
  if (actorId && actorId === userId) return; // never self-notify

  supabase
    .from("alerts")
    .insert({
      user_id: userId,
      type,
      title,
      body: body || null,
      action_url: actionUrl || null,
      data: { ...(data || {}), actor_id: actorId || null } as any,
    })
    .then(({ error }) => {
      if (error) console.warn("[notify]", error.message);
    });
}

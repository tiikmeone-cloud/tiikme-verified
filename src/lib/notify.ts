import { supabase } from "@/integrations/supabase/client";

/**
 * Fire-and-forget notification insert.
 * Writes to BOTH alerts and notifications tables for backward compat.
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

  const payload = {
    user_id: userId,
    type,
    title,
    body: body || null,
    action_url: actionUrl || null,
    data: { ...(data || {}), actor_id: actorId || null } as any,
    is_read: false,
  };

  // Write to notifications table (primary)
  supabase
    .from("notifications")
    .insert(payload)
    .then(({ error }) => {
      if (error) console.warn("[notify:notifications]", error.message);
    });
}

/**
 * Helper: fetch post author_id for a given post.
 * Returns null if not found.
 */
export async function getPostAuthorId(postId: string): Promise<string | null> {
  const { data } = await supabase
    .from("posts")
    .select("author_id")
    .eq("id", postId)
    .maybeSingle();
  return data?.author_id || null;
}

import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = "https://fpyprwenlqpuspskewgq.supabase.co";

export type TiikmePilotMode =
  | "discover"
  | "jobs"
  | "people"
  | "circles"
  // legacy values kept for historical thread data
  | "profile"
  | "hiring"
  | "verification";

export interface TiikmePilotSource {
  type: "organization" | "opportunity" | "post" | "circle" | "profile";
  id: string;
  title: string;
  subtitle?: string | null;
  href?: string | null;
  meta?: string | null;
}

export interface TiikmePilotReply {
  threadId: string;
  assistantMessageId?: string | null;
  answer: string;
  sourceCards: TiikmePilotSource[];
  remainingChats: number;
  remainingDailyRequests?: number;
  mode: TiikmePilotMode;
  usedFallback?: boolean;
  answerPath?: "deterministic" | "llm" | "fallback";
}

export interface TiikmePilotThread {
  id: string;
  title: string;
  mode: TiikmePilotMode;
  preview: string;
  updatedAt: string;
}

export interface TiikmePilotMessageRecord {
  id: string;
  role: "user" | "assistant";
  content: string;
  metadata?: Record<string, any> | null;
  created_at: string;
}

export const MAX_PILOT_CHATS = 10;

export async function askPilot(opts: {
  message: string;
  mode: TiikmePilotMode;
  threadId?: string;
}): Promise<TiikmePilotReply> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const res = await fetch(`${SUPABASE_URL}/functions/v1/tiikme-pilot`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${session.access_token}`,
      "apikey": session.access_token,
    },
    body: JSON.stringify(opts),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Pilot request failed");
  return data as TiikmePilotReply;
}

export async function loadPilotThreads(): Promise<TiikmePilotThread[]> {
  const { data } = await supabase
    .from("ai_threads" as any)
    .select("id, title, mode, last_mode, last_message_at")
    .eq("is_archived", false)
    .order("last_message_at", { ascending: false })
    .limit(MAX_PILOT_CHATS + 5);

  return (data || []).map((t: any) => ({
    id: t.id,
    title: t.title || "Untitled thread",
    mode: (t.last_mode || t.mode || "discover") as TiikmePilotMode,
    preview: "",
    updatedAt: t.last_message_at || t.created_at,
  }));
}

export async function loadPilotMessages(threadId: string): Promise<TiikmePilotMessageRecord[]> {
  const { data } = await supabase
    .from("ai_messages" as any)
    .select("id, role, content, metadata, created_at")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });
  return ((data as unknown) as TiikmePilotMessageRecord[]) || [];
}

export async function archivePilotThread(threadId: string): Promise<void> {
  await supabase
    .from("ai_threads" as any)
    .update({ is_archived: true })
    .eq("id", threadId);
}

export async function deletePilotThread(threadId: string): Promise<void> {
  await supabase.from("ai_messages" as any).delete().eq("thread_id", threadId);
  await supabase.from("ai_threads" as any).delete().eq("id", threadId);
}

export async function ratePilotAnswer(messageId: string, rating: "up" | "down"): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("ai_message_feedback" as any)
    .upsert({ message_id: messageId, user_id: user.id, rating }, { onConflict: "message_id,user_id" });
}

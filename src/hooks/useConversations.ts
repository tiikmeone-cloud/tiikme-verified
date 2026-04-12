import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ConversationWithProfile {
  id: string;
  participant_1: string | null;
  participant_2: string | null;
  last_message_at: string | null;
  created_at: string | null;
  other_user?: {
    id: string;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
    role: string | null;
    institution_name: string | null;
    is_verified: boolean | null;
  };
  last_message?: string;
  last_message_type?: string | null;
  unread_count: number;
}

interface Message {
  id: string;
  content: string;
  sender_id: string | null;
  conversation_id: string | null;
  created_at: string | null;
  is_read: boolean | null;
  pdf_url: string | null;
  attachment_url?: string | null;
  attachment_type?: string | null;
  attachment_name?: string | null;
  attachment_size?: number | null;
  status?: "sending" | "delivered" | "read";
}

export function useConversations(userId: string | undefined) {
  const [conversations, setConversations] = useState<ConversationWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeConvoId, setActiveConvoId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const fetchConversations = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);

    const { data: convos, error: convoErr } = await supabase
      .from("conversations")
      .select("*")
      .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)
      .order("last_message_at", { ascending: false })
      .limit(50);

    if (convoErr) { console.warn("[useConversations] fetch failed:", convoErr.message); }
    if (!mountedRef.current) return;
    if (!convos || convos.length === 0) {
      setConversations([]);
      setLoading(false);
      return;
    }

    const otherIds = convos
      .map(c => c.participant_1 === userId ? c.participant_2 : c.participant_1)
      .filter(Boolean) as string[];
    const uniqueIds = [...new Set(otherIds)];

    const convoIds = convos.map(c => c.id);

    // Batch fetch: profiles, unread counts, and last messages
    const [profilesRes, unreadRes, lastMsgsRes] = await Promise.allSettled([
      supabase.from("profiles").select("id, full_name, username, avatar_url, role, institution_name, is_verified").in("id", uniqueIds),
      supabase.from("pings").select("conversation_id").in("conversation_id", convoIds).eq("is_read", false).neq("sender_id", userId),
      supabase.from("pings").select("conversation_id, content, created_at, attachment_type").in("conversation_id", convoIds).order("created_at", { ascending: false }).limit(200),
    ]);

    if (!mountedRef.current) return;

    const profilesData = profilesRes.status === "fulfilled" ? (profilesRes.value as any).data || [] : (console.warn("[useConversations] profiles failed"), []);
    const unreadData = unreadRes.status === "fulfilled" ? (unreadRes.value as any).data || [] : (console.warn("[useConversations] unread failed"), []);
    const lastMsgsData = lastMsgsRes.status === "fulfilled" ? (lastMsgsRes.value as any).data || [] : (console.warn("[useConversations] lastMsgs failed"), []);

    const unreadMap: Record<string, number> = {};
    (unreadRes.data || []).forEach(p => {
      unreadMap[p.conversation_id!] = (unreadMap[p.conversation_id!] || 0) + 1;
    });

    // Build last message map (first occurrence per convo = most recent)
    const lastMsgMap: Record<string, { content: string; attachment_type: string | null }> = {};
    (lastMsgsRes.data || []).forEach(p => {
      if (!lastMsgMap[p.conversation_id!]) {
        lastMsgMap[p.conversation_id!] = { content: p.content, attachment_type: (p as any).attachment_type || null };
      }
    });

    const profileMap = new Map((profilesRes.data || []).map(p => [p.id, p]));
    const enriched: ConversationWithProfile[] = convos.map(c => {
      const otherId = c.participant_1 === userId ? c.participant_2 : c.participant_1;
      const lastMsg = lastMsgMap[c.id];
      return {
        ...c,
        other_user: profileMap.get(otherId!) || undefined,
        last_message: lastMsg?.content || "",
        last_message_type: lastMsg?.attachment_type || null,
        unread_count: unreadMap[c.id] || 0,
      };
    });

    setConversations(enriched);
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  const loadMessages = useCallback(async (convoId: string) => {
    setActiveConvoId(convoId);
    setMessagesLoading(true);
    const { data } = await supabase
      .from("pings")
      .select("*")
      .eq("conversation_id", convoId)
      .order("created_at", { ascending: true })
      .limit(100);

    if (!mountedRef.current) return;
    setMessages((data || []).map(m => ({
      ...m,
      attachment_url: (m as any).attachment_url || null,
      attachment_type: (m as any).attachment_type || null,
      attachment_name: (m as any).attachment_name || null,
      attachment_size: (m as any).attachment_size || null,
      status: m.is_read ? "read" as const : "delivered" as const,
    })));
    setMessagesLoading(false);
    // Mark unread pings as read and clear badge instantly
    if (userId) {
      setConversations(prev => prev.map(c =>
        c.id === convoId ? { ...c, unread_count: 0 } : c
      ));
      void supabase.from("pings").update({ is_read: true }).eq("conversation_id", convoId).neq("sender_id", userId).eq("is_read", false);
    }
  }, [userId]);

  const sendMessage = useCallback(async (content: string, attachment?: { url: string; type: string; name: string; size: number }) => {
    if (!activeConvoId || !userId || (!content.trim() && !attachment)) return;
    const optimistic: Message = {
      id: crypto.randomUUID(),
      content: content || (attachment?.name || ""),
      sender_id: userId,
      conversation_id: activeConvoId,
      created_at: new Date().toISOString(),
      is_read: false,
      pdf_url: null,
      attachment_url: attachment?.url || null,
      attachment_type: attachment?.type || null,
      attachment_name: attachment?.name || null,
      attachment_size: attachment?.size || null,
      status: "sending",
    };
    setMessages(prev => [...prev, optimistic]);

    const insertData: any = { conversation_id: activeConvoId, sender_id: userId, content: content || attachment?.name || "" };
    if (attachment) {
      insertData.attachment_url = attachment.url;
      insertData.attachment_type = attachment.type;
      insertData.attachment_name = attachment.name;
      insertData.attachment_size = attachment.size;
    }

    const { data, error } = await supabase.from("pings").insert(insertData).select().single();

    if (error) {
      setMessages(prev => prev.map(m => m.id === optimistic.id ? { ...m, status: "sending" as const } : m));
    } else if (data) {
      setMessages(prev => prev.map(m => m.id === optimistic.id ? {
        ...data,
        attachment_url: (data as any).attachment_url || null,
        attachment_type: (data as any).attachment_type || null,
        attachment_name: (data as any).attachment_name || null,
        attachment_size: (data as any).attachment_size || null,
        status: "delivered" as const,
      } : m));
      supabase.from("conversations").update({ last_message_at: new Date().toISOString() }).eq("id", activeConvoId).then(() => {});
    }
  }, [activeConvoId, userId]);

  // Real-time
  useEffect(() => {
    if (!activeConvoId) return;
    const channel = supabase
      .channel(`pings:${activeConvoId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "pings", filter: `conversation_id=eq.${activeConvoId}` }, (payload) => {
        const newMsg = payload.new as any;
        if (newMsg.sender_id !== userId) {
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, { ...newMsg, status: "delivered" as const }];
          });
          supabase.from("pings").update({ is_read: true }).eq("id", newMsg.id).then(() => {});
        }
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "pings", filter: `conversation_id=eq.${activeConvoId}` }, (payload) => {
        const updated = payload.new as any;
        setMessages(prev => prev.map(m =>
          m.id === updated.id ? { ...m, is_read: updated.is_read, status: updated.is_read ? "read" as const : "delivered" as const } : m
        ));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeConvoId, userId]);

  useEffect(() => {
    if (!userId) return;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const debouncedRefresh = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => { fetchConversations(); }, 1000);
    };
    const channel = supabase
      .channel(`convos:${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "pings" }, (payload) => {
        if ((payload.new as any).sender_id !== userId) debouncedRefresh();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, () => { debouncedRefresh(); })
      .subscribe();
    return () => { if (debounceTimer) clearTimeout(debounceTimer); supabase.removeChannel(channel); };
  }, [userId, fetchConversations]);

  const findOrCreateConversation = useCallback(async (otherUserId: string) => {
    if (!userId) return null;
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .or(`and(participant_1.eq.${userId},participant_2.eq.${otherUserId}),and(participant_1.eq.${otherUserId},participant_2.eq.${userId})`)
      .maybeSingle();
    if (existing) return existing.id;
    const { data: newConvo } = await supabase.from("conversations").insert({ participant_1: userId, participant_2: otherUserId }).select("id").single();
    if (newConvo) { fetchConversations(); return newConvo.id; }
    return null;
  }, [userId, fetchConversations]);

  return {
    conversations, loading, activeConvoId,
    messages, messagesLoading,
    loadMessages, sendMessage, findOrCreateConversation,
    refetch: fetchConversations,
  };
}

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

  // Fetch conversations — optimized: batch queries instead of N+1
  const fetchConversations = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);

    const { data: convos } = await supabase
      .from("conversations")
      .select("*")
      .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)
      .order("last_message_at", { ascending: false })
      .limit(50);

    if (!mountedRef.current) return;
    if (!convos || convos.length === 0) {
      setConversations([]);
      setLoading(false);
      return;
    }

    // Batch: get all other user profiles in one query
    const otherIds = convos
      .map(c => c.participant_1 === userId ? c.participant_2 : c.participant_1)
      .filter(Boolean) as string[];
    const uniqueIds = [...new Set(otherIds)];

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, username, avatar_url, role, institution_name, is_verified")
      .in("id", uniqueIds);

    if (!mountedRef.current) return;

    // Batch: get all unread counts in one query per conversation
    // Instead of N+1, we just set unread to 0 and let realtime update it
    // For initial load, do a single batch query for unread pings
    const convoIds = convos.map(c => c.id);
    const { data: unreadPings } = await supabase
      .from("pings")
      .select("conversation_id")
      .in("conversation_id", convoIds)
      .eq("is_read", false)
      .neq("sender_id", userId);

    if (!mountedRef.current) return;

    // Count unreads per conversation
    const unreadMap: Record<string, number> = {};
    (unreadPings || []).forEach(p => {
      unreadMap[p.conversation_id!] = (unreadMap[p.conversation_id!] || 0) + 1;
    });

    // Build enriched list without per-conversation queries
    const profileMap = new Map((profiles || []).map(p => [p.id, p]));
    const enriched: ConversationWithProfile[] = convos.map(c => {
      const otherId = c.participant_1 === userId ? c.participant_2 : c.participant_1;
      return {
        ...c,
        other_user: profileMap.get(otherId!) || undefined,
        last_message: "", // Will show from realtime or can lazy-load
        unread_count: unreadMap[c.id] || 0,
      };
    });

    setConversations(enriched);
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  // Fetch messages for active conversation
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
    setMessages((data || []).map(m => ({ ...m, status: m.is_read ? "read" as const : "delivered" as const })));
    setMessagesLoading(false);

    // Mark as read (fire-and-forget)
    if (userId) {
      supabase
        .from("pings")
        .update({ is_read: true })
        .eq("conversation_id", convoId)
        .neq("sender_id", userId)
        .eq("is_read", false)
        .then(() => {});
    }
  }, [userId]);

  // Send message
  const sendMessage = useCallback(async (content: string) => {
    if (!activeConvoId || !userId || !content.trim()) return;
    const optimistic: Message = {
      id: crypto.randomUUID(),
      content,
      sender_id: userId,
      conversation_id: activeConvoId,
      created_at: new Date().toISOString(),
      is_read: false,
      pdf_url: null,
      status: "sending",
    };
    setMessages(prev => [...prev, optimistic]);

    const { data, error } = await supabase
      .from("pings")
      .insert({ conversation_id: activeConvoId, sender_id: userId, content })
      .select()
      .single();

    if (error) {
      setMessages(prev => prev.map(m => m.id === optimistic.id ? { ...m, status: "sending" as const } : m));
    } else if (data) {
      setMessages(prev => prev.map(m => m.id === optimistic.id ? { ...data, status: "delivered" as const } : m));
      // Update last_message_at (fire-and-forget)
      supabase.from("conversations").update({ last_message_at: new Date().toISOString() }).eq("id", activeConvoId).then(() => {});
    }
  }, [activeConvoId, userId]);

  // Real-time: active conversation messages
  useEffect(() => {
    if (!activeConvoId) return;
    const channel = supabase
      .channel(`pings:${activeConvoId}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "pings",
        filter: `conversation_id=eq.${activeConvoId}`,
      }, (payload) => {
        const newMsg = payload.new as any;
        if (newMsg.sender_id !== userId) {
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, { ...newMsg, status: "delivered" as const }];
          });
          // Auto mark as read
          supabase.from("pings").update({ is_read: true }).eq("id", newMsg.id).then(() => {});
        }
      })
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "pings",
        filter: `conversation_id=eq.${activeConvoId}`,
      }, (payload) => {
        const updated = payload.new as any;
        setMessages(prev => prev.map(m =>
          m.id === updated.id ? { ...m, is_read: updated.is_read, status: updated.is_read ? "read" as const : "delivered" as const } : m
        ));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeConvoId, userId]);

  // Real-time: conversation list updates (debounced)
  useEffect(() => {
    if (!userId) return;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const debouncedRefresh = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => { fetchConversations(); }, 1000);
    };

    const channel = supabase
      .channel(`convos:${userId}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "pings",
      }, (payload) => {
        if ((payload.new as any).sender_id !== userId) debouncedRefresh();
      })
      .on("postgres_changes", {
        event: "*", schema: "public", table: "conversations",
      }, () => { debouncedRefresh(); })
      .subscribe();

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [userId, fetchConversations]);

  // Find or create conversation
  const findOrCreateConversation = useCallback(async (otherUserId: string) => {
    if (!userId) return null;
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .or(`and(participant_1.eq.${userId},participant_2.eq.${otherUserId}),and(participant_1.eq.${otherUserId},participant_2.eq.${userId})`)
      .maybeSingle();

    if (existing) return existing.id;

    const { data: newConvo } = await supabase
      .from("conversations")
      .insert({ participant_1: userId, participant_2: otherUserId })
      .select("id")
      .single();

    if (newConvo) {
      fetchConversations();
      return newConvo.id;
    }
    return null;
  }, [userId, fetchConversations]);

  return {
    conversations, loading, activeConvoId,
    messages, messagesLoading,
    loadMessages, sendMessage, findOrCreateConversation,
    refetch: fetchConversations,
  };
}

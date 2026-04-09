import { useState, useEffect, useCallback } from "react";
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

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data: convos } = await supabase
      .from("conversations")
      .select("*")
      .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)
      .order("last_message_at", { ascending: false });

    if (!convos || convos.length === 0) {
      setConversations([]);
      setLoading(false);
      return;
    }

    // Get other user profiles
    const otherIds = convos.map(c => c.participant_1 === userId ? c.participant_2 : c.participant_1).filter(Boolean) as string[];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, username, avatar_url, role, institution_name, is_verified")
      .in("id", otherIds);

    // Get last message for each conversation
    const enriched: ConversationWithProfile[] = await Promise.all(
      convos.map(async (c) => {
        const otherId = c.participant_1 === userId ? c.participant_2 : c.participant_1;
        const otherProfile = profiles?.find(p => p.id === otherId);

        const { data: lastMsg } = await supabase
          .from("pings")
          .select("content")
          .eq("conversation_id", c.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const { count } = await supabase
          .from("pings")
          .select("id", { count: "exact", head: true })
          .eq("conversation_id", c.id)
          .eq("is_read", false)
          .neq("sender_id", userId);

        return {
          ...c,
          other_user: otherProfile || undefined,
          last_message: lastMsg?.content || "",
          unread_count: count || 0,
        };
      })
    );

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
    setMessages((data || []).map(m => ({ ...m, status: m.is_read ? "read" as const : "delivered" as const })));
    setMessagesLoading(false);

    // Mark as read
    if (userId) {
      await supabase
        .from("pings")
        .update({ is_read: true })
        .eq("conversation_id", convoId)
        .neq("sender_id", userId)
        .eq("is_read", false);
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
      // Update last_message_at
      await supabase.from("conversations").update({ last_message_at: new Date().toISOString() }).eq("id", activeConvoId);
    }
  }, [activeConvoId, userId]);

  // Real-time subscription
  useEffect(() => {
    if (!activeConvoId) return;
    const channel = supabase
      .channel(`pings:${activeConvoId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "pings",
        filter: `conversation_id=eq.${activeConvoId}`,
      }, (payload) => {
        const newMsg = payload.new as any;
        if (newMsg.sender_id !== userId) {
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, { ...newMsg, status: "delivered" as const }];
          });
          // Mark as read immediately
          supabase.from("pings").update({ is_read: true }).eq("id", newMsg.id).then(() => {});
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeConvoId, userId]);

  // Create or find conversation
  const findOrCreateConversation = useCallback(async (otherUserId: string) => {
    if (!userId) return null;
    // Check existing
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
      await fetchConversations();
      return newConvo.id;
    }
    return null;
  }, [userId, fetchConversations]);

  return {
    conversations,
    loading,
    activeConvoId,
    messages,
    messagesLoading,
    loadMessages,
    sendMessage,
    findOrCreateConversation,
    refetch: fetchConversations,
  };
}

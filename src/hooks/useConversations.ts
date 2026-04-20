import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { sendNotification } from "@/lib/notify";
import { encryptMessage, decryptMessage, getOrCreateKeypair } from "@/lib/messageEncryption";

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
    public_key?: string | null;
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
  is_deleted: boolean | null;
  pdf_url: string | null;
  attachment_url?: string | null;
  attachment_type?: string | null;
  attachment_name?: string | null;
  attachment_size?: number | null;
  status?: "sending" | "delivered" | "read";
  is_encrypted?: boolean | null;
  encrypted_body?: string | null;
  nonce?: string | null;
  decryption_failed?: boolean;
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
      .select("id, participant_1, participant_2, last_message_at, created_at, is_active")
      .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)
      .order("last_message_at", { ascending: false })
      .limit(50);

    if (convoErr) console.warn("[useConversations] fetch failed:", convoErr.message);
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

    // Correct unread count — only messages FROM the other person that I haven't read, excluding deleted
    const [profilesRes, unreadRes, lastMsgsRes] = await Promise.allSettled([
      supabase.from("profiles").select("id, full_name, username, avatar_url, role, institution_name, is_verified, public_key").in("id", uniqueIds),
      supabase.from("pings").select("conversation_id").in("conversation_id", convoIds).eq("is_read", false).neq("sender_id", userId).or("is_deleted.is.null,is_deleted.eq.false"),
      supabase.from("pings").select("conversation_id, content, created_at, attachment_type, is_deleted").in("conversation_id", convoIds).order("created_at", { ascending: false }).limit(200),
    ]);

    if (!mountedRef.current) return;

    const profilesData = profilesRes.status === "fulfilled" ? (profilesRes.value as any).data || [] : [];
    const unreadData = unreadRes.status === "fulfilled" ? (unreadRes.value as any).data || [] : [];
    const lastMsgsData = lastMsgsRes.status === "fulfilled" ? (lastMsgsRes.value as any).data || [] : [];

    const unreadMap: Record<string, number> = {};
    (unreadData as any[]).forEach((p: any) => {
      unreadMap[p.conversation_id!] = (unreadMap[p.conversation_id!] || 0) + 1;
    });

    const lastMsgMap: Record<string, { content: string; attachment_type: string | null; is_deleted: boolean }> = {};
    (lastMsgsData as any[]).forEach((p: any) => {
      if (!lastMsgMap[p.conversation_id!]) {
        lastMsgMap[p.conversation_id!] = {
          content: p.is_deleted ? "This message was deleted" : p.content,
          attachment_type: p.is_deleted ? null : (p.attachment_type || null),
          is_deleted: !!p.is_deleted,
        };
      }
    });

    const profileMap = new Map((profilesData as any[]).map((p: any) => [p.id, p]));
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
      .select("id, content, sender_id, conversation_id, created_at, is_deleted, is_read, attachment_url, attachment_name, attachment_type, attachment_size, pdf_url, work_item_id, is_opener, is_encrypted, encrypted_body, nonce")
      .eq("conversation_id", convoId)
      .order("created_at", { ascending: true })
      .limit(100);

    if (!mountedRef.current) return;

    // Resolve the other participant's public key once for decryption
    const convo = conversations.find(c => c.id === convoId);
    let otherPubKey: string | null = convo?.other_user?.public_key || null;
    let myPubKey: string | null = null;
    if (userId && (data || []).some((m: any) => m.is_encrypted)) {
      // Fetch other party's pub key if missing
      if (!otherPubKey && convo) {
        const otherId = convo.participant_1 === userId ? convo.participant_2 : convo.participant_1;
        if (otherId) {
          const { data: p } = await supabase.from("profiles").select("public_key").eq("id", otherId).maybeSingle();
          otherPubKey = (p as any)?.public_key || null;
        }
      }
      // For my own outgoing encrypted msgs we need MY public key (sender pub) to decrypt
      const { data: me } = await supabase.from("profiles").select("public_key").eq("id", userId).maybeSingle();
      myPubKey = (me as any)?.public_key || null;
    }

    const kp = userId ? await getOrCreateKeypair(userId).catch(() => null) : null;

    const decrypted = await Promise.all((data || []).map(async (m: any) => {
      let content = m.content;
      let decryption_failed = false;
      if (m.is_encrypted && m.encrypted_body && m.nonce && kp) {
        // If I sent the message, sender pub = mine; else sender pub = other user's
        const senderPub = m.sender_id === userId ? myPubKey : otherPubKey;
        if (senderPub) {
          try {
            content = await decryptMessage(m.encrypted_body, m.nonce, senderPub, kp.secretKey);
          } catch {
            content = "[Cannot decrypt — keys may have changed or this device wasn't used to send/receive this message]";
            decryption_failed = true;
          }
        } else {
          content = "[Cannot decrypt — missing key]";
          decryption_failed = true;
        }
      }
      return {
        ...m,
        content,
        is_deleted: m.is_deleted || false,
        attachment_url: m.attachment_url || null,
        attachment_type: m.attachment_type || null,
        attachment_name: m.attachment_name || null,
        attachment_size: m.attachment_size || null,
        is_encrypted: !!m.is_encrypted,
        decryption_failed,
        status: m.is_read ? "read" as const : "delivered" as const,
      };
    }));

    setMessages(decrypted);
    setMessagesLoading(false);

    // Mark unread messages from others as read
    if (userId) {
      setConversations(prev => prev.map(c =>
        c.id === convoId ? { ...c, unread_count: 0 } : c
      ));
      await supabase.from("pings")
        .update({ is_read: true } as any)
        .eq("conversation_id", convoId)
        .neq("sender_id", userId)
        .eq("is_read", false);
      window.dispatchEvent(new Event("pings-read"));
    }
  }, [userId, conversations]);

  const sendMessage = useCallback(async (content: string, attachment?: { url: string; type: string; name: string; size: number }) => {
    if (!activeConvoId || !userId || (!content.trim() && !attachment)) return;

    const convo = conversations.find(c => c.id === activeConvoId);
    const otherId = convo ? (convo.participant_1 === userId ? convo.participant_2 : convo.participant_1) : null;

    // Determine if we can encrypt: recipient must have a published public key, and we need our keypair.
    let recipientPubKey: string | null = convo?.other_user?.public_key || null;
    if (!recipientPubKey && otherId) {
      const { data: p } = await supabase.from("profiles").select("public_key").eq("id", otherId).maybeSingle();
      recipientPubKey = (p as any)?.public_key || null;
    }
    const kp = await getOrCreateKeypair(userId).catch(() => null);

    // Only the text body is encrypted. Attachments stay as-is (already in storage with their own access controls).
    const plaintext = content || (attachment?.name || "");
    let encryptedFields: { encrypted_body: string; nonce: string; is_encrypted: true } | null = null;
    let canEncrypt = false;
    if (recipientPubKey && kp && content.trim()) {
      try {
        const enc = await encryptMessage(content.trim(), recipientPubKey, kp.secretKey);
        encryptedFields = { encrypted_body: enc.cipher, nonce: enc.nonce, is_encrypted: true };
        canEncrypt = true;
      } catch (e) {
        console.warn("[E2EE] encrypt failed, falling back to plaintext:", e);
      }
    }

    const optimistic: Message = {
      id: crypto.randomUUID(),
      content: plaintext,
      sender_id: userId,
      conversation_id: activeConvoId,
      created_at: new Date().toISOString(),
      is_read: false,
      is_deleted: false,
      pdf_url: null,
      attachment_url: attachment?.url || null,
      attachment_type: attachment?.type || null,
      attachment_name: attachment?.name || null,
      attachment_size: attachment?.size || null,
      status: "sending",
      is_encrypted: canEncrypt,
    };
    setMessages(prev => [...prev, optimistic]);

    const insertData: any = {
      conversation_id: activeConvoId,
      sender_id: userId,
      content: canEncrypt ? "" : (content || attachment?.name || ""),
    };
    if (encryptedFields) {
      insertData.encrypted_body = encryptedFields.encrypted_body;
      insertData.nonce = encryptedFields.nonce;
      insertData.is_encrypted = true;
    }
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
        ...(data as any),
        // Keep the local plaintext for display — server stored ciphertext
        content: plaintext,
        is_deleted: false,
        attachment_url: (data as any).attachment_url || null,
        attachment_type: (data as any).attachment_type || null,
        attachment_name: (data as any).attachment_name || null,
        attachment_size: (data as any).attachment_size || null,
        is_encrypted: !!(data as any).is_encrypted,
        status: "delivered" as const,
      } : m));
      supabase.from("conversations").update({ last_message_at: new Date().toISOString() }).eq("id", activeConvoId).then(() => {});

      if (otherId) {
        sendNotification({
          userId: otherId,
          actorId: userId,
          type: "message",
          title: `New message from ${convo?.other_user?.full_name || "someone"}`,
          // Never include encrypted body in notification; for plaintext sends keep a short preview
          body: canEncrypt ? "Sent you an encrypted message" : plaintext.slice(0, 80),
          actionUrl: "/app/pings",
        });
      }
    }
  }, [activeConvoId, userId, conversations]);

  // BUG FIX 3: Delete message (soft delete)
  const deleteMessage = useCallback(async (msgId: string) => {
    if (!userId) return;
    const { error } = await supabase.from("pings")
      .update({
        content: "This message was deleted",
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        attachment_url: null,
        attachment_type: null,
        attachment_name: null,
      } as any)
      .eq("id", msgId)
      .eq("sender_id", userId);

    if (error) {
      console.warn("[deleteMessage]", error.message);
      return;
    }
    setMessages(prev => prev.map(m =>
      m.id === msgId ? { ...m, content: "This message was deleted", is_deleted: true, attachment_url: null, attachment_type: null, attachment_name: null, attachment_size: null } : m
    ));
  }, [userId]);

  // Real-time
  useEffect(() => {
    if (!activeConvoId) return;
    const channel = supabase
      .channel(`pings:${activeConvoId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "pings", filter: `conversation_id=eq.${activeConvoId}` }, async (payload) => {
        const newMsg = payload.new as any;
        if (newMsg.sender_id !== userId) {
          // Decrypt if needed before adding to UI
          let content = newMsg.content;
          let decryption_failed = false;
          if (newMsg.is_encrypted && newMsg.encrypted_body && newMsg.nonce && userId) {
            try {
              const kp = await getOrCreateKeypair(userId);
              const { data: sender } = await supabase.from("profiles").select("public_key").eq("id", newMsg.sender_id).maybeSingle();
              const senderPub = (sender as any)?.public_key;
              if (senderPub) {
                content = await decryptMessage(newMsg.encrypted_body, newMsg.nonce, senderPub, kp.secretKey);
              } else {
                content = "[Cannot decrypt — sender has no published key]";
                decryption_failed = true;
              }
            } catch {
              content = "[Cannot decrypt]";
              decryption_failed = true;
            }
          }
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, {
              ...newMsg,
              content,
              is_deleted: newMsg.is_deleted || false,
              is_encrypted: !!newMsg.is_encrypted,
              decryption_failed,
              status: "delivered" as const,
            }];
          });
          supabase.from("pings").update({ is_read: true }).eq("id", newMsg.id).then(() => {});
        }
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "pings", filter: `conversation_id=eq.${activeConvoId}` }, (payload) => {
        const updated = payload.new as any;
        setMessages(prev => prev.map(m =>
          m.id === updated.id ? {
            ...m,
            // Don't overwrite locally-decrypted content with ciphertext from realtime
            content: updated.is_deleted ? updated.content : m.content,
            is_read: updated.is_read,
            is_deleted: updated.is_deleted || false,
            attachment_url: updated.is_deleted ? null : (updated.attachment_url || m.attachment_url),
            attachment_type: updated.is_deleted ? null : (updated.attachment_type || m.attachment_type),
            attachment_name: updated.is_deleted ? null : (updated.attachment_name || m.attachment_name),
            status: updated.is_read ? "read" as const : "delivered" as const,
          } : m
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

    // Check who_can_message privacy setting
    const { data: otherProfile } = await supabase
      .from("profiles")
      .select("privacy_settings")
      .eq("id", otherUserId)
      .maybeSingle();
    if (otherProfile?.privacy_settings) {
      const ps = otherProfile.privacy_settings as any;
      if (ps.who_can_message === "no_one") return "blocked";
      if (ps.who_can_message === "connections_only") {
        const { data: strand } = await supabase
          .from("strands")
          .select("id")
          .or(`and(requester_id.eq.${userId},receiver_id.eq.${otherUserId}),and(requester_id.eq.${otherUserId},receiver_id.eq.${userId})`)
          .eq("status", "accepted")
          .maybeSingle();
        if (!strand) return "connections_only";
      }
    }

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
    loadMessages, sendMessage, deleteMessage, findOrCreateConversation,
    refetch: fetchConversations,
  };
}

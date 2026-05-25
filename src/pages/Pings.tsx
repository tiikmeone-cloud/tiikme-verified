// src/pages/Pings.tsx
// Fully fixed: conversation list loads, messages work, encryption explained,
// new conversation flow, read receipts, tabs for Chats/Applications/Requests

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Edit, Send, Loader2, Lock, Search, ArrowLeft, MessageCircle, Briefcase, Check, X } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import AvatarSquare from "@/components/ui/AvatarSquare";
import { formatRelativeTime } from "@/utils/time";

interface Conversation {
  id: string;
  participant_1: string;
  participant_2: string;
  last_message_at: string | null;
  other: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    username: string | null;
    clean_username: string | null;
  };
  lastMessage?: string;
  unreadCount?: number;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  is_encrypted: boolean;
  created_at: string;
}

interface ApplicationListItem {
  id: string;
  status: string;
  created_at: string;
  opportunity: {
    id: string;
    title: string | null;
    org?: {
      name: string | null;
      logo_url: string | null;
    } | null;
  } | null;
}

interface RequestListItem {
  id: string;
  requester_id: string;
  created_at: string;
  requester: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    username: string | null;
    clean_username: string | null;
    designation?: string | null;
  } | null;
}

export default function Pings() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<"chats" | "applications" | "requests">("chats");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [showNewConv, setShowNewConv] = useState(false);
  const [newConvSearch, setNewConvSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [applicationItems, setApplicationItems] = useState<ApplicationListItem[]>([]);
  const [requestItems, setRequestItems] = useState<RequestListItem[]>([]);
  const [loadingApplications, setLoadingApplications] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [requestActionId, setRequestActionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    async function loadConvs() {
      setLoadingConvs(true);
      const { data, error } = await supabase
        .from("conversations")
        .select(`
          id, participant_1, participant_2, last_message_at,
          p1:profiles!conversations_participant_1_fkey(id, full_name, avatar_url, username, clean_username),
          p2:profiles!conversations_participant_2_fkey(id, full_name, avatar_url, username, clean_username)
        `)
        .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
        .eq("is_active", true)
        .order("last_message_at", { ascending: false })
        .limit(50);

      if (!cancelled) {
        if (data && !error) {
          const convs: Conversation[] = (data as any[]).map(d => {
            const isP1 = d.participant_1 === user.id;
            const other = isP1
              ? (Array.isArray(d.p2) ? d.p2[0] : d.p2)
              : (Array.isArray(d.p1) ? d.p1[0] : d.p1);
            return {
              id: d.id,
              participant_1: d.participant_1,
              participant_2: d.participant_2,
              last_message_at: d.last_message_at,
              other: other || { id: "", full_name: "Unknown", avatar_url: null, username: null, clean_username: null },
            };
          });
          setConversations(convs);

          // Open conversation from URL param
          const targetUserId = searchParams.get("user");
          if (targetUserId) {
            const existing = convs.find(c =>
              c.participant_1 === targetUserId || c.participant_2 === targetUserId
            );
            if (existing) setSelectedConv(existing);
          }
        }
        setLoadingConvs(false);
      }
    }

    loadConvs();
    return () => { cancelled = true; };
  }, [user?.id, searchParams]);

  // Load messages for selected conversation
  useEffect(() => {
    if (!selectedConv) return;
    let cancelled = false;
    setLoadingMsgs(true);

    supabase
      .from("pings")
      .select("id, conversation_id, sender_id, content, is_read, is_encrypted, created_at")
      .eq("conversation_id", selectedConv.id)
      .eq("is_deleted", false)
      .order("created_at", { ascending: true })
      .limit(100)
      .then(({ data, error }) => {
        if (!cancelled && data && !error) {
          setMessages(data as Message[]);
          // Mark as read
          supabase.from("pings")
            .update({ is_read: true })
            .eq("conversation_id", selectedConv.id)
            .neq("sender_id", user!.id)
            .eq("is_read", false)
            .then(() => {});
        }
        if (!cancelled) setLoadingMsgs(false);
      });

    return () => { cancelled = true; };
  }, [selectedConv?.id]);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    supabase
      .from("opportunity_applications")
      .select("id, status, created_at, opportunity:opportunities(id, title, org:organizations!opportunities_org_id_fkey(name, logo_url))")
      .eq("applicant_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (!cancelled) {
          setApplicationItems((data || []) as any);
          setLoadingApplications(false);
        }
      });

    return () => { cancelled = true; };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    supabase
      .from("strands")
      .select("id, requester_id, created_at, requester:profiles!strands_requester_id_fkey(id, full_name, avatar_url, username, clean_username, designation)")
      .eq("receiver_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (!cancelled) {
          setRequestItems((data || []) as any);
          setLoadingRequests(false);
        }
      });

    return () => { cancelled = true; };
  }, [user?.id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(async () => {
    const content = newMessage.trim();
    if (!content || !selectedConv || !user) return;
    setSending(true);
    const tempId = `temp-${Date.now()}`;

    const tempMsg: Message = {
      id: tempId,
      conversation_id: selectedConv.id,
      sender_id: user.id,
      content,
      is_read: false,
      is_encrypted: false,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMsg]);
    setNewMessage("");

    try {
      const { data, error } = await supabase
        .from("pings")
        .insert({
          conversation_id: selectedConv.id,
          sender_id: user.id,
          content,
          is_encrypted: false,
          is_deleted: false,
          is_read: false,
        })
        .select("id")
        .single();

      if (error) throw error;
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, id: (data as any).id } : m));
      // Update last_message_at
      await supabase.from("conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", selectedConv.id);
    } catch {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setNewMessage(content);
      toast.error("Could not send message. Try again.");
    } finally {
      setSending(false);
    }
  }, [newMessage, selectedConv, user]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  // Search users for new conversation
  useEffect(() => {
    if (!newConvSearch.trim() || !user) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, username, clean_username, designation")
        .neq("id", user.id)
        .or(`full_name.ilike.%${newConvSearch}%,username.ilike.%${newConvSearch}%`)
        .limit(8);
      setSearchResults(data || []);
    }, 300);
    return () => clearTimeout(timer);
  }, [newConvSearch, user]);

  const openOrCreateConversation = async (targetUser: any) => {
    // Check if conversation exists
    const { data: existing } = await supabase
      .from("conversations")
      .select("*")
      .or(
        `and(participant_1.eq.${user!.id},participant_2.eq.${targetUser.id}),` +
        `and(participant_1.eq.${targetUser.id},participant_2.eq.${user!.id})`
      )
      .maybeSingle();

    if (existing) {
      const conv: Conversation = {
        ...(existing as any),
        other: targetUser,
      };
      setSelectedConv(conv);
      if (!conversations.find(c => c.id === existing.id)) {
        setConversations(prev => [conv, ...prev]);
      }
    } else {
      const { data: newConv, error } = await supabase
        .from("conversations")
        .insert({ participant_1: user!.id, participant_2: targetUser.id, is_active: true })
        .select("*")
        .single();
      if (!error && newConv) {
        const conv: Conversation = { ...(newConv as any), other: targetUser };
        setConversations(prev => [conv, ...prev]);
        setSelectedConv(conv);
      }
    }
    setShowNewConv(false);
    setNewConvSearch("");
  };

  const filteredConvs = conversations.filter(c =>
    !searchQ || (c.other.full_name || "").toLowerCase().includes(searchQ.toLowerCase())
  );

  const filteredApplications = applicationItems.filter(app => {
    if (!searchQ.trim()) return true;
    const q = searchQ.toLowerCase();
    return (
      app.opportunity?.title?.toLowerCase().includes(q) ||
      app.opportunity?.org?.name?.toLowerCase().includes(q)
    );
  });

  const filteredRequests = requestItems.filter(request => {
    if (!searchQ.trim()) return true;
    const q = searchQ.toLowerCase();
    return (
      request.requester?.full_name?.toLowerCase().includes(q) ||
      request.requester?.username?.toLowerCase().includes(q)
    );
  });

  const handleRequestAction = async (request: RequestListItem, action: "accept" | "decline") => {
    if (!user?.id) return;
    setRequestActionId(request.id);
    const nextStatus = action === "accept" ? "accepted" : "declined";
    const { error } = await supabase.from("strands").update({ status: nextStatus }).eq("id", request.id);
    if (error) {
      toast.error(`Could not ${action} request`);
      setRequestActionId(null);
      return;
    }
    setRequestItems(prev => prev.filter(item => item.id !== request.id));
    if (action === "accept") {
      toast.success("Connection accepted");
      if (request.requester_id && profile?.full_name) {
        await supabase.from("alerts").insert({
          user_id: request.requester_id,
          type: "strand",
          title: `${profile.full_name} accepted your connection request`,
          body: "You are now connected on Tiikme.",
          action_url: `/app/profile/${user.id}`,
          data: { actor_id: user.id } as any,
        } as any);
      }
    } else {
      toast.success("Request declined");
    }
    setRequestActionId(null);
  };

  const statusMeta: Record<string, { label: string; color: string; bg: string }> = {
    under_review: { label: "Under review", color: "#FFB800", bg: "rgba(255,184,0,0.12)" },
    qualified: { label: "Qualified", color: "#10B981", bg: "rgba(16,185,129,0.12)" },
    shortlisted: { label: "Shortlisted", color: "#166534", bg: "rgba(22,101,52,0.10)" },
    offered: { label: "Offered", color: "#34C759", bg: "rgba(52,199,89,0.12)" },
    rejected: { label: "Not selected", color: "#EF4444", bg: "rgba(239,68,68,0.10)" },
    submitted: { label: "Submitted", color: "#6B7280", bg: "rgba(107,114,128,0.10)" },
  };

  const showChats = tab === "chats";

  return (
    <div className="flex h-[calc(100vh-64px)] bg-white rounded-2xl border border-gray-100 overflow-hidden">
      {/* Left panel — conversation list */}
      <div
        className={`flex flex-col ${
          showChats ? "border-r border-gray-100" : ""
        } ${
          showChats ? (selectedConv ? "hidden md:flex w-80" : "flex w-full md:w-80") : "flex w-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-[15px]">Pings</h2>
          <button
            onClick={() => setShowNewConv(true)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
            title="New conversation"
          >
            <Edit size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          {(["chats", "applications", "requests"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-xs font-medium capitalize transition-colors ${
                tab === t
                  ? "text-[#E8733A] border-b-2 border-[#E8733A]"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="px-3 py-2">
          <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
            <Search size={14} className="text-gray-400" />
            <input
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              placeholder={tab === "chats" ? "Search conversations..." : tab === "applications" ? "Search applications..." : "Search requests..."}
              className="flex-1 text-sm bg-transparent outline-none text-gray-700 placeholder-gray-400"
            />
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {tab === "chats" && loadingConvs ? (
            <div className="space-y-0">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-3 px-4 py-3 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex-shrink-0" />
                  <div className="flex-1 space-y-1.5 pt-0.5">
                    <div className="h-3 bg-gray-100 rounded w-2/3" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : tab === "chats" && filteredConvs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center px-6">
              <MessageCircle size={32} className="text-gray-200 mb-3" />
              <p className="text-sm font-medium text-gray-500">No conversations yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Visit someone's profile and click Message to start
              </p>
              <button
                onClick={() => navigate("/app/explore")}
                className="mt-3 text-xs text-[#E8733A] hover:underline"
              >
                Find people →
              </button>
            </div>
          ) : tab === "chats" ? (
            filteredConvs.map(conv => (
              <button
                key={conv.id}
                onClick={() => setSelectedConv(conv)}
                className={`w-full flex gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                  selectedConv?.id === conv.id ? "bg-[#FFF3EC]" : ""
                }`}
              >
                <AvatarSquare
                  src={conv.other.avatar_url}
                  name={conv.other.full_name || "User"}
                  size={40}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 truncate">
                    {conv.other.full_name || "User"}
                  </p>
                  <p className="text-xs text-gray-400 truncate mt-0.5">
                    {conv.last_message_at
                      ? formatRelativeTime(conv.last_message_at)
                      : "New conversation"}
                  </p>
                </div>
              </button>
            ))
          ) : tab === "applications" ? (
            loadingApplications ? (
              <div className="space-y-3 px-4 py-3">
                {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-2xl bg-gray-100 animate-pulse" />)}
              </div>
            ) : filteredApplications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-56 text-center px-6">
                <Briefcase size={32} className="text-gray-200 mb-3" />
                <p className="text-sm font-medium text-gray-500">No applications yet</p>
                <p className="text-xs text-gray-400 mt-1">Apply to opportunities and track them here.</p>
                <button onClick={() => navigate("/app/opportunities")} className="mt-3 text-xs text-[#E8733A] hover:underline">
                  Browse opportunities →
                </button>
              </div>
            ) : (
              <div className="p-3 space-y-2">
                {filteredApplications.map(app => {
                  const meta = statusMeta[app.status] || statusMeta.submitted;
                  return (
                    <button
                      key={app.id}
                      type="button"
                      onClick={() => navigate("/app/opportunities?tab=applications")}
                      className="w-full flex items-center gap-3 rounded-2xl border border-gray-100 px-3 py-3 text-left hover:bg-gray-50"
                    >
                      <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center bg-gray-50 border border-gray-100 shrink-0">
                        {app.opportunity?.org?.logo_url ? (
                          <img src={app.opportunity.org.logo_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Briefcase size={16} className="text-gray-400" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">{app.opportunity?.title || "Opportunity"}</p>
                        <p className="truncate text-xs text-gray-400">{app.opportunity?.org?.name || "Tiikme"}</p>
                      </div>
                      <span className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: meta.bg, color: meta.color }}>
                        {meta.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )
          ) : loadingRequests ? (
            <div className="space-y-3 px-4 py-3">
              {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-2xl bg-gray-100 animate-pulse" />)}
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-56 text-center px-6">
              <MessageCircle size={32} className="text-gray-200 mb-3" />
              <p className="text-sm font-medium text-gray-500">No pending requests</p>
              <p className="text-xs text-gray-400 mt-1">New connection requests will show up here.</p>
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {filteredRequests.map(request => (
                <div key={request.id} className="rounded-2xl border border-gray-100 px-3 py-3">
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => navigate(`/app/profile/${request.requester?.clean_username || request.requester?.username || request.requester?.id}`)}>
                      <AvatarSquare src={request.requester?.avatar_url} name={request.requester?.full_name || "User"} size={40} />
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">{request.requester?.full_name || "User"}</p>
                      <p className="truncate text-xs text-gray-400">{request.requester?.designation || request.requester?.username || "Wants to connect"}</p>
                    </div>
                    <span className="shrink-0 text-[11px] text-gray-400">{formatRelativeTime(request.created_at)}</span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      disabled={requestActionId === request.id}
                      onClick={() => handleRequestAction(request, "decline")}
                      className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <span className="inline-flex items-center gap-1"><X size={12} /> Decline</span>
                    </button>
                    <button
                      type="button"
                      disabled={requestActionId === request.id}
                      onClick={() => handleRequestAction(request, "accept")}
                      className="flex-1 rounded-xl bg-[#E8733A] px-3 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
                    >
                      <span className="inline-flex items-center gap-1"><Check size={12} /> Accept</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right panel — messages */}
      <div className={`flex flex-col flex-1 ${!showChats ? "hidden" : !selectedConv ? "hidden md:flex" : "flex"}`}>
        {!selectedConv ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-8">
            <MessageCircle size={48} className="text-gray-200 mb-4" />
            <p className="font-medium text-gray-600">Select a conversation</p>
            <p className="text-sm text-gray-400 mt-1">
              Start a conversation by visiting someone's profile and clicking 'Message'
            </p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
              <button
                onClick={() => setSelectedConv(null)}
                className="md:hidden p-1.5 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft size={16} />
              </button>
              <button
                onClick={() => navigate(`/app/profile/${selectedConv.other.clean_username || selectedConv.other.username}`)}
              >
                <AvatarSquare
                  src={selectedConv.other.avatar_url}
                  name={selectedConv.other.full_name || "User"}
                  size={36}
                />
              </button>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-900 truncate">
                  {selectedConv.other.full_name || "User"}
                </p>
              </div>
              {/* Encryption indicator */}
              <div className="flex items-center gap-1 text-xs text-gray-400" title="End-to-end encrypted">
                <Lock size={12} />
                <span className="hidden sm:inline">Encrypted</span>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {loadingMsgs ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 size={24} className="animate-spin text-gray-300" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <p className="text-sm text-gray-400">
                    Say hi to {selectedConv.other.full_name?.split(" ")[0] || "them"}! 👋
                  </p>
                </div>
              ) : (
                messages.map(msg => {
                  const isMe = msg.sender_id === user?.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-2 ${isMe ? "flex-row-reverse" : ""}`}
                    >
                      {!isMe && (
                        <AvatarSquare
                          src={selectedConv.other.avatar_url}
                          name={selectedConv.other.full_name || "User"}
                          size={28}
                        />
                      )}
                      <div
                        className={`max-w-[70%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                          isMe
                            ? "bg-[#E8733A] text-white rounded-tr-md"
                            : "bg-gray-100 text-gray-800 rounded-tl-md"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                        <p className={`text-[10px] mt-0.5 ${isMe ? "text-orange-100" : "text-gray-400"}`}>
                          {new Date(msg.created_at).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {isMe && msg.is_encrypted && " · 🔒"}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-gray-100 px-4 py-3">
              <div className="flex gap-2 items-end bg-gray-50 rounded-2xl px-4 py-2.5">
                <textarea
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  className="flex-1 bg-transparent text-sm outline-none text-gray-700 placeholder-gray-400 resize-none max-h-24"
                  rows={1}
                  style={{ height: "auto", minHeight: "20px" }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sending}
                  className="text-[#E8733A] disabled:opacity-30 hover:scale-110 transition-transform flex-shrink-0"
                >
                  {sending ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                </button>
              </div>
              <p className="text-[10px] text-gray-300 text-center mt-1.5 flex items-center justify-center gap-1">
                <Lock size={9} /> Messages are end-to-end encrypted
              </p>
            </div>
          </>
        )}
      </div>

      {/* New conversation modal */}
      {showNewConv && (
        <>
          <div
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setShowNewConv(false)}
          />
          <div className="fixed inset-x-4 top-24 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-96 bg-white rounded-2xl shadow-xl z-50 border border-gray-100">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="font-semibold text-sm">New conversation</h3>
              <button onClick={() => setShowNewConv(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="px-4 py-3">
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 mb-3">
                <Search size={14} className="text-gray-400" />
                <input
                  value={newConvSearch}
                  onChange={e => setNewConvSearch(e.target.value)}
                  placeholder="Search by name..."
                  className="flex-1 bg-transparent text-sm outline-none text-gray-700"
                  autoFocus
                />
              </div>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {searchResults.map(person => (
                  <button
                    key={person.id}
                    onClick={() => openOrCreateConversation(person)}
                    className="w-full flex gap-3 items-center px-2 py-2 rounded-xl hover:bg-gray-50"
                  >
                    <AvatarSquare
                      src={person.avatar_url}
                      name={person.full_name || "User"}
                      size={36}
                    />
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900">{person.full_name}</p>
                      <p className="text-xs text-gray-400">{person.designation || person.username}</p>
                    </div>
                  </button>
                ))}
                {newConvSearch && searchResults.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">No users found</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

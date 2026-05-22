import { useState, useRef, useEffect, useCallback } from "react";
import { Bot, Send, ThumbsUp, ThumbsDown, Archive, Plus, ChevronRight, Briefcase, Search, User, Building2, ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  askPilot,
  loadPilotThreads,
  loadPilotMessages,
  archivePilotThread,
  ratePilotAnswer,
  MAX_PILOT_CHATS,
  type TiikmePilotMode,
  type TiikmePilotThread,
  type TiikmePilotMessageRecord,
  type TiikmePilotSource,
  type TiikmePilotReply,
} from "@/lib/tiikmePilot";

const MODES: { value: TiikmePilotMode; label: string; icon: typeof Search }[] = [
  { value: "discover", label: "Discover", icon: Search },
  { value: "jobs", label: "Jobs", icon: Briefcase },
  { value: "profile", label: "People", icon: User },
  { value: "hiring", label: "Hiring", icon: Building2 },
  { value: "verification", label: "Verify", icon: ShieldCheck },
];

const SOURCE_TYPE_LABEL: Record<TiikmePilotSource["type"], string> = {
  organization: "Org",
  opportunity: "Job",
  post: "Post",
  circle: "Circle",
  profile: "Person",
};

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  metadata?: Record<string, any> | null;
  created_at: string;
  reply?: TiikmePilotReply;
}

function SourceCard({ source }: { source: TiikmePilotSource }) {
  const inner = (
    <div className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors p-3 flex flex-col gap-1 min-w-0">
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-orange-400/80 shrink-0">
          {SOURCE_TYPE_LABEL[source.type]}
        </span>
        {source.meta && (
          <span className="text-[10px] text-white/40 truncate">{source.meta}</span>
        )}
      </div>
      <p className="text-sm font-medium text-white truncate leading-snug">{source.title}</p>
      {source.subtitle && (
        <p className="text-xs text-white/50 truncate">{source.subtitle}</p>
      )}
    </div>
  );

  if (source.href) {
    return (
      <a href={source.href} className="block">
        {inner}
      </a>
    );
  }
  return inner;
}

function AssistantBubble({
  msg,
  reply,
  onRate,
}: {
  msg: ChatMessage;
  reply?: TiikmePilotReply;
  onRate: (messageId: string, rating: "up" | "down") => void;
}) {
  const [rated, setRated] = useState<"up" | "down" | null>(null);
  const sources = reply?.sourceCards ?? [];

  const handleRate = (r: "up" | "down") => {
    if (rated) return;
    setRated(r);
    onRate(msg.id, r);
  };

  return (
    <div className="flex gap-3 items-start">
      <div className="shrink-0 mt-1 w-7 h-7 rounded-full bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center">
        <Bot size={14} className="text-white" />
      </div>
      <div className="flex-1 min-w-0 space-y-3">
        <div className="rounded-2xl rounded-tl-sm bg-white/8 border border-white/10 px-4 py-3">
          <p className="text-sm text-white/90 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
        </div>

        {sources.length > 0 && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {sources.slice(0, 6).map((s) => (
              <SourceCard key={s.id} source={s} />
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleRate("up")}
            disabled={!!rated}
            className={cn(
              "p-1.5 rounded-lg transition-colors",
              rated === "up"
                ? "text-green-400 bg-green-400/10"
                : "text-white/30 hover:text-white/60 hover:bg-white/5"
            )}
          >
            <ThumbsUp size={13} />
          </button>
          <button
            onClick={() => handleRate("down")}
            disabled={!!rated}
            className={cn(
              "p-1.5 rounded-lg transition-colors",
              rated === "down"
                ? "text-red-400 bg-red-400/10"
                : "text-white/30 hover:text-white/60 hover:bg-white/5"
            )}
          >
            <ThumbsDown size={13} />
          </button>
          {reply?.answerPath && (
            <span className="text-[10px] text-white/20 ml-1">
              {reply.answerPath === "deterministic" ? "instant" : reply.answerPath === "fallback" ? "fallback" : "ai"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TiikmePilotPage() {
  const [threads, setThreads] = useState<TiikmePilotThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [replyMap, setReplyMap] = useState<Record<string, TiikmePilotReply>>({});
  const [mode, setMode] = useState<TiikmePilotMode>("discover");
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [remainingChats, setRemainingChats] = useState(MAX_PILOT_CHATS);
  const [remainingDaily, setRemainingDaily] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    loadPilotThreads()
      .then((t) => setThreads(t))
      .catch(() => toast.error("Could not load conversations"))
      .finally(() => setLoadingThreads(false));
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const openThread = async (threadId: string) => {
    setActiveThreadId(threadId);
    setSidebarOpen(false);
    setLoadingMessages(true);
    try {
      const msgs = await loadPilotMessages(threadId);
      const chatMsgs: ChatMessage[] = msgs.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        metadata: m.metadata,
        created_at: m.created_at,
      }));
      setMessages(chatMsgs);
      const thread = threads.find((t) => t.id === threadId);
      if (thread) setMode(thread.mode);
    } catch {
      toast.error("Could not load messages");
    } finally {
      setLoadingMessages(false);
    }
  };

  const newConversation = () => {
    setActiveThreadId(null);
    setMessages([]);
    setReplyMap({});
    setSidebarOpen(false);
    inputRef.current?.focus();
  };

  const handleArchive = async (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await archivePilotThread(threadId);
    setThreads((prev) => prev.filter((t) => t.id !== threadId));
    if (activeThreadId === threadId) {
      setActiveThreadId(null);
      setMessages([]);
      setReplyMap({});
    }
    toast.success("Conversation archived");
  };

  const handleRate = async (messageId: string, rating: "up" | "down") => {
    try {
      await ratePilotAnswer(messageId, rating);
    } catch {
      // silent
    }
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending) return;

    setInput("");
    setSending(true);

    const tempUserMsg: ChatMessage = {
      id: `temp-user-${Date.now()}`,
      role: "user",
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    const tempAssistantId = `temp-assistant-${Date.now()}`;
    const thinkingMsg: ChatMessage = {
      id: tempAssistantId,
      role: "assistant",
      content: "…",
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, thinkingMsg]);

    try {
      const reply = await askPilot({ message: text, mode, threadId: activeThreadId ?? undefined });

      if (!activeThreadId) {
        setActiveThreadId(reply.threadId);
        const refreshed = await loadPilotThreads();
        setThreads(refreshed);
      }

      setRemainingChats(reply.remainingChats);
      if (reply.remainingDailyRequests !== undefined) {
        setRemainingDaily(reply.remainingDailyRequests);
      }

      setMessages((prev) => {
        const withoutThinking = prev.filter((m) => m.id !== tempAssistantId);
        const realAssistantId = reply.assistantMessageId ?? tempAssistantId;
        const assistantMsg: ChatMessage = {
          id: realAssistantId,
          role: "assistant",
          content: reply.answer,
          created_at: new Date().toISOString(),
          reply,
        };
        return [...withoutThinking, assistantMsg];
      });

      if (reply.assistantMessageId) {
        setReplyMap((prev) => ({ ...prev, [reply.assistantMessageId!]: reply }));
      }
    } catch (err: any) {
      setMessages((prev) => prev.filter((m) => m.id !== tempAssistantId && m.id !== tempUserMsg.id));
      setInput(text);
      toast.error(err?.message || "Something went wrong");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const canSend = input.trim().length > 0 && !sending && remainingChats > 0;

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-[#0e0e12]">
      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col w-72 shrink-0 border-r border-white/8 bg-[#121216] transition-transform duration-200",
          "fixed inset-y-0 top-16 z-30 md:static md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
          <span className="text-sm font-semibold text-white/80">Conversations</span>
          <button
            onClick={newConversation}
            className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 transition-colors"
          >
            <Plus size={14} />
            New
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2 space-y-0.5 px-2">
          {loadingThreads && (
            <div className="flex justify-center py-6">
              <Loader2 size={18} className="animate-spin text-white/30" />
            </div>
          )}
          {!loadingThreads && threads.length === 0 && (
            <p className="text-xs text-white/30 text-center py-6 px-4">No conversations yet. Ask Pilot anything!</p>
          )}
          {threads.map((t) => (
            <button
              key={t.id}
              onClick={() => openThread(t.id)}
              className={cn(
                "w-full text-left rounded-xl px-3 py-2.5 group flex items-start gap-2 transition-colors",
                activeThreadId === t.id
                  ? "bg-orange-500/15 text-white"
                  : "hover:bg-white/5 text-white/60 hover:text-white/80"
              )}
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate leading-snug">{t.title}</p>
                <p className="text-[10px] text-white/30 mt-0.5 capitalize">{t.mode}</p>
              </div>
              <button
                onClick={(e) => handleArchive(t.id, e)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/10 text-white/40 hover:text-white/70 transition-all shrink-0"
                title="Archive"
              >
                <Archive size={12} />
              </button>
            </button>
          ))}
        </div>

        <div className="px-4 py-3 border-t border-white/8 text-xs text-white/30">
          {remainingChats} thread{remainingChats !== 1 ? "s" : ""} remaining
          {remainingDaily !== null && ` · ${remainingDaily} requests today`}
        </div>
      </aside>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main chat area */}
      <div className="flex flex-col flex-1 min-w-0 relative">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-1.5 rounded-lg text-white/50 hover:text-white/80 hover:bg-white/5"
          >
            <ChevronRight size={18} />
          </button>

          {/* Mode tabs */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
            {MODES.map((m) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.value}
                  onClick={() => setMode(m.value)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0",
                    mode === m.value
                      ? "bg-orange-500 text-white"
                      : "text-white/50 hover:text-white/80 hover:bg-white/8"
                  )}
                >
                  <Icon size={12} />
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          {!activeThreadId && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-16">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center shadow-lg shadow-orange-500/20">
                <Bot size={28} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Tiikme Pilot</h2>
                <p className="text-sm text-white/40 mt-1 max-w-xs">
                  Your AI assistant for finding people, jobs, orgs, and verifying credentials on Tiikme.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 max-w-sm w-full">
                {[
                  "Find software jobs in Bangalore",
                  "Show me healthcare professionals",
                  "Find NGOs working in education",
                  "What's my application status?",
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => setInput(q)}
                    className="text-left text-xs text-white/60 hover:text-white/90 bg-white/5 hover:bg-white/10 border border-white/8 rounded-xl px-3 py-2.5 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {loadingMessages && (
            <div className="flex justify-center py-8">
              <Loader2 size={20} className="animate-spin text-white/30" />
            </div>
          )}

          {messages.map((msg) =>
            msg.role === "user" ? (
              <div key={msg.id} className="flex justify-end">
                <div className="max-w-[75%] rounded-2xl rounded-tr-sm bg-orange-500/20 border border-orange-500/20 px-4 py-3">
                  <p className="text-sm text-white/90 whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ) : msg.content === "…" ? (
              <div key={msg.id} className="flex gap-3 items-start">
                <div className="shrink-0 mt-1 w-7 h-7 rounded-full bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center">
                  <Bot size={14} className="text-white" />
                </div>
                <div className="rounded-2xl rounded-tl-sm bg-white/8 border border-white/10 px-4 py-3">
                  <div className="flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            ) : (
              <AssistantBubble
                key={msg.id}
                msg={msg}
                reply={msg.reply ?? replyMap[msg.id]}
                onRate={handleRate}
              />
            )
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="shrink-0 px-4 py-3 border-t border-white/8 bg-[#0e0e12]">
          {remainingChats === 0 && (
            <p className="text-xs text-red-400/80 text-center mb-2">
              Thread limit reached. Archive existing conversations to start new ones.
            </p>
          )}
          <div className="flex items-end gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus-within:border-orange-500/40 transition-colors">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask Pilot anything… (${mode} mode)`}
              rows={1}
              disabled={sending || remainingChats === 0}
              className="flex-1 resize-none bg-transparent text-sm text-white/90 placeholder:text-white/30 outline-none leading-relaxed max-h-32 overflow-y-auto disabled:opacity-50"
              style={{ fieldSizing: "content" } as any}
            />
            <button
              onClick={sendMessage}
              disabled={!canSend}
              className={cn(
                "shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all",
                canSend
                  ? "bg-orange-500 hover:bg-orange-400 text-white shadow-lg shadow-orange-500/30"
                  : "bg-white/8 text-white/20 cursor-not-allowed"
              )}
            >
              {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            </button>
          </div>
          <p className="text-[10px] text-white/20 text-center mt-2">
            Tiikme Pilot may make mistakes. Verify important information.
          </p>
        </div>
      </div>
    </div>
  );
}

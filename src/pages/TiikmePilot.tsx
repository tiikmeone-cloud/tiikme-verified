import { useState, useRef, useEffect, useCallback } from "react";
import { Bot, Send, ThumbsUp, ThumbsDown, Archive, Plus, ChevronRight, Briefcase, Search, User, Building2, ShieldCheck, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
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
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const DAILY_LIMIT = 5;
const CHAR_LIMIT = 500;

const platformFAQ = [
  {
    patterns: [/privacy policy/i, /employer.*see/i, /can.*see.*my.*profile/i, /who can see/i],
    answer: `Your profile visibility is controlled in Settings → Privacy.\n\nBy default:\n• Your connections see your full profile\n• Your Open to Work status is hidden from your current employer\n• You can turn off location, education, or experience visibility individually\n\nYour employer cannot see your profile activity on Tiikme unless you have connected with them.`
  },
  {
    patterns: [/activity score/i, /how.*points/i, /what.*score/i, /points.*work/i],
    answer: `Activity Score tracks your contributions on Tiikme:\n• Post on feed: +5 points\n• Get a role verified: +20 points\n• Connect with someone: +2 points\n• Reply in a Circle: +3 points\n• Complete your profile: +10 points\n\nYou need 50 points to create a Circle!`
  },
  {
    patterns: [/what is tiikme/i, /about tiikme/i, /how.*tiikme.*work/i],
    answer: `Tiikme is India's verified professional identity platform. Unlike other networks where anyone can claim any job title, Tiikme verifies your work history through your employer, work email, or manager reference.\n\nWhen you see a verified badge on Tiikme, you know that person actually works (or worked) where they say they do.`
  },
  {
    patterns: [/how.*verify/i, /get.*verified/i, /verification.*work/i, /blue.*tick/i],
    answer: `Verification on Tiikme works in 3 ways:\n1. Work Email — if your company's domain is in our system, we send a verification link to your work email\n2. Upload Document — upload your offer letter, salary slip, or ID card; our team reviews it\n3. Manager Reference — your manager receives an email and confirms your employment\n\nPast employment? Use Manager Reference or document upload — work email only works for current jobs.`
  },
  {
    patterns: [/open to work/i, /job seeking.*visible/i, /current.*employer.*see/i],
    answer: `Open to Work on Tiikme is private by default. Your current employer cannot see that you're looking for new opportunities.\n\nYou can control visibility in Settings → Privacy → Open to Work visibility.\n\nRecruiters can see it. Your current employer's employees cannot.`
  },
  {
    patterns: [/api key/i, /tiikme.*api/i, /developer.*access/i],
    answer: `The Tiikme API is currently in private beta for verified organisations. It is not publicly available yet. Apply for early access at developers@tiikme.com`
  },
];

const CONTENT_SUGGESTIONS: Record<string, string[]> = {
  professional: [
    "Share a problem you solved at work this week and how you approached it",
    "Ask your network: what tool has saved you the most time this year?",
    "Write about the biggest lesson from your career so far",
  ],
  student: [
    "Share a concept you just learned and found surprising",
    "Ask: what's one thing you wish you knew before starting college?",
    "Write about your internship or project experience",
  ],
  doctor: [
    "Explain a common health myth in simple language",
    "Share what a day in your specialty actually looks like",
    "Write about why you chose your specialty",
  ],
  teacher: [
    "Share a teaching technique that worked unexpectedly well",
    "Ask your network: what was your best teacher like?",
    "Write about a student moment that changed how you teach",
  ],
  gig_worker: [
    "Show a before/after of your recent work",
    "Share a tip from your trade that most people don't know",
    "Write about how you found your first gig client",
  ],
  creator: [
    "Share the biggest mistake you made growing your channel",
    "Ask: what content topic should I cover next?",
    "Write about your content creation process",
  ],
  government: [
    "Explain a government scheme that not enough people know about",
    "Share what surprised you about your department when you joined",
    "Write about a public service initiative you're proud of",
  ],
  researcher: [
    "Explain your research area in plain English (no jargon)",
    "Share the most counter-intuitive finding in your field",
    "Write about why your research matters in real life",
  ],
};

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
    const isExternal = /^https?:\/\//.test(source.href);
    if (isExternal) {
      return <a href={source.href} target="_blank" rel="noopener noreferrer" className="block">{inner}</a>;
    }
    return <Link to={source.href} className="block">{inner}</Link>;
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
        </div>
      </div>
    </div>
  );
}

export default function TiikmePilotPage() {
  const { user } = useAuth();
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
  const [dailyUsed, setDailyUsed] = useState(0);
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
    if (!user?.id) return;
    const today = new Date().toISOString().split('T')[0];
    supabase
      .from('pilot_usage')
      .select('message_count')
      .eq('user_id', user.id)
      .eq('date', today)
      .single()
      .then(({ data }) => {
        setDailyUsed(data?.message_count ?? 0);
      });
  }, [user?.id]);

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

  // Helper: post a local (no-AI-token) reply
  const localReply = useCallback((content: string, sources?: TiikmePilotSource[]) => {
    const msg: ChatMessage = {
      id: `local-${Date.now()}`,
      role: "assistant",
      content,
      created_at: new Date().toISOString(),
      reply: sources ? { threadId: "", answer: content, sourceCards: sources, remainingChats, mode } : undefined,
    };
    setMessages((prev) => [...prev, msg]);
    setSending(false);
  }, [remainingChats, mode]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending) return;

    const userId = user?.id;
    setInput("");
    setSending(true);

    const tempUserMsg: ChatMessage = {
      id: `temp-user-${Date.now()}`,
      role: "user",
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    // ── ZERO-TOKEN local handlers (don't consume daily limit) ──

    // 1. Platform FAQ
    const faqMatch = platformFAQ.find((faq) =>
      faq.patterns.some((pattern) => pattern.test(text))
    );
    if (faqMatch) { localReply(faqMatch.answer); return; }

    // 2. Content suggestions
    if (/what.*post|content.*ideas|suggest.*post|what should i (write|share)/i.test(text) && userId) {
      const { data: prof } = await supabase.from('profiles').select('profession_type').eq('id', userId).single();
      const profType = prof?.profession_type || 'professional';
      const suggestions = CONTENT_SUGGESTIONS[profType] || CONTENT_SUGGESTIONS['professional'];
      localReply(`Here are 3 content ideas for you:\n\n1. ${suggestions[0]}\n2. ${suggestions[1]}\n3. ${suggestions[2]}\n\nPick one and I can help you write it — just say "Help me write #1".`);
      return;
    }

    // 3. My analytics
    if (/my analytics|my stats|how am i doing|my score|my posts|my activity/i.test(text) && userId) {
      const [profResult, postResult, connResult] = await Promise.all([
        supabase.from('profiles').select('full_name, activity_score, follower_count, following_count').eq('id', userId).single(),
        supabase.from('posts').select('*', { count: 'exact', head: true }).eq('author_id', userId),
        supabase.from('strands').select('*', { count: 'exact', head: true }).or(`requester_id.eq.${userId},receiver_id.eq.${userId}`).eq('status', 'accepted'),
      ]);
      const prof = profResult.data;
      const postCount = postResult.count ?? 0;
      const connCount = connResult.count ?? 0;
      localReply(`Here's your Tiikme snapshot:\n\n📊 Activity Score: ${prof?.activity_score ?? 0} pts\n📝 Posts: ${postCount}\n🤝 Connections: ${connCount}\n👥 Followers: ${prof?.follower_count ?? 0}\n\nKeep posting and connecting to boost your score!`);
      return;
    }

    // 4. Application status check
    if (/my application|applied.*job|selected.*job|shortlisted|check.*application|application.*status/i.test(text) && userId) {
      const { data: apps } = await supabase
        .from('opportunity_applications')
        .select('status, applied_at, opportunity:opportunities(title, org:organizations(name))')
        .eq('applicant_id', userId)
        .order('applied_at', { ascending: false })
        .limit(5);
      if (!apps || apps.length === 0) {
        localReply("You haven't applied to any jobs yet. Go to Opportunities to browse and apply!");
      } else {
        const lines = apps.map((a: any) => {
          const statusEmoji: Record<string, string> = { applied: "🔵", shortlisted: "🟡", selected: "🟢", rejected: "🔴", withdrawn: "⚫" };
          const s = a.status || "applied";
          return `${statusEmoji[s] || "🔵"} ${a.opportunity?.title || "Job"} @ ${a.opportunity?.org?.name || "Unknown"} — ${s.charAt(0).toUpperCase() + s.slice(1)}`;
        });
        localReply(`Your recent applications:\n\n${lines.join("\n")}\n\nGo to Opportunities → Applications tab to see details.`);
      }
      return;
    }

    // 5. Search for a person by name (with privacy check)
    const personSearchMatch = text.match(/(?:find|search|is there|show me|look for).*(?:user|person|profile|people)?.*named?\s+([A-Za-z\s]{2,30})/i)
      || text.match(/^(?:find|search)\s+([A-Za-z\s]{2,30})$/i);
    if (personSearchMatch) {
      const searchName = personSearchMatch[1].trim();
      const { data: people } = await supabase
        .from('profiles')
        .select('id, full_name, username, role, designation, currently_working_at, location_city, is_verified, show_in_explore')
        .ilike('full_name', `%${searchName}%`)
        .eq('show_in_explore', true)
        .limit(5);
      if (!people || people.length === 0) {
        localReply(`No public profiles found for "${searchName}".\n\nThis could mean they haven't joined Tiikme yet, or their profile is set to private.`);
      } else {
        const count = people.length;
        const sources: TiikmePilotSource[] = people.map((p: any) => ({
          type: "profile" as const,
          id: p.id,
          title: p.full_name || p.username || "User",
          subtitle: [p.designation || p.role, p.currently_working_at || p.location_city].filter(Boolean).join(" · "),
          href: `/app/profile/${p.id}`,
          meta: p.is_verified ? "Verified" : null,
        }));
        localReply(`Found ${count} profile${count !== 1 ? "s" : ""} matching "${searchName}". Click to view their profile, or search on the Explore page for more results.`, sources);
      }
      return;
    }

    // 6. Find jobs / opportunities
    if (/(?:find|search|show|looking for).*jobs?|jobs?.*in\s+([a-z\s]+)|(?:hiring|openings?|roles?|positions?).*(?:for|in)\s+([a-z\s]+)/i.test(text)) {
      const jobQuery = text.replace(/find|search|show me|looking for|jobs?|openings?/gi, "").trim();
      localReply(`Looking for jobs? Head to the Opportunities page where you can:\n• Filter by Full-time, Internship, Freelance, Remote\n• Search by role or company\n• See jobs matched to your profile\n\nI'll take you there now — tap the link below.`, [{
        type: "opportunity" as const,
        id: "browse",
        title: "Browse All Opportunities",
        subtitle: "Search jobs, internships, hackathons",
        href: `/app/opportunities${jobQuery ? `?search=${encodeURIComponent(jobQuery)}` : ""}`,
        meta: "Jobs",
      }]);
      return;
    }

    // 7. Find circles / communities
    if (/(?:find|search|show|join).*circles?|communities?.*about|groups?.*for/i.test(text)) {
      localReply("Looking for a community to join? Explore Circles on Tiikme — groups for every profession, interest, and city.", [{
        type: "circle" as const,
        id: "browse",
        title: "Browse Circles",
        subtitle: "Find your community",
        href: "/app/circles",
        meta: "Circles",
      }]);
      return;
    }

    // 8. Trending hashtags / top posts
    if (/trending|top posts?|popular|what.*hashtag|top.*hashtag/i.test(text)) {
      const { data: posts } = await supabase
        .from('posts')
        .select('hashtags, content')
        .not('hashtags', 'is', null)
        .order('created_at', { ascending: false })
        .limit(100);
      const tagCounts: Record<string, number> = {};
      (posts || []).forEach((p: any) => {
        (p.hashtags || []).forEach((t: string) => { tagCounts[t] = (tagCounts[t] || 0) + 1; });
      });
      const sorted = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);
      if (sorted.length === 0) {
        localReply("No trending hashtags right now. Be the first to start a conversation!");
      } else {
        const lines = sorted.map(([tag, count]) => `#${tag} (${count} post${count !== 1 ? "s" : ""})`);
        localReply(`🔥 Trending on Tiikme right now:\n\n${lines.join("\n")}\n\nClick any hashtag in the feed to explore posts.`);
      }
      return;
    }

    // 9. Refer a friend
    if (/refer.*friend|my friend.*job|friend.*looking.*job|refer.*someone/i.test(text)) {
      localReply("Want to refer a friend to a job on Tiikme?\n\nGo to Opportunities → Referrals tab. You can share a job link directly with your friend or tag a manager in the referral flow.", [{
        type: "opportunity" as const,
        id: "refer",
        title: "Referrals",
        subtitle: "Refer friends to open roles",
        href: "/app/opportunities?tab=referrals",
        meta: "Refer",
      }]);
      return;
    }

    // 10. Find organizations / companies
    const orgSearchMatch = text.match(/(?:find|search|show).*(?:organization|company|org|company).*named?\s+([A-Za-z\s]{2,30})/i)
      || text.match(/(?:what does|about|tell me about)\s+([A-Za-z\s]{2,30})\s+(?:company|org|organization)/i);
    if (orgSearchMatch) {
      const orgName = orgSearchMatch[1].trim();
      const { data: orgs } = await supabase
        .from('organizations')
        .select('id, name, slug, type, city, state, is_verified, followers_count')
        .ilike('name', `%${orgName}%`)
        .limit(5);
      if (!orgs || orgs.length === 0) {
        localReply(`No organization found for "${orgName}" on Tiikme yet.`);
      } else {
        const sources: TiikmePilotSource[] = orgs.map((o: any) => ({
          type: "organization" as const,
          id: o.id,
          title: o.name,
          subtitle: [o.type, o.city, o.state].filter(Boolean).join(" · "),
          href: `/org/${o.slug}`,
          meta: o.is_verified ? "Verified" : null,
        }));
        localReply(`Found ${orgs.length} organization${orgs.length !== 1 ? "s" : ""} matching "${orgName}":`, sources);
      }
      return;
    }

    // 11. Top paying jobs
    if (/top.*paying|highest.*salary|best.*salary|most.*pay|highest.*pay/i.test(text)) {
      const { data: topJobs } = await supabase
        .from('opportunities')
        .select('id, title, salary_max, salary_min, salary_currency, org:organizations(name, slug)')
        .eq('is_open', true)
        .not('salary_max', 'is', null)
        .order('salary_max', { ascending: false })
        .limit(5);
      if (!topJobs || topJobs.length === 0) {
        localReply("No salary data available right now. Browse all opportunities to see what's posted.");
      } else {
        const sources: TiikmePilotSource[] = topJobs.map((j: any) => {
          const max = j.salary_max;
          const label = max >= 100000 ? `₹${(max / 100000).toFixed(0)} LPA` : `₹${(max / 1000).toFixed(0)}K`;
          return {
            type: "opportunity" as const,
            id: j.id,
            title: j.title,
            subtitle: `${(j.org as any)?.name || "Unknown"} · Up to ${label}`,
            href: `/app/opportunities?opp=${j.id}`,
            meta: "Top Pay",
          };
        });
        localReply("Here are the top-paying roles on Tiikme right now:", sources);
      }
      return;
    }

    // ── RATE-LIMITED AI query ──

    // Daily rate limit check
    if (userId) {
      const today = new Date().toISOString().split('T')[0];
      const { data: usage } = await supabase
        .from('pilot_usage')
        .select('message_count')
        .eq('user_id', userId)
        .eq('date', today)
        .single();
      const count = usage?.message_count ?? 0;
      if (count >= DAILY_LIMIT) {
        setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
        toast.error("Daily limit reached — resets at midnight");
        setSending(false);
        return;
      }
      await supabase.from('pilot_usage').upsert(
        { user_id: userId, date: today, message_count: count + 1 },
        { onConflict: 'user_id,date' }
      );
      setDailyUsed(count + 1);
    }

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

  const dailyRemaining = DAILY_LIMIT - dailyUsed;
  const canSend = input.trim().length > 0 && !sending && remainingChats > 0 && dailyRemaining > 0;

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
          {remainingChats > 0 && dailyRemaining <= 0 && (
            <p className="text-xs text-red-400/80 text-center mb-2">
              Daily limit reached — resets at midnight
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
              maxLength={CHAR_LIMIT}
              disabled={sending || remainingChats === 0 || dailyRemaining <= 0}
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
          <div className="flex items-center justify-between mt-1.5 px-1">
            <p
              className={cn(
                "text-[10px]",
                dailyRemaining <= 0
                  ? "text-red-400"
                  : "text-white/30"
              )}
            >
              {dailyRemaining > 0
                ? `${dailyRemaining} message${dailyRemaining !== 1 ? "s" : ""} left today`
                : "Daily limit reached — resets at midnight"}
            </p>
            <p
              className={cn(
                "text-[10px]",
                CHAR_LIMIT - input.length < 20
                  ? "text-red-400"
                  : CHAR_LIMIT - input.length < 100
                  ? "text-orange-400"
                  : "text-white/30"
              )}
            >
              {CHAR_LIMIT - input.length} characters remaining
            </p>
          </div>
          <p className="text-[10px] text-white/20 text-center mt-1">
            Tiikme Pilot may make mistakes. Verify important information.
          </p>
        </div>
      </div>
    </div>
  );
}

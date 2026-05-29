import { useState, useRef, useEffect, useCallback } from "react";
import {
  Bot, Send, ThumbsUp, ThumbsDown, Archive, Trash2, Plus, ChevronRight,
  Briefcase, Search, Users, MessageCircle, Loader2, ShieldCheck,
  TrendingUp, BarChart2, Flame, ArrowUpRight, CheckCircle2, Megaphone,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  askPilot,
  loadPilotThreads,
  loadPilotMessages,
  archivePilotThread,
  deletePilotThread,
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
import { classifyIntent } from "@/lib/pilot/intent-classifier";
import { handlePlatformFaq } from "@/lib/pilot/faq-map";
import {
  handleSearchProfile, handleSearchJob, handleSearchOrg,
  handleSearchCampaign, handleMyAnalytics, handleMyApplications, handleTrending, handlePrivacyQuestion,
} from "@/lib/pilot/handlers";
import { checkQuota, incrementQuota } from "@/lib/pilot/rate-limiter";
import type { PilotResponse, ProfileCard, JobCard, ApplicationItem, AnalyticsData, TrendingHashtag, CampaignCard } from "@/lib/pilot/types";
import AvatarSquare from "@/components/ui/AvatarSquare";

// ─── Constants ─────────────────────────────────────────────────────────────────

const AI_DAILY_LIMIT = 20;
const CHAR_LIMIT = 1000;

const QUICK_ACTIONS = [
  "What's trending today?",
  "Find software jobs in Bangalore",
  "Show me startup organizations",
  "My activity stats",
  "New campaigns today",
  "Find developers in Hyderabad",
  "My job applications",
  "Show tech communities",
  "Remote jobs available",
  "How does Tiikme work?",
];

const THINKING_LABELS: Record<string, string> = {
  SEARCH_PROFILE: "Searching profiles…",
  SEARCH_JOB: "Finding open roles…",
  SEARCH_ORG: "Looking up organizations…",

  SEARCH_CAMPAIGN: "Finding campaigns…",
  MY_ANALYTICS: "Loading your stats…",
  MY_APPLICATIONS: "Fetching your applications…",
  TRENDING: "Getting trending data…",
  PLATFORM_FAQ: "Looking that up…",
  PRIVACY_QUESTION: "Checking privacy info…",
  AI_QUERY: "Thinking…",
};

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  metadata?: Record<string, any> | null;
  created_at: string;
  reply?: TiikmePilotReply;
  pilotResponse?: PilotResponse;
  thinkingLabel?: string;
}

// ─── Response card components ──────────────────────────────────────────────────

function VerifiedBadge() {
  return <ShieldCheck style={{ width: 12, height: 12, color: "#3B82F6", flexShrink: 0 }} />;
}

function ProfileResultsCard({ cards }: { cards: ProfileCard[] }) {
  return (
    <div className="grid grid-cols-1 gap-2 mt-2">
      {cards.map((p) => (
        <Link
          key={p.id}
          to={`/app/profile/${p.id}`}
          className="flex items-center gap-3 rounded-xl p-3 border border-gray-100 bg-gray-50 hover:bg-orange-50 hover:border-orange-100 transition-colors"
        >
          <AvatarSquare src={p.avatar_url} name={p.full_name} size={40} style={{ borderRadius: 10, flexShrink: 0 }} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] font-semibold text-gray-800 truncate">{p.full_name}</span>
              {p.is_verified && <VerifiedBadge />}
            </div>
            {p.headline && <p className="text-[11px] text-gray-500 truncate mt-0.5">{p.headline}</p>}
            {p.location_city && <p className="text-[11px] text-gray-400 mt-0.5">{p.location_city}</p>}
          </div>
          <ArrowUpRight style={{ width: 14, height: 14, color: "#9CA3AF", flexShrink: 0 }} />
        </Link>
      ))}
    </div>
  );
}

function JobResultsCard({ cards }: { cards: JobCard[] }) {
  const TYPE_COLORS: Record<string, string> = {
    full_time: "#16A34A", part_time: "#D97706",
    internship: "#2563EB", contract: "#7C3AED",
    freelance: "#EA580C",
  };

  return (
    <div className="grid grid-cols-1 gap-2 mt-2">
      {cards.map((j) => {
        const salaryLabel = j.salary_max
          ? j.salary_max >= 100000
            ? `₹${(j.salary_max / 100000).toFixed(0)} LPA`
            : `₹${(j.salary_max / 1000).toFixed(0)}K`
          : null;
        const typeColor = TYPE_COLORS[j.type || ""] || "#6B7280";
        return (
          <Link
            key={j.id}
            to={`/app/opportunities?opp=${j.id}`}
            className="flex items-start gap-3 rounded-xl p-3 border border-gray-100 bg-gray-50 hover:bg-orange-50 hover:border-orange-100 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 overflow-hidden bg-white border border-gray-100">
              {j.org_logo
                ? <img src={j.org_logo} alt={j.org_name || ""} className="w-full h-full object-cover" />
                : <Briefcase style={{ width: 16, height: 16, color: "#9CA3AF" }} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-gray-800 truncate">{j.title}</p>
              <p className="text-[11px] text-gray-500 truncate">{j.org_name || "Unknown org"}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {j.type && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: `${typeColor}18`, color: typeColor }}>
                    {j.type.replace(/_/g, " ")}
                  </span>
                )}
                {j.is_remote && <span className="text-[10px] text-gray-400">Remote</span>}
                {j.location && !j.is_remote && <span className="text-[10px] text-gray-400 truncate">{j.location}</span>}
                {salaryLabel && <span className="text-[10px] text-green-600 font-semibold">{salaryLabel}</span>}
              </div>
            </div>
            <ArrowUpRight style={{ width: 14, height: 14, color: "#9CA3AF", flexShrink: 0, marginTop: 2 }} />
          </Link>
        );
      })}
    </div>
  );
}

function CampaignResultsCard({ cards }: { cards: CampaignCard[] }) {
  return (
    <div className="grid grid-cols-1 gap-2 mt-2">
      {cards.map((c) => {
        const budgetLabel = c.budget_max
          ? c.budget_max >= 100000
            ? `₹${(c.budget_max / 100000).toFixed(0)} LPA`
            : `₹${(c.budget_max / 1000).toFixed(0)}K`
          : null;
        const deadlineLabel = c.deadline
          ? new Date(c.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
          : null;
        return (
          <Link
            key={c.id}
            to={`/app/opportunities?tab=campaigns&campaign=${c.id}`}
            className="flex items-start gap-3 rounded-xl p-3 border border-gray-100 bg-gray-50 hover:bg-orange-50 hover:border-orange-100 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 overflow-hidden bg-orange-50 border border-orange-100">
              {c.org_logo
                ? <img src={c.org_logo} alt={c.org_name || ""} className="w-full h-full object-cover" />
                : <Megaphone style={{ width: 16, height: 16, color: "#FF5A1F" }} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-gray-800 truncate">{c.title}</p>
              <p className="text-[11px] text-gray-500 truncate">{c.org_name || "Brand campaign"}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {c.type && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-orange-50 text-orange-600">
                    {c.type.replace(/_/g, " ")}
                  </span>
                )}
                {budgetLabel && <span className="text-[10px] text-green-600 font-semibold">{budgetLabel}</span>}
                {deadlineLabel && <span className="text-[10px] text-gray-400">Due {deadlineLabel}</span>}
              </div>
            </div>
            <ArrowUpRight style={{ width: 14, height: 14, color: "#9CA3AF", flexShrink: 0, marginTop: 2 }} />
          </Link>
        );
      })}
    </div>
  );
}

function AnalyticsCard({ data }: { data: AnalyticsData }) {
  const TIER_COLORS: Record<string, { bg: string; color: string }> = {
    Newcomer:    { bg: "#F3F4F6", color: "#6B7280" },
    Explorer:    { bg: "#EFF6FF", color: "#3B82F6" },
    Contributor: { bg: "#FFFBEB", color: "#D97706" },
    Expert:      { bg: "#F0FDF4", color: "#16A34A" },
  };
  const tierStyle = TIER_COLORS[data.tier] || TIER_COLORS.Newcomer;
  const pct = data.nextTier ? Math.min(100, Math.round((data.score / data.nextTier) * 100)) : 100;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 mt-2 space-y-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: tierStyle.bg }}>
          <BarChart2 style={{ width: 18, height: 18, color: tierStyle.color }} />
        </div>
        <div>
          <p className="text-[13px] font-bold text-gray-800">{data.name ? `${data.name}'s Stats` : "Your Stats"}</p>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: tierStyle.bg, color: tierStyle.color }}>{data.tier}</span>
            {data.isVerified && (
              <span className="flex items-center gap-0.5 text-[10px] text-blue-500">
                <ShieldCheck style={{ width: 10, height: 10 }} /> Verified
              </span>
            )}
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] text-gray-400">Activity Score</span>
          <span className="text-[13px] font-bold" style={{ color: tierStyle.color }}>{data.score} pts</span>
        </div>
        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: tierStyle.color }} />
        </div>
        {data.nextTier && (
          <p className="text-[10px] text-gray-400 mt-1">{data.score} / {data.nextTier} to next tier</p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Posts", value: data.postCount },
          { label: "Connections", value: data.connCount },
          { label: "Followers", value: data.followerCount },
        ].map(({ label, value }) => (
          <div key={label} className="text-center rounded-xl py-2.5 bg-gray-50">
            <p className="text-[16px] font-bold text-gray-800">{value}</p>
            <p className="text-[10px] text-gray-400">{label}</p>
          </div>
        ))}
      </div>

      {data.tips.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Tips to grow</p>
          {data.tips.map((tip, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 shrink-0" />
              <p className="text-[12px] text-gray-600 leading-snug">{tip}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TrendingCard({ hashtags }: { hashtags: TrendingHashtag[] }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 mt-2 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Flame style={{ width: 14, height: 14, color: "#F97316" }} />
        <span className="text-[12px] font-semibold text-gray-600">Trending on Tiikme</span>
      </div>
      <div className="space-y-1.5">
        {hashtags.map((h, i) => (
          <Link key={h.tag} to={h.url} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors">
            <span className="text-[11px] font-bold text-gray-300 w-5 text-center">{i + 1}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-orange-500">{h.tag}</p>
              <p className="text-[10px] text-gray-400">{h.count} post{h.count !== 1 ? "s" : ""}</p>
            </div>
            <TrendingUp style={{ width: 12, height: 12, color: "#D1D5DB" }} />
          </Link>
        ))}
      </div>
    </div>
  );
}

function ApplicationsListCard({ applications }: { applications: ApplicationItem[] }) {
  const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
    applied:     { bg: "#EFF6FF", color: "#3B82F6" },
    pending:     { bg: "#EFF6FF", color: "#3B82F6" },
    reviewing:   { bg: "#FFFBEB", color: "#D97706" },
    shortlisted: { bg: "#FFFBEB", color: "#D97706" },
    selected:    { bg: "#F0FDF4", color: "#16A34A" },
    approved:    { bg: "#F0FDF4", color: "#16A34A" },
    completed:   { bg: "#F0FDF4", color: "#16A34A" },
    rejected:    { bg: "#FFF1F2", color: "#E11D48" },
    withdrawn:   { bg: "#F3F4F6", color: "#6B7280" },
  };

  return (
    <div className="space-y-2 mt-2">
      {applications.map((app) => {
        const style = STATUS_STYLES[app.status] || STATUS_STYLES.applied;
        return (
          <Link
            key={app.id}
            to={app.jobId ? `/app/opportunities?opp=${app.jobId}` : "/app/opportunities"}
            className="flex items-center gap-3 rounded-xl p-3 border border-gray-100 bg-gray-50 hover:bg-orange-50 hover:border-orange-100 transition-colors"
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 overflow-hidden bg-white border border-gray-100">
              {app.orgLogo
                ? <img src={app.orgLogo} alt={app.orgName || ""} className="w-full h-full object-cover" />
                : <Briefcase style={{ width: 14, height: 14, color: "#9CA3AF" }} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-gray-800 truncate">{app.jobTitle || "Job"}</p>
              <p className="text-[11px] text-gray-400 truncate">{app.orgName || "Unknown"}</p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0" style={{ background: style.bg, color: style.color }}>
              {app.statusLabel}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

function FaqCard({ content, action }: { content: string; action?: { label: string; url: string } }) {
  const lines = content.split("\n");
  return (
    <div className="space-y-3">
      <div className="rounded-2xl rounded-tl-sm bg-gray-50 border border-gray-100 px-4 py-3">
        <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
          {lines.map((line, i) => {
            if (!line.trim()) return <br key={i} />;
            const parts = line.split(/\*\*([^*]+)\*\*/g);
            return (
              <p key={i} className="mb-0.5">
                {parts.map((part, j) =>
                  j % 2 === 1 ? <strong key={j} className="text-gray-900 font-semibold">{part}</strong> : part
                )}
              </p>
            );
          })}
        </div>
      </div>
      {action && (
        <Link to={action.url} className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-500 hover:text-orange-600 transition-colors">
          {action.label} <ArrowUpRight style={{ width: 12, height: 12 }} />
        </Link>
      )}
    </div>
  );
}

// ─── Source card (for AI replies) ─────────────────────────────────────────────

const SOURCE_TYPE_LABEL: Record<TiikmePilotSource["type"], string> = {
  organization: "Org", opportunity: "Job", post: "Post", profile: "Person",
};

function SourceCard({ source }: { source: TiikmePilotSource }) {
  const inner = (
    <div className="rounded-xl border border-gray-100 bg-gray-50 hover:bg-orange-50 hover:border-orange-100 transition-colors p-3 flex flex-col gap-1 min-w-0">
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-orange-500 shrink-0">
          {SOURCE_TYPE_LABEL[source.type]}
        </span>
        {source.meta && <span className="text-[10px] text-gray-400 truncate">{source.meta}</span>}
      </div>
      <p className="text-sm font-medium text-gray-800 truncate leading-snug">{source.title}</p>
      {source.subtitle && <p className="text-xs text-gray-400 truncate">{source.subtitle}</p>}
    </div>
  );

  if (source.href) {
    const isExternal = /^https?:\/\//.test(source.href);
    if (isExternal) return <a href={source.href} target="_blank" rel="noopener noreferrer" className="block">{inner}</a>;
    return <Link to={source.href} className="block">{inner}</Link>;
  }
  return inner;
}

// ─── AssistantBubble ───────────────────────────────────────────────────────────

function AssistantBubble({ msg, onRate }: { msg: ChatMessage; onRate: (messageId: string, rating: "up" | "down") => void }) {
  const [rated, setRated] = useState<"up" | "down" | null>(null);
  const pr = msg.pilotResponse;
  const reply = msg.reply;
  const sources = reply?.sourceCards ?? [];

  const handleRate = (r: "up" | "down") => {
    if (rated) return;
    setRated(r);
    onRate(msg.id, r);
    toast.success(r === "up" ? "Thanks for the feedback!" : "We'll work on improving this.");
  };

  if (msg.content === "…") {
    return (
      <div className="flex gap-3 items-start">
        <div className="shrink-0 mt-1 w-7 h-7 rounded-full bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center">
          <Bot size={14} className="text-white" />
        </div>
        <div className="rounded-2xl rounded-tl-sm bg-gray-50 border border-gray-100 px-4 py-3 flex items-center gap-3">
          <div className="flex gap-1">
            <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0ms]" />
            <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:150ms]" />
            <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:300ms]" />
          </div>
          {msg.thinkingLabel && <span className="text-[12px] text-gray-400">{msg.thinkingLabel}</span>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 items-start">
      <div className="shrink-0 mt-1 w-7 h-7 rounded-full bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center">
        <Bot size={14} className="text-white" />
      </div>

      <div className="flex-1 min-w-0 space-y-3">
        {!pr && (
          <div className="rounded-2xl rounded-tl-sm bg-gray-50 border border-gray-100 px-4 py-3">
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
          </div>
        )}

        {pr?.type === "faq" && pr.content && <FaqCard content={pr.content} action={pr.action} />}

        {pr?.type === "text" && pr.content && (
          <div className="space-y-2">
            <div className="rounded-2xl rounded-tl-sm bg-gray-50 border border-gray-100 px-4 py-3">
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{pr.content}</p>
            </div>
            {pr.action && (
              <Link to={pr.action.url} className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-500 hover:text-orange-600 transition-colors">
                {pr.action.label} <ArrowUpRight style={{ width: 12, height: 12 }} />
              </Link>
            )}
          </div>
        )}

        {pr?.type === "profile_results" && (
          <div>
            {pr.content && <p className="text-[12px] text-gray-400 mb-2">{pr.content}</p>}
            <ProfileResultsCard cards={pr.cards as ProfileCard[]} />
            {pr.action && (
              <Link to={pr.action.url} className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-500 hover:text-orange-600 transition-colors mt-2">
                {pr.action.label} <ArrowUpRight style={{ width: 12, height: 12 }} />
              </Link>
            )}
          </div>
        )}

        {pr?.type === "job_results" && (
          <div>
            {pr.content && <p className="text-[12px] text-gray-400 mb-2">{pr.content}</p>}
            <JobResultsCard cards={pr.cards as JobCard[]} />
          </div>
        )}

        {pr?.type === "campaign_results" && (
          <div>
            {pr.content && <p className="text-[12px] text-gray-400 mb-2">{pr.content}</p>}
            <CampaignResultsCard cards={pr.cards as CampaignCard[]} />
            <Link to="/app/opportunities?tab=campaigns" className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-500 hover:text-orange-600 transition-colors mt-2">
              Browse all campaigns <ArrowUpRight style={{ width: 12, height: 12 }} />
            </Link>
          </div>
        )}

        {pr?.type === "analytics_card" && pr.data && <AnalyticsCard data={pr.data} />}

        {pr?.type === "trending_card" && pr.hashtags && <TrendingCard hashtags={pr.hashtags} />}

        {pr?.type === "applications_list" && pr.applications && (
          <div>
            <p className="text-[12px] text-gray-400 mb-2">Your recent applications:</p>
            <ApplicationsListCard applications={pr.applications} />
            <Link to="/app/opportunities?tab=applications" className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-500 hover:text-orange-600 transition-colors mt-2">
              View all applications <ArrowUpRight style={{ width: 12, height: 12 }} />
            </Link>
          </div>
        )}

        {pr?.type === "limit_reached" && pr.content && (
          <div className="rounded-2xl rounded-tl-sm bg-orange-50 border border-orange-100 px-4 py-3">
            <p className="text-sm text-orange-700 leading-relaxed whitespace-pre-wrap">{pr.content}</p>
          </div>
        )}

        {/* AI reply source cards */}
        {sources.length > 0 && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {sources.slice(0, 6).map((s) => <SourceCard key={s.id} source={s} />)}
          </div>
        )}

        {/* Rating */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleRate("up")}
            disabled={!!rated}
            className={cn(
              "p-1.5 rounded-lg transition-colors",
              rated === "up"
                ? "text-green-600 bg-green-50"
                : "text-gray-400 hover:text-green-600 hover:bg-green-50"
            )}
            title="Good answer"
          >
            <ThumbsUp size={13} />
          </button>
          <button
            onClick={() => handleRate("down")}
            disabled={!!rated}
            className={cn(
              "p-1.5 rounded-lg transition-colors",
              rated === "down"
                ? "text-red-500 bg-red-50"
                : "text-gray-400 hover:text-red-500 hover:bg-red-50"
            )}
            title="Not helpful"
          >
            <ThumbsDown size={13} />
          </button>
          {rated && (
            <span className="text-[11px] text-gray-400 ml-1">
              {rated === "up" ? "Thanks!" : "Got it."}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function TiikmePilotPage() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<TiikmePilotThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [remainingChats, setRemainingChats] = useState(MAX_PILOT_CHATS);
  const [aiRemaining, setAiRemaining] = useState(AI_DAILY_LIMIT);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    loadPilotThreads()
      .then(setThreads)
      .catch(() => toast.error("Could not load conversations"))
      .finally(() => setLoadingThreads(false));
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    const today = new Date().toISOString().split("T")[0];
    supabase
      .from("pilot_usage" as any)
      .select("ai_count")
      .eq("user_id", user.id)
      .eq("date", today)
      .maybeSingle()
      .then(({ data }) => {
        const used = (data as any)?.ai_count ?? 0;
        setAiRemaining(Math.max(0, AI_DAILY_LIMIT - used));
      });
  }, [user?.id]);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  const openThread = async (threadId: string) => {
    setActiveThreadId(threadId);
    setSidebarOpen(false);
    setLoadingMessages(true);
    try {
      const msgs = await loadPilotMessages(threadId);
      const chatMsgs: ChatMessage[] = msgs.map((m: TiikmePilotMessageRecord) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        metadata: m.metadata,
        created_at: m.created_at,
      }));
      setMessages(chatMsgs);
    } catch {
      toast.error("Could not load messages");
    } finally {
      setLoadingMessages(false);
    }
  };

  const newConversation = () => {
    setActiveThreadId(null);
    setMessages([]);
    setSidebarOpen(false);
    inputRef.current?.focus();
  };

  const handleArchive = async (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await archivePilotThread(threadId);
    setThreads((prev) => prev.filter((t) => t.id !== threadId));
    if (activeThreadId === threadId) { setActiveThreadId(null); setMessages([]); }
    toast.success("Archived");
  };

  const handleDelete = async (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toast(`Delete this conversation?`, {
      action: {
        label: "Delete",
        onClick: async () => {
          await deletePilotThread(threadId);
          setThreads((prev) => prev.filter((t) => t.id !== threadId));
          if (activeThreadId === threadId) { setActiveThreadId(null); setMessages([]); }
          toast.success("Conversation deleted");
        },
      },
      cancel: { label: "Cancel", onClick: () => {} },
      duration: 5000,
    });
  };

  const handleRate = async (messageId: string, rating: "up" | "down") => {
    try { await ratePilotAnswer(messageId, rating); } catch { /* silent */ }
  };

  const addLocalReply = useCallback((pilotResponse: PilotResponse) => {
    const msg: ChatMessage = {
      id: `local-${Date.now()}`,
      role: "assistant",
      content: pilotResponse.content || "",
      created_at: new Date().toISOString(),
      pilotResponse,
    };
    setMessages((prev) => prev.filter((m) => m.content !== "…").concat(msg));
    setSending(false);
  }, []);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending) return;

    const userId = user?.id;
    setInput("");
    setSending(true);

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    const intent = classifyIntent(text);
    const thinkingLabel = THINKING_LABELS[intent.type] || "Thinking…";
    const tempId = `thinking-${Date.now()}`;

    const thinkingMsg: ChatMessage = {
      id: tempId,
      role: "assistant",
      content: "…",
      created_at: new Date().toISOString(),
      thinkingLabel,
    };
    setMessages((prev) => [...prev, thinkingMsg]);

    const removeThinking = () => setMessages((prev) => prev.filter((m) => m.id !== tempId));

    try {
      if (intent.type === "PLATFORM_FAQ") {
        const faqResult = handlePlatformFaq(text);
        if (faqResult) { removeThinking(); addLocalReply(faqResult); return; }
      }

      if (intent.type === "PRIVACY_QUESTION" && userId) {
        const result = await handlePrivacyQuestion(userId);
        removeThinking(); addLocalReply(result); return;
      }

      if (intent.type === "SEARCH_PROFILE" && userId) {
        const result = await handleSearchProfile(intent.extractedEntities, userId);
        removeThinking(); addLocalReply(result); return;
      }

      if (intent.type === "SEARCH_JOB" && userId) {
        const result = await handleSearchJob(intent.extractedEntities, userId);
        removeThinking(); addLocalReply(result); return;
      }

      if (intent.type === "SEARCH_ORG" && userId) {
        const result = await handleSearchOrg(intent.extractedEntities, userId);
        removeThinking(); addLocalReply(result); return;
      }

      if (intent.type === "SEARCH_CAMPAIGN") {
        const result = await handleSearchCampaign(intent.extractedEntities as any);
        removeThinking(); addLocalReply(result); return;
      }

      if (intent.type === "TRENDING") {
        const result = await handleTrending();
        removeThinking(); addLocalReply(result); return;
      }

      if (intent.type === "MY_ANALYTICS" && userId) {
        const result = await handleMyAnalytics(userId);
        removeThinking(); addLocalReply(result); return;
      }

      if (intent.type === "MY_APPLICATIONS" && userId) {
        const result = await handleMyApplications(userId);
        removeThinking(); addLocalReply(result); return;
      }

      // AI_QUERY — rate-limited
      if (!userId) {
        removeThinking();
        addLocalReply({ type: "text", content: "Please sign in to use Pilot AI." });
        return;
      }

      const quota = await checkQuota(userId, "AI_QUERY");
      if (!quota.allowed) {
        removeThinking();
        addLocalReply({
          type: "limit_reached",
          content: `You've reached your daily AI question limit (${AI_DAILY_LIMIT}). Resets at midnight.\n\nYou can still search for people, jobs, campaigns, and check your stats for free!`,
        });
        setSending(false);
        return;
      }

      await incrementQuota(userId, "AI_QUERY");
      setAiRemaining((prev) => Math.max(0, prev - 1));

      const reply = await askPilot({ message: text, mode: "discover", threadId: activeThreadId ?? undefined });

      if (!activeThreadId) {
        setActiveThreadId(reply.threadId);
        const refreshed = await loadPilotThreads();
        setThreads(refreshed);
      }
      setRemainingChats(reply.remainingChats);

      removeThinking();
      setMessages((prev) => [
        ...prev,
        {
          id: reply.assistantMessageId ?? `ai-${Date.now()}`,
          role: "assistant" as const,
          content: reply.answer,
          created_at: new Date().toISOString(),
          reply,
        },
      ]);
    } catch (err: any) {
      removeThinking();
      setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
      setInput(text);
      toast.error(err?.message || "Something went wrong");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const canSend = input.trim().length > 0 && !sending && remainingChats > 0;

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-white">
      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col w-64 shrink-0 border-r border-gray-100 bg-gray-50 transition-transform duration-200",
          "fixed inset-y-0 top-16 z-30 md:static md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <span className="text-sm font-semibold text-gray-700">Conversations</span>
          <button
            onClick={newConversation}
            className="flex items-center gap-1 text-xs text-orange-500 hover:text-orange-600 transition-colors font-semibold"
          >
            <Plus size={14} /> New
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2 space-y-0.5 px-2">
          {loadingThreads && (
            <div className="flex justify-center py-6">
              <Loader2 size={18} className="animate-spin text-gray-300" />
            </div>
          )}
          {!loadingThreads && threads.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-6 px-4">No conversations yet. Ask Pilot anything!</p>
          )}
          {threads.map((t) => (
            <button
              key={t.id}
              onClick={() => openThread(t.id)}
              className={cn(
                "w-full text-left rounded-xl px-3 py-2.5 group flex items-start gap-2 transition-colors",
                activeThreadId === t.id
                  ? "bg-orange-50 text-gray-800 border border-orange-100"
                  : "hover:bg-white text-gray-500 hover:text-gray-700"
              )}
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate leading-snug">{t.title}</p>
              </div>
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button
                  onClick={(e) => handleArchive(t.id, e)}
                  className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Archive"
                >
                  <Archive size={11} />
                </button>
                <button
                  onClick={(e) => handleDelete(t.id, e)}
                  className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                  title="Delete"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            </button>
          ))}
        </div>

        <div className="px-4 py-3 border-t border-gray-100 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-gray-400">
            <span>{remainingChats} thread{remainingChats !== 1 ? "s" : ""} left</span>
            <span className={cn(aiRemaining <= 3 ? "text-orange-500" : "")}>
              {aiRemaining} AI question{aiRemaining !== 1 ? "s" : ""} today
            </span>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main chat area */}
      <div className="flex flex-col flex-1 min-w-0 relative">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 shrink-0 bg-white">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50"
          >
            <ChevronRight size={18} />
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center shrink-0">
              <Bot size={13} className="text-white" />
            </div>
            <span className="text-sm font-bold text-gray-800">Tiikme Pilot</span>
            <span className="text-[10px] font-medium text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">AI</span>
          </div>

          <div className="ml-auto shrink-0 hidden sm:flex items-center gap-1.5">
            <CheckCircle2 size={11} className={aiRemaining > 0 ? "text-green-500" : "text-red-400"} />
            <span className={cn("text-[11px] font-medium", aiRemaining > 0 ? "text-gray-400" : "text-red-400")}>
              {aiRemaining} AI question{aiRemaining !== 1 ? "s" : ""} left
            </span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 bg-white">
          {!activeThreadId && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-5 py-8 max-w-lg mx-auto w-full">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center shadow-lg shadow-orange-100">
                <Bot size={28} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Tiikme Pilot</h2>
                <p className="text-sm text-gray-400 mt-1.5 max-w-xs leading-relaxed">
                  Search profiles, jobs, campaigns and communities — or ask anything about Tiikme.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                {QUICK_ACTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => { setInput(q); inputRef.current?.focus(); }}
                    className="text-left text-xs text-gray-500 hover:text-gray-800 bg-gray-50 hover:bg-orange-50 hover:border-orange-100 border border-gray-100 rounded-xl px-3 py-2.5 transition-colors flex items-center gap-2"
                  >
                    <Search size={10} className="text-gray-300 shrink-0" />
                    {q}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-gray-300">
                Most searches are instant & free · {aiRemaining} AI question{aiRemaining !== 1 ? "s" : ""} left today
              </p>
            </div>
          )}

          {loadingMessages && (
            <div className="flex justify-center py-8">
              <Loader2 size={20} className="animate-spin text-gray-300" />
            </div>
          )}

          {messages.map((msg) =>
            msg.role === "user" ? (
              <div key={msg.id} className="flex justify-end">
                <div className="max-w-[75%] rounded-2xl rounded-tr-sm bg-orange-500 px-4 py-3">
                  <p className="text-sm text-white whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ) : (
              <AssistantBubble key={msg.id} msg={msg} onRate={handleRate} />
            )
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area — single border */}
        <div className="shrink-0 px-4 py-3 border-t border-gray-100 bg-white">
          <div className="flex items-end gap-3 bg-gray-50 rounded-2xl px-4 py-3 focus-within:ring-2 focus-within:ring-orange-200 focus-within:bg-white transition-all">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search people, jobs, campaigns — or ask anything about Tiikme…"
              rows={1}
              maxLength={CHAR_LIMIT}
              disabled={sending || remainingChats === 0}
              className="flex-1 resize-none bg-transparent text-sm text-gray-700 placeholder:text-gray-400 outline-none leading-relaxed max-h-32 overflow-y-auto disabled:opacity-50"
              style={{ fieldSizing: "content" } as any}
            />
            <button
              onClick={sendMessage}
              disabled={!canSend}
              className={cn(
                "shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all",
                canSend
                  ? "bg-orange-500 hover:bg-orange-400 text-white shadow-sm"
                  : "bg-gray-100 text-gray-300 cursor-not-allowed"
              )}
            >
              {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            </button>
          </div>
          <div className="flex items-center justify-between mt-1.5 px-1">
            <p className="text-[10px] text-gray-300">Enter to send · Shift+Enter for new line</p>
            <p className={cn(
              "text-[10px]",
              CHAR_LIMIT - input.length < 50 ? "text-red-400"
                : CHAR_LIMIT - input.length < 200 ? "text-orange-400"
                : "text-gray-300"
            )}>
              {CHAR_LIMIT - input.length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

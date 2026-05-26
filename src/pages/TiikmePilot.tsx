import { useState, useRef, useEffect, useCallback } from "react";
import {
  Bot, Send, ThumbsUp, ThumbsDown, Archive, Plus, ChevronRight,
  Briefcase, Users, MessageCircle, Loader2, ShieldCheck,
  TrendingUp, BarChart2, Flame, ArrowUpRight, CheckCircle2,
} from "lucide-react";
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
import { classifyIntent } from "@/lib/pilot/intent-classifier";
import { handlePlatformFaq } from "@/lib/pilot/faq-map";
import {
  handleSearchProfile, handleSearchJob, handleSearchOrg, handleSearchCircle,
  handleMyAnalytics, handleMyApplications, handleTrending, handlePrivacyQuestion,
  handleMyProfile, handleMyExperience, handleMySkills,
} from "@/lib/pilot/handlers";
import { checkQuota, incrementQuota } from "@/lib/pilot/rate-limiter";
import type { PilotResponse, ProfileCard, JobCard, ApplicationItem, AnalyticsData, TrendingHashtag, CircleCard, MyProfileData, ExperienceItem } from "@/lib/pilot/types";
import AvatarSquare from "@/components/ui/AvatarSquare";

// ─── Constants ────────────────────────────────────────────────────────────────

const AI_DAILY_LIMIT = 3;
const CHAR_LIMIT = 500;

const QUICK_ACTIONS = [
  "My profile",
  "My experience",
  "My skills",
  "My activity score",
  "My applications",
  "Find jobs in Bangalore",
  "What's trending today?",
  "Show me tech communities",
];

const THINKING_LABELS: Record<string, string> = {
  SEARCH_PROFILE: "Searching profiles…",
  SEARCH_JOB: "Finding open roles…",
  SEARCH_ORG: "Looking up organizations…",
  SEARCH_CIRCLE: "Searching communities…",
  MY_ANALYTICS: "Loading your stats…",
  MY_APPLICATIONS: "Fetching your applications…",
  MY_PROFILE: "Loading your profile…",
  MY_EXPERIENCE: "Fetching your work history…",
  MY_SKILLS: "Loading your skills…",
  TRENDING: "Getting trending data…",
  PLATFORM_FAQ: "Looking that up…",
  PRIVACY_QUESTION: "Checking privacy info…",
  AI_QUERY: "Thinking…",
};

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Response card components ─────────────────────────────────────────────────

function VerifiedBadge() {
  return (
    <ShieldCheck
      style={{ width: 12, height: 12, color: "#3B82F6", flexShrink: 0 }}
    />
  );
}

function ProfileResultsCard({ cards }: { cards: ProfileCard[] }) {
  return (
    <div className="grid grid-cols-1 gap-2 mt-2">
      {cards.map((p) => (
        <Link
          key={p.id}
          to={`/app/profile/${p.id}`}
          className="flex items-center gap-3 rounded-xl p-3 border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
        >
          <AvatarSquare
            src={p.avatar_url}
            name={p.full_name}
            size={40}
            style={{ borderRadius: 10, flexShrink: 0 }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] font-semibold text-white truncate">{p.full_name}</span>
              {p.is_verified && <VerifiedBadge />}
            </div>
            {p.headline && (
              <p className="text-[11px] text-white/50 truncate mt-0.5">{p.headline}</p>
            )}
            {p.location_city && (
              <p className="text-[11px] text-white/35 mt-0.5">{p.location_city}</p>
            )}
          </div>
          <ArrowUpRight style={{ width: 14, height: 14, color: "rgba(255,255,255,0.3)", flexShrink: 0 }} />
        </Link>
      ))}
    </div>
  );
}

function JobResultsCard({ cards }: { cards: JobCard[] }) {
  const TYPE_COLORS: Record<string, string> = {
    full_time: "#22C55E", part_time: "#F59E0B",
    internship: "#3B82F6", contract: "#A855F7",
    freelance: "#F97316",
  };

  return (
    <div className="grid grid-cols-1 gap-2 mt-2">
      {cards.map((j) => {
        const salaryLabel = j.salary_max
          ? j.salary_max >= 100000
            ? `₹${(j.salary_max / 100000).toFixed(0)} LPA`
            : `₹${(j.salary_max / 1000).toFixed(0)}K`
          : null;
        const typeColor = TYPE_COLORS[j.type || ""] || "#9CA3AF";
        return (
          <Link
            key={j.id}
            to={`/app/opportunities?opp=${j.id}`}
            className="flex items-start gap-3 rounded-xl p-3 border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 overflow-hidden"
              style={{ background: "rgba(255,255,255,0.08)" }}
            >
              {j.org_logo ? (
                <img src={j.org_logo} alt={j.org_name || ""} className="w-full h-full object-cover" />
              ) : (
                <Briefcase style={{ width: 16, height: 16, color: "rgba(255,255,255,0.4)" }} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-white truncate">{j.title}</p>
              <p className="text-[11px] text-white/50 truncate">{j.org_name || "Unknown org"}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {j.type && (
                  <span
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                    style={{ background: `${typeColor}20`, color: typeColor }}
                  >
                    {j.type.replace(/_/g, " ")}
                  </span>
                )}
                {j.is_remote && (
                  <span className="text-[10px] text-white/40">Remote</span>
                )}
                {j.location && !j.is_remote && (
                  <span className="text-[10px] text-white/40 truncate">{j.location}</span>
                )}
                {salaryLabel && (
                  <span className="text-[10px] text-green-400 font-semibold">{salaryLabel}</span>
                )}
              </div>
            </div>
            <ArrowUpRight style={{ width: 14, height: 14, color: "rgba(255,255,255,0.3)", flexShrink: 0, marginTop: 2 }} />
          </Link>
        );
      })}
    </div>
  );
}

function AnalyticsCard({ data }: { data: AnalyticsData }) {
  const TIER_COLORS: Record<string, { bg: string; color: string }> = {
    Newcomer: { bg: "#6B728020", color: "#9CA3AF" },
    Explorer: { bg: "#3B82F620", color: "#60A5FA" },
    Contributor: { bg: "#F59E0B20", color: "#FBBF24" },
    Expert: { bg: "#10B98120", color: "#34D399" },
  };
  const tierStyle = TIER_COLORS[data.tier] || TIER_COLORS.Newcomer;
  const pct = data.nextTier ? Math.min(100, Math.round((data.score / data.nextTier) * 100)) : 100;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 mt-2 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: tierStyle.bg }}
        >
          <BarChart2 style={{ width: 18, height: 18, color: tierStyle.color }} />
        </div>
        <div>
          <p className="text-[13px] font-bold text-white">
            {data.name ? `${data.name}'s Stats` : "Your Stats"}
          </p>
          <div className="flex items-center gap-1.5">
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: tierStyle.bg, color: tierStyle.color }}
            >
              {data.tier}
            </span>
            {data.isVerified && (
              <span className="flex items-center gap-0.5 text-[10px] text-blue-400">
                <ShieldCheck style={{ width: 10, height: 10 }} /> Verified
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Score bar */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] text-white/50">Activity Score</span>
          <span className="text-[13px] font-bold" style={{ color: tierStyle.color }}>{data.score} pts</span>
        </div>
        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, background: tierStyle.color }}
          />
        </div>
        {data.nextTier && (
          <p className="text-[10px] text-white/30 mt-1">{data.score} / {data.nextTier} to next tier</p>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Posts", value: data.postCount },
          { label: "Connections", value: data.connCount },
          { label: "Followers", value: data.followerCount },
        ].map(({ label, value }) => (
          <div key={label} className="text-center rounded-xl py-2.5" style={{ background: "rgba(255,255,255,0.05)" }}>
            <p className="text-[16px] font-bold text-white">{value}</p>
            <p className="text-[10px] text-white/40">{label}</p>
          </div>
        ))}
      </div>

      {/* Tips */}
      {data.tips.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold text-white/50 uppercase tracking-wide">Tips to grow</p>
          {data.tips.map((tip, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 shrink-0" />
              <p className="text-[12px] text-white/60 leading-snug">{tip}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TrendingCard({ hashtags }: { hashtags: TrendingHashtag[] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 mt-2">
      <div className="flex items-center gap-2 mb-3">
        <Flame style={{ width: 14, height: 14, color: "#F97316" }} />
        <span className="text-[12px] font-semibold text-white/70">Trending on Tiikme</span>
      </div>
      <div className="space-y-1.5">
        {hashtags.map((h, i) => (
          <Link
            key={h.tag}
            to={h.url}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors"
          >
            <span className="text-[11px] font-bold text-white/30 w-5 text-center">{i + 1}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-orange-400">{h.tag}</p>
              <p className="text-[10px] text-white/35">{h.count} post{h.count !== 1 ? "s" : ""}</p>
            </div>
            <TrendingUp style={{ width: 12, height: 12, color: "rgba(255,255,255,0.2)" }} />
          </Link>
        ))}
      </div>
    </div>
  );
}

function ApplicationsListCard({ applications }: { applications: ApplicationItem[] }) {
  const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
    applied: { bg: "#3B82F620", color: "#60A5FA" },
    pending: { bg: "#3B82F620", color: "#60A5FA" },
    reviewing: { bg: "#F59E0B20", color: "#FBBF24" },
    shortlisted: { bg: "#F59E0B20", color: "#FBBF24" },
    selected: { bg: "#10B98120", color: "#34D399" },
    approved: { bg: "#10B98120", color: "#34D399" },
    completed: { bg: "#10B98120", color: "#34D399" },
    rejected: { bg: "#EF444420", color: "#F87171" },
    withdrawn: { bg: "#6B728020", color: "#9CA3AF" },
  };

  return (
    <div className="space-y-2 mt-2">
      {applications.map((app) => {
        const style = STATUS_STYLES[app.status] || STATUS_STYLES.applied;
        return (
          <Link
            key={app.id}
            to={app.jobId ? `/app/opportunities?opp=${app.jobId}` : "/app/opportunities"}
            className="flex items-center gap-3 rounded-xl p-3 border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 overflow-hidden"
              style={{ background: "rgba(255,255,255,0.08)" }}
            >
              {app.orgLogo ? (
                <img src={app.orgLogo} alt={app.orgName || ""} className="w-full h-full object-cover" />
              ) : (
                <Briefcase style={{ width: 14, height: 14, color: "rgba(255,255,255,0.4)" }} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-white truncate">{app.jobTitle || "Job"}</p>
              <p className="text-[11px] text-white/40 truncate">{app.orgName || "Unknown"}</p>
            </div>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
              style={{ background: style.bg, color: style.color }}
            >
              {app.statusLabel}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

function CircleResultsCard({ cards }: { cards: CircleCard[] }) {
  return (
    <div className="grid grid-cols-1 gap-2 mt-2">
      {cards.map((c) => (
        <Link
          key={c.id}
          to={`/app/circles/${c.slug}`}
          className="flex items-center gap-3 rounded-xl p-3 border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(249,115,22,0.12)" }}
          >
            <MessageCircle style={{ width: 16, height: 16, color: "#F97316" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-white truncate">{c.name}</p>
            {c.description && (
              <p className="text-[11px] text-white/40 truncate">{c.description}</p>
            )}
            {c.member_count !== undefined && (
              <p className="text-[10px] text-white/30 mt-0.5">
                {c.member_count} member{c.member_count !== 1 ? "s" : ""}
                {c.post_count ? ` · ${c.post_count} posts` : ""}
              </p>
            )}
          </div>
          <ArrowUpRight style={{ width: 14, height: 14, color: "rgba(255,255,255,0.3)", flexShrink: 0 }} />
        </Link>
      ))}
    </div>
  );
}

function MyProfileCard({ data, action }: { data: MyProfileData; action?: { label: string; url: string } }) {
  const hasExperience = data.experience && data.experience.length > 0;

  const formatDate = (d: string | null | undefined) => {
    if (!d) return null;
    try {
      return new Date(d).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
    } catch { return d; }
  };

  // Experience-only view
  if (hasExperience) {
    return (
      <div className="space-y-3">
        <div className="rounded-2xl rounded-tl-sm bg-white/8 border border-white/10 p-4 space-y-3">
          <p className="text-[12px] font-semibold text-white/50 uppercase tracking-wide">Work History</p>
          {data.experience!.map((exp, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(249,115,22,0.12)" }}>
                <Briefcase style={{ width: 14, height: 14, color: "#F97316" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-white">{exp.role || "Role"}</p>
                <p className="text-[11px] text-white/60">{exp.company}</p>
                <p className="text-[10px] text-white/35 mt-0.5">
                  {formatDate(exp.start_date)}
                  {" – "}
                  {exp.is_current ? "Present" : formatDate(exp.end_date) || "—"}
                </p>
                {exp.description && (
                  <p className="text-[11px] text-white/45 mt-1 leading-snug line-clamp-2">{exp.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
        {action && (
          <Link to={action.url} className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-400 hover:text-orange-300 transition-colors">
            {action.label} <ArrowUpRight style={{ width: 12, height: 12 }} />
          </Link>
        )}
      </div>
    );
  }

  // Full profile view
  return (
    <div className="space-y-3">
      <div className="rounded-2xl rounded-tl-sm bg-white/8 border border-white/10 p-4 space-y-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(249,115,22,0.12)" }}>
            <Users style={{ width: 20, height: 20, color: "#F97316" }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[15px] font-bold text-white">{data.full_name || "Your Profile"}</span>
              {data.is_verified && (
                <span className="flex items-center gap-0.5 text-[10px] text-blue-400">
                  <ShieldCheck style={{ width: 10, height: 10 }} /> Verified
                </span>
              )}
            </div>
            {data.headline && <p className="text-[12px] text-white/60 mt-0.5 leading-snug">{data.headline}</p>}
            {(data.location_city || data.location_state) && (
              <p className="text-[11px] text-white/35 mt-0.5">
                {[data.location_city, data.location_state].filter(Boolean).join(", ")}
              </p>
            )}
          </div>
        </div>

        {/* Current workplace */}
        {data.currently_working_at && (
          <div className="flex items-center gap-2">
            <Briefcase style={{ width: 12, height: 12, color: "rgba(255,255,255,0.3)", flexShrink: 0 }} />
            <span className="text-[12px] text-white/60">{data.currently_working_at}</span>
          </div>
        )}

        {/* About/Bio */}
        {data.about && (
          <div>
            <p className="text-[11px] font-semibold text-white/40 uppercase tracking-wide mb-1">About</p>
            <p className="text-[13px] text-white/75 leading-relaxed line-clamp-4">{data.about}</p>
          </div>
        )}

        {/* Skills */}
        {data.skills && data.skills.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold text-white/40 uppercase tracking-wide mb-2">Skills</p>
            <div className="flex flex-wrap gap-1.5">
              {data.skills.slice(0, 8).map((s, i) => (
                <span key={i} className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: "rgba(249,115,22,0.12)", color: "#FB923C" }}>
                  {s}
                </span>
              ))}
              {data.skills.length > 8 && (
                <span className="text-[11px] text-white/35">+{data.skills.length - 8} more</span>
              )}
            </div>
          </div>
        )}
      </div>
      {action && (
        <Link to={action.url} className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-400 hover:text-orange-300 transition-colors">
          {action.label} <ArrowUpRight style={{ width: 12, height: 12 }} />
        </Link>
      )}
    </div>
  );
}

function FaqCard({ content, action }: { content: string; action?: { label: string; url: string } }) {
  const lines = content.split("\n");
  return (
    <div className="space-y-3">
      <div className="rounded-2xl rounded-tl-sm bg-white/8 border border-white/10 px-4 py-3">
        <div className="text-sm text-white/90 leading-relaxed whitespace-pre-wrap">
          {lines.map((line, i) => {
            if (!line.trim()) return <br key={i} />;
            // Bold text between **
            const parts = line.split(/\*\*([^*]+)\*\*/g);
            return (
              <p key={i} className="mb-0.5">
                {parts.map((part, j) =>
                  j % 2 === 1 ? <strong key={j} className="text-white font-semibold">{part}</strong> : part
                )}
              </p>
            );
          })}
        </div>
      </div>
      {action && (
        <Link
          to={action.url}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-400 hover:text-orange-300 transition-colors"
        >
          {action.label} <ArrowUpRight style={{ width: 12, height: 12 }} />
        </Link>
      )}
    </div>
  );
}

// ─── Source card (for AI replies) ─────────────────────────────────────────────

const SOURCE_TYPE_LABEL: Record<TiikmePilotSource["type"], string> = {
  organization: "Org", opportunity: "Job", post: "Post", circle: "Circle", profile: "Person",
};

function SourceCard({ source }: { source: TiikmePilotSource }) {
  const inner = (
    <div className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors p-3 flex flex-col gap-1 min-w-0">
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-orange-400/80 shrink-0">
          {SOURCE_TYPE_LABEL[source.type]}
        </span>
        {source.meta && <span className="text-[10px] text-white/40 truncate">{source.meta}</span>}
      </div>
      <p className="text-sm font-medium text-white truncate leading-snug">{source.title}</p>
      {source.subtitle && <p className="text-xs text-white/50 truncate">{source.subtitle}</p>}
    </div>
  );

  if (source.href) {
    const isExternal = /^https?:\/\//.test(source.href);
    if (isExternal) return <a href={source.href} target="_blank" rel="noopener noreferrer" className="block">{inner}</a>;
    return <Link to={source.href} className="block">{inner}</Link>;
  }
  return inner;
}

// ─── AssistantBubble ──────────────────────────────────────────────────────────

function AssistantBubble({
  msg,
  onRate,
}: {
  msg: ChatMessage;
  onRate: (messageId: string, rating: "up" | "down") => void;
}) {
  const [rated, setRated] = useState<"up" | "down" | null>(null);
  const pr = msg.pilotResponse;
  const reply = msg.reply;
  const sources = reply?.sourceCards ?? [];

  const handleRate = (r: "up" | "down") => {
    if (rated) return;
    setRated(r);
    onRate(msg.id, r);
  };

  // Thinking indicator
  if (msg.content === "…") {
    return (
      <div className="flex gap-3 items-start">
        <div className="shrink-0 mt-1 w-7 h-7 rounded-full bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center">
          <Bot size={14} className="text-white" />
        </div>
        <div className="rounded-2xl rounded-tl-sm bg-white/8 border border-white/10 px-4 py-3 flex items-center gap-3">
          <div className="flex gap-1">
            <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:0ms]" />
            <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:150ms]" />
            <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:300ms]" />
          </div>
          {msg.thinkingLabel && (
            <span className="text-[12px] text-white/30">{msg.thinkingLabel}</span>
          )}
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
        {/* Render based on response type */}
        {!pr && (
          <div className="rounded-2xl rounded-tl-sm bg-white/8 border border-white/10 px-4 py-3">
            <p className="text-sm text-white/90 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
          </div>
        )}

        {pr?.type === "faq" && pr.content && (
          <FaqCard content={pr.content} action={pr.action} />
        )}

        {pr?.type === "limit_reached" && pr.content && (
          <div className="space-y-2">
            <div className="rounded-2xl rounded-tl-sm px-4 py-3" style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)" }}>
              <p className="text-sm text-red-300 leading-relaxed whitespace-pre-wrap">{pr.content}</p>
            </div>
          </div>
        )}

        {pr?.type === "text" && pr.content && (
          <div className="space-y-2">
            <div className="rounded-2xl rounded-tl-sm bg-white/8 border border-white/10 px-4 py-3">
              <p className="text-sm text-white/90 leading-relaxed whitespace-pre-wrap">{pr.content}</p>
            </div>
            {pr.action && (
              <Link
                to={pr.action.url}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-400 hover:text-orange-300 transition-colors"
              >
                {pr.action.label} <ArrowUpRight style={{ width: 12, height: 12 }} />
              </Link>
            )}
          </div>
        )}

        {pr?.type === "profile_results" && (
          <div>
            {pr.content && (
              <p className="text-[12px] text-white/50 mb-2">{pr.content}</p>
            )}
            <ProfileResultsCard cards={pr.cards as ProfileCard[]} />
            {pr.action && (
              <Link
                to={pr.action.url}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-400 hover:text-orange-300 transition-colors mt-2"
              >
                {pr.action.label} <ArrowUpRight style={{ width: 12, height: 12 }} />
              </Link>
            )}
          </div>
        )}

        {pr?.type === "job_results" && (
          <div>
            {pr.content && (
              <p className="text-[12px] text-white/50 mb-2">{pr.content}</p>
            )}
            <JobResultsCard cards={pr.cards as JobCard[]} />
            {pr.action && (
              <Link
                to={pr.action.url}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-400 hover:text-orange-300 transition-colors mt-2"
              >
                {pr.action.label} <ArrowUpRight style={{ width: 12, height: 12 }} />
              </Link>
            )}
          </div>
        )}

        {pr?.type === "analytics_card" && pr.data && (
          <AnalyticsCard data={pr.data} />
        )}

        {pr?.type === "trending_card" && pr.hashtags && (
          <TrendingCard hashtags={pr.hashtags} />
        )}

        {pr?.type === "applications_list" && pr.applications && (
          <div>
            <p className="text-[12px] text-white/50 mb-2">Your recent applications:</p>
            <ApplicationsListCard applications={pr.applications} />
            <Link
              to="/app/opportunities?tab=applications"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-400 hover:text-orange-300 transition-colors mt-2"
            >
              View all applications <ArrowUpRight style={{ width: 12, height: 12 }} />
            </Link>
          </div>
        )}

        {pr?.type === "circle_results" && (
          <div>
            {pr.content && (
              <p className="text-[12px] text-white/50 mb-2">{pr.content}</p>
            )}
            <CircleResultsCard cards={pr.cards as CircleCard[]} />
            {pr.action && (
              <Link
                to={pr.action.url}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-400 hover:text-orange-300 transition-colors mt-2"
              >
                {pr.action.label} <ArrowUpRight style={{ width: 12, height: 12 }} />
              </Link>
            )}
          </div>
        )}

        {pr?.type === "my_profile_card" && pr.myProfile && (
          <MyProfileCard data={pr.myProfile} action={pr.action} />
        )}

        {/* AI reply source cards */}
        {sources.length > 0 && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {sources.slice(0, 6).map((s) => <SourceCard key={s.id} source={s} />)}
          </div>
        )}

        {/* Rating */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleRate("up")}
            disabled={!!rated}
            className={cn(
              "p-1.5 rounded-lg transition-colors",
              rated === "up" ? "text-green-400 bg-green-400/10" : "text-white/30 hover:text-white/60 hover:bg-white/5"
            )}
          >
            <ThumbsUp size={13} />
          </button>
          <button
            onClick={() => handleRate("down")}
            disabled={!!rated}
            className={cn(
              "p-1.5 rounded-lg transition-colors",
              rated === "down" ? "text-red-400 bg-red-400/10" : "text-white/30 hover:text-white/60 hover:bg-white/5"
            )}
          >
            <ThumbsDown size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function TiikmePilotPage() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<TiikmePilotThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [mode, setMode] = useState<TiikmePilotMode>("discover");
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
    setSidebarOpen(false);
    inputRef.current?.focus();
  };

  const handleArchive = async (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await archivePilotThread(threadId);
    setThreads((prev) => prev.filter((t) => t.id !== threadId));
    if (activeThreadId === threadId) { setActiveThreadId(null); setMessages([]); }
    toast.success("Conversation archived");
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

    // Classify intent
    const intent = classifyIntent(text);
    const thinkingLabel = THINKING_LABELS[intent.type] || "Thinking…";
    const tempId = `thinking-${Date.now()}`;

    // Show thinking bubble
    const thinkingMsg: ChatMessage = {
      id: tempId,
      role: "assistant",
      content: "…",
      created_at: new Date().toISOString(),
      thinkingLabel,
    };
    setMessages((prev) => [...prev, thinkingMsg]);

    const removeThinking = () =>
      setMessages((prev) => prev.filter((m) => m.id !== tempId));

    try {
      // ── FAQ / Privacy → zero-token, no rate limit ──
      if (intent.type === "PLATFORM_FAQ") {
        const faqResult = handlePlatformFaq(text);
        if (faqResult) { removeThinking(); addLocalReply(faqResult); return; }
      }

      if (intent.type === "PRIVACY_QUESTION" && userId) {
        const result = await handlePrivacyQuestion(userId);
        removeThinking(); addLocalReply(result); return;
      }

      // ── Search queries ──
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

      if (intent.type === "SEARCH_CIRCLE") {
        const result = await handleSearchCircle(intent.extractedEntities);
        removeThinking(); addLocalReply(result); return;
      }

      if (intent.type === "TRENDING") {
        const result = await handleTrending();
        removeThinking(); addLocalReply(result); return;
      }

      // ── Personal data (requires login) ──
      if (intent.type === "MY_PROFILE" && userId) {
        const result = await handleMyProfile(userId);
        removeThinking(); addLocalReply(result); return;
      }

      if (intent.type === "MY_EXPERIENCE" && userId) {
        const result = await handleMyExperience(userId);
        removeThinking(); addLocalReply(result); return;
      }

      if (intent.type === "MY_SKILLS" && userId) {
        const result = await handleMySkills(userId);
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

      // ── AI_QUERY → rate-limited, goes to Edge Function ──
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
          content: `You've used all ${AI_DAILY_LIMIT} AI questions for today. Resets at midnight.\n\nYou can still search for people, jobs, circles, and check your stats for free!`,
        });
        setSending(false);
        return;
      }

      // Increment before calling (prevent double-sends)
      await incrementQuota(userId, "AI_QUERY");
      setAiRemaining((prev) => Math.max(0, prev - 1));

      const reply = await askPilot({ message: text, mode, threadId: activeThreadId ?? undefined });

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
    <div className="flex h-[calc(100vh-64px)] overflow-hidden" style={{ background: "#0f0f1b" }}>
      {/* ── Sidebar ── */}
      <aside
        className={cn(
          "flex flex-col w-64 shrink-0 transition-transform duration-200",
          "fixed inset-y-0 top-16 z-30 md:static md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ background: "#13131e", borderRight: "1px solid rgba(255,255,255,0.07)" }}
      >
        {/* Sidebar brand header */}
        <div className="flex items-center justify-between px-4 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #FF5A1F, #FF8C42)" }}>
              <Bot size={16} className="text-white" />
            </div>
            <div>
              <p className="text-[13px] font-bold text-white leading-none">Tiikme Pilot</p>
              <p className="text-[10px] mt-0.5" style={{ color: "#FF5A1F" }}>AI-powered assistant</p>
            </div>
          </div>
          <button
            onClick={newConversation}
            title="New conversation"
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
            style={{ color: "#FF5A1F" }}
          >
            <Plus size={15} />
          </button>
        </div>

        {/* Thread list */}
        <div className="flex-1 overflow-y-auto py-2 space-y-0.5 px-2">
          {loadingThreads && (
            <div className="flex justify-center py-8">
              <Loader2 size={16} className="animate-spin" style={{ color: "#FF5A1F" }} />
            </div>
          )}
          {!loadingThreads && threads.length === 0 && (
            <div className="text-center py-8 px-4">
              <p className="text-xs text-white/30">No conversations yet.</p>
              <p className="text-[11px] text-white/20 mt-1">Start by asking anything below.</p>
            </div>
          )}
          {threads.map((t) => (
            <button
              key={t.id}
              onClick={() => openThread(t.id)}
              className={cn(
                "w-full text-left rounded-xl px-3 py-2.5 group flex items-start gap-2 transition-colors",
                activeThreadId === t.id
                  ? "text-white"
                  : "text-white/50 hover:text-white/80"
              )}
              style={activeThreadId === t.id
                ? { background: "rgba(255,90,31,0.12)", border: "1px solid rgba(255,90,31,0.2)" }
                : { border: "1px solid transparent" }
              }
            >
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium truncate leading-snug">{t.title}</p>
              </div>
              <button
                onClick={(e) => handleArchive(t.id, e)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded transition-all"
                style={{ color: "rgba(255,255,255,0.4)" }}
                title="Delete"
              >
                <Archive size={11} />
              </button>
            </button>
          ))}
        </div>

        {/* Sidebar footer */}
        <div className="px-4 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center justify-between text-[11px]">
            <span style={{ color: "rgba(255,255,255,0.3)" }}>{remainingChats} thread{remainingChats !== 1 ? "s" : ""} left</span>
            <span style={{ color: aiRemaining <= 1 ? "#FF5A1F" : "rgba(255,255,255,0.3)" }}>
              {aiRemaining} AI/{AI_DAILY_LIMIT} today
            </span>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/70 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Main chat area ── */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-5 py-3 shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-2 rounded-lg transition-colors hover:bg-white/8"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            <ChevronRight size={18} />
          </button>

          <div className="md:hidden flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #FF5A1F, #FF8C42)" }}>
              <Bot size={12} className="text-white" />
            </div>
            <span className="text-sm font-bold text-white">Tiikme Pilot</span>
          </div>

          {activeThreadId && (
            <button
              onClick={newConversation}
              className="hidden md:flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors hover:bg-white/8"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              <Plus size={13} /> New chat
            </button>
          )}

          <div className="ml-auto flex items-center gap-2">
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
              style={{
                background: aiRemaining > 0 ? "rgba(255,90,31,0.1)" : "rgba(239,68,68,0.1)",
                color: aiRemaining > 0 ? "#FF5A1F" : "#EF4444",
                border: `1px solid ${aiRemaining > 0 ? "rgba(255,90,31,0.2)" : "rgba(239,68,68,0.2)"}`,
              }}
            >
              <CheckCircle2 size={11} />
              {aiRemaining} AI left
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6">
          {!activeThreadId && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-6 py-10 px-4">
              {/* Brand icon */}
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl" style={{ background: "linear-gradient(135deg, #FF5A1F, #FF8C42)", boxShadow: "0 20px 60px rgba(255,90,31,0.35)" }}>
                <Bot size={36} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Tiikme Pilot</h1>
                <p className="text-sm mt-2 max-w-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
                  Ask about your profile, find people and jobs, explore communities, or ask anything about the platform.
                </p>
              </div>

              {/* Quick action chips */}
              <div className="grid grid-cols-2 gap-2 w-full max-w-lg">
                {QUICK_ACTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => { setInput(q); inputRef.current?.focus(); }}
                    className="text-left text-[12px] font-medium px-3.5 py-2.5 rounded-xl transition-all"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.09)",
                      color: "rgba(255,255,255,0.65)",
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,90,31,0.08)";
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,90,31,0.2)";
                      (e.currentTarget as HTMLButtonElement).style.color = "#FF8C42";
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)";
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.09)";
                      (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.65)";
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
              <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.2)" }}>
                People/job/community searches are free · {aiRemaining} open-ended AI question{aiRemaining !== 1 ? "s" : ""} left today
              </p>
            </div>
          )}

          {loadingMessages && (
            <div className="flex justify-center py-8">
              <Loader2 size={20} className="animate-spin" style={{ color: "#FF5A1F" }} />
            </div>
          )}

          {messages.map((msg) =>
            msg.role === "user" ? (
              <div key={msg.id} className="flex justify-end">
                <div
                  className="max-w-[78%] rounded-2xl rounded-tr-sm px-4 py-3"
                  style={{ background: "rgba(255,90,31,0.15)", border: "1px solid rgba(255,90,31,0.25)" }}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "rgba(255,255,255,0.92)" }}>{msg.content}</p>
                </div>
              </div>
            ) : (
              <AssistantBubble key={msg.id} msg={msg} onRate={handleRate} />
            )
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ── Input area ── */}
        <div className="shrink-0 px-4 md:px-8 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.07)", background: "#0f0f1b" }}>
          <div
            className="flex items-end gap-3 rounded-2xl px-4 py-3 transition-all"
            style={{ background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(255,255,255,0.1)" }}
            onFocus={() => {}}
            ref={(el) => {
              if (el) {
                el.addEventListener("focusin", () => {
                  el.style.borderColor = "rgba(255,90,31,0.5)";
                  el.style.boxShadow = "0 0 0 3px rgba(255,90,31,0.08)";
                });
                el.addEventListener("focusout", () => {
                  el.style.borderColor = "rgba(255,255,255,0.1)";
                  el.style.boxShadow = "none";
                });
              }
            }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything — my profile, find people, jobs, communities…"
              rows={2}
              maxLength={CHAR_LIMIT}
              disabled={sending || remainingChats === 0}
              className="flex-1 resize-none bg-transparent text-[14px] outline-none leading-relaxed max-h-36 overflow-y-auto disabled:opacity-50"
              style={{ color: "rgba(255,255,255,0.9)", caretColor: "#FF5A1F" }}
            />
            <button
              onClick={sendMessage}
              disabled={!canSend}
              className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all mb-0.5"
              style={canSend
                ? { background: "#FF5A1F", color: "#fff", boxShadow: "0 4px 16px rgba(255,90,31,0.4)" }
                : { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.25)", cursor: "not-allowed" }
              }
            >
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
          <div className="flex items-center justify-between mt-1.5 px-1">
            <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.2)" }}>
              Press Enter to send · Shift+Enter for new line
            </p>
            <p
              className="text-[10px]"
              style={{ color: CHAR_LIMIT - input.length < 20 ? "#EF4444" : CHAR_LIMIT - input.length < 100 ? "#FF5A1F" : "rgba(255,255,255,0.2)" }}
            >
              {CHAR_LIMIT - input.length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

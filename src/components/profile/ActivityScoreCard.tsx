import { useState } from "react";
import { HelpCircle, Info } from "lucide-react";
import ActivityScoreRing from "@/components/ActivityScoreRing";
import { getTier, getNextTier } from "@/lib/activityTiers";

interface ActivityScoreCardProps {
  score: number;
  isOwn?: boolean;
  /** Optional breakdown — if not passed, shows the generic component list */
  breakdown?: {
    content?: number;
    engagement?: number;
    connections?: number;
    completeness?: number;
    bonuses?: number;
    penalties?: number;
  };
  /** Optional next-tier hint inputs for own profile */
  nextHints?: {
    postsNeeded?: number;
    connectionsNeeded?: number;
  };
}

export default function ActivityScoreCard({ score, isOwn, breakdown, nextHints }: ActivityScoreCardProps) {
  const [showHelp, setShowHelp] = useState(false);
  const safeScore = Math.max(0, Math.min(100, score || 0));
  const tier = getTier(safeScore);
  const next = getNextTier(safeScore);

  // Progress within the current tier band
  const bandStart = tier.min;
  const bandEnd = next ? next.min : 100;
  const bandPct = Math.max(0, Math.min(100, ((safeScore - bandStart) / Math.max(1, bandEnd - bandStart)) * 100));

  return (
    <div
      className="rounded-2xl flex flex-col items-center text-center"
      style={{
        width: 180,
        padding: 14,
        background: "rgba(255,255,255,0.40)",
        border: `1.5px solid ${tier.color}33`,
        boxShadow: `0 4px 16px ${tier.color}1A`,
      }}
    >
      <div className="flex items-center gap-1 mb-1.5">
        <span style={{ fontSize: 11, fontWeight: 700, color: "#6B7094", letterSpacing: 0.4, textTransform: "uppercase" }}>
          Activity Score
        </span>
        <button
          type="button"
          onClick={() => setShowHelp(v => !v)}
          aria-label="How is this calculated?"
          className="cursor-pointer hover:opacity-70"
          style={{ background: "none", border: "none", padding: 0, lineHeight: 0 }}
        >
          <HelpCircle style={{ width: 12, height: 12, color: "#9CA3C0" }} />
        </button>
      </div>

      {/* Ring (reuse existing component but compact — hide its built-in label by wrapping) */}
      <div style={{ marginBottom: 6 }}>
        <RingOnly score={safeScore} size={88} color={tier.color} />
      </div>

      <div className="flex items-center gap-1" style={{ fontSize: 13, fontWeight: 800, color: tier.color }}>
        <span>{tier.label}</span>
        <span aria-hidden style={{ fontSize: 14 }}>{tier.emoji}</span>
      </div>
      <div style={{ fontSize: 11, color: "#6B7094", marginTop: 2 }}>{safeScore}/100</div>

      {/* Progress to next tier */}
      <div className="w-full mt-2.5">
        <div style={{ width: "100%", height: 6, borderRadius: 999, background: "rgba(0,0,0,0.06)", overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              width: `${bandPct}%`,
              borderRadius: 999,
              background: next
                ? `linear-gradient(90deg, ${tier.color}, ${next.color})`
                : tier.color,
              transition: "width 700ms ease-out",
            }}
          />
        </div>
        <div style={{ fontSize: 10, color: "#9CA3C0", marginTop: 4 }}>
          {next ? `${bandEnd - safeScore} pts to ${next.label}` : "Top tier reached"}
        </div>
      </div>

      {/* Own-profile next-tier hint */}
      {isOwn && next && (
        <div
          className="w-full mt-2.5 text-left"
          style={{ fontSize: 11, color: "#1A1A2E", lineHeight: "15px", padding: 8, borderRadius: 8, background: tier.bg }}
        >
          {nextTierActionable(nextHints, next.label) || tier.hint}
        </div>
      )}

      {/* Help / breakdown panel */}
      {showHelp && (
        <div
          className="w-full mt-2.5 text-left"
          style={{ fontSize: 11, color: "#1A1A2E", padding: 10, borderRadius: 10, background: "rgba(0,0,0,0.04)" }}
        >
          <div className="flex items-center gap-1 mb-1.5" style={{ fontWeight: 700 }}>
            <Info style={{ width: 11, height: 11 }} />
            <span>How it's calculated</span>
          </div>
          <ul style={{ margin: 0, paddingLeft: 14, lineHeight: "16px" }}>
            <li>Content (posts, comments){breakdown?.content != null ? `: ${breakdown.content} pts` : ""}</li>
            <li>Engagement (likes, replies){breakdown?.engagement != null ? `: ${breakdown.engagement} pts` : ""}</li>
            <li>Connections (strands){breakdown?.connections != null ? `: ${breakdown.connections} pts` : ""}</li>
            <li>Profile completeness{breakdown?.completeness != null ? `: ${breakdown.completeness} pts` : ""}</li>
            <li>Bonuses (verified, days active){breakdown?.bonuses != null ? `: +${breakdown.bonuses}` : ""}</li>
            {breakdown?.penalties != null && breakdown.penalties > 0 && (
              <li style={{ color: "#EF4444" }}>Penalties (reports, spam): −{breakdown.penalties}</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

/** Compact version of ActivityScoreRing without the side-label, used inside the card. */
function RingOnly({ score, size, color }: { score: number; size: number; color: string }) {
  const strokeWidth = 7;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (Math.min(score, 100) / 100) * circumference;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span style={{ fontSize: 22, fontWeight: 800, color: "#1A1A2E" }}>{score}</span>
      </div>
    </div>
  );
}

function nextTierActionable(
  hints: ActivityScoreCardProps["nextHints"],
  nextLabel: string,
): string | null {
  if (!hints) return null;
  const parts: string[] = [];
  if (hints.postsNeeded && hints.postsNeeded > 0) parts.push(`Post ${hints.postsNeeded} more time${hints.postsNeeded > 1 ? "s" : ""}`);
  if (hints.connectionsNeeded && hints.connectionsNeeded > 0) parts.push(`get ${hints.connectionsNeeded} new connection${hints.connectionsNeeded > 1 ? "s" : ""}`);
  if (parts.length === 0) return null;
  return `${parts.join(" and ")} to reach ${nextLabel} tier.`;
}

/** Compact public-facing ring + tier emoji for use in cards. */
export function ActivityScoreMini({ score, hideIfLow = true, viewerIsOwner = false }: { score: number; hideIfLow?: boolean; viewerIsOwner?: boolean }) {
  const safe = Math.max(0, Math.min(100, score || 0));
  const tier = getTier(safe);
  const isLow = safe < 10;
  if (isLow && hideIfLow && !viewerIsOwner) {
    return (
      <span
        title="New here"
        aria-label="New here"
        className="inline-flex items-center gap-1"
        style={{ fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 999, background: "rgba(156,163,192,0.18)", color: "#6B7094" }}
      >
        New
      </span>
    );
  }
  const size = 26;
  const sw = 3;
  const r = (size - sw) / 2;
  const c = 2 * Math.PI * r;
  const p = (safe / 100) * c;
  return (
    <span
      title={`${tier.label} · ${safe}/100`}
      aria-label={`Activity Score ${safe} out of 100, tier ${tier.label}`}
      className="inline-flex items-center gap-1 shrink-0"
    >
      <span className="relative inline-block" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90 block">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth={sw} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={tier.color} strokeWidth={sw}
            strokeDasharray={c} strokeDashoffset={c - p} strokeLinecap="round" />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center" style={{ fontSize: 9, fontWeight: 800, color: "#1A1A2E" }}>
          {safe}
        </span>
      </span>
      <span aria-hidden style={{ fontSize: 11 }}>{tier.emoji}</span>
    </span>
  );
}

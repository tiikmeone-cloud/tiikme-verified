/**
 * Activity Score 5-tier system.
 * Emoji set is the sanctioned exception in Core memory: 🌱🔨⭐🚀🏅
 */

export interface ActivityTierDef {
  min: number;
  max: number;
  label: string;
  color: string;
  bg: string;
  emoji: string;
  hint: string;
}

export const ACTIVITY_TIERS: ActivityTierDef[] = [
  { min: 0,  max: 20,  label: "Newcomer",    color: "#94A3B8", bg: "rgba(148,163,184,0.15)", emoji: "🌱", hint: "Complete your profile and start engaging." },
  { min: 21, max: 40,  label: "Explorer",    color: "#3B82F6", bg: "rgba(59,130,246,0.14)",  emoji: "🔨", hint: "You're getting discovered. Post more to grow." },
  { min: 41, max: 60,  label: "Active",      color: "#10B981", bg: "rgba(16,185,129,0.14)",  emoji: "⭐", hint: "Consistent contributor. Keep going." },
  { min: 61, max: 80,  label: "Contributor", color: "#FF5A1F", bg: "rgba(249,115,22,0.14)",  emoji: "🚀", hint: "Top 20%. Help others break into your field." },
  { min: 81, max: 100, label: "Leader",      color: "#EC4899", bg: "rgba(236,72,153,0.14)",  emoji: "🏅", hint: "Top 5%. Your voice shapes the community." },
];

export function getTier(score: number): ActivityTierDef {
  const s = Math.max(0, Math.min(100, score || 0));
  return ACTIVITY_TIERS.find(t => s >= t.min && s <= t.max) || ACTIVITY_TIERS[0];
}

/** Next tier after the current one, or null if Leader. */
export function getNextTier(score: number): ActivityTierDef | null {
  const cur = getTier(score);
  const idx = ACTIVITY_TIERS.findIndex(t => t.label === cur.label);
  return idx < ACTIVITY_TIERS.length - 1 ? ACTIVITY_TIERS[idx + 1] : null;
}

/** Public visibility gate to prevent gaming early on. */
export function shouldShowPublicScore(
  profile: { id: string; activity_score?: number | null },
  viewer?: { id?: string } | null
): boolean {
  if (viewer?.id && profile.id === viewer.id) return true;
  return (profile.activity_score ?? 0) >= 10;
}

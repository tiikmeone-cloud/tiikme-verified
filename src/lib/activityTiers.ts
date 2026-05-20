// src/lib/activityTiers.ts
// Single source of truth for activity score tiers - used everywhere

export interface Tier {
  min: number;
  max: number;
  name: string;
  label?: string;
  color: string;
  bg?: string;
  bgColor: string;
  emoji?: string;
  hint?: string;
  nextName?: string;
  pointsToNext?: (score: number) => number;
}

export const TIERS: Tier[] = [
  { min: 0,   max: 10,  name: "Newcomer",  label: "Newcomer",  color: "#6B7094", bgColor: "#F0F0F5", bg: "#F0F0F5", emoji: "🌱", hint: "Complete your profile and start engaging." },
  { min: 11,  max: 50,  name: "Explorer",  label: "Explorer",  color: "#E8733A", bgColor: "#FFF3EC", bg: "#FFF3EC", emoji: "🔨", hint: "You're getting discovered. Post more to grow." },
  { min: 51,  max: 200, name: "Builder",   label: "Builder",   color: "#3B82F6", bgColor: "#EFF6FF", bg: "#EFF6FF", emoji: "⭐", hint: "Consistent contributor. Keep going." },
  { min: 201, max: 500, name: "Achiever",  label: "Achiever",  color: "#8B5CF6", bgColor: "#F5F3FF", bg: "#F5F3FF", emoji: "🚀", hint: "Top performers create visible momentum." },
  { min: 501, max: 1000, name: "Connector", label: "Connector", color: "#059669", bgColor: "#ECFDF5", bg: "#ECFDF5", emoji: "🤝", hint: "Strong network effects are kicking in." },
  { min: 1001, max: Infinity, name: "TiikElite", label: "TiikElite", color: "#F59E0B", bgColor: "#FFFBEB", bg: "#FFFBEB", emoji: "🏅", hint: "Top tier reached." },
];

export function getTier(score: number): Tier {
  return TIERS.find(t => score >= t.min && score <= t.max) ?? TIERS[0];
}

export function getNextTier(score: number): Tier | null {
  const current = getTier(score);
  const idx = TIERS.indexOf(current);
  return idx >= 0 && idx < TIERS.length - 1 ? TIERS[idx + 1] : null;
}

export function getPointsToNextTier(score: number): number {
  const current = getTier(score);
  const idx = TIERS.indexOf(current);
  if (idx >= TIERS.length - 1) return 0;
  return TIERS[idx + 1].min - score;
}

export function getTierProgress(score: number): number {
  const tier = getTier(score);
  if (tier.max === Infinity) return 100;
  const range = tier.max - tier.min;
  const progress = score - tier.min;
  return Math.min(100, Math.round((progress / range) * 100));
}

export function shouldShowPublicScore(
  profile: { id: string; activity_score?: number | null },
  viewer?: { id?: string } | null
): boolean {
  if (viewer?.id && profile.id === viewer.id) return true;
  return (profile.activity_score ?? 0) >= 10;
}

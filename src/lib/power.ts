import { supabase } from "@/integrations/supabase/client";

export async function awardPower(
  userId: string,
  amount: number,
  reason: string,
  refId?: string,
  refType?: string
) {
  // Use the secure server-side RPC function instead of direct inserts
  const { data, error } = await supabase.rpc("award_power", {
    p_user_id: userId,
    p_amount: amount,
    p_reason: reason,
    p_reference_id: refId || null,
    p_reference_type: refType || null,
  });

  if (error) throw error;

  return {
    currentPower: (data as any)?.current_power || 0,
    totalEarned: (data as any)?.total_earned || 0,
  };
}

export const MILESTONES = {
  100: { level: "Verified Pro", emoji: "⚡", message: "You're now a Verified Pro!" },
  250: { level: "Top Voice", emoji: "🎙️", message: "You reached Top Voice!" },
  500: { level: "Pioneer", emoji: "🥇", message: "You're a Tiikme Pioneer!" },
  1000: { level: "Diamond", emoji: "💎", message: "You hit Diamond status!" },
} as const;

export function checkMilestone(previousTotal: number, newTotal: number) {
  for (const [threshold, milestone] of Object.entries(MILESTONES)) {
    const t = parseInt(threshold);
    if (newTotal >= t && previousTotal < t) {
      return milestone;
    }
  }
  return null;
}

export const LEVEL_CONFIG: Record<string, { color: string; label: string; emoji: string }> = {
  builder: { color: "#6B7280", label: "Builder", emoji: "🔧" },
  verified_pro: { color: "var(--brand)", label: "Verified Pro", emoji: "⚡" },
  top_voice: { color: "#7C3AED", label: "Top Voice", emoji: "🎙️" },
  pioneer: { color: "#F59E0B", label: "Pioneer", emoji: "🥇" },
  diamond: { color: "#06B6D4", label: "Diamond", emoji: "💎" },
};

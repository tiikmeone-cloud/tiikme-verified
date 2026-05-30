import { supabase } from '@/integrations/supabase/client';
import type { IntentType } from './types';

// Daily limits per intent type
const DAILY_LIMITS: Partial<Record<IntentType, number>> = {
  AI_QUERY: 3,
  SEARCH_PROFILE: 50,
  SEARCH_JOB: 50,
  SEARCH_ORG: 50,
  MY_ANALYTICS: 20,
  MY_APPLICATIONS: 20,
  TRENDING: 20,
  PLATFORM_FAQ: 9999,
  PRIVACY_QUESTION: 9999,
};

// Which column in pilot_usage tracks each intent
type QuotaColumn = 'ai_count' | 'search_count' | 'analytics_count';

function getQuotaColumn(intentType: IntentType): QuotaColumn {
  switch (intentType) {
    case 'AI_QUERY':
      return 'ai_count';
    case 'MY_ANALYTICS':
    case 'MY_APPLICATIONS':
    case 'TRENDING':
      return 'analytics_count';
    case 'SEARCH_PROFILE':
    case 'SEARCH_JOB':
    case 'SEARCH_ORG':
      return 'search_count';
    case 'PLATFORM_FAQ':
    case 'PRIVACY_QUESTION':
    default:
      return 'search_count';
  }
}

function todayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

interface PilotUsageRow {
  user_id: string;
  date: string;
  ai_count: number;
  search_count: number;
  analytics_count: number;
}

export async function checkQuota(
  userId: string,
  intentType: IntentType
): Promise<{ allowed: boolean; aiRemaining: number }> {
  // Unlimited intent types — skip DB check
  const limit = DAILY_LIMITS[intentType] ?? 9999;
  if (limit >= 9999) {
    return { allowed: true, aiRemaining: DAILY_LIMITS['AI_QUERY'] ?? 3 };
  }

  const today = todayDateString();
  const column = getQuotaColumn(intentType);

  // Fetch today's row, create if missing
  const { data: existing } = await (supabase as any)
    .from('pilot_usage')
    .select('ai_count, search_count, analytics_count')
    .eq('user_id', userId)
    .eq('date', today)
    .maybeSingle();

  const row: Omit<PilotUsageRow, 'user_id' | 'date'> = existing ?? {
    ai_count: 0,
    search_count: 0,
    analytics_count: 0,
  };

  const currentCount: number = (row as any)[column] ?? 0;
  const aiRemaining = Math.max(0, (DAILY_LIMITS['AI_QUERY'] ?? 3) - (row.ai_count ?? 0));
  const allowed = currentCount < limit;

  return { allowed, aiRemaining };
}

export async function incrementQuota(
  userId: string,
  intentType: IntentType
): Promise<void> {
  // Unlimited — don't bother writing
  const limit = DAILY_LIMITS[intentType] ?? 9999;
  if (limit >= 9999) return;

  const today = todayDateString();
  const column = getQuotaColumn(intentType);

  // Try to get existing row first
  const { data: existing } = await (supabase as any)
    .from('pilot_usage')
    .select('ai_count, search_count, analytics_count')
    .eq('user_id', userId)
    .eq('date', today)
    .maybeSingle();

  if (existing) {
    const newCount = ((existing as any)[column] ?? 0) + 1;
    await (supabase as any)
      .from('pilot_usage')
      .update({ [column]: newCount })
      .eq('user_id', userId)
      .eq('date', today);
  } else {
    // Insert new row
    await (supabase as any)
      .from('pilot_usage')
      .insert({
        user_id: userId,
        date: today,
        ai_count: column === 'ai_count' ? 1 : 0,
        search_count: column === 'search_count' ? 1 : 0,
        analytics_count: column === 'analytics_count' ? 1 : 0,
      });
  }
}

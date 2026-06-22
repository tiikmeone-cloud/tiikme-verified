/**
 * User preferences — privacy + notification toggles persisted in user_preferences.
 * Previously Settings was all-stub; this wires it to real DB rows.
 */

import { createClient } from '@/lib/supabase/client'

export interface UserPreferences {
  public_flex: boolean
  recruiter_search: boolean
  show_location: boolean
  allow_flex_download: boolean
  show_squad_attestations: boolean
  show_vouches: boolean
  notify_application_stage: boolean
  notify_vouches_received: boolean
  notify_squad_requests: boolean
  notify_job_matches: boolean
  notify_org_posts: boolean
  notify_weekly_report: boolean
  // Job match preferences (formerly the JobPrefTab in Settings)
  salary_min_lpa: number | null
  salary_max_lpa: number | null
  notice_period: 'immediate' | '15_days' | '30_days' | '60_days' | '90_days' | null
  willing_to_relocate: boolean
  preferred_languages: string[]
  preferred_job_types: string[]
  preferred_work_modes: string[]
}

export const DEFAULT_PREFS: UserPreferences = {
  public_flex: true,
  recruiter_search: true,
  show_location: true,
  allow_flex_download: true,
  show_squad_attestations: true,
  show_vouches: true,
  notify_application_stage: true,
  notify_vouches_received: true,
  notify_squad_requests: true,
  notify_job_matches: true,
  notify_org_posts: false,
  notify_weekly_report: true,
  salary_min_lpa: null,
  salary_max_lpa: null,
  notice_period: null,
  willing_to_relocate: true,
  preferred_languages: [],
  preferred_job_types: [],
  preferred_work_modes: [],
}

import { getDemoUserId } from '@/lib/applications'

async function uid(): Promise<string | null> {
  return getDemoUserId()
}

export async function loadPreferences(): Promise<UserPreferences> {
  const userId = await uid()
  if (!userId) return DEFAULT_PREFS
  const supabase = createClient()
  const { data } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  if (!data) return DEFAULT_PREFS
  return { ...DEFAULT_PREFS, ...data } as UserPreferences
}

export async function setPreference<K extends keyof UserPreferences>(key: K, value: UserPreferences[K]): Promise<boolean> {
  const userId = await uid()
  if (!userId) return false
  const supabase = createClient()
  const { error } = await supabase
    .from('user_preferences')
    .upsert({ user_id: userId, [key]: value, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
  return !error
}

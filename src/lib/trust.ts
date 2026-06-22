/**
 * Trust Score — computed server-side from real verification signals
 * (profile completeness, experience/education, confirmed squads,
 *  accepted vouches, verified certs) via the get_trust_score RPC.
 */
import { createClient } from '@/lib/supabase/client'
import { getDemoUserId } from '@/lib/applications'
import { logRpc } from '@/lib/rpcError'

export interface TrustComponent {
  key: string
  label: string
  points: number
  max: number
  done: boolean
  hint: string
}

export interface TrustScore {
  score: number
  components: TrustComponent[]
}

const EMPTY: TrustScore = { score: 0, components: [] }

/** Percentile band label derived from the score. */
export function trustBand(score: number): string {
  if (score >= 80) return 'Top 5%'
  if (score >= 70) return 'Top 12%'
  if (score >= 60) return 'Top 22%'
  if (score >= 45) return 'Top 38%'
  if (score >= 25) return 'Building'
  return 'Getting started'
}

export async function getTrustScore(userId?: string): Promise<TrustScore> {
  const supabase = createClient()
  const user = userId ?? (await getDemoUserId())
  if (!user) return EMPTY
  const { data, error } = await supabase.rpc('get_trust_score', { p_user: user })
  if (error || !data) { logRpc('getTrustScore', error); return EMPTY }
  return data as TrustScore
}

/** Real "at a glance" counts for the Rundown — no vanity metrics. */
export interface ProfileSignals {
  squads_confirmed: number
  vouches_given: number
  applications_active: number
  flex_views: number
}

const EMPTY_SIGNALS: ProfileSignals = {
  squads_confirmed: 0, vouches_given: 0, applications_active: 0, flex_views: 0,
}

export async function getProfileSignals(userId?: string): Promise<ProfileSignals> {
  const supabase = createClient()
  const user = userId ?? (await getDemoUserId())
  if (!user) return EMPTY_SIGNALS
  const { data, error } = await supabase.rpc('get_profile_signals', { p_user: user })
  if (error || !data) { logRpc('getProfileSignals', error); return EMPTY_SIGNALS }
  return data as ProfileSignals
}

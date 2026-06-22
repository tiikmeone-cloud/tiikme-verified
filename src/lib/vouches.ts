/**
 * Vouch system — typed wrappers around the Wave 3 RPCs.
 *
 * Insider-only rule:
 *   You can only vouch at orgs where you currently work.
 *   The SQL raises an exception if you try to vouch elsewhere — frontend
 *   uses `listMyOrgs()` to hide the Vouch button on jobs that aren't yours.
 */

import { createClient } from '@/lib/supabase/client'
import { getDemoUserId } from '@/lib/applications'
import { logRpc } from '@/lib/rpcError'

export type VouchStatus = 'pending' | 'accepted' | 'declined' | 'expired'
export type VouchOutcome = 'interview' | 'hired' | 'passed' | 'spam' | null

export interface VouchGiven {
  vouch_id: string
  status: VouchStatus
  outcome: VouchOutcome
  why_brief: string
  created_at: string
  responded_at: string | null
  referee_id: string
  referee_name: string | null
  referee_username: string
  referee_avatar: string | null
  job_id: string
  job_title: string
  org_id: string
  org_slug: string
  org_name: string
}

export interface VouchReceived {
  vouch_id: string
  status: VouchStatus
  outcome: VouchOutcome
  why_brief: string
  created_at: string
  voucher_id: string
  voucher_name: string | null
  voucher_username: string
  voucher_headline: string | null
  voucher_avatar: string | null
  voucher_trust_delta: number
  job_id: string
  job_title: string
  org_id: string
  org_slug: string
  org_name: string
}

export interface MyOrg {
  org_id: string
  org_slug: string
  org_name: string
  role: string | null
}

export interface VouchQuality {
  total_vouches: number
  accepted_vouches: number
  interview_or_hired: number
  quality_pct: number
  trust_delta: number
}

export async function listMyOrgs(): Promise<MyOrg[]> {
  const supabase = createClient()
  const user = await getDemoUserId()
  if (!user) return []
  const { data, error } = await supabase.rpc('list_my_orgs', { p_user: user })
  if (error) { logRpc('listMyOrgs', error); return [] }
  return (data as MyOrg[]) ?? []
}

export async function listVouchesGiven(userId?: string): Promise<VouchGiven[]> {
  const supabase = createClient()
  const user = userId ?? await getDemoUserId()
  if (!user) return []
  const { data, error } = await supabase.rpc('list_vouches_given', { p_user: user })
  if (error) { logRpc('listVouchesGiven', error); return [] }
  return (data as VouchGiven[]) ?? []
}

export async function listVouchesReceived(userId?: string): Promise<VouchReceived[]> {
  const supabase = createClient()
  const user = userId ?? await getDemoUserId()
  if (!user) return []
  const { data, error } = await supabase.rpc('list_vouches_received', { p_user: user })
  if (error) { logRpc('listVouchesReceived', error); return [] }
  return (data as VouchReceived[]) ?? []
}

export async function createVouch(args: {
  refereeId: string
  jobId: string
  whyBrief: string
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const supabase = createClient()
  const user = await getDemoUserId()
  if (!user) return { ok: false, error: 'Not signed in' }
  const { data, error } = await supabase.rpc('create_vouch', {
    p_voucher: user, p_referee: args.refereeId, p_job: args.jobId, p_why: args.whyBrief,
  })
  if (error) return { ok: false, error: error.message }
  return { ok: true, id: data as string }
}

export async function acceptVouch(vouchId: string): Promise<string | null> {
  const supabase = createClient()
  const user = await getDemoUserId()
  if (!user) return null
  const { data, error } = await supabase.rpc('accept_vouch', { p_vouch: vouchId, p_referee: user })
  if (error) { logRpc('acceptVouch', error); return null }
  return data as string
}

export async function declineVouch(vouchId: string): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase.rpc('decline_vouch', { p_vouch: vouchId })
  if (error) { logRpc('declineVouch', error); return false }
  return true
}

export async function getVouchQuality(userId?: string): Promise<VouchQuality | null> {
  const supabase = createClient()
  const uid = userId ?? await getDemoUserId()
  if (!uid) return null
  const { data, error } = await supabase.rpc('get_vouch_quality_score', { p_user: uid })
  if (error) { logRpc('getVouchQuality', error); return null }
  const row = Array.isArray(data) ? data[0] : data
  return (row as VouchQuality) ?? null
}

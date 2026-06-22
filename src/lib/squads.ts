/**
 * Squad system — typed wrappers around the Wave 2 RPCs.
 */

import { createClient } from '@/lib/supabase/client'
import { getDemoUserId } from '@/lib/applications'
import { logRpc } from '@/lib/rpcError'

export type SquadStatus = 'pending' | 'active' | 'revoked' | 'expired'

export interface MySquad {
  squad_id: string
  status: SquadStatus
  is_initiator: boolean
  is_incoming: boolean
  other_id: string
  other_name: string | null
  other_username: string
  other_headline: string | null
  other_avatar: string | null
  context_org: string | null
  context_org_slug: string | null
  context_org_name: string | null
  context_proj: string | null
  created_at: string
  confirmed_at: string | null
}

export interface OrgSquadDensity {
  total_members: number
  members_with_squad: number
  density_pct: number
  active_edges: number
}

const STUB_SQUADS: MySquad[] = [
  {
    squad_id: 'stub-sq1', status: 'active', is_initiator: true, is_incoming: false,
    other_id: 'demo-p1', other_name: 'Aarav Sharma', other_username: 'aarav-sharma',
    other_headline: 'Full-Stack Engineer · ByteCloud', other_avatar: null,
    context_org: null, context_org_slug: 'bytecloud', context_org_name: 'ByteCloud',
    context_proj: null, created_at: '2024-03-15T10:00:00Z', confirmed_at: '2024-03-16T09:00:00Z',
  },
  {
    squad_id: 'stub-sq2', status: 'active', is_initiator: false, is_incoming: false,
    other_id: 'demo-p7', other_name: 'Arjun Patel', other_username: 'arjun-patel',
    other_headline: 'Senior Product Manager · LearnLoop', other_avatar: null,
    context_org: null, context_org_slug: 'learnloop', context_org_name: 'LearnLoop',
    context_proj: null, created_at: '2024-08-20T14:00:00Z', confirmed_at: '2024-08-21T11:00:00Z',
  },
  {
    squad_id: 'stub-sq3', status: 'pending', is_initiator: false, is_incoming: true,
    other_id: 'demo-p2', other_name: 'Priya Nair', other_username: 'priya-nair',
    other_headline: 'Product Designer · FreshRoute', other_avatar: null,
    context_org: null, context_org_slug: 'freshroute', context_org_name: 'FreshRoute',
    context_proj: null, created_at: '2026-06-20T08:00:00Z', confirmed_at: null,
  },
]

export async function listMySquads(): Promise<MySquad[]> {
  const supabase = createClient()
  const user = await getDemoUserId()
  if (!user) return []
  const isDemoUser = user === (await (async () => {
    const { data } = await supabase.from('profiles').select('id').eq('username', 'naadhn').maybeSingle()
    return data?.id ?? null
  })())
  const { data, error } = await supabase.rpc('list_my_squads', { p_user: user })
  if (error) return isDemoUser ? STUB_SQUADS : []
  const live = (data as MySquad[]) ?? []
  if (!isDemoUser) return live
  const hasActive = live.some(s => s.status === 'active')
  if (!hasActive) return [...STUB_SQUADS.filter(s => s.status === 'active'), ...live]
  return live
}

export async function requestSquad(args: {
  toUserId: string
  contextOrgId?: string
  contextProj?: string
}): Promise<string | null> {
  const supabase = createClient()
  const user = await getDemoUserId()
  if (!user) return null
  const { data, error } = await supabase.rpc('request_squad', {
    p_from: user,
    p_to: args.toUserId,
    p_context_org: args.contextOrgId ?? null,
    p_context_proj: args.contextProj ?? null,
  })
  if (error) { logRpc('requestSquad', error); return null }
  return data as string
}

export async function confirmSquad(squadId: string): Promise<boolean> {
  const supabase = createClient()
  const user = await getDemoUserId()
  if (!user) return false
  const { error } = await supabase.rpc('confirm_squad', {
    p_squad: squadId, p_confirmer: user,
  })
  if (error) { logRpc('confirmSquad', error); return false }
  return true
}

export async function revokeSquad(squadId: string): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase.rpc('revoke_squad', { p_squad: squadId })
  if (error) { logRpc('revokeSquad', error); return false }
  return true
}

export async function getOrgSquadDensity(orgId: string): Promise<OrgSquadDensity | null> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('get_org_squad_density', { p_org: orgId })
  if (error) { logRpc('getOrgSquadDensity', error); return null }
  const row = Array.isArray(data) ? data[0] : data
  return (row as OrgSquadDensity) ?? null
}

/* ── Auto-discovery — people you've actually worked with ── */

export interface SquadSuggestion {
  user_id: string
  username: string
  full_name: string | null
  headline: string | null
  avatar_url: string | null
  shared_org_id: string | null   // null for flex_experience-matched suggestions (no org record)
  shared_org_slug: string
  shared_org_name: string
  shared_role: string | null
  overlap_months: number
}

const STUB_SUGGESTIONS: SquadSuggestion[] = [
  { user_id: 'demo-p3', username: 'rohan-gupta', full_name: 'Rohan Gupta', headline: 'Data Scientist · MediSense', avatar_url: null, shared_org_id: 'org-medisense', shared_org_slug: 'medisense', shared_org_name: 'MediSense', shared_role: 'Data Scientist', overlap_months: 18 },
  { user_id: 'demo-p5', username: 'karthik-reddy', full_name: 'Karthik Reddy', headline: 'DevOps Architect · ByteCloud', avatar_url: null, shared_org_id: 'org-bytecloud', shared_org_slug: 'bytecloud', shared_org_name: 'ByteCloud', shared_role: 'DevOps Architect', overlap_months: 24 },
  { user_id: 'demo-p4', username: 'sneha-kapoor', full_name: 'Sneha Kapoor', headline: 'Content & Marketing Lead · FreshRoute', avatar_url: null, shared_org_id: 'org-freshroute', shared_org_slug: 'freshroute', shared_org_name: 'FreshRoute', shared_role: 'Marketing Lead', overlap_months: 12 },
]

export async function suggestSquadMates(): Promise<SquadSuggestion[]> {
  const supabase = createClient()
  const user = await getDemoUserId()
  if (!user) return []
  const { data: profileRow } = await supabase.from('profiles').select('id').eq('username', 'naadhn').maybeSingle()
  const isDemoUser = user === profileRow?.id
  const { data, error } = await supabase.rpc('suggest_squad_mates', { p_user: user, p_limit: 30 })
  if (error) { logRpc('suggestSquadMates', error); return isDemoUser ? STUB_SUGGESTIONS : [] }
  const live = (data as SquadSuggestion[]) ?? []
  if (!isDemoUser) return live
  return live.length > 0 ? live : STUB_SUGGESTIONS
}

export async function endorseSkill(toUserId: string, skill: string): Promise<string | null> {
  const supabase = createClient()
  const user = await getDemoUserId()
  if (!user) return null
  const { data, error } = await supabase.rpc('endorse_skill', {
    p_from: user, p_to: toUserId, p_skill: skill,
  })
  if (error) { logRpc('endorseSkill', error); return null }
  return data as string
}

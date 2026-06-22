/**
 * Level Up — real Supabase data for courses · certificates · hackathons,
 * plus brand campaigns for creators. Falls back gracefully to [].
 */

import { createClient } from '@/lib/supabase/client'
import { logRpc } from '@/lib/rpcError'

export type LearnKind = 'course' | 'certificate' | 'hackathon'

export interface LearnInstructor { name: string; title: string; bio?: string; avatar?: string }
export interface LearnProject { title: string; summary: string }
export interface LearnModule { title: string; topics: string[] }
export interface LearnFaq { q: string; a: string }
export interface LearnDetails {
  about?: string
  who_for?: string[]
  who_can_apply?: string
  outcomes?: string[]
  live_projects?: LearnProject[]
  syllabus?: LearnModule[]
  format?: string
  weekly_hours?: string
  schedule?: string
  language?: string
  emi_available?: boolean
  emi_band?: string
  scholarships?: string
  refund_policy?: string
  prerequisites?: string[]
  instructors?: LearnInstructor[]
  certificate?: string
  verified_on_tiikme?: boolean
  placement_help?: string
  faqs?: LearnFaq[]
}

export interface LearnItem {
  id: string
  kind: LearnKind
  title: string
  provider: string
  provider_color: string
  url: string | null
  summary: string | null
  duration: string | null
  cost: string | null
  is_free: boolean
  skills: string[]
  level: string | null
  starts_on: string | null
  deadline: string | null
  location: string | null
  prize: string | null
  org_id: string | null
  org_logo_url?: string | null
  expires_at: string | null
  details?: LearnDetails
}

export interface BrandCampaign {
  id: string
  brand_name: string
  brand_color: string
  title: string
  summary: string | null
  niches: string[]
  platforms: string[]
  budget_band: string | null
  deliverables: string | null
  deadline: string | null
}

export async function listLearnItems(kind?: LearnKind): Promise<LearnItem[]> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('list_learn_items', { p_kind: kind ?? null, p_limit: 50 })
  if (error) { logRpc('listLearnItems', error); return [] }
  return (data as LearnItem[]) ?? []
}

export async function listBrandCampaigns(): Promise<BrandCampaign[]> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('list_brand_campaigns', { p_limit: 30 })
  if (error) { logRpc('listBrandCampaigns', error); return [] }
  return (data as BrandCampaign[]) ?? []
}

/* ── Posting (demo insert path; provider/org auth + RLS lands later) ── */

export interface NewLearnItem {
  kind: LearnKind; title: string; provider: string; provider_color: string
  url: string | null; summary: string | null; skills: string[]; level: string | null
  is_free: boolean; cost: string | null; duration: string | null
  starts_on: string | null; deadline: string | null; location: string | null; prize: string | null
  org_id?: string | null; expires_at?: string | null
  details?: LearnDetails
}

export async function postLearnItem(item: NewLearnItem): Promise<{ id?: string; error?: string }> {
  const supabase = createClient()
  const { data, error } = await supabase.from('learn_items').insert(item).select('id').single()
  if (error) return { error: error.code === '42501' ? 'Posting needs you signed in as a provider (auth coming).' : error.message }
  return { id: (data as { id: string }).id }
}

export async function updateLearnItem(id: string, item: Partial<NewLearnItem>): Promise<{ error?: string }> {
  const supabase = createClient()
  const { error } = await supabase.from('learn_items').update(item).eq('id', id)
  if (error) return { error: error.message }
  return {}
}

export async function deleteLearnItem(id: string): Promise<{ error?: string }> {
  const supabase = createClient()
  const { error } = await supabase.from('learn_items').delete().eq('id', id)
  if (error) return { error: error.message }
  return {}
}

export async function listOrgLearnItems(orgId: string): Promise<LearnItem[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('learn_items')
    .select('*, orgs(logo_url)')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
  if (error) { logRpc('listOrgLearnItems', error); return [] }
  return ((data ?? []) as (LearnItem & { orgs: { logo_url: string | null } | null })[]).map(row => ({
    ...row,
    org_logo_url: row.orgs?.logo_url ?? null,
  }))
}

export interface NewBrandCampaign {
  brand_name: string; brand_color: string; title: string; summary: string | null
  niches: string[]; platforms: string[]; budget_band: string | null
  deliverables: string | null; deadline: string | null
}

export async function postBrandCampaign(c: NewBrandCampaign): Promise<{ id?: string; error?: string }> {
  const supabase = createClient()
  const { data, error } = await supabase.from('brand_campaigns').insert({ ...c, is_open: true }).select('id').single()
  if (error) return { error: error.code === '42501' ? 'Posting needs you signed in as a brand (auth coming).' : error.message }
  return { id: (data as { id: string }).id }
}

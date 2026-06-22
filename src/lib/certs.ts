/**
 * Level Up · certs — typed wrappers.
 */

import { createClient } from '@/lib/supabase/client'
import { getDemoUserId } from '@/lib/applications'
import { logRpc } from '@/lib/rpcError'

export type CertSource = 'manual' | 'credly' | 'coursera' | 'nsdc' | 'udemy' | 'google'

export interface FlexCert {
  id: string
  user_id: string
  name: string
  issuer: string
  issued_on: string | null
  expires_on: string | null
  source: CertSource
  source_url: string | null
  verified: boolean
  created_at: string
}

export async function listMyCerts(): Promise<FlexCert[]> {
  const supabase = createClient()
  const user = await getDemoUserId()
  if (!user) return []
  const { data, error } = await supabase.rpc('list_my_certs', { p_user: user })
  if (error) { logRpc('listMyCerts', error); return [] }
  return (data as FlexCert[]) ?? []
}

export async function addCert(args: { name: string; issuer: string; source?: CertSource; url?: string; verified?: boolean }): Promise<string | null> {
  const supabase = createClient()
  const user = await getDemoUserId()
  if (!user) return null
  const { data, error } = await supabase.rpc('add_cert', {
    p_user: user,
    p_name: args.name,
    p_issuer: args.issuer,
    p_source: args.source ?? 'manual',
    p_url: args.url ?? null,
    p_verified: args.verified ?? false,
  })
  if (error) { logRpc('addCert', error); return null }
  return data as string
}

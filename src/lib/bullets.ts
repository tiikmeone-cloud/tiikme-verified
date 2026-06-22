/**
 * Flex bullet suggestions — Twin's inline polish.
 *
 * `context_key` schema: 'experience:{slug}:bullet:{index}'
 *   e.g. 'experience:zeta:bullet:0'
 */

import { createClient } from '@/lib/supabase/client'
import { getDemoUserId } from '@/lib/applications'
import { logRpc } from '@/lib/rpcError'

export interface FlexBullet {
  id: string
  user_id: string
  context_key: string
  original: string
  suggestion: string
  why: string | null
  applied: boolean
  created_at: string
}

export async function listMyBullets(): Promise<FlexBullet[]> {
  const supabase = createClient()
  const user = await getDemoUserId()
  if (!user) return []
  const { data, error } = await supabase.rpc('list_my_bullets', { p_user: user })
  if (error) { logRpc('listMyBullets', error); return [] }
  return (data as FlexBullet[]) ?? []
}

export async function applyBullet(id: string): Promise<void> {
  const supabase = createClient()
  await supabase.rpc('apply_bullet', { p_id: id })
}

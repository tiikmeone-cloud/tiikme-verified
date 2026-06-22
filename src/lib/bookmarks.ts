/**
 * Bookmarks (Stash) — typed wrappers.
 */

import { createClient } from '@/lib/supabase/client'
import { getDemoUserId } from '@/lib/applications'
import { logRpc } from '@/lib/rpcError'

export interface Bookmark {
  job_id: string
  saved_at: string
  job_title: string
  job_type: string | null
  job_mode: string | null
  job_location: string | null
  job_salary: string | null
  org_id: string
  org_slug: string
  org_name: string
  org_logo: string | null
}

export async function listBookmarks(): Promise<Bookmark[]> {
  const supabase = createClient()
  const user = await getDemoUserId()
  if (!user) return []
  const { data, error } = await supabase.rpc('list_my_bookmarks', { p_user: user })
  if (error) { logRpc('listBookmarks', error); return [] }
  return (data as Bookmark[]) ?? []
}

export async function toggleBookmark(jobId: string): Promise<boolean | null> {
  const supabase = createClient()
  const user = await getDemoUserId()
  if (!user) return null
  const { data, error } = await supabase.rpc('toggle_bookmark', { p_user: user, p_job: jobId })
  if (error) { logRpc('toggleBookmark', error); return null }
  return data as boolean
}

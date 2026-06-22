/**
 * Connected feed — real Supabase data via the `get_connected_feed` RPC.
 *
 * Returns posts (updates + jobs) from orgs the demo user has connected with.
 * Falls back to the mock only if the RPC errors / returns nothing.
 */

import { createClient } from '@/lib/supabase/client'
import { getDemoUserId } from '@/lib/applications'
import { mockConnectedFeed, type ConnectedFeedItem } from '@/stubs/getOrgFeed'

interface RpcRow {
  post_id: string
  kind: 'update' | 'job'
  body: string | null
  posted_at: string
  likes: number
  comments: number
  org_id: string
  org_slug: string
  org_name: string
  org_logo: string | null
  org_verified: boolean
  job_id: string | null
  job_title: string | null
  job_type: string | null
  job_mode: string | null
  job_location: string | null
  job_salary: string | null
  job_must_have: string[] | null
}

export async function fetchConnectedFeed(): Promise<ConnectedFeedItem[]> {
  try {
    const supabase = createClient()
    const user = await getDemoUserId()
    if (!user) return mockConnectedFeed()

    const { data, error } = await supabase.rpc('get_connected_feed', { p_user: user, p_limit: 30 })
    if (error || !data) return mockConnectedFeed()

    const rows = data as RpcRow[]
    if (rows.length === 0) return mockConnectedFeed()

    return rows.map<ConnectedFeedItem>(r => ({
      postId: r.post_id,
      kind: r.kind,
      body: r.body,
      postedAt: r.posted_at,
      likes: r.likes ?? 0,
      comments: r.comments ?? 0,
      orgId: r.org_id,
      orgSlug: r.org_slug,
      orgName: r.org_name,
      orgLogo: r.org_logo ?? '#FF5C28',
      orgVerified: r.org_verified,
      job: r.kind === 'job' && r.job_id
        ? {
            id: r.job_id,
            title: r.job_title ?? 'Role',
            type: r.job_type,
            mode: r.job_mode,
            location: r.job_location,
            salary: r.job_salary,
            mustHave: r.job_must_have ?? [],
          }
        : null,
    }))
  } catch {
    return mockConnectedFeed()
  }
}

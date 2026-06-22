// Connected-org feed types + mock fallback.
// In production this is wired to the `get_connected_feed` RPC in Supabase.

export interface FeedJob {
  id: string
  title: string
  type: string | null
  mode: string | null
  location: string | null
  salary: string | null
  mustHave: string[]
}

export interface ConnectedFeedItem {
  postId: string
  kind: 'update' | 'job'
  body: string | null
  postedAt: string            // ISO
  likes: number
  comments: number
  orgId: string
  orgSlug: string
  orgName: string
  orgLogo: string             // logo_color hex
  orgVerified: boolean
  job: FeedJob | null
}

/** Fallback feed when there's no auth/data yet — matches the seeded rows. */
export function mockConnectedFeed(): ConnectedFeedItem[] {
  return [
    {
      postId: 'p1', kind: 'update',
      body: 'Our design team just shipped a new account-opening flow — 38% faster than before. Proud of this one. 🚀',
      postedAt: new Date(Date.now() - 2 * 3600_000).toISOString(),
      likes: 184, comments: 22,
      orgId: 'o-zeta', orgSlug: 'zeta', orgName: 'Zeta', orgLogo: '#6D4BD8', orgVerified: true,
      job: null,
    },
    {
      postId: 'p2', kind: 'job',
      body: 'Hiring a Senior Product Designer to lead our banking flows team. Hybrid · Bengaluru.',
      postedAt: new Date(Date.now() - 24 * 3600_000).toISOString(),
      likes: 96, comments: 14,
      orgId: 'o-zeta', orgSlug: 'zeta', orgName: 'Zeta', orgLogo: '#6D4BD8', orgVerified: true,
      job: {
        id: 'j-zeta-1', title: 'Senior Product Designer',
        type: 'Full-time', mode: 'Hybrid', location: 'Bengaluru, IN', salary: '₹35-55L',
        mustHave: ['Figma', 'Design systems', 'Banking'],
      },
    },
    {
      postId: 'p3', kind: 'update',
      body: 'Linear 2026.1 is out — keyboard-first triage, instant search, the works.',
      postedAt: new Date(Date.now() - 5 * 3600_000).toISOString(),
      likes: 412, comments: 38,
      orgId: 'o-linear', orgSlug: 'linear', orgName: 'Linear', orgLogo: '#5E6AD2', orgVerified: true,
      job: null,
    },
    {
      postId: 'p4', kind: 'job',
      body: 'Looking for a Frontend Engineer who lives and breathes TypeScript. Fully remote.',
      postedAt: new Date(Date.now() - 3 * 24 * 3600_000).toISOString(),
      likes: 257, comments: 31,
      orgId: 'o-linear', orgSlug: 'linear', orgName: 'Linear', orgLogo: '#5E6AD2', orgVerified: true,
      job: {
        id: 'j-linear-1', title: 'Frontend Engineer',
        type: 'Full-time', mode: 'Remote', location: 'Remote', salary: '$120-160k',
        mustHave: ['React', 'TypeScript', 'CSS'],
      },
    },
  ]
}

export function relativeTime(iso: string): string {
  const d = new Date(iso).getTime()
  const diff = (Date.now() - d) / 1000
  if (diff < 60)    return 'just now'
  if (diff < 3600)  return `${Math.floor(diff/60)}m`
  if (diff < 86400) return `${Math.floor(diff/3600)}h`
  if (diff < 604800)return `${Math.floor(diff/86400)}d`
  return new Date(iso).toLocaleDateString()
}

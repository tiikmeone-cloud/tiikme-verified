'use client'

import { useEffect, useState } from 'react'
import { relativeTime, type ConnectedFeedItem } from '@/stubs/getOrgFeed'
import { fetchConnectedFeed } from '@/lib/connectedFeed'
import { Card } from '@/components/profile/ui/Primitives'

interface Props {
  items?: ConnectedFeedItem[]
  onOpenJob?: (item: ConnectedFeedItem) => void
  showHeader?: boolean
  emptyHint?: string
  /** Show only job posts — hide org "updates" (default true for Rundown). */
  jobsOnly?: boolean
}

/**
 * The connected-org feed.
 * Mixes plain updates (social-feed look) and job posts (job-card look).
 * Job cards open the SAME job-detail UI everywhere they appear
 * (Rundown · Jobs page · Applications) via onOpenJob.
 */
export default function ConnectedFeed({
  items,
  onOpenJob,
  showHeader = true,
  emptyHint = 'Connect an organisation to see new roles here.',
  jobsOnly = true,
}: Props) {
  // If items aren't passed in, fetch real connected-feed data from Supabase.
  const [fetched, setFetched] = useState<ConnectedFeedItem[] | null>(items ?? null)
  useEffect(() => {
    if (items) { setFetched(items); return }
    let alive = true
    fetchConnectedFeed().then(d => { if (alive) setFetched(d) })
    return () => { alive = false }
  }, [items])

  const all = fetched ?? []
  const feed = jobsOnly ? all.filter(i => i.kind === 'job' && i.job) : all

  return (
    <section className="space-y-3">
      {showHeader && (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[14px] font-bold text-ink leading-tight">From your connections</p>
            <p className="text-[11px] text-ink-3 mt-0.5">Updates &amp; roles from orgs you’ve connected with.</p>
          </div>
          <a href="/opportunities" className="text-[12px] font-semibold text-orange hover:text-orange-2 transition-colors">Browse all →</a>
        </div>
      )}

      {feed.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="text-[13px] text-ink-3">{emptyHint}</p>
        </Card>
      ) : feed.map(item =>
        item.kind === 'job' && item.job
          ? <JobPostCard key={item.postId} item={item} onOpen={() => onOpenJob?.(item)} />
          : <UpdateCard  key={item.postId} item={item} />
      )}
    </section>
  )
}

/* ── Org "update" — kept for backwards compat, but jobsOnly=true filters it out ── */
function UpdateCard({ item }: { item: ConnectedFeedItem }) {
  return (
    <Card className="p-4">
      <OrgHeader item={item} />
      <p className="text-[13px] text-ink mt-2.5 leading-relaxed whitespace-pre-wrap">{item.body}</p>
    </Card>
  )
}

/* ── Job post — single clean clickable row · NO social actions ── */
function JobPostCard({ item, onOpen }: { item: ConnectedFeedItem; onOpen: () => void }) {
  const j = item.job!
  return (
    <button
      onClick={onOpen}
      className="w-full text-left bg-card hover:border-orange/30 transition-colors rounded-[14px] border border-line p-3.5 flex items-center gap-3 group">
      <div
        className="w-11 h-11 rounded-[12px] flex items-center justify-center text-white text-[15px] font-bold shrink-0"
        style={{ backgroundColor: item.orgLogo }}>
        {item.orgName.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-[13px] font-semibold text-ink truncate">{j.title}</p>
          {item.orgVerified && (
            <svg width="11" height="11" viewBox="0 0 24 24" fill="var(--color-purple)" className="shrink-0">
              <path d="M12 2l2.4 2.4 3.4-.6.6 3.4L21 12l-2.6 2.4.6 3.4-3.4.6L12 22l-2.4-2.6-3.4.6-.6-3.4L3 12l2.6-2.4-.6-3.4 3.4.6z"/>
              <path d="M10 13l-1.5-1.5L7.5 12.5 10 15l5-5-1-1z" fill="#fff"/>
            </svg>
          )}
        </div>
        <p className="text-[11px] text-ink-3 truncate">
          {item.orgName} · {j.location ?? '—'}{j.salary ? ` · ${j.salary}` : ''} · {relativeTime(item.postedAt)}
        </p>
        <div className="flex flex-wrap gap-1 mt-1.5">
          {j.type && <Chip>{j.type}</Chip>}
          {j.mode && <Chip>{j.mode}</Chip>}
          {j.mustHave.slice(0, 3).map(s => <Chip key={s} accent>{s}</Chip>)}
        </div>
      </div>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink-3)"
           strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
           className="shrink-0 group-hover:text-orange transition-colors">
        <polyline points="9 18 15 12 9 6"/>
      </svg>
    </button>
  )
}

function OrgHeader({ item, pill }: { item: ConnectedFeedItem; pill?: string }) {
  return (
    <a href={`/org/${item.orgSlug}`} className="flex items-center gap-2.5 group">
      <div
        className="w-9 h-9 rounded-[10px] flex items-center justify-center text-white text-[13px] font-bold shrink-0"
        style={{ backgroundColor: item.orgLogo }}
      >
        {item.orgName.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-[13px] font-semibold text-ink truncate group-hover:text-orange transition-colors">{item.orgName}</p>
          {item.orgVerified && (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="var(--color-purple)" className="shrink-0">
              <path d="M12 2l2.4 2.4 3.4-.6.6 3.4L21 12l-2.6 2.4.6 3.4-3.4.6L12 22l-2.4-2.6-3.4.6-.6-3.4L3 12l2.6-2.4-.6-3.4 3.4.6z"/>
              <path d="M10 13l-1.5-1.5L7.5 12.5 10 15l5-5-1-1z" fill="#fff"/>
            </svg>
          )}
          {pill && <span className="text-[9px] font-bold uppercase tracking-wider text-orange bg-orange-soft px-1.5 py-0.5 rounded-full">{pill}</span>}
        </div>
        <p className="text-[10px] text-ink-3 leading-none mt-0.5">{relativeTime(item.postedAt)} · Connected</p>
      </div>
    </a>
  )
}

function Chip({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <span className={[
      'text-[10px] font-medium px-2 py-0.5 rounded-full border',
      accent ? 'text-orange bg-orange-soft border-orange/20' : 'text-ink-2 bg-card border-line',
    ].join(' ')}>{children}</span>
  )
}

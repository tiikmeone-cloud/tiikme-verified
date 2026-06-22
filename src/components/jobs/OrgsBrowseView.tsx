'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/profile/ui/Toast'
import { getExploreOrgs } from '@/stubs/getExplore'

interface Org {
  id: string
  slug: string
  name: string
  tagline: string | null
  logo_color: string | null
  verified: boolean
  type: string | null
  location: string | null
  follower_count: number | null
}

export const ORG_INDUSTRIES = ['All', 'Tech / SaaS', 'Design', 'FinTech', 'HealthTech', 'EdTech', 'FoodTech', 'Media', 'E-Commerce', 'CyberSec', 'D2C', 'Other'] as const
export type OrgIndustry = typeof ORG_INDUSTRIES[number]

interface ViewProps {
  controlledQ?: string
  onControlledQChange?: (v: string) => void
  filterIndustry?: OrgIndustry
  filterLoc?: string
  filterVerified?: boolean
}

export default function OrgsBrowseView({
  controlledQ, onControlledQChange,
  filterIndustry = 'All', filterLoc = '', filterVerified = false,
}: ViewProps = {}) {
  const [orgs, setOrgs] = useState<Org[]>([])
  const [loading, setLoading] = useState(true)
  const [localQ, setLocalQ] = useState('')
  const [connected, setConnected] = useState<Set<string>>(new Set())
  const [followCounts, setFollowCounts] = useState<Map<string, number>>(new Map())
  const q = controlledQ ?? localQ
  const setQ = onControlledQChange ?? setLocalQ
  const isControlled = controlledQ !== undefined

  useEffect(() => {
    (async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('orgs')
        .select('id, slug, name, tagline, logo_color, verified, type, location, follower_count')
        .order('name', { ascending: true })
      const dbList = (data as Org[]) ?? []
      // Merge stub orgs — shown when DB org table is sparse
      const stubOrgs: Org[] = getExploreOrgs().map(o => ({
        id: `stub-${o.slug}`,
        slug: o.slug,
        name: o.name,
        tagline: o.tagline ?? null,
        logo_color: o.logoColor,
        verified: o.verified ?? false,
        type: o.industry ?? o.type,
        location: o.location,
        follower_count: o.follower_count ?? null,
      }))
      const dbSlugs = new Set(dbList.map(o => o.slug))
      const merged = [...dbList, ...stubOrgs.filter(s => !dbSlugs.has(s.slug))]
        .sort((a, b) => a.name.localeCompare(b.name))
      setOrgs(merged)
      setFollowCounts(new Map(merged.map(o => [o.id, o.follower_count ?? 0])))
      setLoading(false)
    })()
  }, [])

  const filtered = useMemo(() => {
    let list = orgs
    const needle = q.trim().toLowerCase()
    if (needle) list = list.filter(o =>
      o.name.toLowerCase().includes(needle) ||
      (o.tagline ?? '').toLowerCase().includes(needle) ||
      (o.location ?? '').toLowerCase().includes(needle),
    )
    if (filterVerified) list = list.filter(o => o.verified)
    if (filterLoc.trim()) {
      const loc = filterLoc.trim().toLowerCase()
      list = list.filter(o => (o.location ?? '').toLowerCase().includes(loc))
    }
    if (filterIndustry !== 'All') {
      const ind = filterIndustry.toLowerCase()
      list = list.filter(o => {
        const t = (o.type ?? '').toLowerCase()
        return t.includes(ind.split('/')[0].trim()) || t.includes(ind.split(' ')[0].toLowerCase())
      })
    }
    return list
  }, [orgs, q, filterIndustry, filterLoc, filterVerified])

  const toggleConnect = (e: React.MouseEvent, org: Org) => {
    e.preventDefault()
    e.stopPropagation()
    const wasConnected = connected.has(org.id)
    setConnected(prev => { const n = new Set(prev); wasConnected ? n.delete(org.id) : n.add(org.id); return n })
    setFollowCounts(prev => {
      const n = new Map(prev)
      n.set(org.id, (n.get(org.id) ?? 0) + (wasConnected ? -1 : 1))
      return n
    })
    if (wasConnected) {
      toast(`Disconnected from ${org.name}`)
    } else {
      toast(`Connected to ${org.name} ✓`)
    }
  }

  const fmtCount = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`

  return (
    <div className="space-y-3">
      {/* Own search — hidden when shell controls it */}
      <div className={[isControlled ? 'hidden' : 'flex', 'items-center gap-2 bg-card rounded-[12px] px-3.5 py-2.5 shadow-card'].join(' ')}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink-3)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input value={q} onChange={e => setQ(e.target.value)}
          placeholder="Search organisations · name, tagline, city…"
          className="flex-1 bg-transparent text-[13px] text-ink placeholder-ink-3 outline-none min-w-0" />
      </div>

      <p className="text-[11px] text-ink-3 px-1">{filtered.length} organisation{filtered.length === 1 ? '' : 's'}</p>

      {loading && <p className="text-[12px] text-ink-3 py-8 text-center">Loading…</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(o => {
          const isConnected = connected.has(o.id)
          const followers = followCounts.get(o.id) ?? 0
          return (
            <Link key={o.id} href={`/org/${o.slug}`}
              className="bg-card border border-line hover:border-orange/30 rounded-[16px] p-4 transition-colors group flex flex-col gap-2">

              <div className="flex items-start gap-3">
                {/* Logo */}
                <div className="w-11 h-11 rounded-[12px] flex items-center justify-center text-white text-[16px] font-bold shrink-0"
                     style={{ backgroundColor: o.logo_color ?? '#FF5C28' }}>
                  {o.name.charAt(0)}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Row: [Name ✓] ............. [Connect icon] */}
                  <div className="flex items-center justify-between gap-2">
                    {/* Name + verified badge — tight together */}
                    <div className="flex items-center gap-1 min-w-0">
                      <p className="text-[13.5px] font-bold text-ink truncate group-hover:text-orange transition-colors">{o.name}</p>
                      {o.verified && (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="var(--color-purple)" className="shrink-0">
                          <path d="M12 2l2.4 2.4 3.4-.6.6 3.4L21 12l-2.6 2.4.6 3.4-3.4.6L12 22l-2.4-2.6-3.4.6-.6-3.4L3 12l2.6-2.4-.6-3.4 3.4.6z"/>
                          <path d="M10 13l-1.5-1.5L7.5 12.5 10 15l5-5-1-1z" fill="#fff"/>
                        </svg>
                      )}
                    </div>

                    {/* Connect icon button — far right */}
                    <button
                      onClick={e => toggleConnect(e, o)}
                      aria-label={isConnected ? 'Disconnect' : 'Connect'}
                      title={isConnected ? 'Disconnect' : 'Connect'}
                      className={['shrink-0 w-6 h-6 rounded-full flex items-center justify-center border transition-all',
                        isConnected
                          ? 'text-white bg-orange border-orange'
                          : 'text-ink-3 border-line bg-page hover:border-orange/50 hover:text-orange'
                      ].join(' ')}>
                      {isConnected
                        ? <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                        : <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      }
                    </button>
                  </div>

                  {/* Type · location */}
                  <p className="text-[11px] text-ink-3 truncate mt-0.5">{o.type ?? '—'}{o.location ? ` · ${o.location}` : ''}</p>

                  {/* Follower count */}
                  {followers > 0 && (
                    <p className="text-[10.5px] text-ink-3 mt-0.5">
                      <span className={isConnected ? 'text-orange font-semibold' : ''}>{fmtCount(followers)}</span> follower{followers !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>

              {o.tagline && <p className="text-[11.5px] text-ink-2 leading-snug line-clamp-2">{o.tagline}</p>}
            </Link>
          )
        })}
      </div>

      {!loading && filtered.length === 0 && (
        <p className="text-[12px] text-ink-3 italic text-center py-10">No organisations match.</p>
      )}
    </div>
  )
}

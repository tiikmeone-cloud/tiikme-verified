'use client'

import type { ExplorePerson, ExploreOrg } from '@/stubs/getExplore'
import OrgConnectPill from '@/components/ui/OrgConnectPill'

/* Compact DP-on-DP mutual stack — tight, shows all (capped at 5), minimal gap */
function MutualStack({ urls, count }: { urls: string[]; count: number }) {
  if (count === 0) return <span className="text-[11px] text-ink-3">Suggested for you</span>
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex">
        {urls.slice(0,5).map((u,i)=>(
          // eslint-disable-next-line @next/next/no-img-element
          <img key={i} src={u} alt="" className="w-[18px] h-[18px] rounded-full object-cover border-2 border-card" style={{ marginLeft: i?-6:0 }} />
        ))}
      </div>
      <span className="text-[11px] text-ink-3">{count} mutual</span>
    </div>
  )
}

export function PeopleCard({ p }: { p: ExplorePerson }) {
  return (
    <a href={`/profile/${p.handle}`} className="bg-card rounded-[18px] shadow-card p-4 flex flex-col gap-2.5 hover:shadow-[0_4px_14px_rgba(0,0,0,.10)] transition-shadow">
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.avatar} alt={p.name} className="w-12 h-12 rounded-full object-cover" />
          {/* current company logo badge (replaces location) */}
          <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-[6px] flex items-center justify-center text-white text-[9px] font-bold border-2 border-card" style={{ backgroundColor: p.companyColor }} title={p.company}>
            {p.company.charAt(0)}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-semibold text-ink truncate">{p.name}</p>
          <p className="text-[12px] text-ink-2 truncate">{p.role}</p>
          <p className="text-[11px] text-ink-3 truncate">{p.company}</p>
        </div>
      </div>
      <MutualStack urls={p.mutuals} count={p.mutualCount} />
    </a>
  )
}

export function OrgCard({ o }: { o: ExploreOrg }) {
  return (
    <a href={`/org/${o.slug}`} className="bg-card rounded-[18px] shadow-card p-4 flex flex-col gap-2.5 hover:shadow-[0_4px_14px_rgba(0,0,0,.10)] transition-shadow">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-[13px] flex items-center justify-center text-white text-[18px] font-bold shrink-0" style={{ backgroundColor: o.logoColor }}>
          {o.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <p className="text-[14px] font-semibold text-ink truncate">{o.name}</p>
            {o.verified && <Verified />}
          </div>
          <p className="text-[11px] text-ink-3 truncate">{o.type} · {o.location}</p>
        </div>
        <OrgConnectPill initial={o.following} />
      </div>
      <div className="flex items-center justify-between">
        <MutualStack urls={o.members} count={o.memberCount} />
        {o.openRoles > 0 && <span className="text-[11px] font-semibold text-orange bg-orange-soft px-2 py-0.5 rounded-full shrink-0">{o.openRoles} open roles</span>}
      </div>
    </a>
  )
}

export function Verified() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="#6D4BD8" className="shrink-0">
      <path d="M12 2l2.4 2.4 3.4-.6.6 3.4L21 12l-2.6 2.4.6 3.4-3.4.6L12 22l-2.4-2.6-3.4.6-.6-3.4L3 12l2.6-2.4-.6-3.4 3.4.6z"/>
      <path d="M10 13l-1.5-1.5L7.5 12.5 10 15l5-5-1-1z" fill="#fff"/>
    </svg>
  )
}

'use client'

import type { Profile } from '@/lib/types'
import type { ViewId, UserRole } from '@/lib/profileTypes'
import { RoleLine } from '@/components/profile/ui/RoleBadges'

interface Props {
  profile: Profile
  roles: UserRole[]
  activeView: ViewId
  onEditClick: () => void
  onNavigate: (v: ViewId) => void
}

interface NavItem { id: ViewId; label: string; sub: string; badge?: string; icon: React.ReactNode }
interface NavSection { title: string; items: NavItem[] }

const SECTIONS: NavSection[] = [
  { title: 'PROFILE', items: [
    { id:'rundown', label:'Rundown', sub:'Your overview',
      icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
    { id:'my-flex', label:'My Flex', sub:'Digital resume',
      icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
  ]},
  { title: 'MY SPACE', items: [
    { id:'squads', label:'Squads', sub:'Verified teammates',
      icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg> },
    { id:'stash', label:'Stash', sub:'Saved items',
      icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg> },
  ]},
  { title: 'ACCOUNT', items: [
    { id:'my-applications', label:'My Applications', sub:'Job tracker',
      icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg> },
    { id:'requests', label:'Requests', sub:'Flex access requests',
      icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/></svg> },
    { id:'alerts', label:'Alerts', sub:'Notifications', badge:'3',
      icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg> },
    { id:'settings', label:'Settings', sub:'Account & privacy',
      icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg> },
  ]},
]

export default function IdentityPanel({ profile, roles, activeView, onEditClick, onNavigate }: Props) {
  const displayName = profile.full_name ?? profile.username

  return (
    <aside className="hidden lg:flex w-[272px] shrink-0 flex-col overflow-y-auto border-r border-line" style={{ backgroundColor: 'var(--color-panel)' }}>
      {/* Identity */}
      <div className="px-4 pt-5 pb-3">
        <div className="flex items-start gap-3">
          <div className="w-[48px] h-[48px] rounded-full bg-gradient-to-br from-orange to-orange-2 flex items-center justify-center text-white text-[18px] font-bold overflow-hidden shrink-0">
            {profile.avatar_url
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
              : <span>{displayName.charAt(0).toUpperCase()}</span>}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-bold text-ink truncate leading-tight">{displayName}</p>
            <div className="mt-1"><RoleLine roles={roles} size="sm" /></div>
          </div>
          <button onClick={onEditClick} title="Edit profile" className="w-8 h-8 rounded-[9px] flex items-center justify-center hover:bg-card text-ink-2 hover:text-ink transition-colors shrink-0">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
        </div>
      </div>

      <div className="h-px mx-4 mb-3" style={{ backgroundColor: 'var(--color-line)' }} />

      {/* Nav */}
      <nav className="flex-1 px-3 flex flex-col gap-4 overflow-y-auto pb-4">
        {SECTIONS.map(section => (
          <div key={section.title}>
            <p className="text-[10px] font-semibold tracking-[0.08em] uppercase text-ink-3 px-2.5 mb-1.5">{section.title}</p>
            {section.items.map(item => {
              const active = activeView === item.id
              return (
                <button key={item.id} onClick={() => onNavigate(item.id)}
                  className="w-full flex items-center gap-3 px-2.5 py-2 rounded-[11px] text-left transition-all"
                  style={active ? { backgroundColor:'var(--color-card)', boxShadow:'0 1px 4px rgba(0,0,0,.10), 0 0 0 1px rgba(0,0,0,.06)' } : undefined}
                  onMouseEnter={e=>{ if(!active)(e.currentTarget as HTMLElement).style.backgroundColor='var(--color-card)' }}
                  onMouseLeave={e=>{ if(!active)(e.currentTarget as HTMLElement).style.backgroundColor='' }}>
                  <span className="w-[30px] h-[30px] rounded-[8px] flex items-center justify-center shrink-0"
                    style={active ? { backgroundColor:'var(--color-orange-soft)', color:'var(--color-orange)' } : { backgroundColor:'rgba(0,0,0,.05)', color:'var(--color-ink-2)' }}>
                    {item.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold leading-tight truncate" style={{ color: active ? 'var(--color-ink)' : 'var(--color-ink-2)' }}>{item.label}</p>
                    <p className="text-[10px] text-ink-3 leading-none mt-0.5 truncate">{item.sub}</p>
                  </div>
                  {item.badge && <span className="text-[9px] font-bold text-white bg-orange rounded-full px-1.5 py-0.5 leading-none shrink-0">{item.badge}</span>}
                </button>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="px-3 py-3 border-t border-line">
        <button className="w-full flex items-center gap-3 px-2.5 py-2 rounded-[11px] text-left transition-all"
          onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.backgroundColor='rgba(255,255,255,.5)'}}
          onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.backgroundColor=''}}>
          <span className="w-[30px] h-[30px] rounded-[8px] flex items-center justify-center shrink-0 bg-line/50">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink-3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </span>
          <p className="text-[13px] font-semibold" style={{ color:'var(--color-ink-2)' }}>Log out</p>
        </button>
      </div>
    </aside>
  )
}

/* ── Mobile profile sub-nav (horizontal chips) ── */
export function MobileProfileNav({ activeView, onNavigate }: { activeView: ViewId; onNavigate: (v: ViewId) => void }) {
  const items: { id: ViewId; label: string }[] = [
    { id:'my-flex', label:'My Flex' },
    { id:'squads', label:'Squads' },
    { id:'vouches', label:'Vouches' },
    { id:'my-applications', label:'Applications' },
    { id:'requests', label:'Requests' },
    { id:'stash', label:'Stash' },
    { id:'settings', label:'Settings' },
  ]
  return (
    <div className="bg-page/90 backdrop-blur border-b border-line">
      <div className="flex gap-2 overflow-x-auto px-4 py-2.5 no-scrollbar">
        {items.map(it => (
          <button key={it.id} onClick={() => onNavigate(it.id)}
            className={['px-3 py-1.5 text-[12px] font-medium rounded-full whitespace-nowrap transition-colors shrink-0',
              activeView===it.id ? 'bg-orange text-white' : 'bg-card text-ink-2 border border-line'].join(' ')}>
            {it.label}
          </button>
        ))}
      </div>
    </div>
  )
}

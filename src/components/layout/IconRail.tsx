'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signOut } from '@/lib/auth'
import { createClient } from '@/lib/supabase/client'

const ICONS = {
  home:    <><path d="M12 2l1.8 5.5L19 9l-5.2 1.5L12 16l-1.8-5.5L5 9l5.2-1.5z"/><path d="M19 14l.8 2.5L22 17l-2.2.5L19 20l-.8-2.5L16 17l2.2-.5z"/></>,
  jobs:    <><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></>,
  profile: <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
}

const TAB_GRADIENT: Record<string, string> = {
  home:    'from-orange to-orange-2',
  jobs:    'from-amber to-[#F8C155]',
  profile: 'from-teal to-[#43C9BA]',
}

type ActiveNav = 'home' | 'jobs' | 'profile'

export function useMeHref() {
  const [href, setHref] = useState('/profile/me')
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase
        .from('profiles')
        .select('username, account_type, primary_org_slug')
        .eq('id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data?.account_type === 'org' && data?.primary_org_slug) {
            setHref(`/org/${data.primary_org_slug}`)
          } else if (data?.username) {
            setHref(`/profile/${data.username}`)
          }
        })
    })
  }, [])
  return href
}

/* ── Desktop left rail ── */
export default function IconRail({ onCreateClick, active = 'profile' }: { onCreateClick: () => void; active?: ActiveNav }) {
  const meHref = useMeHref()
  return (
    <aside className="hidden lg:flex w-[84px] bg-card border-r border-line flex-col items-center py-5 gap-4 shrink-0">
      <RailLink id="home"    label="Tiik" href="/"              active={active==='home'} />
      <RailLink id="jobs"    label="Jobs" href="/opportunities"  active={active==='jobs'} />
      <RailLink id="profile" label="Me"   href={meHref}          active={active==='profile'} />
      <div className="flex-1" />
      <RailLogout />
    </aside>
  )
}

function RailLink({ id, label, href, active }: { id: string; label: string; href: string; active?: boolean }) {
  const gradient = TAB_GRADIENT[id] ?? 'from-orange to-orange-2'
  return (
    <Link href={href} title={label} className="flex flex-col items-center gap-1.5 group">
      <div className={[
        'w-12 h-12 rounded-[14px] flex items-center justify-center text-white bg-gradient-to-br transition-all', gradient,
        active ? 'shadow-[0_3px_10px_rgba(255,92,40,.4)] ring-2 ring-orange/25' : 'opacity-70 group-hover:opacity-100 group-hover:shadow-card',
      ].join(' ')}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          {ICONS[id as keyof typeof ICONS]}
        </svg>
      </div>
      <span className={['text-[10px] font-semibold transition-colors leading-none', active ? 'text-ink' : 'text-ink-3 group-hover:text-ink-2'].join(' ')}>{label}</span>
    </Link>
  )
}

function RailLogout() {
  const router = useRouter()
  const onLogout = async () => { await signOut(); router.push('/sign-in') }
  return (
    <button onClick={onLogout} title="Log out" className="flex flex-col items-center gap-1.5 group">
      <div className="w-12 h-12 rounded-[14px] flex items-center justify-center hover:bg-line transition-all">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ink-3 group-hover:text-red transition-colors">
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
      </div>
      <span className="text-[10px] font-semibold text-ink-3 leading-none">Out</span>
    </button>
  )
}

/* ── Mobile bottom tab bar — floating pill dock ── */
export function MobileTabBar({
  active = 'profile',
  collapsed = false,
  onToggleCollapse,
}: {
  onCreateClick?: () => void
  active?: ActiveNav
  /** In-chat mode: pill slides away; a drag handle stays visible */
  collapsed?: boolean
  onToggleCollapse?: () => void
}) {
  const meHref = useMeHref()

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-30 flex flex-col items-center pointer-events-none"
      style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>

      {/* ── Drag handle (only when pill is hidden) ── */}
      {collapsed && (
        <button
          onClick={onToggleCollapse}
          className="pointer-events-auto mb-1 flex flex-col items-center gap-1 px-8 py-2"
          style={{ touchAction: 'manipulation' }}>
          {/* chevron up hint */}
          <svg width="16" height="10" viewBox="0 0 16 10" fill="none" style={{ opacity: 0.3 }}>
            <path d="M1 9L8 2L15 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {/* pill-shaped handle */}
          <div style={{
            width: 36, height: 4, borderRadius: 9999,
            background: 'rgba(0,0,0,0.18)',
            backdropFilter: 'blur(4px)',
          }} />
        </button>
      )}

      {/* Nav pill removed — tabs now live in TopBar (top center) */}
    </nav>
  )
}

const TAB_GLOW: Record<string, string> = {
  home:    '0 6px 18px rgba(255,92,40,.45)',
  jobs:    '0 6px 18px rgba(245,165,36,.45)',
  profile: '0 6px 18px rgba(43,179,163,.45)',
}

function MobileTab({ id, label, href, active }: { id: string; label: string; href: string; active?: boolean }) {
  const gradient = TAB_GRADIENT[id] ?? 'from-orange to-orange-2'
  const glow = TAB_GLOW[id] ?? ''
  return (
    <Link href={href} className="flex flex-col items-center gap-1 px-2.5 py-0.5">
      <div
        className={[
          'w-[38px] h-[38px] rounded-[13px] flex items-center justify-center text-white bg-gradient-to-br transition-all duration-200', gradient,
        ].join(' ')}
        style={active ? {
          boxShadow: [
            glow,
            '0 2px 0 rgba(255,255,255,0.25) inset',
          ].join(','),
          transform: 'scale(1.06)',
        } : {
          opacity: 0.35,
        }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          {ICONS[id as keyof typeof ICONS]}
        </svg>
      </div>
      <span style={{ fontSize: '9px' }} className={['font-bold leading-none tracking-wide transition-colors', active ? 'text-ink' : 'text-ink-3'].join(' ')}>{label}</span>
    </Link>
  )
}

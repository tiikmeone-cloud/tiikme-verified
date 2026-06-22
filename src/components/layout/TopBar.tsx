'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import NotificationBell from '@/components/notifications/NotificationBell'
import TiikmeMark from '@/components/brand/TiikmeMark'
import { useMeHref } from '@/components/layout/IconRail'

const NAV_TABS = [
  { id: 'home',    label: 'Tiik', href: '/' },
  { id: 'jobs',    label: 'Jobs', href: '/opportunities' },
  { id: 'profile', label: 'Me',   href: null }, // resolved via useMeHref
] as const

const TAB_ACTIVE_COLOR: Record<string, string> = {
  home:    'text-orange',
  jobs:    'text-amber-500',
  profile: 'text-teal',
}
const TAB_ACTIVE_BG: Record<string, string> = {
  home:    'bg-orange/10',
  jobs:    'bg-amber-500/10',
  profile: 'bg-teal/10',
}

export default function TopBar() {
  const pathname = usePathname()
  const meHref = useMeHref()

  const active =
    pathname === '/' ? 'home'
    : pathname.startsWith('/opportunities') ? 'jobs'
    : 'profile'

  return (
    <header className="h-12 bg-card/90 backdrop-blur border-b border-line flex items-center px-4 sticky top-0 z-30 shrink-0">
      {/* Logo — left */}
      <Link href="/home" prefetch className="flex items-center shrink-0 w-16">
        <TiikmeMark size={20} showWordmark wordmarkClassName="text-[14px]" />
      </Link>

      {/* Centered nav — mobile only */}
      <div className="flex-1 flex justify-center lg:hidden">
        <div className="flex items-center gap-0.5 rounded-[14px] bg-page/50 border border-line/50 p-0.5">
          {NAV_TABS.map(tab => {
            const href = tab.id === 'profile' ? meHref : tab.href
            const isActive = active === tab.id
            return (
              <Link
                key={tab.id}
                href={href}
                className={[
                  'flex items-center justify-center h-7 px-3.5 rounded-[11px] text-[12.5px] font-semibold transition-all duration-150',
                  isActive
                    ? `${TAB_ACTIVE_COLOR[tab.id]} ${TAB_ACTIVE_BG[tab.id]}`
                    : 'text-ink-3 hover:text-ink',
                ].join(' ')}
              >
                {tab.label}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Bell — right */}
      <div className="flex justify-end shrink-0 w-16">
        <NotificationBell />
      </div>
    </header>
  )
}

'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import TopBar from '@/components/layout/TopBar'
import IconRail, { MobileTabBar } from '@/components/layout/IconRail'
import { ToastHost } from '@/components/profile/ui/Toast'
import CreateMenu from '@/components/profile/CreateMenu'
import OrgTalentLifecycle from '@/components/applications/OrgTalentLifecycle'
import TalentPoolView from '@/components/applications/TalentPoolView'
type Tab = 'pipeline' | 'pool'

export default function TalentPageShell({ orgSlug, orgName }: { orgSlug: string; orgName: string }) {
  const [createOpen, setCreateOpen] = useState(false)
  const [tab, setTab] = useState<Tab>('pipeline')
  const params = useSearchParams()
  const defaultJobId = params.get('job') ?? undefined

  const TABS: { id: Tab; label: string }[] = [
    { id: 'pipeline', label: 'Pipeline' },
    { id: 'pool',     label: 'Talent Pool' },
  ]

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--color-page)' }}>
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <IconRail active="jobs" onCreateClick={() => setCreateOpen(true)} />

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto px-4 lg:px-8 py-6 pb-24 lg:pb-8" style={{ maxWidth: 1180 }}>
            <Link href={`/org/${orgSlug}`} className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-ink-3 hover:text-ink transition-colors mb-4">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              Back to {orgName}
            </Link>

            {/* Tab toggle */}
            <div className="flex items-center gap-1 bg-card border border-line rounded-[12px] p-1 w-fit mb-6">
              {TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`text-[12px] font-semibold px-4 py-2 rounded-[9px] transition-all ${
                    tab === t.id ? 'bg-orange text-white shadow-sm' : 'text-ink-3 hover:text-ink'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {tab === 'pipeline' && <OrgTalentLifecycle orgSlug={orgSlug} orgName={orgName} defaultJobId={defaultJobId} />}
            {tab === 'pool'     && <TalentPoolView orgContext />}
          </div>
        </main>
      </div>

      <MobileTabBar active="jobs" onCreateClick={() => setCreateOpen(true)} />
      {createOpen && <CreateMenu onSelect={() => {}} onClose={() => setCreateOpen(false)} />}
      <ToastHost />
    </div>
  )
}

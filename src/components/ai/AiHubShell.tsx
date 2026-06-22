'use client'

import { useState } from 'react'
import TopBar from '@/components/layout/TopBar'
import IconRail, { MobileTabBar } from '@/components/layout/IconRail'
import { ToastHost } from '@/components/profile/ui/Toast'
import CreateMenu from '@/components/profile/CreateMenu'
import AgentFeed from '@/components/ai/AgentFeed'
import MatchPanel from '@/components/ai/MatchPanel'
import GapFeedback from '@/components/ai/GapFeedback'
import WhatsAppPreview from '@/components/ai/WhatsAppPreview'

type Tab = 'agent' | 'match' | 'gap' | 'whatsapp'

export default function AiHubShell() {
  const [tab, setTab] = useState<Tab>('agent')
  const [createOpen, setCreateOpen] = useState(false)

  const TABS: { id: Tab; label: string }[] = [
    { id:'agent', label:'My Agent' },
    { id:'match', label:'AI Match' },
    { id:'gap', label:'Gap Coach' },
    { id:'whatsapp', label:'WhatsApp' },
  ]

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ backgroundColor:'var(--color-page)' }}>
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <IconRail active="jobs" onCreateClick={() => setCreateOpen(true)} />

        <main className="flex-1 overflow-y-auto" style={{ backgroundColor:'var(--color-page)' }}>
          <div className="px-4 lg:px-8 py-6 pb-24 lg:pb-8 mx-auto" style={{ maxWidth:'720px' }}>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-[22px] font-bold text-ink leading-tight">AI</h1>
              <span className="text-[9px] font-bold text-purple bg-purple/10 px-1.5 py-0.5 rounded-full uppercase">Preview</span>
            </div>
            <p className="text-[12px] text-ink-3 mb-4">How tiikme works for you — your agent, your match, your path. <a href="/recruiter/search" className="text-orange font-semibold">Recruiter side →</a></p>

            <div className="flex gap-2 mb-5 overflow-x-auto no-scrollbar">
              {TABS.map(t => (
                <button key={t.id} onClick={()=>setTab(t.id)} className={['px-4 py-1.5 text-[12px] font-semibold rounded-full whitespace-nowrap transition-colors shrink-0', tab===t.id?'bg-orange text-white':'bg-card text-ink-2 border border-line hover:bg-line'].join(' ')}>{t.label}</button>
              ))}
            </div>

            {tab==='agent' && <AgentFeed />}

            {tab==='match' && (
              <div className="space-y-4">
                <MatchPanel score={85} factors={[
                  { label:'Figma', have:true }, { label:'Design Systems', have:true },
                  { label:'Prototyping', have:true }, { label:'User Research', have:true },
                  { label:'5+ yrs experience', have:false }, { label:'Motion design', have:false },
                ]} />
                <p className="text-[11px] text-ink-3 px-1">Shown on every job · matching runs on embeddings of your verified Flex (cheap + private).</p>
              </div>
            )}

            {tab==='gap' && (
              <GapFeedback role="Senior Product Designer" org="Creative Labs" got={6} total={8} steps={[
                { kind:'cert', label:'Add the free “Google UX Design” cert — this role asks for it.', cta:'Level Up' },
                { kind:'project', label:'Show 1 project using prototyping in your Flex.', cta:'Add' },
                { kind:'squad', label:'Tag 2 teammates to verify your design-system work.', cta:'Verify' },
              ]} />
            )}

            {tab==='whatsapp' && <WhatsAppPreview />}
          </div>
        </main>
      </div>

      <MobileTabBar active="jobs" onCreateClick={() => setCreateOpen(true)} />
      {createOpen && <CreateMenu onSelect={() => {}} onClose={() => setCreateOpen(false)} />}
      <ToastHost />
    </div>
  )
}

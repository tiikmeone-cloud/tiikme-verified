'use client'

import { useState } from 'react'
import TopBar from '@/components/layout/TopBar'
import IconRail, { MobileTabBar } from '@/components/layout/IconRail'
import { ToastHost } from '@/components/profile/ui/Toast'
import CreateMenu from '@/components/profile/CreateMenu'
import CandidateDrawer from '@/components/jobs/CandidateDrawer'
import { getApplicants, STAGE_TABS, type Applicant, type Stage } from '@/stubs/getJobs'

export default function TalentShell({ orgName, jobTitle }: { orgName: string; jobTitle: string }) {
  const [list, setList] = useState<Applicant[]>(getApplicants())
  const [tab, setTab] = useState<Stage | 'all'>('all')
  const [open, setOpen] = useState<Applicant | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  const count = (s: Stage | 'all') => s === 'all' ? list.length : list.filter(a => a.stage === s).length
  const shown = tab === 'all' ? list : list.filter(a => a.stage === tab)

  const setStage = (id: string, stage: Stage) => {
    setList(p => p.map(a => a.id === id ? { ...a, stage } : a))
    setOpen(o => o && o.id === id ? { ...o, stage } : o)
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ backgroundColor:'var(--color-page)' }}>
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <IconRail active="jobs" onCreateClick={() => setCreateOpen(true)} />

        <main className="flex-1 overflow-y-auto" style={{ backgroundColor:'var(--color-page)' }}>
          <div className="px-4 lg:px-8 py-6 pb-24 lg:pb-8 mx-auto" style={{ maxWidth:'1000px' }}>
            <a href="/org/tech-genius" className="text-[12px] font-medium text-ink-3 hover:text-ink transition-colors">← {orgName}</a>
            <h1 className="text-[22px] font-bold text-ink leading-tight mt-1">{jobTitle}</h1>
            <p className="text-[12px] text-ink-3 mt-1">Talent list · review, shortlist, and move candidates through your pipeline.</p>

            {/* pipeline tabs */}
            <div className="flex gap-1.5 mt-5 mb-4 overflow-x-auto no-scrollbar border-b border-line">
              {STAGE_TABS.map(t => (
                <button key={t.id} onClick={()=>setTab(t.id)} className={['flex items-center gap-1.5 px-3.5 py-2.5 text-[13px] font-semibold whitespace-nowrap border-b-2 transition-colors', tab===t.id?'border-orange text-ink':'border-transparent text-ink-3 hover:text-ink-2'].join(' ')}>
                  {t.label}<span className={['text-[10px] px-1.5 py-0.5 rounded-full', tab===t.id?'bg-orange-soft text-orange':'bg-page text-ink-3'].join(' ')}>{count(t.id)}</span>
                </button>
              ))}
            </div>

            {/* search + filters */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <div className="flex-1 min-w-[200px] flex items-center gap-2 bg-card rounded-[12px] px-3.5 py-2.5 shadow-card">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink-3)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input placeholder="Search candidates…" className="flex-1 bg-transparent text-[13px] text-ink placeholder-ink-3 outline-none" />
              </div>
              {['Experience','Expected salary','More filters'].map(f => (
                <button key={f} className="text-[12px] font-medium text-ink-2 bg-card border border-line rounded-[12px] px-3 py-2.5 hover:bg-line transition-colors shrink-0">{f} ▾</button>
              ))}
            </div>

            {/* talent table */}
            <div className="bg-card rounded-[16px] shadow-card overflow-hidden">
              {/* header */}
              <div className="hidden sm:grid grid-cols-[1fr_90px_70px_60px_90px] gap-2 px-4 py-2.5 border-b border-line text-[10px] font-semibold uppercase tracking-wide text-ink-3">
                <span>Name</span><span>Expected</span><span>Exp</span><span>Rating</span><span>Status</span>
              </div>
              {shown.map(a => (
                <button key={a.id} onClick={()=>setOpen(a)} className="w-full grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_90px_70px_60px_90px] gap-2 px-4 py-3 items-center border-b border-line last:border-0 hover:bg-page transition-colors text-left">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={a.avatar} alt={a.name} className="w-9 h-9 rounded-full object-cover shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[13px] font-semibold text-ink truncate">{a.name}</span>
                        {a.badge && <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${a.badge==='TOP TALENT'?'text-green bg-green/12':'text-purple bg-purple/12'}`}>{a.badge}</span>}
                        {a.source==='external' && <span className="text-[8px] font-bold text-ink-3 bg-page px-1.5 py-0.5 rounded-full">EXT</span>}
                      </div>
                      <span className="text-[11px] text-ink-3">{a.gender} · {a.age} · <span className="text-purple font-medium">{a.matchPct}% match</span></span>
                    </div>
                  </div>
                  <span className="hidden sm:block text-[12px] text-ink-2">{a.expectedSalary}</span>
                  <span className="hidden sm:block text-[12px] text-ink-2">{a.experience}</span>
                  <span className="hidden sm:flex items-center gap-0.5 text-[12px] text-ink-2">{a.rating}<span className="text-amber">★</span></span>
                  <StatusPill stage={a.stage} />
                </button>
              ))}
              {shown.length===0 && <div className="py-10 text-center text-[13px] text-ink-3">No candidates in this stage.</div>}
            </div>
          </div>
        </main>
      </div>

      <MobileTabBar active="jobs" onCreateClick={() => setCreateOpen(true)} />
      {open && <CandidateDrawer applicant={open} onClose={()=>setOpen(null)} onStage={setStage} />}
      {createOpen && <CreateMenu onSelect={() => {}} onClose={() => setCreateOpen(false)} />}
      <ToastHost />
    </div>
  )
}

function StatusPill({ stage }: { stage: Stage }) {
  const map: Record<Stage, { l: string; c: string }> = {
    applied:{l:'Applied',c:'text-ink-2 bg-page'}, shortlisted:{l:'Shortlisted',c:'text-teal bg-teal/10'},
    invited:{l:'Invited',c:'text-orange bg-orange-soft'}, interviewed:{l:'Interviewed',c:'text-purple bg-purple/10'},
    hired:{l:'Hired',c:'text-green bg-green/12'}, rejected:{l:'Closed',c:'text-ink-3 bg-page'},
  }
  const s = map[stage]
  return <span className={`justify-self-start text-[10px] font-semibold px-2 py-0.5 rounded-full ${s.c}`}>{s.l}</span>
}
